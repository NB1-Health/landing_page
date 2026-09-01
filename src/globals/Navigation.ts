import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/roles'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Global Navigation',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Anchor Text',
        },
        {
          name: 'link',
          type: 'relationship',
          relationTo: ['pages'],
          required: true,
        },
      ],
    },
  ],
}
