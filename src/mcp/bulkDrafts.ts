import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { APIError, type PayloadRequest } from 'payload'

import {
  assertAgentRequest,
  clonePageDraft,
  createPostDraft,
  parsePagePatch,
  patchPageDraft,
  requireLocale,
  updatePostDraft,
} from '@/mcp/contentOperations'
import { hashStableJSON } from '@/mcp/runIdempotentMutation'
import {
  beginAgentMutationTransaction,
  commitAgentMutationTransaction,
  rollbackAgentMutationTransaction,
} from '@/mcp/mutationTransaction'

const auditCollection = 'agent-operations'
const maxItems = 20
const maxPayloadBytes = 250_000
const planLifetimeMs = 24 * 60 * 60 * 1_000
const defaultWritesPerMinute = 10
const approvalInstructions =
  'An admin must review this plan and set Approval Status to Approved in Payload Admin before it can be committed.'

type ID = number | string
type AppLocale = ReturnType<typeof requireLocale>

type PostCreateItem = {
  authorIDs?: ID[]
  categoryIDs?: ID[]
  contentHtml: string
  focusKeyword?: string
  heroImageID?: ID
  introHtml: string
  metaDescription: string
  metaTitle: string
  slug: string
  subtitle?: string
  title: string
  type: 'post-create'
}

type PostUpdateItem = {
  expectedUpdatedAt: string
  id: ID
  patch: {
    authorIDs?: ID[]
    categoryIDs?: ID[]
    contentHtml?: string
    focusKeyword?: null | string
    heroImageID?: ID | null
    introHtml?: string
    metaDescription?: string
    metaTitle?: string
    slug?: string
    subtitle?: null | string
    title?: string
  }
  type: 'post-update'
}

type PageCloneItem = {
  slug: string
  sourcePageID: ID
  title: string
  type: 'page-clone'
}

type PageUpdateItem = {
  expectedUpdatedAt: string
  id: ID
  patch: Record<string, unknown>
  type: 'page-update'
}

export type BulkDraftItem = PageCloneItem | PageUpdateItem | PostCreateItem | PostUpdateItem

type OperationStatus = 'failed' | 'planned' | 'running' | 'succeeded'

type AgentOperation = {
  actor: ID | { id: ID }
  approvalStatus?: 'approved' | 'not-required' | 'pending' | 'rejected'
  error?: string
  expiresAt?: string
  id: ID
  idempotencyKey: string
  locale?: string
  operationKey: string
  plan?: unknown
  planHash?: string
  requestHash: string
  result?: unknown
  status: OperationStatus
  tool: string
}

type AuditPayload = {
  count: (args: {
    collection: typeof auditCollection
    overrideAccess: true
    req: PayloadRequest
    where: Record<string, unknown>
  }) => Promise<{ totalDocs: number }>
  create: (args: {
    collection: typeof auditCollection
    data: Record<string, unknown>
    depth: 0
    overrideAccess: true
    req: PayloadRequest
  }) => Promise<AgentOperation>
  find: (args: {
    collection: typeof auditCollection
    depth: 0
    limit: 1
    overrideAccess: true
    req: PayloadRequest
    where: Record<string, unknown>
  }) => Promise<{ docs: AgentOperation[] }>
  findByID: (args: {
    collection: typeof auditCollection
    depth: 0
    id: ID
    overrideAccess: true
    req: PayloadRequest
  }) => Promise<AgentOperation>
  update: (args: {
    collection: typeof auditCollection
    data: Record<string, unknown>
    depth: 0
    id: ID
    overrideAccess: true
    req: PayloadRequest
  }) => Promise<AgentOperation>
}

function badRequest(message: string): never {
  throw new APIError(message, 400)
}

function conflict(message: string): never {
  throw new APIError(message, 409)
}

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    badRequest(`${label} must be an object.`)
  }
  return value as Record<string, unknown>
}

