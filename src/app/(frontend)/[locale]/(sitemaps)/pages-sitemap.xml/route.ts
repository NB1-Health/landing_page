import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { isAppLocale, type AppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { readHreflangOverrides } from '@/utilities/hreflang'
import { parseRobotsDirectives } from '@/utilities/robotsDirectives'

function withLocale(siteURL: string, locale: AppLocale, path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${siteURL}/${locale}${clean}`
}

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params

  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const getPagesSitemap = unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const SITE_URL = getServerSideURL().replace(/\/$/, '')
      const dateFallback = new Date().toISOString()

      const [results, englishHome] = await Promise.all([
        payload.find({
          collection: 'pages',
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
              robots: true,
              seoOverrides: true,
            },
          },
        }),
        payload.find({
          collection: 'pages',
          // Identify the shared home document even if English is currently a
          // draft; each locale's public query above still enforces publication.
          overrideAccess: true,
          draft: false,
          depth: 0,
          limit: 1,
          pagination: false,
          locale: 'en',
          fallbackLocale: false,
          where: {
            or: [{ slug: { equals: 'home' } }, { slug: { equals: 'home-page' } }],
          },
          select: { slug: true },
        }),
      ])
      const homePageID = englishHome.docs[0]?.id

      const defaultSitemap = [
        { loc: withLocale(SITE_URL, locale, '/posts'), lastmod: dateFallback },
      ]

      const sitemap =
        results.docs
          ?.filter((page) => {
            if (!page?.slug || typeof page.title !== 'string' || !page.title.trim()) return false
            if (parseRobotsDirectives(page.meta?.robots)?.index === false) return false
            const overrides = readHreflangOverrides(page.meta?.seoOverrides)
            return !(overrides?.enabled && overrides.excludedLocales?.includes(locale))
          })
          .map((page) => {
            const isHome = page.id === homePageID

            return {
              loc: isHome ? `${SITE_URL}/${locale}` : withLocale(SITE_URL, locale, `/${page.slug}`),
              lastmod: page.updatedAt || dateFallback,
            }
          }) || []

      return [...defaultSitemap, ...sitemap]
    },
    ['pages-sitemap', locale],
    { tags: ['pages-sitemap', `pages-sitemap-${locale}`] },
  )

  const sitemap = await getPagesSitemap()
  return getServerSideSitemap(sitemap)
}
