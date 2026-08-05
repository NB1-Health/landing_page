import { APIError, type CollectionBeforeOperationHook } from 'payload'

import { getUserRole, type CMSRole } from './roles'

type PageWriteOperation = 'create' | 'delete' | 'restoreVersion' | 'update'

type PageWrite = {
  draft?: boolean
  operation: PageWriteOperation
  overrideAccess?: boolean
  status?: unknown
}

export function canWritePage(role: CMSRole | null, write: PageWrite): boolean {
  if (write.overrideAccess === true || role === 'admin') return true
  if (role === null || write.operation === 'delete') return false
  if (role === 'publisher') return true
  if (!['create', 'update'].includes(write.operation)) return false

  return write.draft === true && write.status !== 'published'
}

export const enforcePageWriteRole: CollectionBeforeOperationHook<'pages'> = async ({
  args,
  operation,
  req,
}) => {
  if (!['create', 'delete', 'restoreVersion', 'update'].includes(operation)) return

  const writeArgs = args as {
    data?: { _status?: unknown }
    draft?: boolean
    overrideAccess?: boolean
  }
  const allowed = canWritePage(getUserRole(req.user), {
    draft: writeArgs.draft,
    operation: operation as PageWriteOperation,
    overrideAccess: writeArgs.overrideAccess,
    status: writeArgs.data?._status,
  })

  if (!allowed) {
    throw new APIError(
      operation === 'delete'
        ? 'Only administrators can delete pages.'
        : 'Editors can save drafts. Publishing and restoring versions require a publisher or administrator.',
      403,
      null,
      true,
    )
  }
}