const rejectUnknownKeys = (
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void => {
  const allowedKeys = new Set(allowed)
  const unknown = Object.keys(value).filter((key) => !allowedKeys.has(key))
  if (unknown.length > 0) badRequest(`${label} contains unsupported fields: ${unknown.join(', ')}`)
}

const requiredText = (
  value: unknown,
  label: string,
  maxLength: number,
  preserveWhitespace = false,
): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    badRequest(`${label} must be a non-empty string.`)
  }
  if (Buffer.byteLength(value, 'utf8') > maxLength) {
    badRequest(`${label} exceeds its ${maxLength}-byte limit.`)
  }
  return preserveWhitespace ? value : value.trim()
}

function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
  nullable: true,
): string | null | undefined
function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
  nullable?: false,
): string | undefined
function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
  nullable = false,
): string | null | undefined {
  if (value === undefined) return undefined
  if (nullable && value === null) return null
  if (typeof value !== 'string')
    badRequest(`${label} must be a string${nullable ? ' or null' : ''}.`)
  if (Buffer.byteLength(value, 'utf8') > maxLength) {
    badRequest(`${label} exceeds its ${maxLength}-byte limit.`)
  }
  return value.trim()
}

const id = (value: unknown, label: string): ID => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (normalized && normalized.length <= 128) return normalized
  }
  return badRequest(`${label} must be a positive integer or a non-empty ID string.`)
}

const ids = (value: unknown, label: string): ID[] | undefined => {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || value.length > 50) {
    badRequest(`${label} must be an array containing at most 50 IDs.`)
  }
  return value.map((entry, index) => id(entry, `${label}[${index}]`))
}

const timestamp = (value: unknown, label: string): string => {
  const text = requiredText(value, label, 64)
  const milliseconds = Date.parse(text)
  if (!Number.isFinite(milliseconds)) badRequest(`${label} must be a valid timestamp.`)
  return new Date(milliseconds).toISOString()
}

const slug = (value: unknown, label: string): string => {
  const normalized = requiredText(value, label, 70)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    badRequest(`${label} must contain only lowercase letters, numbers, and single hyphens.`)
  }
  return normalized
}

const postCreate = (raw: Record<string, unknown>, index: number): PostCreateItem => {
  const label = `items[${index}]`
  rejectUnknownKeys(
    raw,
    [
      'authorIDs',
      'categoryIDs',
      'contentHtml',
      'focusKeyword',
      'heroImageID',
      'introHtml',
      'metaDescription',
      'metaTitle',
      'slug',
      'subtitle',
      'title',
      'type',
    ],
    label,
  )

  const authorIDs = ids(raw.authorIDs, `${label}.authorIDs`)
  const categoryIDs = ids(raw.categoryIDs, `${label}.categoryIDs`)
  const focusKeyword = optionalText(raw.focusKeyword, `${label}.focusKeyword`, 200)
  const subtitle = optionalText(raw.subtitle, `${label}.subtitle`, 300)
  const heroImageID =
    raw.heroImageID === undefined ? undefined : id(raw.heroImageID, `${label}.heroImageID`)

  return {
    ...(authorIDs === undefined ? {} : { authorIDs }),
    ...(categoryIDs === undefined ? {} : { categoryIDs }),
    contentHtml: requiredText(raw.contentHtml, `${label}.contentHtml`, 220_000, true),
    ...(focusKeyword === undefined ? {} : { focusKeyword }),
    ...(heroImageID === undefined ? {} : { heroImageID }),
    introHtml: requiredText(raw.introHtml, `${label}.introHtml`, 30_000, true),
    metaDescription: requiredText(raw.metaDescription, `${label}.metaDescription`, 220),
    metaTitle: requiredText(raw.metaTitle, `${label}.metaTitle`, 70),
    slug: slug(raw.slug, `${label}.slug`),
    ...(subtitle === undefined ? {} : { subtitle }),
    title: requiredText(raw.title, `${label}.title`, 70),
    type: 'post-create',
  }
}

