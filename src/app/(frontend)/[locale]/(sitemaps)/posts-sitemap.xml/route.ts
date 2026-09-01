import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { readHreflangOverrides } from '@/utilities/hreflang'

function withLocale(siteURL: string, locale: AppLocale, path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${siteURL}/${locale}${clean}`
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params

  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const getPostsSitemap = unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const SITE_URL = getServerSideURL().replace(/\/$/, '')

      const results = await payload.find({
        collection: 'posts',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 0,
        pagination: false,

        locale,
        fallbackLocale: false,

        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          title: true,
          updatedAt: true,
          noindex: true,
          primaryCategory: true,
          meta: {
            seoOverrides: true,
          },
        },
      })

      const dateFallback = new Date().toISOString()

      const sitemap =
        results.docs
          ?.filter((post) => {
            if (!post?.slug || typeof post.title !== 'string' || !post.title.trim()) return false
            // Blanket exclusion set on the post. Per-locale exclusion is
            // handled by the hreflang overrides check below.
            if (post.noindex) return false
            const overrides = readHreflangOverrides(post.meta?.seoOverrides)
            return !(overrides?.enabled && overrides.excludedLocales?.includes(locale))
          })
          .map((post) => ({
            loc: withLocale(SITE_URL, locale, `/journal/${post.slug}`),
            lastmod: post.updatedAt || dateFallback,
          })) || []

      // No category archives here. Brief 1 §4 asked for a crawlable URL per
      // category and we shipped it; TICKET-SEO-007 §10 reversed that, because
      // `/journal/category/gut-health` competes with `/en/microbiome/gut-health`
      // — a pillar page built specifically to rank for that term. The chips are
      // client-side filters again, so there is no category URL to list.
      return sitemap
    },
    ['posts-sitemap', locale],
    { tags: ['posts-sitemap', `posts-sitemap-${locale}`] },
  )

  const sitemap = await getPostsSitemap()
  return getServerSideSitemap(sitemap)
}
