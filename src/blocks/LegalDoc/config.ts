import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const bodyEditor = lexicalEditor({
  // UploadFeature lets editors insert inline images (media) via the `/` menu or
  // toolbar. Without it the body editor only offers Paragraph — which is why the
  // original page's in-body images had to be added through the JSON/API import.
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    UploadFeature(),
  ],
})

// Fields for a single Section Content item — its kind is chosen via the
// "Type" dropdown (Clause = numbered 1.1; Card = bordered box + optional table).
const sectionContentFields = [
  {
    name: 'type',
    label: 'Type',
    type: 'select' as const,
    defaultValue: 'clause',
    options: [
      { label: 'Clause (numbered 1.1)', value: 'clause' },
      { label: 'Card (bordered, no number)', value: 'card' },
      { label: 'Form / Annex box', value: 'form' },
      { label: 'Key/Value card (Data / Purpose …)', value: 'keyvalue' },
      { label: 'Definition list (Term + description)', value: 'definitions' },
    ],
    admin: { description: 'Choose how this item is displayed.' },
  },
  {
    name: 'title',
    label: 'Title',
    type: 'text' as const,
    localized: true,
    admin: {
      description: 'Card / Key-Value card heading, or the form box title.',
      condition: (_: any, s: any) =>
        s?.type === 'card' || s?.type === 'form' || s?.type === 'keyvalue',
    },
  },
  {
    name: 'body',
    label: 'Body',
    type: 'richText' as const,
    localized: true,
    editor: bodyEditor,
    admin: {
      // Body is for Clause / Card / Form only — Key/Value and Definition list
      // use the Rows below instead.
      condition: (_: any, s: any) => s?.type !== 'keyvalue' && s?.type !== 'definitions',
    },
  },
  {
    type: 'collapsible' as const,
    label: 'Table (optional)',
    admin: {
      initCollapsed: true,
      description: 'Card only. Leave empty for no table. Supports 2 or 3 columns.',
      condition: (_: any, s: any) => s?.type === 'card',
    },
    fields: [
      { name: 'tableCaption', label: 'Table Caption', type: 'text' as const, localized: true },
      {
        name: 'columns',
        labels: { singular: 'Column', plural: 'Columns' },
        type: 'array' as const,
        admin: {
          description:
            'Add as many columns as you need. Order = left → right. First column aligns left, last right, the rest centered.',
        },
        fields: [
          { name: 'heading', label: 'Column Heading', type: 'text' as const, localized: true },
        ],
      },
      {
        name: 'rows',
        labels: { singular: 'Row', plural: 'Rows' },
        type: 'array' as const,
        fields: [
          {
            name: 'cells',
            labels: { singular: 'Cell', plural: 'Cells' },
            type: 'array' as const,
            admin: { description: 'One cell per column, in the same order as the columns above.' },
            fields: [{ name: 'value', label: 'Value', type: 'text' as const, localized: true }],
          },
        ],
      },
    ],
  },
  {
    name: 'footnote',
    label: 'Footnote',
    type: 'textarea' as const,
    localized: true,
    admin: {
      description: 'Small note below the table (card) or below the form box.',
      condition: (_: any, s: any) => s?.type === 'card' || s?.type === 'form',
    },
  },
  {
    name: 'pairRows',
    label: 'Rows',
    labels: { singular: 'Row', plural: 'Rows' },
    type: 'array' as const,
    admin: {
      description:
        'For "Key/Value card" and "Definition list". Left = label/term, Right = value/description (rich text).',
      condition: (_: any, s: any) => s?.type === 'keyvalue' || s?.type === 'definitions',
    },
    fields: [
      { name: 'left', label: 'Label / Term', type: 'text' as const, localized: true, required: true },
      {
        name: 'right',
        label: 'Value / Description',
        type: 'richText' as const,
        localized: true,
        editor: bodyEditor,
      },
    ],
  },
]