const postPatch = (rawValue: unknown, index: number): PostUpdateItem['patch'] => {
  const label = `items[${index}].patch`
  const raw = asRecord(rawValue, label)
  rejectUnknownKeys(
    raw,
    [
      'authorIDs',
      'categoryIDs',
      'contentHtml',
      'focusKeyword',
      'heroImageID',
      'introHtml',
      'metaDescription',
      'metaTitle',
      'slug',
      'subtitle',
      'title',
    ],
    label,
  )
  if (Object.keys(raw).length === 0) badRequest(`${label} must change at least one field.`)

  const patch: PostUpdateItem['patch'] = {}
  if ('authorIDs' in raw) patch.authorIDs = ids(raw.authorIDs, `${label}.authorIDs`)
  if ('categoryIDs' in raw) patch.categoryIDs = ids(raw.categoryIDs, `${label}.categoryIDs`)
  if ('contentHtml' in raw) {
    patch.contentHtml = requiredText(raw.contentHtml, `${label}.contentHtml`, 220_000, true)
  }
  if ('focusKeyword' in raw) {
    patch.focusKeyword = optionalText(raw.focusKeyword, `${label}.focusKeyword`, 200, true)
  }
  if ('heroImageID' in raw) {
    patch.heroImageID =
      raw.heroImageID === null ? null : id(raw.heroImageID, `${label}.heroImageID`)
  }
  if ('introHtml' in raw) {
    patch.introHtml = requiredText(raw.introHtml, `${label}.introHtml`, 30_000, true)
  }
  if ('metaDescription' in raw) {
    patch.metaDescription = requiredText(raw.metaDescription, `${label}.metaDescription`, 220)
  }
  if ('metaTitle' in raw) patch.metaTitle = requiredText(raw.metaTitle, `${label}.metaTitle`, 70)
  if ('slug' in raw) patch.slug = slug(raw.slug, `${label}.slug`)
  if ('subtitle' in raw) patch.subtitle = optionalText(raw.subtitle, `${label}.subtitle`, 300, true)
  if ('title' in raw) patch.title = requiredText(raw.title, `${label}.title`, 70)
  return patch
}

const pagePatch = (rawValue: unknown, index: number): Record<string, unknown> => {
  const raw = asRecord(rawValue, `items[${index}].patch`)
  const patch = parsePagePatch(JSON.stringify(raw))
  if ('title' in patch) patch.title = requiredText(patch.title, `items[${index}].patch.title`, 200)
  if ('slug' in patch) patch.slug = slug(patch.slug, `items[${index}].patch.slug`)
  return patch
}

const normalizeItem = (value: unknown, index: number): BulkDraftItem => {
  const raw = asRecord(value, `items[${index}]`)
  switch (raw.type) {
    case 'post-create':
      return postCreate(raw, index)
    case 'post-update':
      rejectUnknownKeys(raw, ['expectedUpdatedAt', 'id', 'patch', 'type'], `items[${index}]`)
      return {
        expectedUpdatedAt: timestamp(raw.expectedUpdatedAt, `items[${index}].expectedUpdatedAt`),
        id: id(raw.id, `items[${index}].id`),
        patch: postPatch(raw.patch, index),
        type: 'post-update',
      }
    case 'page-clone':
      rejectUnknownKeys(raw, ['slug', 'sourcePageID', 'title', 'type'], `items[${index}]`)
      return {
        slug: slug(raw.slug, `items[${index}].slug`),
        sourcePageID: id(raw.sourcePageID, `items[${index}].sourcePageID`),
        title: requiredText(raw.title, `items[${index}].title`, 200),
        type: 'page-clone',
      }
    case 'page-update':
      rejectUnknownKeys(raw, ['expectedUpdatedAt', 'id', 'patch', 'type'], `items[${index}]`)
      return {
        expectedUpdatedAt: timestamp(raw.expectedUpdatedAt, `items[${index}].expectedUpdatedAt`),
        id: id(raw.id, `items[${index}].id`),
        patch: pagePatch(raw.patch, index),
        type: 'page-update',
      }
    default:
      return badRequest(
        `items[${index}].type must be post-create, post-update, page-clone, or page-update.`,
      )
  }
}

const normalizeItems = (value: unknown): BulkDraftItem[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxItems) {
    badRequest(`Bulk plans must contain between 1 and ${maxItems} items.`)
  }
  return value.map(normalizeItem)
}

const normalizedKey = (value: string): string => {
  const key = value.trim()
  if (!key || key.length > 128) badRequest('Idempotency key must be between 1 and 128 characters.')
  return key
}

