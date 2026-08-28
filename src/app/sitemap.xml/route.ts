import { appLocales } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { SITEMAP_CACHE_HEADERS } from '@/utilities/sitemapCache'
const LOCALES = appLocales

export async function GET(_req: Request) {
  const site = getServerSideURL().replace(/\/$/, '')
  const lastmod = new Date().toISOString()

  const entries = LOCALES.map(
    (locale) => `<sitemap>
  <loc>${site}/${locale}/sitemap.xml</loc>
  <lastmod>${lastmod}</lastmod>
</sitemap>`,
  ).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...SITEMAP_CACHE_HEADERS,
    },
  })
}
