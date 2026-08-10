import type { Block } from 'payload'
import { makeHeadingEditor, inlineRichTextEditor } from '@/fields/headingLexical'

export const ReferInfoBlock: Block = {
  slug: 'referInfo',
  interfaceName: 'ReferInfoBlock',
  dbName: 'rfi',
  labels: { singular: 'Refer — Info', plural: 'Refer — Info' },
  fields: [
    {
      name: 'heading',
      type: 'richText',
      localized: true,
      editor: makeHeadingEditor(['h2']),
      admin: { description: 'Use italic for the teal-accented words (e.g. "about a minute.").' },
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Image shown beside the steps (e.g. kit being handed over).' },
    },
    {
      name: 'steps',
      type: 'array',
      admin: { description: 'Numbered steps (auto-numbered in order).' },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        {
          name: 'body',
          type: 'richText',
          localized: true,
          editor: inlineRichTextEditor,
          admin: { description: 'Use bold for emphasised phrases.' },
        },
      ],
    },
    {
      name: 'eligibilityHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Which plans the programme applies to',
    },
    {
      name: 'eligibility',
      type: 'array',
      admin: { description: 'Eligibility bullet list with tick / cross markers.' },
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'include',
          options: [
            { label: 'Included (✓)', value: 'include' },
            { label: 'Excluded (✕)', value: 'exclude' },
          ],
        },
        {
          name: 'text',
          type: 'richText',
          localized: true,
          editor: inlineRichTextEditor,
          admin: { description: 'Use bold for the emphasised lead phrase.' },
        },
      ],
    },
  ],
}
