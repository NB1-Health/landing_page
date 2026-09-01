import type { CollectionConfig } from 'payload'
import { adminOnly } from '../../access/roles'

export const Authors: CollectionConfig<'authors'> = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    admin: adminOnly,
    read: () => true, // public (for frontend)
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: false,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'Used for /authors/[slug]',
      },
    },

    // E-E-A-T
    {
      name: 'credentials',
      type: 'text',
      admin: { description: 'Example: MD, PhD, Registered Dietitian' },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },

    // Optional: link out
    {
      name: 'website',
      type: 'text',
      admin: { description: 'Public profile URL (optional)' },
    },

    // Optional: organization/role
    {
      name: 'roleTitle',
      type: 'text',
      localized: true,
      admin: { description: 'Example: Scientific Writer / Medical Reviewer' },
    },
    {
      name: 'affiliation',
      type: 'text',
      localized: true,
      admin: { description: 'Example: NB1 Health GmbH' },
    },
  ],
}
