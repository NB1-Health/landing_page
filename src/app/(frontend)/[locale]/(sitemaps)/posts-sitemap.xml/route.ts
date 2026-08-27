import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { readHreflangOverrides } from '@/utilities/hreflang'
import { SITEMAP_CACHE_HEADERS } from '@/utilities/sitemapCache'

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
            const overrides = readHreflangOverrides(post.meta?.seoOverrides)
            return !(overrides?.enabled && overrides.excludedLocales?.includes(locale))
          })
          .map((post) => ({
            loc: withLocale(SITE_URL, locale, `/posts/${post.slug}`),
            lastmod: post.updatedAt || dateFallback,
          })) || []

      return sitemap
    },
    ['posts-sitemap', locale],
    { revalidate: 600, tags: ['posts-sitemap', `posts-sitemap-${locale}`] },
  )

  const sitemap = await getPostsSitemap()
  return getServerSideSitemap(sitemap, SITEMAP_CACHE_HEADERS)
}
