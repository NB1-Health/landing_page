import type { CollectionConfig } from 'payload'

import { adminFieldOnly, adminOnly, adminOrSelf, cmsRoles, hasCMSRole } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req }) => hasCMSRole(req.user),
    create: adminOnly,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
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
      defaultValue: 'editor',
      saveToJWT: true,
      options: cmsRoles.map((role) => ({
        label: role[0].toUpperCase() + role.slice(1),
        value: role,
      })),
      access: {
        create: adminFieldOnly,
        update: adminFieldOnly,
      },
    },
  ],
  timestamps: true,
}
