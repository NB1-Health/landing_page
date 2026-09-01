import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { SITEMAP_CACHE_HEADERS } from '@/utilities/sitemapCache'

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
    // The hubs are not Page documents — they render through the Pages route but
    // live in their own collection, so `pages-sitemap` cannot see them.
    `<sitemap>
       <loc>${site}/${locale}/hubs-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    // One child per content type, not one big file. At 408 scientific articles
    // and 854 lexicon terms a single sitemap would be slow to regenerate on every
    // publish, and a crawler would re-fetch all of it because one term changed.
    `<sitemap>
       <loc>${site}/${locale}/pillars-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    `<sitemap>
       <loc>${site}/${locale}/research-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    // Terms and their browse pages are listed separately: ~13 category pages
    // against 854 terms, and only one of the two changes when a term is
    // published.
    `<sitemap>
       <loc>${site}/${locale}/lexicon-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    `<sitemap>
       <loc>${site}/${locale}/lexicon-categories-sitemap.xml</loc>
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
      ...SITEMAP_CACHE_HEADERS,
    },
  })
}
