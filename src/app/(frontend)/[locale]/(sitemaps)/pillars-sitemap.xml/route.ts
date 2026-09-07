import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The Microbiome pillars.
 *
 * A pillar's URL is composed from two localized slugs — `locale + hub.slug +
 * pillar.slug` — so this cannot be built from the pillar alone. The hub slugs
 * are read once per request and reused across every row, rather than joined per
 * document: three hubs, and at 2,400 lexicon terms later the difference between
 * one lookup and 2,400 is the whole cost of the route.
 *
 * A pillar is listed only where BOTH slugs exist in this locale. If the hub has
 * no slug here the URL does not exist at all, and a sitemap that lists URLs
 * which 404 is worse than one that lists fewer.
 *
 * `noindex` pillars are excluded — telling a crawler to fetch a page and then
 * telling it not to index the page it fetched is a contradiction, and it spends
 * crawl budget to deliver it.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const getPillarsSitemap = unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const SITE_URL = getServerSideURL().replace(/\/$/, '')
      const dateFallback = new Date().toISOString()

      const [hubResults, pillarResults] = await Promise.all([
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
          collection: 'pillars',
          depth: 0,
          draft: false,
          limit: 0,
          locale,
          fallbackLocale: false,
          overrideAccess: false,
          pagination: false,
          where: { _status: { equals: 'published' } },
          select: { slug: true, hub: true, noindex: true, updatedAt: true },
        }),
      ])

      const hubSlugById = new Map<string, string>()
      for (const hub of hubResults.docs) {
        if (typeof hub.slug === 'string' && hub.slug.trim()) {
          hubSlugById.set(String(hub.id), hub.slug.trim())
        }
      }

      return pillarResults.docs
        .filter((pillar) => !pillar.noindex)
        .map((pillar) => {
          const record = pillar as unknown as Record<string, unknown>
          const slug = typeof record.slug === 'string' ? record.slug.trim() : ''

          const hub = record.hub
          const hubId =
            hub && typeof hub === 'object' && 'id' in hub
              ? String((hub as { id: unknown }).id)
              : String(hub)
          const hubSlug = hubSlugById.get(hubId)

          if (!slug || !hubSlug) return null

          return {
            loc: `${SITE_URL}/${locale}/${hubSlug}/${slug}`,
            lastmod: (record.updatedAt as string) || dateFallback,
          }
        })
        .filter((entry): entry is { loc: string; lastmod: string } => entry !== null)
    },
    ['pillars-sitemap', locale],
    { tags: ['pillars-sitemap', `pillars-sitemap-${locale}`, 'hubs'] },
  )

  return getServerSideSitemap(await getPillarsSitemap())
}
