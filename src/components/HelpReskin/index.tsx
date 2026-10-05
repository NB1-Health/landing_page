import React from 'react'

import { HELP_RESKIN_HREF, helpReskinEnabled } from '@/utilities/helpReskin'

/**
 * Loads the kit-instructions reskin, or renders nothing.
 *
 * WHY A <link> AND NOT AN import. A CSS `import` in Next is static — resolved
 * at build time, with no way to not-have-it — so a conditional import cannot be
 * written. The stylesheet lives in /public and is linked when the switch is on.
 * React 19 hoists a <link rel="stylesheet"> to <head> wherever it is rendered,
 * so this can sit inline in the route's JSX and still land in the right place.
 *
 * `precedence` asks React to order it late. It is NOT relied on. Every rule in
 * the sheet is scoped `body:has([data-help-article]) …`, which is specificity
 * 0-2-1 against the 0-2-0 that styled-jsx compiles its own `.hh-h1` to — so the
 * reskin wins on specificity whatever the source order turns out to be. That
 * matters here: ordering between a Next CSS import and a React-managed link is
 * not something this code controls, and the journal reskin had to reach for
 * `!important` on its nav for exactly this reason. Here the scope selector does
 * the job, so `!important` appears only where an inline style has to be beaten.
 *
 * Rendered unconditionally on the route, like <JournalReskin />: the sheet
 * applies to nothing unless a help block is on the page.
 */
export function HelpReskin() {
  if (!helpReskinEnabled()) return null

  return <link rel="stylesheet" href={HELP_RESKIN_HREF} precedence="high" />
}

export default HelpReskin
