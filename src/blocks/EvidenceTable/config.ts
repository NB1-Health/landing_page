import type { Block } from 'payload'

/**
 * The evidence table — designer brief §5's comparison table with the 5-dot
 * strength rating.
 *
 * Its own block rather than a variant of `DataTable`. `DataTable` is a generic
 * grid of localized cells: an editor decides what each column means. Here the
 * columns ARE the meaning — a claim, how well supported it is, and the caveat —
 * and the rating is a value on a fixed scale that the renderer draws rather than
 * a string someone types. Folding this into `DataTable` would mean an editor
 * typing "●●●○○" into a cell, which cannot be styled, cannot be read aloud, and
 * cannot be validated.
 *
 * `strength` is a select, not a number. "3" tells an editor nothing; "Mixed"
 * tells them what they are asserting, and the label is what a screen reader
 * announces.
 *
 * A lexical block, so it serializes into the field's JSON — no migration.
 */
export const EvidenceTable: Block = {
  slug: 'evidenceTable',
  interfaceName: 'EvidenceTableBlock',
  labels: { singular: 'Evidence table', plural: 'Evidence tables' },
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional heading above the table. Not an H2 — it does not belong in the contents list.',
      },
    },
    {
      name: 'rows',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      labels: { singular: 'Claim', plural: 'Claims' },
      fields: [
        {
          name: 'claim',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'The claim being rated, e.g. "Fibre increases microbial diversity".' },
        },
        {
          name: 'strength',
          type: 'select',
          required: true,
          defaultValue: '3',
          options: [
            { label: '1 — Very limited', value: '1' },
            { label: '2 — Limited', value: '2' },
            { label: '3 — Mixed', value: '3' },
            { label: '4 — Good', value: '4' },
            { label: '5 — Strong', value: '5' },
          ],
          admin: {
            description:
              'Drawn as filled dots out of five. The wording is translated at render time, so pick the level, not a phrase.',
          },
        },
        {
          name: 'note',
          type: 'textarea',
          localized: true,
          admin: { description: 'Optional caveat. One short sentence — this is a table cell.' },
        },
      ],
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      admin: { description: 'Optional. Where the ratings come from, if that needs saying.' },
    },
  ],
}