const actorID = (req: PayloadRequest): ID => {
  const value = req.user?.id
  if (value === undefined || value === null) {
    throw new APIError('Authentication is required.', 401)
  }
  return value
}

const relationID = (value: AgentOperation['actor']): ID =>
  typeof value === 'object' ? value.id : value

const payloadFor = (req: PayloadRequest): AuditPayload => req.payload as unknown as AuditPayload

/** Lock the approved plan row so an admin cannot revoke or replace it mid-commit. */
const lockPlan = async (req: PayloadRequest, planID: ID): Promise<void> => {
  const numericID = typeof planID === 'number' ? planID : Number(planID)
  if (!Number.isSafeInteger(numericID) || numericID <= 0)
    badRequest('Plan ID must be a positive integer.')

  const database = req.payload.db as unknown as Partial<PostgresAdapter>
  if (typeof database.execute !== 'function' || !database.sessions) return

  const transactionID = await req.transactionID
  const session = transactionID ? database.sessions[String(transactionID)] : undefined
  if (!session) throw new APIError('Could not lock the bulk draft plan.', 500)

  await database.execute({
    db: session.db,
    raw: `SELECT "id" FROM "agent_operations" WHERE "id" = ${numericID} FOR UPDATE`,
  })
}

const writesPerMinute = (): number => {
  const configured = Number(process.env.MCP_WRITES_PER_MINUTE)
  const value =
    Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : defaultWritesPerMinute
  return Math.min(100, Math.max(1, value))
}

const enforceQuota = async (
  payload: AuditPayload,
  req: PayloadRequest,
  actor: ID,
): Promise<void> => {
  const { totalDocs } = await payload.count({
    collection: auditCollection,
    overrideAccess: true,
    req,
    where: {
      actor: { equals: actor },
      createdAt: { greater_than: new Date(Date.now() - 60_000).toISOString() },
    },
  })
  if (totalDocs >= writesPerMinute()) {
    throw new APIError('Agent mutation rate limit exceeded. Try again shortly.', 429)
  }
}

const findOperation = async (
  payload: AuditPayload,
  req: PayloadRequest,
  operationKey: string,
): Promise<AgentOperation | undefined> => {
  const { docs } = await payload.find({
    collection: auditCollection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: { operationKey: { equals: operationKey } },
  })
  return docs[0]
}

const summary = (items: BulkDraftItem[]): Record<BulkDraftItem['type'], number> => {
  const counts: Record<BulkDraftItem['type'], number> = {
    'page-clone': 0,
    'page-update': 0,
    'post-create': 0,
    'post-update': 0,
  }
  items.forEach((item) => counts[item.type]++)
  return counts
}

const planResponse = (operation: AgentOperation, items: BulkDraftItem[]) => ({
  count: items.length,
  instructions: approvalInstructions,
  planHash: operation.planHash,
  planID: operation.id,
  summary: summary(items),
})

export const planBulkDrafts = async ({
  idempotencyKey,
  itemsJson,
  locale,
  req,
}: {
  idempotencyKey: string
  itemsJson: string
  locale: string
  req: PayloadRequest
}) => {
  assertAgentRequest(req)
  const appLocale = requireLocale(locale)
  const key = normalizedKey(idempotencyKey)
  if (Buffer.byteLength(itemsJson, 'utf8') > maxPayloadBytes) {
    throw new APIError(`Bulk plan exceeds the ${maxPayloadBytes}-byte limit.`, 413)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(itemsJson)
  } catch {
    badRequest('Bulk plan is not valid JSON.')
  }
  const items = normalizeItems(parsed)
  const actor = actorID(req)
  const tool = 'plan_bulk_drafts'
  const operationKey = hashStableJSON({ actorID: String(actor), key, tool })
  const planHash = hashStableJSON(items)
  const requestHash = hashStableJSON({ locale: appLocale, plan: items })
  const payload = payloadFor(req)

  const transaction = await beginAgentMutationTransaction(req, actor)
  try {
    const existing = await findOperation(payload, req, operationKey)
    if (existing) {
      if (existing.requestHash !== requestHash) {
        conflict('This idempotency key was already used for a different bulk plan.')
      }
      const existingItems = normalizeItems(existing.plan)
      await commitAgentMutationTransaction(req, transaction)
      return planResponse(existing, existingItems)
    }

    await enforceQuota(payload, req, actor)

    let operation: AgentOperation
    try {
      operation = await payload.create({
        collection: auditCollection,
        data: {
          actor,
          approvalStatus: 'pending',
          expiresAt: new Date(Date.now() + planLifetimeMs).toISOString(),
          idempotencyKey: key,
          locale: appLocale,
          operationKey,
          plan: items,
          planHash,
          requestHash,
          status: 'planned',
          tool,
        },
        depth: 0,
        overrideAccess: true,
        req,
      })
    } catch (error) {
      const raced = await findOperation(payload, req, operationKey)
      if (!raced) throw error
      if (raced.requestHash !== requestHash) {
        conflict('This idempotency key was already used for a different bulk plan.')
      }
      operation = raced
    }

    const result = planResponse(operation, items)
    await commitAgentMutationTransaction(req, transaction)
    return result
  } catch (error) {
    await rollbackAgentMutationTransaction(req, transaction)
    throw error
  }
}

