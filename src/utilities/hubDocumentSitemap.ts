import type { Payload } from 'payload'

import type { AppLocale } from '@/i18n/config'
import { lexiconCategoryPath } from '@/utilities/lexiconPaths'

/**
 * Sitemap rows for a collection that lives under a hub.
 *
 * `pillars-sitemap.xml` was written out by hand; this is what it should have been
 * before the second and third collection arrived. Three copies of the same
 * hub-slug join, each with its own chance of getting the `noindex` filter or the
 * missing-slug guard subtly wrong, is exactly the drift `hubDocumentQueries`
 * exists to prevent on the read side.
 *
 * Two rules that are easy to get wrong and are therefore centralised here:
 *
 * - A document is listed only where BOTH its own slug and its hub's slug exist in
 *   this locale. Missing either means the URL does not exist, and a sitemap that
 *   lists URLs which 404 is worse than one that lists fewer.
 * - `noindex` is filtered in JavaScript, never in the `where`. In Postgres
 *   `noindex != true` evaluates to NULL for a row where the column is NULL, which
 *   is not TRUE — so the predicate would silently drop every document whose
 *   checkbox was never touched. On a pipeline-filled collection that is most of
 *   them, and the failure looks like a sitemap that is simply short.
 */

export type SitemapEntry = { loc: string; lastmod: string }

type HubDocumentCollection = 'pillars' | 'scientific-articles' | 'lexicon-terms'

export async function hubDocumentSitemapEntries({
  payload,
  collection,
  locale,
  siteURL,
}: {
  payload: Payload
  collection: HubDocumentCollection
  locale: AppLocale
  /** Already trimmed of any trailing slash. */
  siteURL: string
}): Promise<SitemapEntry[]> {
  const dateFallback = new Date().toISOString()

  // The hub slugs are read once and reused across every row rather than joined
  // per document. Three hubs against up to 854 terms — the difference between
  // one lookup and 2,400 is the whole cost of the route.
  const [hubResults, documentResults] = await Promise.all([
    payload.find({
      collection: 'hubs',
      depth: 0,
      limit: 0,
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    }),
    payload.find({
      // Narrowed to one literal: `find` is typed per collection and a union of
      // slugs gives it a union of `select` shapes it will not accept. Every field
      // read below is guarded.
      collection: collection as 'pillars',
      depth: 0,
      draft: false,
      limit: 0,
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, hub: true, noindex: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
  ])

  const hubSlugById = new Map<string, string>()
  for (const hub of hubResults.docs) {
    if (typeof hub.slug === 'string' && hub.slug.trim()) {
      hubSlugById.set(String(hub.id), hub.slug.trim())
    }
  }

  return documentResults.docs
    .map((doc): SitemapEntry | null => {
      const record = doc as unknown as Record<string, unknown>

      // Telling a crawler to fetch a page and then telling it not to index the
      // page it fetched is a contradiction, and it spends crawl budget to deliver
      // it. At 854 terms that budget is the constraint.
      if (record.noindex === true) return null

      const slug = typeof record.slug === 'string' ? record.slug.trim() : ''

      const hub = record.hub
      const hubId =
        hub && typeof hub === 'object' && 'id' in hub
          ? String((hub as { id: unknown }).id)
          : hub != null
            ? String(hub)
            : ''
      const hubSlug = hubSlugById.get(hubId)

      if (!slug || !hubSlug) return null

      return {
        loc: `${siteURL}/${locale}/${hubSlug}/${slug}`,
        lastmod: (record.updatedAt as string) || dateFallback,
      }
    })
    .filter((entry): entry is SitemapEntry => entry !== null)
}

/**
 * Sitemap rows for the lexicon category browse pages.
 *
 * Separate because a category carries no `hub` relationship — it belongs to the
 * Lexicon implicitly, so the hub is looked up by `key` rather than joined. And the
 * path carries the extra browse segment, which is translated — `lexiconCategoryPath`
 * owns that so the sitemap cannot advertise `/de/glossar/topics/...`.
 *
 * The localized slug is the address, matching what the route now resolves. `key`
 * is identity only — it used to be accepted as a URL too, which meant every
 * category page had a second address returning 200.
 */
export async function lexiconCategorySitemapEntries({
  payload,
  locale,
  siteURL,
}: {
  payload: Payload
  locale: AppLocale
  siteURL: string
}): Promise<SitemapEntry[]> {
  const dateFallback = new Date().toISOString()

  const hubResults = await payload.find({
    collection: 'hubs',
    depth: 0,
    limit: 1,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    where: { key: { equals: 'lexicon' } },
  })

  const hubSlug =
    typeof hubResults.docs[0]?.slug === 'string' ? hubResults.docs[0].slug.trim() : ''

  // No Lexicon slug in this locale means no category URLs in this locale. An
  // empty sitemap is the honest answer.
  if (!hubSlug) return []

  const categoryResults = await payload.find({
    collection: 'lexicon-categories',
    depth: 0,
    draft: false,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: { slug: true, noindex: true, updatedAt: true },
    where: { _status: { equals: 'published' } },
  })

  return categoryResults.docs
    .map((doc): SitemapEntry | null => {
      const record = doc as unknown as Record<string, unknown>
      if (record.noindex === true) return null

      // Slug only. `key` is identity, not an address — listing the key URL as
      // well would advertise two URLs for one page, and one of them is not the
      // canonical.
      const segment = typeof record.slug === 'string' ? record.slug.trim() : ''
      if (!segment) return null

      return {
        loc: `${siteURL}${lexiconCategoryPath({ locale, hubSlug, categorySegment: segment })}`,
        lastmod: (record.updatedAt as string) || dateFallback,
      }
    })
    .filter((entry): entry is SitemapEntry => entry !== null)
}
