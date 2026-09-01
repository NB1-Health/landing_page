import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Authors: CollectionConfig<'authors'> = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true, // public (for frontend)
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
      admin: {
        description:
          'Legacy single profile URL. Prefer Profile links below; this is still read as a fallback.',
      },
    },
    {
      /**
       * Three profile links, per the designer brief §4: the author box is
       * designed once for *an* author with "name, role, credential, affiliation,
       * photo, three profile links".
       *
       * An array rather than three named fields, because the brief does not say
       * WHICH three — in practice ORCID, Google Scholar, LinkedIn or an
       * institutional page, and which three differ per author. Named fields would
       * force every author into the same set and leave two empty on most records.
       *
       * `label` is not localized: "ORCID" and "LinkedIn" are proper nouns.
       */
      name: 'profileLinks',
      type: 'array',
      maxRows: 3,
      labels: { singular: 'Profile link', plural: 'Profile links' },
      admin: {
        description:
          'Up to three. e.g. ORCID, Google Scholar, an institutional page. The author box renders whichever exist.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'e.g. ORCID, Google Scholar, LinkedIn' },
        },
        { name: 'url', type: 'text', required: true },
      ],
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
