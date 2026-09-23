export const brandColors = {
  'text-white': { css: { color: '#ffffff' }, label: 'White' },
  'text-black': { css: { color: '#000000' }, label: 'Black' },
  'text-brand': { css: { color: '#0A8FB0' }, label: 'Brand' },
  'text-amber': { css: { color: '#E8B53A' }, label: 'Amber' },
  // ─── Redesign tokens ───────────────────────────────────────────────────
  //
  // tools/defaults.py records a coloured run in the mockups as `$: { color:
  // 'rd-<token>' }` on the text node, and textConverter looks that value up in
  // THIS map to get its css. None of them were registered, so every lookup
  // returned undefined and the run rendered in the inherited colour: the ✕ on
  // the "left out" note came out white instead of orange, and "96+ ingredients"
  // lost its blue-grey.
  //
  // Declared as the CSS variables rather than hex so they follow the palette in
  // rd-tokens.css, which is the one place those values are defined.
  'rd-dark-brown': { css: { color: 'var(--nb1-dark-brown)' }, label: 'Dark brown' },
  'rd-cool-grey': { css: { color: 'var(--nb1-cool-grey)' }, label: 'Cool grey' },
  'rd-warm-grey': { css: { color: 'var(--nb1-warm-grey)' }, label: 'Warm grey' },
  'rd-blue-grey': { css: { color: 'var(--nb1-blue-grey)' }, label: 'Blue grey' },
  'rd-blue': { css: { color: 'var(--nb1-blue)' }, label: 'Blue' },
  'rd-lime': { css: { color: 'var(--nb1-lime)' }, label: 'Lime' },
  'rd-soft-pink': { css: { color: 'var(--nb1-soft-pink)' }, label: 'Soft pink' },
  'rd-orange': { css: { color: 'var(--nb1-orange)' }, label: 'Orange' },
  'rd-black': { css: { color: 'var(--nb1-black)' }, label: 'Black' },
} as const

export const brandColorSwatches = [
  { type: 'button' as const, label: 'White', color: '#ffffff' },
  { type: 'button' as const, label: 'Black', color: '#000000' },
  { type: 'button' as const, label: 'Brand Teal', color: '#0A8FB0' },
  { type: 'button' as const, label: 'Amber', color: '#E8B53A' },
]
