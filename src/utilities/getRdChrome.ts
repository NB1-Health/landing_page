import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * Fetch the redesign header / footer, by id or by default.
 *
 * A deliberate copy of the shape in `getHeaderFooter.ts` rather than a
 * generalisation of it: that file is on the path of every page on the live site,
 * and widening its types to cover two more collections would put the whole site
 * behind a change made for the redesign. Two collections, twenty lines, no risk.
 *
 * `depth: 2` matches the live header's, so the logo uploads come back populated
 * rather than as ids.
 */
function safeLocale(locale?: string): AppLocale {
  return isAppLocale(locale ?? '') ? (locale as AppLocale) : 'en'
}

const fetchOne = async (
  collection: 'rd-headers' | 'rd-footers',
  id: string | number | null | undefined,
  locale?: string,
) => {
  const payload = await getPayload({ config: configPromise })
  if (id) {
    return payload.findByID({ collection, id, depth: 2, locale: safeLocale(locale) })
  }
  const result = await payload.find({
    collection,
    where: { isDefault: { equals: true } },
    limit: 1,
    depth: 2,
    locale: safeLocale(locale),
  })
  return result.docs[0] ?? null
}

export const getCachedRdHeader = (id: string | number | null | undefined, locale?: string) =>
  unstable_cache(
    () => fetchOne('rd-headers', id, locale),
    ['rd-header', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_header_${id}` : 'rd_header_default'] },
  )

export const getCachedRdFooter = (id: string | number | null | undefined, locale?: string) =>
  unstable_cache(
    () => fetchOne('rd-footers', id, locale),
    ['rd-footer', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_footer_${id}` : 'rd_footer_default'] },
  )