export const LegalDocBlock: Block = {
  slug: 'legalDoc',
  interfaceName: 'LegalDocBlock',
  labels: { singular: 'Legal / Policy Page', plural: 'Legal / Policy Pages' },
  fields: [
    // ── Hero ────────────────────────────────────────────────────
    { name: 'title', label: 'Title', type: 'text', localized: true, required: true },
    { name: 'subheading', label: 'Subheading', type: 'textarea', localized: true },
    // ── "At a glance" summary ───────────────────────────────────
    {
      name: 'showSummary',
      label: 'Show "At a glance" summary',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'summaryHeading',
      label: 'Summary Heading',
      type: 'text',
      localized: true,
      admin: { condition: (_, s) => s?.showSummary },
    },
    {
      name: 'summaryNote',
      label: 'Summary Note',
      type: 'text',
      localized: true,
      admin: { condition: (_, s) => s?.showSummary },
    },
    {
      name: 'summaryItems',
      label: 'Summary Bullets',
      labels: { singular: 'Bullet', plural: 'Bullets' },
      type: 'array',
      admin: {
        description: 'One bullet per row. Each bullet is rich text (bold, links, etc.).',
        condition: (_, s) => s?.showSummary,
        initCollapsed: false,
      },
      fields: [
        {
          name: 'text',
          label: 'Bullet',
          type: 'richText',
          localized: true,
          editor: bodyEditor,
        },
      ],
    },
    // ── Numbered sections ───────────────────────────────────────
    {
      name: 'sections',
      labels: { singular: 'Section', plural: 'Sections' },
      type: 'array',
      admin: {
        description:
          'Section numbers (1, 2 …) and the sticky table of contents are generated automatically. Inside each section add content blocks: a "Clause" is auto-numbered 1.1, 1.2 …; a "Card" is a bordered box with no number (and can hold a table). '
          + 'Any text or rich-text field in this block supports amount tokens, resolved to the visitor’s selected currency: “{{fee:kit}}” = the one-off kit fee (fixed per currency, see src/lib/plans/fees.ts) and “{{price:core:4}}” = a live plan rate. Arithmetic works too, e.g. “{{fee:kit*2}}”. Never type a literal amount like “€49” — it would stay in euros for a visitor paying in GBP/CHF/AED.',
        initCollapsed: true,
      },
      fields: [
        { name: 'title', label: 'Section Title', type: 'text', localized: true, required: true },
        {
          name: 'tocLabel',
          label: 'Table-of-Contents Label',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Optional short label shown in the "On this page" list on the left. Leave empty to use the Section Title.',
          },
        },
        {
          name: 'numberLabel',
          label: 'Number Label Override',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Leave empty for automatic numbering (1, 2 …). Set a custom badge like "6 — Annex" for an annex: it won\'t be auto-numbered, is hidden from the table of contents, and its clauses show "—" instead of a number.',
          },
        },
        {
          name: 'content',
          label: 'Section Content',
          labels: { singular: 'Item', plural: 'Items' },
          type: 'array',
          admin: {
            initCollapsed: true,
            description:
              'Each item has a "Type" dropdown: Clause (auto-numbered 1.1) or Card (bordered box, optional table).',
          },
          fields: sectionContentFields,
        },
      ],
    },
    // ── Closing contact callout (dark box) ──────────────────────
    {
      type: 'collapsible',
      label: 'Closing Callout (dark box)',
      admin: {
        initCollapsed: true,
        description:
          'Optional dark box at the end (e.g. "Questions about cookies?"). Leave the heading empty to hide it.',
      },
      fields: [
        { name: 'calloutHeading', label: 'Heading', type: 'text', localized: true },
        { name: 'calloutBody', label: 'Body', type: 'textarea', localized: true },
        {
          name: 'calloutRows',
          label: 'Detail Rows',
          labels: { singular: 'Row', plural: 'Rows' },
          type: 'array',
          admin: { description: 'Label / value pairs (e.g. Controller, Address, Email).' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', label: 'Label', type: 'text', localized: true, required: true },
                { name: 'value', label: 'Value', type: 'text', localized: true, required: true },
              ],
            },
            {
              name: 'href',
              label: 'Link URL (optional)',
              type: 'text',
              admin: {
                description: 'If set, the value becomes a link. e.g. mailto:support@nb1.com',
              },
            },
          ],
        },
      ],
    },
  ],
}
