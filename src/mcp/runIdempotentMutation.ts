import { createHash } from 'node:crypto'

import { APIError, type PayloadRequest } from 'payload'

import {
  beginAgentMutationTransaction,
  commitAgentMutationTransaction,
  rollbackAgentMutationTransaction,
} from '@/mcp/mutationTransaction'

const auditCollection = 'agent-operations'
const writesPerMinute = 10
const redacted = '[REDACTED]'
const sensitiveKey = /api.?key|authorization|cookie|password|secret|token/i
const verboseKey = /body|content|html|markdown|prompt/i

type AuditID = number | string
type TargetCollection = 'media' | 'pages' | 'posts'

type AgentOperation = {
  id: AuditID
  requestHash: string
  result?: unknown
  status: 'failed' | 'planned' | 'running' | 'succeeded'
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
  update: (args: {
    collection: typeof auditCollection
    data: Record<string, unknown>
    depth: 0
    id: AuditID
    overrideAccess: true
    req: PayloadRequest
  }) => Promise<AgentOperation>
}

export type IdempotentMutationOutcome<TResult> = {
  result: TResult
  targetIDs?: AuditID[]
}

export type RunIdempotentMutationOptions<TArgs, TResult> = {
  args: TArgs
  idempotencyKey: string
  locale?: string
  req: PayloadRequest
  run: () => Promise<IdempotentMutationOutcome<TResult>>
  targetCollection?: TargetCollection
  tool: string
}

export const stableStringify = (value: unknown): string => {
  const serialized = JSON.stringify(value, (_key, currentValue: unknown) => {
    if (!currentValue || typeof currentValue !== 'object' || Array.isArray(currentValue)) {
      return currentValue
    }

    return Object.fromEntries(
      Object.entries(currentValue as Record<string, unknown>).sort(([left], [right]) =>
        left < right ? -1 : left > right ? 1 : 0,
      ),
    )
  })

  if (serialized === undefined) {
    throw new TypeError('Value must be JSON serializable.')
  }

  return serialized
}

export const sha256 = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex')

export const hashStableJSON = (value: unknown): string => sha256(stableStringify(value))

const findExisting = async (
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

const resolveExisting = <TResult>(
  existing: AgentOperation,
  requestHash: string,
): { result: TResult } => {
  if (existing.requestHash !== requestHash) {
    throw new APIError('This idempotency key was already used for different input.', 409)
  }

  if (existing.status !== 'succeeded') {
    throw new APIError(`This idempotent operation is ${existing.status}.`, 409)
  }

  return { result: existing.result as TResult }
}

const collectPrivateStrings = (
  value: unknown,
  key = '',
  values = new Set<string>(),
): Set<string> => {
  if (typeof value === 'string' && (sensitiveKey.test(key) || verboseKey.test(key))) {
    if (value) values.add(value)
    return values
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectPrivateStrings(item, key, values))
  } else if (value && typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) =>
      collectPrivateStrings(childValue, childKey, values),
    )
  }
  return values
}

const auditError = (error: unknown, args: unknown): string => {
  if (!(error instanceof Error)) return 'Non-Error mutation failure'

  let message = `${error.name}: ${error.message}`
  const privateValues = [...collectPrivateStrings(args)].sort(
    (left, right) => right.length - left.length,
  )
  privateValues.forEach((value) => {
    message = message.replaceAll(value, redacted)
  })
  message = message
    .replace(/\bBearer\s+\S+/gi, `Bearer ${redacted}`)
    .replace(
      /(api.?key|authorization|cookie|password|secret|token)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      `$1$2${redacted}`,
    )

  return message.replace(/\s+/g, ' ').slice(0, 500)
}

/**
 * Runs one MCP mutation behind a database-backed idempotency and audit record.
 * Audit collection access is intentionally bypassed; the caller's content writes must not be.
 */
export const runIdempotentMutation = async <TArgs, TResult>({
  args,
  idempotencyKey,
  locale,
  req,
  run,
  targetCollection,
  tool,
}: RunIdempotentMutationOptions<TArgs, TResult>): Promise<TResult> => {
  const actorID = req.user?.id
  if (actorID === undefined || actorID === null) {
    throw new APIError('Authentication is required.', 401)
  }

  const normalizedKey = idempotencyKey.trim()
  const normalizedTool = tool.trim()
  if (!normalizedKey || normalizedKey.length > 128) {
    throw new APIError('Idempotency key must be between 1 and 128 characters.', 400)
  }
  if (!normalizedTool) throw new APIError('Tool name is required.', 400)

  const payload = req.payload as unknown as AuditPayload
  const operationKey = hashStableJSON({
    actorID: String(actorID),
    key: normalizedKey,
    tool: normalizedTool,
  })
  // Hash the complete input. The digest is non-reversible and must distinguish
  // changed body copy or credentials under a reused idempotency key.
  const requestHash = hashStableJSON(args)
  const transaction = await beginAgentMutationTransaction(req, actorID)
  const operationData = {
    actor: actorID,
    idempotencyKey: normalizedKey,
    locale,
    operationKey,
    requestHash,
    status: 'running',
    targetCollection,
    tool: normalizedTool,
  }
  let operation: AgentOperation | undefined
  try {
    const existing = await findExisting(payload, req, operationKey)
    if (existing) {
      const result = resolveExisting<TResult>(existing, requestHash).result
      await commitAgentMutationTransaction(req, transaction)
      return result
    }

    const cutoff = new Date(Date.now() - 60_000).toISOString()
    const { totalDocs } = await payload.count({
      collection: auditCollection,
      overrideAccess: true,
      req,
      where: {
        actor: { equals: actorID },
        createdAt: { greater_than: cutoff },
      },
    })
    if (totalDocs >= writesPerMinute) {
      throw new APIError('Agent mutation rate limit exceeded. Try again shortly.', 429)
    }

    operation = await payload.create({
      collection: auditCollection,
      data: operationData,
      depth: 0,
      overrideAccess: true,
      req,
    })

    const outcome = await run()
    await payload.update({
      collection: auditCollection,
      data: {
        result: outcome.result,
        status: 'succeeded',
        targetIDs: outcome.targetIDs,
      },
      depth: 0,
      id: operation.id,
      overrideAccess: true,
      req,
    })
    await commitAgentMutationTransaction(req, transaction)
    return outcome.result
  } catch (error) {
    await rollbackAgentMutationTransaction(req, transaction)

    try {
      if (transaction.active && operation) {
        await payload.create({
          collection: auditCollection,
          data: { ...operationData, error: auditError(error, args), status: 'failed' },
          depth: 0,
          overrideAccess: true,
          req,
        })
      } else if (operation) {
        await payload.update({
          collection: auditCollection,
          data: { error: auditError(error, args), status: 'failed' },
          depth: 0,
          id: operation.id,
          overrideAccess: true,
          req,
        })
      }
    } catch {
      // Preserve the mutation error even if the best-effort audit write also fails.
    }
    throw error
  }
}
