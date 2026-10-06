import React from 'react'

import { getCachedRdFooter, getCachedRdFooterByName } from '@/utilities/getRdChrome'
import { getCachedHubLinks } from '@/utilities/hubQueries'
import { isJournalLocale } from '@/utilities/journalEnabled'
import { isAppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import RdFooter from './Footer'

/** See HeaderServer for why this wrapper exists and why it is display:contents. */
const SCOPE: React.CSSProperties = { display: 'contents' }

/**
 * The shape RdFooter's column arrays actually want.
 *
 * BOTH FIELDS ARE REQUIRED, and that is not a guess — `label` and `url` are
 * `required: true` on the RdFooters column arrays, so payload-types generates
 * them as plain `string`. The first version of this file typed them
 * `string | null | undefined`, mirroring how Payload types an OPTIONAL array
 * field, and `next build` rejected the spread:
 *
 *   Type 'string | null | undefined' is not assignable to type 'string'.
 *
 * Wrong in the direction that matters: a looser type here would have had to be
 * narrowed at the call site, and there is no call site — the array goes
 * straight into the component. The two sources both give plain strings
 * (`dict.footer.journal`, and `HubLink` is `{ title: string; path: string }`),
 * so the honest type is the strict one.
 *
 * `id` is optional on the generated type and simply absent here; a column built
 * at render has no row id, and the component does not read one.
 */
type Link = { label: string; url: string }

/**
 * The content tree, as footer links: a Journal link, then every hub that has a
 * slug in THIS locale.
 *
 * Lifted from the site footer (`Footer/Component.tsx:49-67`) rather than
 * reinvented, because the two have to agree: a hub that appears in one footer
 * and not the other is worse than a hub in neither.
 *
 * `dict.footer.journal` is the SAME key the site footer reads, so the two say
 * the same word in all nine locales rather than drifting apart.
 *
 * `getCachedHubLinks` already drops a hub with no slug in this locale, so a
 * partial translation shortens the column rather than adding a 404 to it. The
 * `isJournalLocale` gate is the same one the site footer uses — in a locale
 * with no Journal there is no content tree to point at, and the column is
 * empty rather than a lone dead link.
 */
async function hubColumn(locale: string): Promise<Link[]> {
  const appLocale = isAppLocale(locale) ? locale : 'en'
  if (!isJournalLocale(appLocale)) return []

  const dict = getDictionary(appLocale)
  const hubs = await getCachedHubLinks(appLocale)()

  return [
    { label: dict.footer.journal, url: `/${appLocale}/journal` },
    ...hubs.map((hub) => ({ label: hub.title, url: hub.path })),
  ]
}

/**
 * Server wrapper for the redesign footer — see HeaderServer for the split.
 *
 * WHAT CHANGED HERE, AND WHY. The footer's three columns are authored arrays.
 * The site footer's first column is not — it is built from the hubs, so that
 * creating a hub with a slug makes it appear everywhere and removing the slug
 * makes it vanish, with nobody retyping `/de/mikrobiom`.
 *
 * Pointing the Journal at this footer without that would have been a visual win
 * and a navigation loss: the journal pages would lose the Journal / Microbiome
 * / Research / Lexicon links, on the pages where those links matter most.
 *
 * So the document names ONE of its three columns as the generated one
 * (`contentColumn`), and this substitutes that column's links at render. The
 * column's title is still authored — only the links are derived. A footer with
 * `contentColumn: 'none'`, which is the default and what every existing
 * document reads, is untouched by any of this.
 *
 * The authored links are REPLACED, not merged: a column is one thing or the
 * other, and merging would produce a list half of which an editor can reorder
 * and half of which they cannot. They are not deleted either — the field still
 * holds them, so setting this back to None brings them straight back.
 */
export async function RdFooterServer({
  locale,
  id,
  name,
}: {
  locale: string
  id?: string | number | null
  /** Find the footer by its admin NAME instead of its id. Preferred where
   *  the same document has different ids per environment. */
  name?: string | null
}) {
  const data = name ? await getCachedRdFooterByName(name, locale)() : await getCachedRdFooter(id, locale)()
  if (!data) return null

  const pick = (data as { contentColumn?: string | null }).contentColumn
  let generated: Partial<Record<'columnOneLinks' | 'columnTwoLinks' | 'columnThreeLinks', Link[]>> = {}

  // Three branches rather than a computed key. `{ [field]: links }` with a
  // union-typed key widens to `{ [x: string]: Link[] }`, which does not satisfy
  // the Partial<Record<…>> above — the same class of error as the one that
  // broke the build on `Link` itself. Spelled out, each assignment is checked.
  //
  // Anything unrecognised falls through and the authored column renders.
  // `contentColumn` is a select so that is unreachable from the admin, but a
  // seed or a script writes the raw string, and a typo there should cost a
  // generated column rather than the whole column.
  if (pick && pick !== 'none') {
    const links = await hubColumn(locale)
    if (pick === 'one') generated = { columnOneLinks: links }
    else if (pick === 'two') generated = { columnTwoLinks: links }
    else if (pick === 'three') generated = { columnThreeLinks: links }
  }

  return (
    <div className="rd-block" style={SCOPE}>
      <RdFooter {...data} {...generated} />
    </div>
  )
}

export default RdFooterServer
