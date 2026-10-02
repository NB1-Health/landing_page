import React from 'react'

import { JOURNAL_RESKIN_HREF, journalReskinEnabled } from '@/utilities/journalReskin'

/**
 * Loads the Journal reskin, or renders nothing.
 *
 * One line per journal route, and the route needs to know nothing else — not
 * the stylesheet's path, not the environment variable, not the default.
 *
 * WHY A <link> AND NOT AN import. A CSS `import` in Next is static — it is
 * resolved at build time and there is no way to not-have-it — so a conditional
 * import is not a thing that can be written. The stylesheet lives in /public
 * and is linked when the switch is on. React 19 hoists a
 * <link rel="stylesheet"> to <head> wherever it is rendered, so this can sit
 * inline in the route's JSX and still land in the right place.
 *
 * `precedence` is what makes React manage it rather than leave it where it
 * falls — React groups stylesheets by precedence and orders the groups, which
 * is as close to "loaded last" as this gets. It is not relied on: the token
 * block in the stylesheet uses `:root:root`, so it wins on specificity whatever
 * the order turns out to be. Two independent reasons for the same outcome,
 * because ordering between a Next CSS import and a React-managed link is not
 * something this code controls.
 *
 * The switch itself is a constant in src/utilities/journalReskin.ts — one line
 * to flip, and it shows up in the diff and the history rather than in an
 * environment nobody can see from the code.
 */
export function JournalReskin() {
  if (!journalReskinEnabled()) return null

  return <link rel="stylesheet" href={JOURNAL_RESKIN_HREF} precedence="high" />
}

export default JournalReskin