const safeAuditError = (error: unknown): string => {
  const name = error instanceof Error && error.name ? error.name.slice(0, 80) : 'Error'
  const status = error instanceof APIError ? ` (${error.status})` : ''
  return `${name}${status}: Bulk draft commit failed.`
}

const updateAudit = async (
  payload: AuditPayload,
  req: PayloadRequest,
  id: ID,
  data: Record<string, unknown>,
): Promise<void> => {
  await payload.update({
    collection: auditCollection,
    data,
    depth: 0,
    id,
    overrideAccess: true,
    req,
  })
}

const bestEffortUpdate = async (
  payload: AuditPayload,
  req: PayloadRequest,
  id: ID,
  data: Record<string, unknown>,
): Promise<void> => {
  try {
    await updateAudit(payload, req, id, data)
  } catch {
    // Keep the content failure as the primary error if audit persistence also fails.
  }
}

const bestEffortCreate = async (
  payload: AuditPayload,
  req: PayloadRequest,
  data: Record<string, unknown>,
): Promise<void> => {
  try {
    await payload.create({
      collection: auditCollection,
      data,
      depth: 0,
      overrideAccess: true,
      req,
    })
  } catch {
    // Keep the content failure as the primary error if audit persistence also fails.
  }
}

const runItem = async (item: BulkDraftItem, locale: AppLocale, req: PayloadRequest) => {
  switch (item.type) {
    case 'post-create': {
      const { type: _type, ...input } = item
      return createPostDraft({ input, locale, req })
    }
    case 'post-update':
      return updatePostDraft({
        expectedUpdatedAt: item.expectedUpdatedAt,
        id: item.id,
        locale,
        patch: item.patch,
        req,
      })
    case 'page-clone':
      return clonePageDraft({
        locale,
        req,
        slug: item.slug,
        sourcePageID: item.sourcePageID,
        title: item.title,
      })
    case 'page-update':
      return patchPageDraft({
        expectedUpdatedAt: item.expectedUpdatedAt,
        id: item.id,
        locale,
        patch: item.patch,
        req,
      })
  }
}

