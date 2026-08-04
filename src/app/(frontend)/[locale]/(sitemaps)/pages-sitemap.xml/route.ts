import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { isAppLocale, type AppLocale } from '@/i18n/config'

// Payload types in your project also accept "all"
type PayloadLocale = AppLocale | 'all'

function getSiteURL() {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    'https://example.com'

  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `https://${raw}`
}

function withLocale(siteURL: string, locale: AppLocale, path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${siteURL}/${locale}${clean}`
}

export async function GET(
  _req: Request,
  // ✅ In your Next version, route handler params are a Promise
  { params }: { params: Promise<{ locale: string }> },
) {
  const resolved = await params

  // ✅ Narrow to allowed locale union
  const locale: AppLocale = isAppLocale(resolved?.locale) ? resolved.locale : 'en'

  const getPagesSitemap = unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const SITE_URL = getSiteURL()
      const dateFallback = new Date().toISOString()

      const [homeRefs, results] = await Promise.all([
        payload.find({
          collection: 'pages',
          overrideAccess: false,
          draft: false,
          depth: 0,
          limit: 2,
          pagination: false,
          locale: 'en',
          fallbackLocale: false,
          where: { slug: { in: ['home', 'home-page'] } },
          select: { slug: true },
        }),
        payload.find({
          collection: 'pages',
          overrideAccess: false,
          draft: false,
          depth: 0,
          limit: 1000,
          pagination: false,

          // ✅ Correctly typed for Payload localization
          locale: locale as PayloadLocale,
          fallbackLocale: false,

          where: {
            _status: {
              equals: 'published',
            },
          },
          select: {
            slug: true,
            updatedAt: true,
          },
        }),
      ])
      const homeIDs = new Set(homeRefs.docs.map((page) => String(page.id)))

      const defaultSitemap = [
        { loc: withLocale(SITE_URL, locale, '/search'), lastmod: dateFallback },
        { loc: withLocale(SITE_URL, locale, '/posts'), lastmod: dateFallback },
      ]

      const sitemap =
        results.docs
          ?.filter((page) => Boolean(page?.slug))
          .map((page) => {
            const isHome = homeIDs.has(String(page.id))

            return {
              loc: isHome ? `${SITE_URL}/${locale}` : withLocale(SITE_URL, locale, `/${page.slug}`),
              lastmod: page.updatedAt || dateFallback,
            }
          }) || []

      return [...defaultSitemap, ...sitemap]
    },
    // ✅ cache per locale
    ['pages-sitemap', locale],
    { tags: ['pages-sitemap', `pages-sitemap-${locale}`] },
  )

  const sitemap = await getPagesSitemap()
  return getServerSideSitemap(sitemap)
}
