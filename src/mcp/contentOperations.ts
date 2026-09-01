import path from 'node:path'

import type { PostgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import {
  APIError,
  commitTransaction,
  initTransaction,
  killTransaction,
  type PayloadRequest,
  type Where,
} from 'payload'

import { isAgentEditor } from '@/access/roles'
import { isAppLocale, type AppLocale } from '@/i18n/config'
import { parseHtmlToContent } from '@/utilities/parseHtmlToBlocks'

export type ContentCollection = 'pages' | 'posts'
export type TrashableCollection = ContentCollection | 'media'

type RecordDoc = Record<string, unknown> & {
  _status?: unknown
  agentTrashEligible?: unknown
  deletedAt?: unknown
  id: number | string
  updatedAt?: unknown
}

type PostDraftInput = {
  authorIDs?: Array<number | string>
  categoryIDs?: Array<number | string>
  contentHtml: string
  focusKeyword?: string
  heroImageID?: number | string
  introHtml: string
  metaDescription: string
  metaTitle: string
  slug: string
  subtitle?: string
  title: string
}

export type PostDraftPatch = {
  authorIDs?: Array<number | string>
  categoryIDs?: Array<number | string>
  contentHtml?: string
  focusKeyword?: string | null
  heroImageID?: number | string | null
  introHtml?: string
  metaDescription?: string
  metaTitle?: string
  slug?: string
  subtitle?: string | null
  title?: string
}

type PageCopyField = {
  maxBytes: number
  required?: boolean
  richText?: boolean
}

const PAGE_COPY_FIELDS: Record<string, Record<string, PageCopyField>> = {
  athleteBanner: {
    eyebrow: { maxBytes: 80 },
    heading: { maxBytes: 300, richText: true },
  },
  evolutionBand: {
    eyebrow: { maxBytes: 80 },
    heading: { maxBytes: 300, richText: true },
    subtext: { maxBytes: 1_000 },
  },
  floatingCTA: {
    buttonText: { maxBytes: 80, required: true },
    highlightedText: { maxBytes: 120 },
    text: { maxBytes: 120 },
  },
  heroBanner: {
    ctaButtonText: { maxBytes: 80 },
    description: { maxBytes: 1_000, richText: true },
    heading: { maxBytes: 300, required: true, richText: true },
    pillText: { maxBytes: 120, richText: true },
  },
  outcomesSection: {
    eyebrow: { maxBytes: 80 },
    heading: { maxBytes: 300, richText: true },
    subText: { maxBytes: 500 },
  },
  priceBreak: {
    headingLine1: { maxBytes: 300, richText: true },
    headingLine2: { maxBytes: 300, richText: true },
  },
  processDiagram: {
    eyebrow: { maxBytes: 80 },
    heading: { maxBytes: 300, required: true, richText: true },
  },
  reserveCta: {
    ctaButtonText: { maxBytes: 80 },
    heading: { maxBytes: 300, richText: true },
    pillText: { maxBytes: 120 },
    subText: { maxBytes: 500 },
  },
  scienceBoard: {
    eyebrow: { maxBytes: 80 },
    heading: { maxBytes: 300, richText: true },
    subCredits: { maxBytes: 500, richText: true },
    subLead: { maxBytes: 1_000 },
  },
  statBreak: {
    headingAfter: { maxBytes: 80 },
    headingLine1: { maxBytes: 200 },
    headingLine2: { maxBytes: 200 },
    highlightedWord: { maxBytes: 80 },
    statNumber: { maxBytes: 40, required: true },
    statSuffix: { maxBytes: 20 },
  },
}

type PageCopyEdit = {
  blockID: string
  blockType: string
  patch: Record<string, string>
}

const PAGE_PATCH_FIELDS = new Set(['copyEdits', 'meta', 'slug', 'title'])
const SYSTEM_FIELDS = new Set([
  '_status',
  'createdAt',
  'deletedAt',
  'id',
  'publishedAt',
  'updatedAt',
])

function badRequest(message: string): never {
  throw new APIError(message, 400)
}

function conflict(message: string): never {
  throw new APIError(message, 409)
}

export function assertAgentRequest(req: PayloadRequest): asserts req is PayloadRequest & {
  user: NonNullable<PayloadRequest['user']>
} {
  if (req.payloadAPI !== 'MCP' || !req.user || !isAgentEditor(req.user)) {
    throw new APIError('This operation requires an authenticated MCP editor.', 403)
  }
}

export function requireLocale(value: string): AppLocale {
  if (!isAppLocale(value)) badRequest(`Unsupported locale: ${value}`)
  return value
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest(`${label} must be a JSON object.`)
  }
  return value as Record<string, unknown>
}

function rejectUnknownFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedFields = new Set(allowed)
  const unknown = Object.keys(value).filter((key) => !allowedFields.has(key))
  if (unknown.length > 0) badRequest(`${label} contains unsupported fields: ${unknown.join(', ')}`)
}

function pagePatchText(
  value: unknown,
  label: string,
  maxBytes: number,
  allowEmpty = false,
): string {
  if (typeof value !== 'string') badRequest(`${label} must be plain text.`)
  const text = value.trim()
  if (!allowEmpty && !text) badRequest(`${label} cannot be empty.`)
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    badRequest(`${label} exceeds its ${maxBytes}-byte limit.`)
  }
  return text
}

function parsePageCopyEdits(value: unknown): PageCopyEdit[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    badRequest('Page copyEdits must contain between 1 and 20 edits.')
  }

  const seenBlockIDs = new Set<string>()
  return value.map((entry, index) => {
    const label = `Page copyEdits[${index}]`
    const edit = asRecord(entry, label)
    rejectUnknownFields(edit, ['blockID', 'blockType', 'patch'], label)

    if (typeof edit.blockID !== 'string') badRequest(`${label}.blockID must be a string.`)
    const blockID = edit.blockID.trim()
    if (!blockID || Buffer.byteLength(blockID, 'utf8') > 128) {
      badRequest(`${label}.blockID must be between 1 and 128 bytes.`)
    }
    if (seenBlockIDs.has(blockID))
      badRequest(`Page copyEdits contains duplicate blockID ${blockID}.`)
    seenBlockIDs.add(blockID)

    if (typeof edit.blockType !== 'string' || !Object.hasOwn(PAGE_COPY_FIELDS, edit.blockType)) {
      badRequest(`${label}.blockType is not supported for agent copy edits.`)
    }
    const blockType = edit.blockType
    const rules = PAGE_COPY_FIELDS[blockType]
    const rawPatch = asRecord(edit.patch, `${label}.patch`)
    const fields = Object.keys(rawPatch)
    if (fields.length === 0) badRequest(`${label}.patch must change at least one field.`)
    rejectUnknownFields(rawPatch, Object.keys(rules), `${label}.patch`)

    const patch: Record<string, string> = {}
    for (const field of fields) {
      const rawText = rawPatch[field]
      if (typeof rawText !== 'string') badRequest(`${label}.patch.${field} must be plain text.`)
      const text = rawText.trim()
      const rule = rules[field]
      if (Buffer.byteLength(text, 'utf8') > rule.maxBytes) {
        badRequest(`${label}.patch.${field} exceeds its ${rule.maxBytes}-byte limit.`)
      }
      if (rule.required && !text) badRequest(`${label}.patch.${field} cannot be empty.`)
      patch[field] = text
    }

    return { blockID, blockType, patch }
  })
}

export function parsePagePatch(patchJson: string): Record<string, unknown> {
  if (Buffer.byteLength(patchJson, 'utf8') > 250_000) {
    badRequest('Page patch exceeds the 250 KB limit.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(patchJson)
  } catch {
    badRequest('Page patch is not valid JSON.')
  }

  const patch = asRecord(parsed, 'Page patch')
  const keys = Object.keys(patch)
  if (keys.length === 0) badRequest('Page patch must change at least one field.')

  const unsupported = keys.filter((key) => !PAGE_PATCH_FIELDS.has(key))
  if (unsupported.length > 0) {
    badRequest(`Page patch contains unsupported fields: ${unsupported.join(', ')}`)
  }

  if ('copyEdits' in patch) patch.copyEdits = parsePageCopyEdits(patch.copyEdits)
  if ('title' in patch) patch.title = pagePatchText(patch.title, 'Page patch title', 120)
  if ('slug' in patch) {
    const slug = pagePatchText(patch.slug, 'Page patch slug', 70)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      badRequest('Page patch slug must contain only lowercase letters, numbers, and hyphens.')
    }
    patch.slug = slug
  }
  if ('meta' in patch) {
    const meta = asRecord(patch.meta, 'Page patch meta')
    rejectUnknownFields(meta, ['description', 'title'], 'Page patch meta')
    if (Object.keys(meta).length === 0)
      badRequest('Page patch meta must change at least one field.')
    patch.meta = {
      ...('description' in meta
        ? { description: pagePatchText(meta.description, 'Page patch meta.description', 155, true) }
        : {}),
      ...('title' in meta
        ? { title: pagePatchText(meta.title, 'Page patch meta.title', 60, true) }
        : {}),
    }
  }

  return patch
}

