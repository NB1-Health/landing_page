import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { lexiconCategorySitemapEntries } from '@/utilities/hubDocumentSitemap'
import { isAppLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The lexicon category browse pages: `/en/lexicon/topics/{category}`, and in
 * German `/de/glossar/themen/{category}`.
 *
 * Separate from the terms sitemap because these are a different kind of URL —
 * roughly 13 browse pages against 854 term pages — and because the browse segment
 * is translated. `lexiconCategoryPath` owns that word, so this file cannot
 * advertise `/de/glossar/topics/...`, which the route would 404.
 *
 * Tagged `lexicon-categories` as well as its own key: publishing a category
 * changes this list, and publishing a TERM does not.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isAppLocale(localeParam)) return new Response('Not found', { status: 404 })
  const locale = localeParam

  const entries = await unstable_cache(
    async () =>
      lexiconCategorySitemapEntries({
        payload: await getPayload({ config }),
        locale,
        siteURL: getServerSideURL().replace(/\/$/, ''),
      }),
    ['lexicon-categories-sitemap', locale],
    { tags: ['lexicon-categories-sitemap', 'lexicon-categories', 'hubs'] },
  )()

  return getServerSideSitemap(entries)
}
