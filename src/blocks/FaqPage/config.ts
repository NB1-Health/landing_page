import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const inlineEditor = lexicalEditor({
  features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()],
})

export const FaqPageBlock: Block = {
  slug: 'faqPage',
  interfaceName: 'FaqPageBlock',
  labels: { singular: 'FAQ Page', plural: 'FAQ Pages' },
  fields: [
    // ── Hero ────────────────────────────────────────────────────
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'subheading',
      label: 'Subheading',
      type: 'textarea',
      localized: true,
    },
    // ── Groups ──────────────────────────────────────────────────
    {
      name: 'groups',
      labels: { singular: 'Group', plural: 'Groups' },
      type: 'array',
      admin: {
        description:
          'Each group becomes a numbered section (01, 02 …, added automatically) and a category chip that jumps to it. '
          + 'Any text or rich-text field in this block supports amount tokens, resolved to the visitor’s selected currency: “{{fee:kit}}” = the one-off kit fee (fixed per currency, see src/lib/plans/fees.ts) and “{{price:core:4}}” = a live plan rate. Arithmetic works too, e.g. “{{fee:kit*2}}”.',
        initCollapsed: true,
      },
      fields: [
        { name: 'label', label: 'Group Label', type: 'text', localized: true, required: true },
        {
          name: 'items',
          labels: { singular: 'Question', plural: 'Questions' },
          type: 'array',
          fields: [
            { name: 'question', label: 'Question', type: 'text', localized: true, required: true },
            {
              name: 'answer',
              label: 'Answer',
              type: 'richText',
              localized: true,
              editor: inlineEditor,
            },
          ],
        },
      ],
    },
    // ── Closing callout ─────────────────────────────────────────
    {
      name: 'calloutHeading',
      label: 'Callout Heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'calloutBody',
      label: 'Callout Body',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'calloutCtaLabel',
      label: 'Callout Button Label',
      type: 'text',
      localized: true,
    },
    {
      name: 'calloutCtaHref',
      label: 'Callout Button URL',
      type: 'text',
    },
  ],
}
