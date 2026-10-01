import React from 'react'

import { getCachedRdFooter } from '@/utilities/getRdChrome'
import { getCachedHubLinks } from '@/utilities/hubQueries'
import { isJournalLocale } from '@/utilities/journalEnabled'
import { isAppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import RdFooter from './Footer'

/** See HeaderServer for why this wrapper exists and why it is display:contents. */
const SCOPE: React.CSSProperties = { display: 'contents' }

type Link = { label?: string | null; url?: string | null }

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

  const [dict, hubs] = await Promise.all([
    Promise.resolve(getDictionary(appLocale)),
    getCachedHubLinks(appLocale)(),
  ])

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
}: {
  locale: string
  id?: string | number | null
}) {
  const data = await getCachedRdFooter(id, locale)()
  if (!data) return null

  const pick = (data as { contentColumn?: string | null }).contentColumn
  let generated: Partial<Record<'columnOneLinks' | 'columnTwoLinks' | 'columnThreeLinks', Link[]>> = {}

  if (pick && pick !== 'none') {
    const links = await hubColumn(locale)
    const field = (
      { one: 'columnOneLinks', two: 'columnTwoLinks', three: 'columnThreeLinks' } as const
    )[pick as 'one' | 'two' | 'three']
    // An unrecognised value renders the authored column rather than an empty
    // one. `contentColumn` is a select, so this is unreachable through the
    // admin — but a seed or a script writes the raw string, and a typo there
    // should cost a generated column, not the whole column.
    if (field) generated = { [field]: links }
  }

  return (
    <div className="rd-block" style={SCOPE}>
      <RdFooter {...data} {...generated} />
    </div>
  )
}

export default RdFooterServer
