import type { PostgresAdapter } from '@payloadcms/db-postgres'
import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type GlobalBeforeChangeHook,
  type GlobalConfig,
  type PayloadRequest,
  type Plugin,
} from 'payload'

import { isAgentEditor } from '@/access/roles'

type MediaRow = {
  agentTrashEligible: boolean
  deletedAt: unknown
  id: number
}

type SchemaField = {
  blockReferences?: unknown[]
  blocks?: unknown[]
  fields?: unknown[]
  name?: string
  relationTo?: unknown
  tabs?: unknown[]
  type?: string
}

function mediaID(value: unknown): number | undefined {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>).id
      : value
  const id = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
}

function addUploadIDs(value: unknown, ids: Set<number>): void {
  const id = mediaID(value)
  if (id !== undefined) {
    ids.add(id)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => addUploadIDs(entry, ids))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => addUploadIDs(entry, ids))
  }
}

function visitSchemaFields(fields: unknown[], value: unknown, ids: Set<number>): void {
  if (!value || typeof value !== 'object') return
  const record = value as Record<string, unknown>

  for (const rawField of fields) {
    if (!rawField || typeof rawField !== 'object') continue
    const field = rawField as SchemaField
    const fieldValue = field.name ? record[field.name] : value

    if (field.type === 'upload' && field.relationTo === 'media') {
      addUploadIDs(fieldValue, ids)
      continue
    }

    if (field.type === 'richText') {
      embeddedMediaIDs(fieldValue).forEach((id) => ids.add(id))
      continue
    }

    if (field.type === 'array') {
      const rows = Array.isArray(fieldValue)
        ? fieldValue
        : fieldValue && typeof fieldValue === 'object'
          ? Object.values(fieldValue)
          : []
      for (const row of rows.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))) {
        visitSchemaFields(field.fields ?? [], row, ids)
      }
      continue
    }

    if (field.type === 'blocks') {
      const rows = Array.isArray(fieldValue)
        ? fieldValue
        : fieldValue && typeof fieldValue === 'object'
          ? Object.values(fieldValue).flatMap((entry) => (Array.isArray(entry) ? entry : []))
          : []
      const blocks = [...(field.blocks ?? []), ...(field.blockReferences ?? [])]
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue
        const blockType = (row as Record<string, unknown>).blockType
        const block = blocks.find(
          (candidate) =>
            candidate &&
            typeof candidate === 'object' &&
            (candidate as Record<string, unknown>).slug === blockType,
        ) as SchemaField | undefined
        if (block) visitSchemaFields(block.fields ?? [], row, ids)
      }
      continue
    }

    if (field.type === 'group') {
      visitSchemaFields(field.fields ?? [], fieldValue, ids)
      continue
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      visitSchemaFields(field.fields ?? [], value, ids)
      continue
    }

    if (field.type === 'tabs') {
      for (const rawTab of field.tabs ?? []) {
        if (!rawTab || typeof rawTab !== 'object') continue
        const tab = rawTab as SchemaField
        visitSchemaFields(tab.fields ?? [], tab.name ? record[tab.name] : value, ids)
      }
    }
  }
}

export function embeddedMediaIDs(value: unknown): number[] {
  const ids = new Set<number>()
  const seen = new WeakSet<object>()

  const visit = (entry: unknown): void => {
    if (!entry || typeof entry !== 'object') return
    if (seen.has(entry)) return
    seen.add(entry)

    if (Array.isArray(entry)) {
      entry.forEach(visit)
      return
    }

    const record = entry as Record<string, unknown>
    const candidates = [
      ...(record.relationTo === 'media' ? [record.value] : []),
      ...(record.blockType === 'mediaBlock' ? [record.media] : []),
      ...(record.blockType === 'expertQuote' ? [record.avatar] : []),
    ]
    for (const candidate of candidates) addUploadIDs(candidate, ids)
    Object.values(record).forEach(visit)
  }

  visit(value)
  return [...ids].sort((left, right) => left - right)
}

function referencedMediaIDs(fields: unknown[], data: unknown): number[] {
  const ids = new Set<number>()
  visitSchemaFields(fields, data, ids)
  return [...ids].sort((left, right) => left - right)
}

async function postgresSession(req: PayloadRequest) {
  const transactionID = await req.transactionID
  const database = req.payload.db as unknown as PostgresAdapter
  const session = transactionID ? database.sessions[String(transactionID)] : undefined
  if (!session) throw new APIError('Could not protect Media references.', 500)
  return { database, session }
}