export const commitBulkDrafts = async ({
  idempotencyKey,
  planID,
  req,
}: {
  idempotencyKey: string
  planID: ID
  req: PayloadRequest
}) => {
  assertAgentRequest(req)
  const key = normalizedKey(idempotencyKey)
  const actor = actorID(req)
  const payload = payloadFor(req)
  const transaction = await beginAgentMutationTransaction(req, actor)
  if (!transaction.active) {
    throw new APIError('Bulk draft commits require database transaction support.', 503)
  }

  let commitOperation: AgentOperation | undefined
  let commitOperationData: Record<string, unknown> | undefined
  let plan: AgentOperation | undefined

  try {
    // The row lock makes the approval check and its consumption one atomic action.
    await lockPlan(req, planID)
    plan = await payload.findByID({
      collection: auditCollection,
      depth: 0,
      id: planID,
      overrideAccess: true,
      req,
    })

    if (String(relationID(plan.actor)) !== String(actor)) {
      throw new APIError('This bulk plan belongs to a different editor.', 403)
    }
    if (plan.tool !== 'plan_bulk_drafts')
      badRequest('The requested record is not a bulk draft plan.')

    const items = normalizeItems(plan.plan)
    const recomputedPlanHash = hashStableJSON(items)
    if (!plan.planHash || plan.planHash !== recomputedPlanHash) {
      conflict('The stored bulk plan changed after it was created.')
    }
    if (plan.status === 'succeeded') {
      if (plan.result === undefined) conflict('The completed bulk plan has no replayable result.')
      await commitAgentMutationTransaction(req, transaction)
      return plan.result
    }
    if (plan.status !== 'planned') conflict(`This bulk plan is ${plan.status}.`)
    if (plan.approvalStatus !== 'approved') {
      conflict('An admin must approve this bulk plan in Payload Admin before it can be committed.')
    }
    if (!plan.expiresAt || !Number.isFinite(Date.parse(plan.expiresAt))) {
      conflict('This bulk plan has no valid expiry time.')
    }
    if (Date.parse(plan.expiresAt) <= Date.now()) {
      conflict('This bulk plan has expired. Create a new plan.')
    }

    const appLocale = requireLocale(plan.locale ?? '')
    const tool = 'commit_bulk_drafts'
    // One operation key per plan prevents concurrent commits using different client keys.
    const operationKey = hashStableJSON({ actorID: String(actor), planID: String(plan.id), tool })
    const requestHash = hashStableJSON({ planHash: recomputedPlanHash, planID: String(plan.id) })
    const existingCommit = await findOperation(payload, req, operationKey)
    if (existingCommit) {
      if (existingCommit.requestHash !== requestHash) {
        conflict('This bulk plan was already committed with different input.')
      }
      if (existingCommit.status !== 'succeeded') {
        conflict(`This bulk plan commit is ${existingCommit.status}.`)
      }
      await commitAgentMutationTransaction(req, transaction)
      return existingCommit.result
    }

    await enforceQuota(payload, req, actor)

    commitOperationData = {
      actor,
      approvalStatus: 'not-required',
      idempotencyKey: key,
      locale: appLocale,
      operationKey,
      planHash: recomputedPlanHash,
      requestHash,
      status: 'running',
      tool,
    }
    commitOperation = await payload.create({
      collection: auditCollection,
      data: commitOperationData,
      depth: 0,
      overrideAccess: true,
      req,
    })
    await updateAudit(payload, req, plan.id, { status: 'running' })

    const results = []
    for (const [index, item] of items.entries()) {
      results.push({ index, result: await runItem(item, appLocale, req), type: item.type })
    }
    const result = { count: results.length, planID: plan.id, results }
    const targetIDs = results.flatMap(({ result }) => {
      if (!result || typeof result !== 'object' || !('id' in result)) return []
      const resultID = (result as { id?: unknown }).id
      return typeof resultID === 'number' || typeof resultID === 'string' ? [resultID] : []
    })

    await updateAudit(payload, req, plan.id, { result, status: 'succeeded', targetIDs })
    await updateAudit(payload, req, commitOperation.id, {
      result,
      status: 'succeeded',
      targetIDs,
    })
    await commitAgentMutationTransaction(req, transaction)
    return result
  } catch (error) {
    await rollbackAgentMutationTransaction(req, transaction)

    if (commitOperation && commitOperationData && plan) {
      const failure = { error: safeAuditError(error), status: 'failed' }
      const operationKey = String(commitOperationData.operationKey)
      let persistedCommit: AgentOperation | undefined
      try {
        persistedCommit = await findOperation(payload, req, operationKey)
      } catch {
        // The best-effort failure audit must never mask the content error.
      }

      // An ambiguous commit may have succeeded despite a transport error. Never
      // downgrade a durable success to failed; a retry will replay that result.
      if (persistedCommit?.status !== 'succeeded') {
        await bestEffortUpdate(payload, req, plan.id, failure)
        if (persistedCommit) await bestEffortUpdate(payload, req, persistedCommit.id, failure)
        else await bestEffortCreate(payload, req, { ...commitOperationData, ...failure })
      }
    }
    throw error
  }
}
