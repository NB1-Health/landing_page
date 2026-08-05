import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/roles'

export const FAQ: GlobalConfig = {
  slug: 'faq',
  label: 'FAQ',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'sections',
      label: 'FAQ Sections',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'items',
          label: 'Questions',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'question',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'answer',
              type: 'textarea',
              required: true,
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'structuredData',
      label: 'Structured Data Override (JSON-LD)',
      type: 'json',
      admin: {
        description: 'Optional. If empty, FAQPage JSON-LD will be auto-generated.',
      },
    },
  ],
}
