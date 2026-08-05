import type { Access, FieldAccess } from 'payload'

export const cmsRoles = ['editor', 'publisher', 'admin'] as const
export type CMSRole = (typeof cmsRoles)[number]

export function getUserRole(user: unknown): CMSRole | null {
  if (!user || typeof user !== 'object') return null

  const role = (user as { role?: unknown }).role
  if (role == null) return 'editor'
  return cmsRoles.includes(role as CMSRole) ? (role as CMSRole) : null
}

export const hasCMSRole = (user: unknown): boolean => getUserRole(user) !== null
export const isAdminUser = (user: unknown): boolean => getUserRole(user) === 'admin'

export const editorOrAbove: Access = ({ req }) => hasCMSRole(req.user)
export const adminOnly: Access = ({ req }) => isAdminUser(req.user)
export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user)

export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (!hasCMSRole(req.user) || req.user?.id == null) return false

  return {
    id: {
      equals: req.user.id,
    },
  }
}
