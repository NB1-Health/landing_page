import type { Field } from 'payload'

/**
 * The science board's fields, shared by the two blocks that render it.
 *
 * The homepage's rdLab and Our Plans' rdPgBoard show the SAME nine fields per
 * person and the same two labels; what differs between the pages is the markup,
 * not the data. Declaring the list twice would be one list in two places, free
 * to drift — a renamed subfield or a reworded description on one page and not
 * the other, with nothing to catch it.
 *
 * What is NOT shared is `defaultValue`: that is each page's own content, and
 * each block passes its own.
 *
 * The markup is deliberately not shared. The two sections differ in their
 * section background, their wrapper nesting, their heading sizes, a
 * flex-scrolling rail against a three-column grid, an assurance strip only the
 * homepage has, and where the panel overlay sits in the DOM. One component
 * behind nine conditionals would be harder to read than two.
 */
export const scientistSubFields: Field[] = [
      { name: 'photo', type: 'upload', relationTo: 'media', label: 'Portrait' },
      { name: 'name', type: 'text', localized: true, required: true },
      {
        name: 'role',
        type: 'text',
        localized: true,
        admin: { description: 'The line under the name ON THE CARD.' },
      },
      {
        name: 'credentials',
        type: 'text',
        localized: true,
        admin: { description: 'The small print on the card.' },
      },
      {
        name: 'panelEyebrow',
        type: 'text',
        localized: true,
        label: 'Panel pill',
        admin: { description: 'The outlined pill at the top of the panel.' },
      },
      {
        name: 'panelCredentials',
        type: 'text',
        localized: true,
        label: 'Panel credentials',
        admin: { description: 'The uppercase line under the name IN THE PANEL.' },
      },
      { name: 'bio', type: 'textarea', localized: true, label: 'Biography' },
      {
        name: 'bioExtra',
        type: 'textarea',
        localized: true,
        label: 'Biography, second paragraph',
        admin: { description: 'Optional. The paragraph is not rendered at all when empty.' },
      },
      {
        name: 'quote',
        type: 'textarea',
        localized: true,
        admin: { description: 'Rendered with the blue rule down its left edge.' },
      },
]

/**
 * THREE ROWS, FIXED. The cards repeat cleanly, but the panels do not: one has
 * two biography paragraphs and the others have one, and the quote is always the
 * LAST paragraph, so its position differs between panels. Bound positionally,
 * a panel's quote lands in its second biography slot. Both components therefore
 * bind the panels per index, and the array is pinned at three.
 */
export const scientistsField = (defaultValue: unknown[]): Field => ({
  name: 'scientists',
  type: 'array',
  label: 'Science board',
  minRows: 3,
  maxRows: 3,
  admin: {
    description:
      'Each row is one card in the rail AND the panel it opens. Exactly three: '
      + 'the panels are laid out individually because they do not all have the '
      + 'same number of paragraphs.',
  },
  defaultValue,
  fields: scientistSubFields,
})

export const readBioLabelField = (defaultValue: string): Field => ({
  name: 'readBioLabel',
  type: 'text',
  localized: true,
  defaultValue,
})

export const closeLabelField = (defaultValue: string): Field => ({
  name: 'closeLabel',
  type: 'text',
  localized: true,
  label: 'Close button label',
  admin: { description: 'Read by screen readers; the button itself shows ✕.' },
  defaultValue,
})
