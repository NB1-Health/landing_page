import type { Config } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Global = keyof Config['globals']

import { isAppLocale, type AppLocale } from '@/i18n/config'

type PayloadLocale = AppLocale | 'all'

/**
 * Generic over the slug so the return type is the specific global, not a union
 * of every global on the site.
 *
 * Without this, `getCachedGlobal('site-settings')` resolved to
 * `SiteSetting | Navigation | Faq`, and reading any field that only exists on
 * one of them was a type error even though the slug is a literal at every call
 * site. `payload.findGlobal` is not itself generic over the slug here, so the
 * assertion below is the one place that knowledge lives.
 */
async function getGlobal<T extends Global>(
  slug: T,
  depth = 0,
  locale?: string,
): Promise<Config['globals'][T]> {
  const payload = await getPayload({ config: configPromise })

  const safeLocale: PayloadLocale | undefined = locale
    ? isAppLocale(locale)
      ? (locale as PayloadLocale)
      : 'en'
    : undefined

  const global = await payload.findGlobal({
    slug,
    depth,
    locale: safeLocale,
  })

  return global as Config['globals'][T]
}

export const getCachedGlobal = <T extends Global>(slug: T, depth = 0, locale?: string) =>
  unstable_cache(
    async () => getGlobal(slug, depth, locale),
    [slug, String(depth), locale || 'default'],
    {
      tags: [`global_${slug}`, locale ? `global_${slug}_${locale}` : `global_${slug}_default`],
    },
  )
