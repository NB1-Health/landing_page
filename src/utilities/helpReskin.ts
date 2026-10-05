/**
 * The kit-instructions reskin switch.
 *
 * ONE LINE decides whether the two help-article pages — "How to use your stool
 * testing kit" and "How to use your blood testing kit" — wear the new nb1
 * visual system or the one they shipped with. Nothing else knows about it.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  TO PUT THE OLD DESIGN BACK: change `true` to `false` below, and deploy. │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Off means the <link> is never rendered, the six help blocks are untouched,
 * and there is nothing left behind — no half-applied theme, no overrides to
 * hunt down. Deliberately the same shape as `journalReskin.ts`, including the
 * `: boolean` annotation, which is load-bearing: without it TypeScript narrows
 * to the literal `true` and every `if (!helpReskinEnabled())` is provably dead
 * code, which some lint configurations strip and others flag.
 *
 * WHY A STYLESHEET RATHER THAN EDITING THE BLOCKS. Andra's call. The six
 * components carry 86 literal colours and 19 font stacks inside styled-jsx and
 * no custom properties at all, so unlike the journal there are no token values
 * to redefine — the choice was between retokenising the components in place and
 * overriding them from outside. Outside keeps the revert to one line.
 *
 * WHAT IT COVERS. Only the two pages that use the `help*` blocks. Measured, not
 * assumed: of 58 pages, exactly 165 and 167 carry any of the six block types,
 * and neither carries anything else. The stylesheet is nonetheless scoped by
 * `body:has([data-help-article])` so that a third help page added later picks
 * it up and no other page can, whatever the route decides to load.
 */
export const HELP_RESKIN: boolean = true

export function helpReskinEnabled(): boolean {
  return HELP_RESKIN
}

/** The stylesheet, served from /public. Named here so the path has one home. */
export const HELP_RESKIN_HREF = '/help-reskin.css'