/** Serialize all Media references against trash and revoke agent cleanup permanently. */
async function protectMediaReferences(
  data: Record<string, unknown>,
  fields: unknown[],
  req: PayloadRequest,
  originalData?: Record<string, unknown>,
  currentMediaID?: number,
  allowCurrentMediaInTrash = false,
): Promise<Record<string, unknown>> {
  const originalIDs = new Set(referencedMediaIDs(fields, originalData))
  const ids = referencedMediaIDs(fields, data).filter((id) => !originalIDs.has(id))
  if (ids.length === 0 && currentMediaID === undefined) return data

  const { database, session } = await postgresSession(req)
  const referencedIDSet = new Set(ids)
  const lockingIDs = [...new Set([...ids, ...(currentMediaID ? [currentMediaID] : [])])].sort(
    (left, right) => left - right,
  )
  if (lockingIDs.length > 0) {
    const lockingIDList = lockingIDs.join(', ')
    const locked = await database.execute({
      db: session.db,
      raw: `
        SELECT
          "id",
          "agent_trash_eligible" AS "agentTrashEligible",
          "deleted_at" AS "deletedAt"
        FROM "media"
        WHERE "id" IN (${lockingIDList})
        ORDER BY "id"
        FOR UPDATE
      `,
    })
    const lockedRows = locked.rows as unknown as MediaRow[]
    const lockedCurrent = lockedRows.find(({ id }) => id === currentMediaID)
    if (
      lockedRows.length !== lockingIDs.length ||
      (currentMediaID !== undefined &&
        lockedCurrent?.deletedAt !== null &&
        !allowCurrentMediaInTrash) ||
      lockedRows.some(({ deletedAt, id }) => referencedIDSet.has(id) && deletedAt !== null)
    ) {
      throw new APIError('Referenced Media is missing or in trash.', 409)
    }
    const stillEligibleIDs = lockedRows
      .filter(({ agentTrashEligible, id }) => referencedIDSet.has(id) && agentTrashEligible)
      .map(({ id }) => id)
    if (stillEligibleIDs.length === 0) return data

    await database.execute({
      db: session.db,
      raw: `
        UPDATE "media"
        SET "agent_trash_eligible" = false
        WHERE "id" IN (${stillEligibleIDs.join(', ')})
      `,
    })
  }

  return data
}

export const protectCollectionMediaReferences: CollectionBeforeChangeHook = ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const currentMediaID = collection.slug === 'media' ? mediaID(originalDoc?.id) : undefined
  const restoringCurrentMedia =
    currentMediaID !== undefined &&
    typeof originalDoc?.deletedAt === 'string' &&
    data.deletedAt === null
  return protectMediaReferences(
    data,
    collection.fields,
    req,
    originalDoc,
    currentMediaID,
    restoringCurrentMedia,
  )
}

export const protectGlobalMediaReferences: GlobalBeforeChangeHook = ({
  data,
  global,
  originalDoc,
  req,
}) => protectMediaReferences(data, global.fields, req, originalDoc)

export function withMediaReferenceSafety<T extends CollectionConfig>(collection: T): T {
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeChange: [...(collection.hooks?.beforeChange ?? []), protectCollectionMediaReferences],
    },
  }
}

export function withGlobalMediaReferenceSafety<T extends GlobalConfig>(global: T): T {
  return {
    ...global,
    hooks: {
      ...global.hooks,
      beforeChange: [...(global.hooks?.beforeChange ?? []), protectGlobalMediaReferences],
    },
  }
}

export const mediaReferenceSafetyPlugin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map(withMediaReferenceSafety),
  globals: config.globals?.map(withGlobalMediaReferenceSafety),
})

/** Keep the latch server-owned; ordinary Media edits conservatively revoke cleanup. */
export const preserveAgentTrashEligibility: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const isAgentUpload =
    operation === 'create' &&
    req.context.agentMediaUpload === true &&
    req.payloadAPI === 'MCP' &&
    isAgentEditor(req.user)
  const isAgentTrashUpdate =
    operation === 'update' &&
    (req.context.agentTrashAction === 'trash' || req.context.agentTrashAction === 'restore') &&
    req.payloadAPI === 'MCP' &&
    isAgentEditor(req.user)

  data.agentTrashEligible =
    isAgentUpload || (isAgentTrashUpdate && originalDoc?.agentTrashEligible === true)
  return data
}
