import { isAppLocale } from '@/i18n/config'
import { getSitemapCacheHeaders } from '@/utilities/cloudflareCache'
import { getServerSideURL } from '@/utilities/getURL'

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  if (!locale || !isAppLocale(locale)) {
    return new Response('Not found', { status: 404 })
  }

  const site = getServerSideURL().replace(/\/$/, '')
  const lastmod = new Date().toISOString()

  const entries = [
    `<sitemap>
       <loc>${site}/${locale}/pages-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    `<sitemap>
       <loc>${site}/${locale}/posts-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
  ].join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      ...getSitemapCacheHeaders(),
    },
  })
}
