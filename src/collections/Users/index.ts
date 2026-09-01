import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrEditor, adminOrSelf, isAdmin, userRoles } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOrEditor,
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    hidden: ({ user }) => !isAdmin(user),
    useAsTitle: 'name',
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: userRoles.map((role) => ({
        label: role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Agent editor',
        value: role,
      })),
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => isAdmin(user),
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
