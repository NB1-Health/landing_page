import type { Block } from 'payload'
import { inlineRichTextEditor } from '@/fields/headingLexical'

export const ReferFaqBlock: Block = {
  slug: 'referFaq',
  interfaceName: 'ReferFaqBlock',
  dbName: 'rff',
  labels: { singular: 'Refer — FAQ', plural: 'Refer — FAQ' },
  fields: [
    { name: 'title', type: 'text', localized: true, defaultValue: 'FAQs' },
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        { name: 'question', type: 'text', localized: true, required: true },
        {
          name: 'answer',
          type: 'richText',
          localized: true,
          required: true,
          editor: inlineRichTextEditor,
          admin: { description: 'Answer text. Links are supported (e.g. "get in touch").' },
        },
      ],
    },
  ],
}
