import { APIError, type Access, type AccessArgs, type PayloadRequest } from 'payload'

export const userRoles = ['admin', 'agent-editor'] as const

export type UserRole = (typeof userRoles)[number]

type UserWithRole = {
  role?: unknown
}

export const isAdmin = (user: unknown): boolean => {
  return (user as UserWithRole | null | undefined)?.role === 'admin'
}

export const isAgentEditor = (user: unknown): boolean => {
  return (user as UserWithRole | null | undefined)?.role === 'agent-editor'
}

type BooleanAccess = (args: AccessArgs) => boolean

export const adminOnly: BooleanAccess = ({ req: { user } }) => isAdmin(user)

export const contentEditor: BooleanAccess = ({ req }) =>
  isAdmin(req.user) || (req.payloadAPI === 'MCP' && isAgentEditor(req.user))

/**
 * Payload checks delete access when an update sets `deletedAt`. Permit only the
 * constrained MCP trash update; permanent delete operations have no matching data.
 */
export const adminOrAgentTrash: BooleanAccess = ({ data, req }) => {
  if (isAdmin(req.user)) return true
  if (
    !isAgentEditor(req.user) ||
    req.payloadAPI !== 'MCP' ||
    req.context.agentTrashAction !== 'trash' ||
    !data ||
    typeof data !== 'object'
  ) {
    return false
  }

  const trashData = data as Record<string, unknown>
  return (
    Object.keys(trashData).length === 1 &&
    typeof trashData.deletedAt === 'string' &&
    trashData.deletedAt.length > 0
  )
}

export const adminOrSelf: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true
  if (!user || user.collection !== 'users') return false

  return { id: { equals: user.id } }
}

export const adminOrPublished: Access = ({ req: { user } }) => {
  if (isAdmin(user)) return true

  return { _status: { equals: 'published' } }
}

export const contentEditorOrPublished: Access = ({ req }) => {
  if (isAdmin(req.user) || (req.payloadAPI === 'MCP' && isAgentEditor(req.user))) return true

  return { _status: { equals: 'published' } }
}

function includesPublishedStatus(value: unknown): boolean {
  if (value === 'published') return true
  if (!value || typeof value !== 'object') return false

  return Object.values(value).some(includesPublishedStatus)
}

type AgentOperationArgs = {
  data?: {
    _status?: unknown
    deletedAt?: unknown
  }
  draft?: boolean
}

function hasDeletedAt(data: AgentOperationArgs['data']): boolean {
  return Boolean(data && Object.prototype.hasOwnProperty.call(data, 'deletedAt'))
}

function isAuthorizedAgentTrashUpdate(
  args: AgentOperationArgs,
  operation: string,
  req: PayloadRequest,
): boolean {
  if (operation !== 'update' || (req as { payloadAPI?: string }).payloadAPI !== 'MCP') {
    return false
  }

  const action = req.context.agentTrashAction
  const data = args.data
  if (!data || Object.keys(data).some((key) => key !== 'deletedAt')) return false

  if (action === 'trash') return typeof data.deletedAt === 'string' && data.deletedAt.length > 0
  if (action === 'restore') return data.deletedAt === null

  return false
}

/** Agent editors may create and update draft versions, never the live document. */
export const enforceAgentDraftOperation = ({
  args,
  operation,
  req,
}: {
  args: unknown
  operation: string
  req: PayloadRequest
}): void => {
  if (!isAgentEditor(req.user)) return

  const operationArgs = args as AgentOperationArgs

  if (isAuthorizedAgentTrashUpdate(operationArgs, operation, req)) return

  if (hasDeletedAt(operationArgs.data)) {
    throw new APIError('Agent editors can only trash or restore content through MCP tools.', 403)
  }

  if (operation === 'delete' || operation === 'deleteByID') {
    throw new APIError('Agent editors cannot permanently delete content.', 403)
  }

  if (operation === 'restoreVersion') {
    throw new APIError('Agent editors cannot restore content versions.', 403)
  }

  if (operation !== 'create' && operation !== 'update') return

  if (operationArgs.draft !== true || includesPublishedStatus(operationArgs.data?._status)) {
    throw new APIError('Agent editors can only save draft content.', 403)
  }
}

/** Media has no drafts, but its trash state still belongs to the constrained MCP tools. */
export const enforceAgentMediaOperation = ({
  args,
  operation,
  req,
}: {
  args: unknown
  operation: string
  req: PayloadRequest
}): void => {
  if (!isAgentEditor(req.user)) return

  const operationArgs = args as AgentOperationArgs
  if (isAuthorizedAgentTrashUpdate(operationArgs, operation, req)) return

  if (hasDeletedAt(operationArgs.data)) {
    throw new APIError('Agent editors can only trash or restore media through MCP tools.', 403)
  }

  if (operation === 'delete' || operation === 'deleteByID') {
    throw new APIError('Agent editors cannot permanently delete media.', 403)
  }
}
