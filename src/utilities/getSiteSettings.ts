import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { defaultLocale, type AppLocale } from '@/i18n/config'

const CACHE_SECONDS = 600
const CACHE_TAG = 'global_site-settings'

async function fetchSiteSettings(locale: AppLocale) {
  const payload = await getPayload({ config: configPromise })

  return payload.findGlobal({
    slug: 'site-settings',
    // `payload.config.ts` sets no `defaultDepth`, so an omitted depth is 2 and
    // this global was resolving two levels of relationships on every layout
    // render. The only consumer is `[locale]/layout.tsx:90`, which reads
    // `site?.organizationJsonLd` — a JSON field. Nothing here needs a
    // relationship resolved, so depth 0 returns the same data for less work.
    //
    // Raise this the moment a caller starts reading a related document off the
    // global. At depth 0 that arrives as a bare id and renders as nothing,
    // which fails silently rather than throwing.
    depth: 0,
    locale,
    fallbackLocale: defaultLocale,
    overrideAccess: false,
  })
}

const getCachedSiteSettings = unstable_cache(fetchSiteSettings, ['site-settings'], {
  revalidate: CACHE_SECONDS,
  tags: [CACHE_TAG],
})

export function getSiteSettings(locale: AppLocale, preview: boolean) {
  return preview ? fetchSiteSettings(locale) : getCachedSiteSettings(locale)
}
