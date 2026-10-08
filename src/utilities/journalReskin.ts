/**
 * The Journal reskin switch.
 *
 * ONE LINE decides whether the journal pages wear the new nb1 visual system or
 * the one they shipped with. Nothing else in the codebase knows about it.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  CURRENTLY ON. To put the old design back: change `true` to `false`.    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * That is the whole procedure. Off means the <link> is never rendered, the
 * journal's own stylesheets are untouched, and there is nothing left behind to
 * clean up — no half-applied theme, no overrides to hunt down.
 *
 * WHAT THIS SWITCH COVERS, and what it deliberately does not:
 *
 *   it covers      the journal CONTENT — tokens, hero, cards, chips, the
 *                  article body — on all ten journal page types, plus the site
 *                  nav above them.
 *   it does NOT    the footer. Which footer the journal wears is a CHOICE, in
 *                  `Site Settings → Journal index page → Redesign footer`, and
 *                  a styling switch has no business changing the site's
 *                  navigation. See src/components/JournalFooter.
 *
 * WHY A CONSTANT RATHER THAN AN ENVIRONMENT VARIABLE. An env var would let the
 * design differ between environments without anything in the repository saying
 * so — staging and production disagreeing, and the code unable to tell you
 * which is which. A constant is in the diff, in the review, and in the history:
 * whoever flips it leaves a commit that says when and why. For a one-way change
 * ahead of a launch that is the property worth having, and it costs a deploy,
 * which this change needs anyway.
 *
 * The type annotation is not noise. Without `: boolean` TypeScript narrows this
 * to the literal `true`, and every `if (!journalReskinEnabled())` becomes
 * provably dead code — which some lint configurations remove and others flag.
 * Annotated, the branch stays real and flipping the value just works.
 */
export const JOURNAL_RESKIN: boolean = true

export function journalReskinEnabled(): boolean {
  return JOURNAL_RESKIN
}

/* The stylesheet is no longer fetched by URL, so there is no path constant
 * here any more: it is imported by [locale]/layout.tsx and served from
 * /_next/. This switch now decides whether the marker attribute is in the
 * DOM, which is what every rule in that stylesheet is behind. */
