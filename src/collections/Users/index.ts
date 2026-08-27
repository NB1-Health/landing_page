import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrSelf, isAdmin, userRoles } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['name', 'email'],
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
        label: role === 'admin' ? 'Admin' : 'Agent editor',
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
