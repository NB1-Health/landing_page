import React from 'react'

import { helpReskinEnabled } from '@/utilities/helpReskin'

/**
 * Turns the kit-instructions reskin on, or renders nothing.
 *
 * A MARKER, NOT A <link> — same reason as JournalReskin, and the same fault:
 * `/help-reskin.css` lives outside the paths nginx proxies on staging, so the
 * <link> fetched the login SPA's index.html with a 200 and applied nothing.
 * The stylesheet is now imported by `[locale]/layout.tsx` and served from
 * `/_next/static/css/…`.
 *
 * Because an import loads everywhere, the sheet's selectors now require TWO
 * things: `[data-help-reskin]` — this marker, which is the switch — and
 * `[data-help-article]`, which only the help blocks emit. So this can be
 * rendered on the whole `[locale]/[slug]` route, as it always was, and still
 * apply to nothing but the two kit-instruction pages.
 *
 * The switch is one line in src/utilities/helpReskin.ts.
 */
export function HelpReskin() {
  if (!helpReskinEnabled()) return null

  return <div data-help-reskin="" hidden aria-hidden="true" />
}

export default HelpReskin
