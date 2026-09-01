import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The content hubs — Microbiome, Research, Lexicon.
 *
 * Their own sitemap rather than an entry in the pages one, because they are not
 * Page documents: they render through the Pages ROUTE but live in the `hubs`
 * collection, so `pages-sitemap.xml` cannot see them. Without this they are
 * discoverable only by crawling a link to them, which for §4's top-level hubs is
 * the wrong place to rely on luck.
 *
 * A hub with no slug in this locale is skipped: it has no URL here at all, by
 * the same rule that makes `/fr/microbiome` a 404.
 *
 * The Journal is not listed here — it is served by its own route and belongs in
 * whatever sitemap covers that.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const getHubsSitemap = unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const SITE_URL = getServerSideURL().replace(/\/$/, '')
      const dateFallback = new Date().toISOString()

      const results = await payload.find({
        collection: 'hubs',
        depth: 0,
        limit: 0,
        locale,
        fallbackLocale: false,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
      })

      return results.docs
        .filter((hub) => typeof hub.slug === 'string' && hub.slug.trim())
        .map((hub) => ({
          loc: `${SITE_URL}/${locale}/${hub.slug}`,
          lastmod: hub.updatedAt || dateFallback,
        }))
    },
    ['hubs-sitemap', locale],
    { tags: ['hubs-sitemap', `hubs-sitemap-${locale}`, 'hubs'] },
  )

  return getServerSideSitemap(await getHubsSitemap())
}
