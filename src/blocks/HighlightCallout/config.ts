import type { Block } from 'payload'

/**
 * The highlight callout — designer brief §5's in-body emphasis panel.
 *
 * Distinct from `KeyTakeaways` (a summary of the whole article, at most one per
 * page, always a list) and from `ComplianceNote` (fixed legal framing, wording
 * supplied by the dictionary). This is a single point an editor wants to lift out
 * of the flow, anywhere in the body, as many times as the article needs.
 *
 * Two tones, not an open colour choice. Rule 2 of the designer brief keeps teal
 * for signal and reserves lime for conversion; letting an editor pick a colour
 * per callout is how a page ends up with four accent colours and no hierarchy.
 *
 * Body is plain text, not rich text. A callout containing its own headings,
 * lists and nested blocks stops being a callout, and a nested lexical field
 * inside a lexical block is a rendering problem nobody needs.
 */
export const HighlightCallout: Block = {
  slug: 'highlightCallout',
  interfaceName: 'HighlightCalloutBlock',
  labels: { singular: 'Highlight callout', plural: 'Highlight callouts' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: { description: 'Optional short heading, a few words.' },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Note (teal)', value: 'info' },
        { label: 'Caution (amber)', value: 'caution' },
      ],
      admin: {
        description:
          'Caution is for genuine "be careful" content — interactions, dosage, when to see a doctor. Not for emphasis.',
      },
    },
  ],
}
