import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { hubDocumentSitemapEntries } from '@/utilities/hubDocumentSitemap'
import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Published scientific articles: `/en/research/{slug}`.
 *
 * One child per content type rather than one large file: at 408 articles and 854
 * terms across two locales a single sitemap would be slow to regenerate on every
 * publish, and a crawler re-fetching everything because one term changed is the
 * cost this split avoids.
 *
 * The join, the `noindex` filter and the both-slugs-must-exist rule all live in
 * `hubDocumentSitemapEntries` — written out by hand once in `pillars-sitemap`,
 * and three copies of it is three chances to get the NULL-safe `noindex` check
 * subtly wrong.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const entries = await unstable_cache(
    async () =>
      hubDocumentSitemapEntries({
        payload: await getPayload({ config }),
        collection: 'scientific-articles',
        locale,
        siteURL: getServerSideURL().replace(/\/$/, ''),
      }),
    ['research-sitemap', locale],
    { tags: ['research-sitemap', `research-sitemap-${locale}`, 'hubs'] },
  )()

  return getServerSideSitemap(entries)
}
