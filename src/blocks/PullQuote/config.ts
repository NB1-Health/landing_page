import type { Block } from 'payload'

/**
 * The pull quote — designer brief §5's typographic emphasis device.
 *
 * Not `ExpertQuote`, which is a person saying something: it carries a relationship
 * to an Author, an avatar and credentials, and its point is attribution. A pull
 * quote is a line lifted out of the article's own prose and set large. Same shape
 * on screen, opposite meaning, and merging them would force every pull quote to
 * either invent an author or render an empty byline.
 *
 * `duplicatesBody` is the field that matters. A pull quote usually repeats a
 * sentence that already appears a paragraph above — which is fine visually and
 * wrong for a screen reader, which reads it twice with no indication that it is
 * the same sentence. Flagged, the renderer marks it `aria-hidden`, so the
 * sighted reader gets the emphasis and the listening reader does not get the
 * stutter. Default true, because repeating body text is the normal case.
 */
export const PullQuote: Block = {
  slug: 'pullQuote',
  interfaceName: 'PullQuoteBlock',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      localized: true,
      admin: { description: 'One or two sentences. Longer than that stops reading as a pull quote.' },
    },
    {
      name: 'attribution',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional. Leave empty when lifting the article own words — use Expert Quote when a named person is speaking.',
      },
    },
    {
      name: 'duplicatesBody',
      type: 'checkbox',
      defaultValue: true,
      label: 'This text also appears in the body',
      admin: {
        description:
          'Keep checked when the quote repeats a sentence from the article. It stays visible, but is skipped by screen readers so it is not read twice.',
      },
    },
  ],
}
