import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'
import { isJournalLocale } from '@/utilities/journalEnabled'
import { SITEMAP_CACHE_HEADERS } from '@/utilities/sitemapCache'

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  if (!locale || !isAppLocale(locale)) {
    return new Response('Not found', { status: 404 })
  }

  const site = getServerSideURL().replace(/\/$/, '')
  const lastmod = new Date().toISOString()

  // With the Journal switched off every one of its children 404s, so listing
  // them here would point a crawler at six dead URLs. The index keeps only
  // pages-sitemap, which is not Journal content.
  // Whether THIS market has a Journal. Its six children all 404 otherwise, and
  // listing them would point a crawler at six dead files.
  const journal = isJournalLocale(locale)

  const entries = [
    `<sitemap>
       <loc>${site}/${locale}/pages-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
    // Journal articles live in the pre-existing posts sitemap, so it is
    // conditional too — its every URL is under /journal.
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/posts-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
    // The hubs are not Page documents — they render through the Pages route but
    // live in their own collection, so `pages-sitemap` cannot see them.
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/hubs-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
    // One child per content type, not one big file. At 408 scientific articles
    // and 854 lexicon terms a single sitemap would be slow to regenerate on every
    // publish, and a crawler would re-fetch all of it because one term changed.
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/pillars-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/research-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
    // Terms and their browse pages are listed separately: ~13 category pages
    // against 854 terms, and only one of the two changes when a term is
    // published.
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/lexicon-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
    ...(journal
      ? [
          `<sitemap>
       <loc>${site}/${locale}/lexicon-categories-sitemap.xml</loc>
       <lastmod>${lastmod}</lastmod>
     </sitemap>`,
        ]
      : []),
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
