/**
 * Colour tokens available in the redesign's rich-text editors.
 *
 * A SEPARATE file from `brandColors.ts` on purpose. That one holds the live
 * site's four colours and is wired into `headingLexical.ts`, which every
 * existing block's editor uses — adding to it would change the toolbar on
 * content nobody is redesigning. The redesign gets its own palette and its own
 * editor factory, and the two never interfere.
 *
 * Values are COPIED from the mockup's own `:root` block (see rd-tokens.css), not
 * sampled by eye. They are literal hex rather than `var(--nb1-…)` because
 * Lexical stores the resolved css on the text node and the admin panel does not
 * load the front-end stylesheet — a `var()` here renders as no colour at all in
 * the editor, which is where an author needs to see it.
 *
 * These exist so multi-colour copy is expressed as a NAMED TOKEN on the text
 * node. The alternative the pipeline exists to prevent is an author being told
 * to "make it bold so it comes out lime on the page".
 */
export const redesignColors = {
  'rd-dark-brown': { css: { color: '#514745' }, label: 'Dark brown' },
  'rd-cool-grey': { css: { color: '#F0F5FF' }, label: 'Cool grey' },
  'rd-warm-grey': { css: { color: '#AFACAC' }, label: 'Warm grey' },
  'rd-blue-grey': { css: { color: '#B3E7F3' }, label: 'Blue grey' },
  'rd-blue': { css: { color: '#5FEAFF' }, label: 'Aqua' },
  'rd-lime': { css: { color: '#D9FF65' }, label: 'Lime' },
  'rd-soft-pink': { css: { color: '#FF9CE0' }, label: 'Soft pink' },
  'rd-orange': { css: { color: '#FF8B3E' }, label: 'Orange' },
  'rd-black': { css: { color: '#000000' }, label: 'Black' },
} as const
