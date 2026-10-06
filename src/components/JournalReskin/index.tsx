import React from 'react'

import { journalReskinEnabled } from '@/utilities/journalReskin'

/**
 * Turns the Journal reskin on for this route, or renders nothing.
 *
 * WHY THIS IS A MARKER AND NO LONGER A <link>.
 *
 * It used to render `<link rel="stylesheet" href="/journal-reskin.css">`,
 * because a CSS `import` in Next is static and a conditional import cannot be
 * written. That worked locally and was INVISIBLE ON STAGING: nginx there
 * proxies an allowlist (`/en/`, the other locales, `/cms/`, `/_next/`) and
 * serves the login SPA's index.html with a 200 for everything else, so the
 * browser received 3,634 bytes of HTML where it asked for CSS, built an empty
 * stylesheet, and the reskin did nothing at all. The same fault took the
 * webfonts out in October — see claude/stg-public-dir-not-proxied.md.
 *
 * The stylesheet is now imported by `[locale]/layout.tsx`, so it is emitted
 * under `/_next/static/css/…`, which IS proxied. An import loads on every page
 * though, so the switch had to move into the CSS: every rule is behind
 * `[data-jr-reskin]`, and this component is what puts that attribute in the
 * DOM — on exactly the five journal routes it used to render the <link> on.
 *
 * `hidden` keeps it out of layout and out of the accessibility tree. `:has()`
 * still matches a hidden element, which is the whole point.
 *
 * The switch itself is still one line in src/utilities/journalReskin.ts.
 */
export function JournalReskin() {
  if (!journalReskinEnabled()) return null

  return <div data-jr-reskin="" hidden aria-hidden="true" />
}

export default JournalReskin
