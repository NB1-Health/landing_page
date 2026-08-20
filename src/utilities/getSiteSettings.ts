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
