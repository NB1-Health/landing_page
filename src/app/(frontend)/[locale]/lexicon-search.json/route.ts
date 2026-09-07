import { unstable_cache } from 'next/cache'

import { getCachedHubByKey } from '@/utilities/hubQueries'
import { getCachedSearchIndex } from '@/utilities/lexiconQueries'
import { isAppLocale } from '@/i18n/config'

/**
 * The lexicon's search index, as JSON: `/en/lexicon-search.json`.
 *
 * The `.json` in the segment name is load-bearing, not decoration. `middleware.ts`
 * bypasses any path containing a dot — everything else, this endpoint included,
 * gets a `normalizePathname` pass and a live `fetch` to `/cms/api/redirects` with
 * a 1.5-second timeout before the route is even reached. Putting a redirect
 * lookup in front of the request that is supposed to make the search field feel
 * instant defeats the point of fetching the index up front. Naming the segment
 * `sitemap.xml`-style takes the documented bypass instead of adding a new one.
 *
 * Fetched lazily by the index page's search field, on first interaction rather
 * than at page load. That is the whole reason this endpoint exists instead of the
 * data being embedded in the page.
 *
 * The arithmetic: 2,400 terms, each a title, an href and a definition sentence,
 * is roughly half a megabyte of JSON — call it 110KB over the wire. As page
 * weight on an index whose actual content is ten category cards, that is
 * indefensible. As a one-off fetch paid only by a reader who clicks into the
 * search field, it is fine, and it buys instant local filtering with no
 * round-trip per keystroke and no `unaccent` extension in Postgres. The accent
 * folding stays in JavaScript, where `foldForSearch` already does it and is
 * already tested.
 *
 * A STATIC segment beside the dynamic `[slug]` at this depth, which is the same
 * arrangement `sitemap.xml` already uses one level up. Deliberately NOT named
 * after the hub slug: that slug is a localized field (`lexicon` in English,
 * `glossar` in German), and an endpoint that moved with it would need the client
 * to know the slug before it could ask for anything.
 */
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  // The hub supplies the URL segment every href in the index is built from. In a
  // locale where the Lexicon has no slug there are no term URLs at all, so an
  // empty index is the honest answer rather than a 500.
  const hub = await getCachedHubByKey(locale, 'lexicon')()
  if (!hub) {
    return Response.json([], {
      headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' },
    })
  }

  // Cached twice over on purpose: `getCachedSearchIndex` memoises the database
  // read, and this wrapper memoises the serialised body, so a warm request does
  // not re-stringify 2,400 objects. Both hang off the same tag, so publishing a
  // term clears them together.
  const body = await unstable_cache(
    async () => JSON.stringify(await getCachedSearchIndex({ locale, hubSlug: hub.slug })()),
    ['lexicon-search-body', locale, hub.slug],
    { tags: ['lexicon-terms', `lexicon-search-index_${locale}`] },
  )()

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Not a page. It should never be indexed and never appear in a sitemap —
      // a JSON body ranking for a term name would outrank the term's own page.
      'X-Robots-Tag': 'noindex',
      // Revalidation is tag-driven, so a long browser cache is safe and is what
      // makes the second visit free. `stale-while-revalidate` keeps a reader who
      // returns mid-publish from waiting on a refetch.
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
}