function plainTextRichText(text: string) {
  return {
    root: {
      children: [
        {
          children: text
            ? [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text,
                  type: 'text',
                  version: 1,
                },
              ]
            : [],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function applyPageCopyEdits(layoutValue: unknown, edits: PageCopyEdit[]): unknown[] {
  if (!Array.isArray(layoutValue)) conflict('Page layout is unavailable for copy editing.')

  const layout = [...layoutValue]
  for (const edit of edits) {
    const matches = layout
      .map((block, index) => ({ block, index }))
      .filter(
        ({ block }) =>
          Boolean(block && typeof block === 'object' && !Array.isArray(block)) &&
          (block as Record<string, unknown>).id === edit.blockID,
      )

    if (matches.length !== 1) {
      conflict(
        `Page block ${edit.blockID} was not found exactly once. Read the Page before retrying.`,
      )
    }

    const match = matches[0]
    const block = match.block as Record<string, unknown>
    if (block.blockType !== edit.blockType) {
      conflict(
        `Page block ${edit.blockID} is ${String(block.blockType)}, not ${edit.blockType}. Read the Page before retrying.`,
      )
    }

    const rules = PAGE_COPY_FIELDS[edit.blockType]
    const nextBlock = { ...block }
    for (const [field, text] of Object.entries(edit.patch)) {
      nextBlock[field] = rules[field].richText ? plainTextRichText(text) : text
    }
    layout[match.index] = nextBlock
  }

  return layout
}

function cleanCloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanCloneValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SYSTEM_FIELDS.has(key))
      .map(([key, nested]) => [key, cleanCloneValue(nested)]),
  )
}

function compactDocument(doc: RecordDoc, collection: ContentCollection) {
  return {
    id: doc.id,
    collection,
    title: doc.title,
    slug: doc.slug,
    status: doc._status,
    updatedAt: doc.updatedAt,
  }
}

function assertFresh(doc: RecordDoc, expectedUpdatedAt: string): void {
  if (doc.updatedAt !== expectedUpdatedAt) {
    conflict(
      `Content changed after it was read (expected ${expectedUpdatedAt}, found ${String(doc.updatedAt)}). Read it again before retrying.`,
    )
  }
}

async function findByID(
  req: PayloadRequest,
  collection: TrashableCollection,
  id: number | string,
  locale: AppLocale,
  trash = false,
): Promise<RecordDoc> {
  const common = {
    id,
    depth: 0,
    fallbackLocale: false as const,
    locale,
    overrideAccess: false,
    req,
    trash,
  }

  const doc =
    collection === 'pages'
      ? await req.payload.findByID({ collection: 'pages', draft: true, ...common })
      : collection === 'posts'
        ? await req.payload.findByID({ collection: 'posts', draft: true, ...common })
        : await req.payload.findByID({ collection: 'media', ...common })

  return doc as unknown as RecordDoc
}

const lockTables: Record<TrashableCollection, string> = {
  media: 'media',
  pages: 'pages',
  posts: 'posts',
}

function numericDocumentID(id: number | string): number {
  const value = typeof id === 'number' ? id : Number(id)
  if (!Number.isSafeInteger(value) || value <= 0)
    badRequest('Document ID must be a positive integer.')
  return value
}

/** Hold the document's Postgres row lock across freshness/live checks and its write. */
async function withDocumentLock<T>(
  req: PayloadRequest,
  collection: TrashableCollection,
  id: number | string,
  run: () => Promise<T>,
): Promise<T> {
  const shouldCommit = await initTransaction(req)
  try {
    const transactionID = await req.transactionID
    const database = req.payload.db as unknown as PostgresAdapter
    const session = transactionID ? database.sessions[String(transactionID)] : undefined
    if (!session) throw new APIError('Could not start a content mutation transaction.', 500)

    await database.execute({
      db: session.db,
      raw: `SELECT "id" FROM "${lockTables[collection]}" WHERE "id" = ${numericDocumentID(id)} FOR UPDATE`,
    })
    const result = await run()
    if (shouldCommit) await commitTransaction(req)
    return result
  } catch (error) {
    if (shouldCommit) await killTransaction(req)
    throw error
  }
}

function quoteSQLIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`
}

/** Block Media trash while any relational current or historical row still references it. */
async function assertMediaIsUnreferenced(req: PayloadRequest, id: number | string): Promise<void> {
  const transactionID = await req.transactionID
  const database = req.payload.db as unknown as PostgresAdapter
  const session = transactionID ? database.sessions[String(transactionID)] : undefined
  if (!session) throw new APIError('Could not check Media references.', 500)

  const referenceColumns = await database.execute({
    db: session.db,
    raw: `
      SELECT
        source_namespace.nspname AS "schemaName",
        source_table.relname AS "tableName",
        source_column.attname AS "columnName"
      FROM pg_constraint constraint_record
      JOIN pg_class source_table ON source_table.oid = constraint_record.conrelid
      JOIN pg_namespace source_namespace ON source_namespace.oid = source_table.relnamespace
      JOIN pg_class target_table ON target_table.oid = constraint_record.confrelid
      JOIN pg_namespace target_namespace ON target_namespace.oid = target_table.relnamespace
      JOIN LATERAL unnest(constraint_record.conkey) WITH ORDINALITY source_key(attnum, ordinal)
        ON true
      JOIN LATERAL unnest(constraint_record.confkey) WITH ORDINALITY target_key(attnum, ordinal)
        ON target_key.ordinal = source_key.ordinal
      JOIN pg_attribute source_column
        ON source_column.attrelid = source_table.oid
        AND source_column.attnum = source_key.attnum
      JOIN pg_attribute target_column
        ON target_column.attrelid = target_table.oid
        AND target_column.attnum = target_key.attnum
      WHERE constraint_record.contype = 'f'
        AND target_table.relname = 'media'
        AND target_namespace.nspname = current_schema()
        AND target_column.attname = 'id'
        AND NOT (
          source_namespace.nspname = target_namespace.nspname AND (
            (
              source_table.relname = 'media_locales'
              AND source_column.attname = '_parent_id'
            )
            OR (
              source_table.relname = 'payload_locked_documents_rels'
              AND source_column.attname = 'media_id'
            )
          )
        )
    `,
  })
  const columns = referenceColumns.rows as unknown as Array<{
    columnName: string
    schemaName: string
    tableName: string
  }>
  if (columns.length === 0) return

  const mediaID = numericDocumentID(id)
  const queries = columns.map(({ columnName, schemaName, tableName }) => {
    const column = quoteSQLIdentifier(columnName)
    const table = `${quoteSQLIdentifier(schemaName)}.${quoteSQLIdentifier(tableName)}`
    return `SELECT 1 FROM ${table} WHERE ${column} = ${mediaID}`
  })
  const references = await database.execute({
    db: session.db,
    raw: `SELECT 1 FROM (${queries.join(' UNION ALL ')}) AS "media_references" LIMIT 1`,
  })
  if (references.rowCount) {
    conflict(
      'Media is referenced by current or historical content. An admin must review it before removal.',
    )
  }
}

export async function findContent({
  collection,
  locale,
  limit,
  req,
  search,
}: {
  collection: ContentCollection
  locale: AppLocale
  limit: number
  req: PayloadRequest
  search?: string
}) {
  assertAgentRequest(req)
  const trimmedSearch = search?.trim()
  const where: Where | undefined = trimmedSearch
    ? {
        or: [{ title: { like: trimmedSearch } }, { slug: { like: trimmedSearch } }],
      }
    : undefined
  const common = {
    depth: 0,
    draft: true,
    fallbackLocale: false as const,
    limit: Math.min(Math.max(limit, 1), 20),
    locale,
    overrideAccess: false,
    pagination: false as const,
    req,
    sort: '-updatedAt',
    where,
  }

  const result =
    collection === 'pages'
      ? await req.payload.find({ collection: 'pages', ...common })
      : await req.payload.find({ collection: 'posts', ...common })

  return {
    collection,
    docs: (result.docs as unknown as RecordDoc[]).map((doc) => compactDocument(doc, collection)),
    locale,
    totalDocs: result.totalDocs,
  }
}

export async function getContent({
  collection,
  id,
  locale,
  req,
}: {
  collection: ContentCollection
  id: number | string
  locale: AppLocale
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  const doc = await findByID(req, collection, id, locale)
  const serialized = JSON.stringify(doc)
  if (Buffer.byteLength(serialized, 'utf8') > 500_000) {
    throw new APIError('Document exceeds the 500 KB MCP response limit.', 413)
  }
  return { collection, doc, locale }
}

export async function createPostDraft({
  input,
  locale,
  req,
}: {
  input: PostDraftInput
  locale: AppLocale
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  const intro = parseHtmlToContent(input.introHtml)
  const doc = await req.payload.create({
    collection: 'posts',
    data: {
      _status: 'draft',
      authors: input.authorIDs,
      categories: input.categoryIDs,
      focusKeyword: input.focusKeyword,
      heroImage: input.heroImageID,
      htmlContent: input.contentHtml,
      intro,
      meta: {
        description: input.metaDescription,
        title: input.metaTitle,
      },
      slug: input.slug,
      source: 'api',
      subtitle: input.subtitle,
      title: input.title,
    } as never,
    depth: 0,
    draft: true,
    fallbackLocale: false,
    locale,
    overrideAccess: false,
    req,
  })

  const current = await findByID(req, 'posts', doc.id, locale)
  return compactDocument(current, 'posts')
}

export async function updatePostDraft({
  expectedUpdatedAt,
  id,
  locale,
  patch,
  req,
}: {
  expectedUpdatedAt: string
  id: number | string
  locale: AppLocale
  patch: PostDraftPatch
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  if (Object.keys(patch).length === 0) badRequest('Post patch must change at least one field.')

  const update = () =>
    withDocumentLock(req, 'posts', id, async () => {
      const current = await findByID(req, 'posts', id, locale)
      assertFresh(current, expectedUpdatedAt)

      const data: Record<string, unknown> = { _status: 'draft' }
      if (patch.title !== undefined) data.title = patch.title
      if (patch.subtitle !== undefined) data.subtitle = patch.subtitle
      if (patch.slug !== undefined) data.slug = patch.slug
      if (patch.focusKeyword !== undefined) data.focusKeyword = patch.focusKeyword
      if (patch.heroImageID !== undefined) data.heroImage = patch.heroImageID
      if (patch.categoryIDs !== undefined) data.categories = patch.categoryIDs
      if (patch.authorIDs !== undefined) data.authors = patch.authorIDs
      if (patch.introHtml !== undefined) data.intro = parseHtmlToContent(patch.introHtml)
      if (patch.contentHtml !== undefined) {
        data.htmlContent = patch.contentHtml
        data.source = 'api'
      }
      if (patch.metaTitle !== undefined || patch.metaDescription !== undefined) {
        const currentMeta = asRecord(current.meta ?? {}, 'Current post meta')
        data.meta = {
          ...currentMeta,
          ...(patch.metaDescription !== undefined ? { description: patch.metaDescription } : {}),
          ...(patch.metaTitle !== undefined ? { title: patch.metaTitle } : {}),
        }
      }

      const doc = await req.payload.update({
        collection: 'posts',
        id,
        data: data as never,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        locale,
        overrideAccess: false,
        overrideLock: false,
        req,
      })
      const latest = await findByID(req, 'posts', doc.id, locale)
      return compactDocument(latest, 'posts')
    })

  return patch.heroImageID === undefined || patch.heroImageID === null
    ? update()
    : withDocumentLock(req, 'media', patch.heroImageID, update)
}

export async function clonePageDraft({
  locale,
  req,
  slug,
  sourcePageID,
  title,
}: {
  locale: AppLocale
  req: PayloadRequest
  slug: string
  sourcePageID: number | string
  title: string
}) {
  assertAgentRequest(req)
  const source = await findByID(req, 'pages', sourcePageID, locale)
  const data = cleanCloneValue(source) as Record<string, unknown>
  data._status = 'draft'
  data.slug = slug
  data.title = title

  const doc = await req.payload.create({
    collection: 'pages',
    data: data as never,
    depth: 0,
    draft: true,
    fallbackLocale: false,
    locale,
    overrideAccess: false,
    req,
  })
  const current = await findByID(req, 'pages', doc.id, locale)
  return compactDocument(current, 'pages')
}

export async function patchPageDraft({
  expectedUpdatedAt,
  id,
  locale,
  patch,
  req,
}: {
  expectedUpdatedAt: string
  id: number | string
  locale: AppLocale
  patch: Record<string, unknown>
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  const parsedPatch = parsePagePatch(JSON.stringify(patch))
  return withDocumentLock(req, 'pages', id, async () => {
    const current = await findByID(req, 'pages', id, locale)
    assertFresh(current, expectedUpdatedAt)

    const { copyEdits, meta, ...fields } = parsedPatch
    const data: Record<string, unknown> = { ...fields, _status: 'draft' }
    if (meta) {
      const currentMeta =
        current.meta && typeof current.meta === 'object' && !Array.isArray(current.meta)
          ? (current.meta as Record<string, unknown>)
          : {}
      data.meta = { ...currentMeta, ...(meta as Record<string, unknown>) }
    }
    if (copyEdits) {
      data.layout = applyPageCopyEdits(current.layout, copyEdits as PageCopyEdit[])
    }

    const doc = await req.payload.update({
      collection: 'pages',
      id,
      data: data as never,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale,
      overrideAccess: false,
      overrideLock: false,
      req,
    })
    const latest = await findByID(req, 'pages', doc.id, locale)
    return compactDocument(latest, 'pages')
  })
}

const MEDIA_SIGNATURES: Record<string, (data: Buffer) => boolean> = {
  'image/gif': (data) => ['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString('ascii')),
  'image/jpeg': (data) =>
    data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) => data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')),
  'image/webp': (data) =>
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP',
}

const MEDIA_EXTENSIONS: Record<string, string[]> = {
  'image/gif': ['.gif'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

const mediaLimitBytes = 5 * 1024 * 1024
const mediaLimitPixels = 40_000_000

export async function uploadMedia({
  alt,
  base64,
  filename,
  locale,
  mimeType,
  req,
}: {
  alt: string
  base64: string
  filename: string
  locale: AppLocale
  mimeType: keyof typeof MEDIA_SIGNATURES
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  const safeName = path.basename(filename.trim())
  if (!safeName || safeName !== filename.trim() || safeName.length > 120) {
    badRequest('Filename must be a plain filename no longer than 120 characters.')
  }
  const extension = path.extname(safeName).toLowerCase()
  if (!MEDIA_EXTENSIONS[mimeType]?.includes(extension)) {
    badRequest(`Filename extension does not match ${mimeType}.`)
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) badRequest('File is not valid base64.')
  const maxBytes = mediaLimitBytes
  if (base64.length > Math.ceil(maxBytes / 3) * 4 + 4) {
    throw new APIError(`Media exceeds the ${maxBytes}-byte MCP upload limit.`, 413)
  }
  const data = Buffer.from(base64, 'base64')
  if (data.length === 0 || data.length > maxBytes) {
    throw new APIError(`Media exceeds the ${maxBytes}-byte MCP upload limit.`, 413)
  }
  if (!MEDIA_SIGNATURES[mimeType]?.(data)) {
    badRequest(`File bytes do not match ${mimeType}.`)
  }

  const maxPixels = mediaLimitPixels
  try {
    const metadata = await sharp(data, { animated: true, limitInputPixels: maxPixels }).metadata()
    const width = metadata.width ?? 0
    const frameHeight = metadata.pageHeight ?? metadata.height ?? 0
    const pages = metadata.pages ?? 1
    if (
      width <= 0 ||
      frameHeight <= 0 ||
      pages <= 0 ||
      pages > 100 ||
      width * frameHeight * pages > maxPixels
    ) {
      throw new Error('unsafe image dimensions')
    }
  } catch {
    badRequest(`Image is invalid or exceeds the ${maxPixels}-pixel decode limit.`)
  }

  const previousUpload = req.context.agentMediaUpload
  req.context.agentMediaUpload = true
  let media: RecordDoc
  try {
    const doc = await req.payload.create({
      collection: 'media',
      data: { agentTrashEligible: false, alt },
      depth: 0,
      fallbackLocale: false,
      file: { data, mimetype: mimeType, name: safeName, size: data.length },
      locale,
      overrideAccess: false,
      req,
    })
    media = doc as unknown as RecordDoc
  } finally {
    if (previousUpload === undefined) delete req.context.agentMediaUpload
    else req.context.agentMediaUpload = previousUpload
  }
  return {
    id: media.id,
    filename: media.filename,
    mimeType: media.mimeType,
    size: media.filesize,
    updatedAt: media.updatedAt,
  }
}

async function withTrashAction<T>(
  req: PayloadRequest,
  action: 'restore' | 'trash',
  run: () => Promise<T>,
): Promise<T> {
  const previous = req.context.agentTrashAction
  req.context.agentTrashAction = action
  try {
    return await run()
  } finally {
    if (previous === undefined) delete req.context.agentTrashAction
    else req.context.agentTrashAction = previous
  }
}

export async function setContentTrashState({
  action,
  collection,
  expectedUpdatedAt,
  id,
  locale,
  req,
}: {
  action: 'restore' | 'trash'
  collection: TrashableCollection
  expectedUpdatedAt: string
  id: number | string
  locale: AppLocale
  req: PayloadRequest
}) {
  assertAgentRequest(req)
  return withDocumentLock(req, collection, id, async () => {
    const current = await findByID(req, collection, id, locale, action === 'restore')
    assertFresh(current, expectedUpdatedAt)

    if (action === 'restore' && typeof current.deletedAt !== 'string') {
      conflict('Content is not in trash and cannot be restored.')
    }

    if (collection === 'media') {
      if (current.agentTrashEligible !== true) {
        conflict(
          'Only MCP-uploaded Media that has never been referenced or manually modified can be trashed or restored by an agent.',
        )
      }
      if (action === 'trash') await assertMediaIsUnreferenced(req, id)
    }

    if (collection !== 'media') {
      const liveCommon = {
        id,
        depth: 0,
        disableErrors: true,
        draft: false,
        fallbackLocale: false as const,
        locale: 'all' as const,
        overrideAccess: false,
        req,
        trash: true,
      }
      const live =
        collection === 'pages'
          ? await req.payload.findByID({ collection: 'pages', ...liveCommon })
          : await req.payload.findByID({ collection: 'posts', ...liveCommon })
      const status = (live as unknown as RecordDoc | null)?._status
      const hasPublishedLocale =
        status === 'published' ||
        (status !== null &&
          typeof status === 'object' &&
          Object.values(status).includes('published'))

      if (hasPublishedLocale) {
        conflict(
          'Published content must be unpublished in every locale by an admin before it can be trashed or restored.',
        )
      }
    }

    const common = {
      id,
      data: { deletedAt: action === 'trash' ? new Date().toISOString() : null } as never,
      depth: 0,
      fallbackLocale: false as const,
      locale,
      overrideAccess: false,
      overrideLock: false,
      req,
      trash: action === 'restore',
    }

    const doc = await withTrashAction(req, action, async () => {
      if (collection === 'pages') {
        return req.payload.update({ collection: 'pages', ...common })
      }
      if (collection === 'posts') {
        return req.payload.update({ collection: 'posts', ...common })
      }
      return req.payload.update({ collection: 'media', ...common })
    })

    const updated = await findByID(req, collection, doc.id, locale, action === 'trash')
    return {
      action,
      collection,
      id: updated.id,
      updatedAt: updated.updatedAt,
    }
  })
}

export function isAgentEditorRequest(req: PayloadRequest): boolean {
  return req.payloadAPI === 'MCP' && isAgentEditor(req.user)
}
