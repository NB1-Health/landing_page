import type { Metadata } from 'next'

import { appLocales, type AppLocale } from '@/i18n/config'
import { buildHreflangAlternates } from '@/utilities/hreflang'
import type { Hub } from '@/utilities/hubQueries'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

/**
 * `<head>` for a content hub.
 *
 * Kept out of the Pages route so that file stays about pages — the hub branch
 * there is two lines, not a second `generateMetadata` inlined next to the first.
 *
 * The hreflang cluster is built from the slugs that actually exist, locale by
 * locale, never by swapping the path segment. §6 is explicit about this, and the
 * failure mode is not local: an alternate pointing at a page that does not exist
 * can invalidate the whole cluster, taking the working languages down with it.
 * `buildHreflangAlternates` already skips any locale with no path, so passing
 * only the resolved ones is the whole fix.
 */
export function buildHubMetadata(hub: Hub, locale: AppLocale): Metadata {
  const siteURL = getServerSideURL()
  const canonical = new URL(`/${locale}/${hub.slug}`, siteURL).toString()

  const pathsByLocale = Object.fromEntries(
    appLocales
      .filter((available) => typeof hub.slugsByLocale[available] === 'string')
      .map((available) => [available, hub.slugsByLocale[available] as string]),
  )

  const title = hub.metaTitle ?? `${hub.title} | NB1`
  const description = hub.metaDescription ?? hub.intro ?? ''

  return {
    title,
    description,
    alternates: {
      canonical,
      ...buildHreflangAlternates({ siteURL, pathsByLocale }),
    },
    openGraph: mergeOpenGraph({
      type: 'website',
      // Open Graph shows the human title, not the SERP-tuned one.
      title: hub.title,
      description,
      url: canonical,
    }),
  }
}
