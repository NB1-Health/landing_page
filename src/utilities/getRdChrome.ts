import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import type { RdFooter, RdHeader } from '@/payload-types'

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
 *
 * WHY THE RETURN TYPE IS `unknown`, AND WHY THE CAST IS HERE.
 *
 * `collection` is a UNION of two slugs, and Payload resolves a document's type
 * from that slug — given a union it has no single collection to resolve against
 * and the result collapses to `never`. That is not visible here (nothing in this
 * file consumes the value) but it is fatal at the call site: `never` cannot be
 * spread, so `<RdFooter {...data} />` fails to compile with "Spread types may
 * only be created from object types."
 *
 * Widening to `unknown` and narrowing once per collection in the two getters
 * below is the smallest honest fix: each getter knows exactly which collection
 * it asked for, so it is the one place where naming the document type is a
 * statement of fact rather than a guess. The server wrappers then receive real,
 * checked props — RdHeaderServer / RdFooterServer used to cast to `never` to get
 * past this, which silently switched OFF prop checking on the chrome.
 */
function safeLocale(locale?: string): AppLocale {
  return isAppLocale(locale ?? '') ? (locale as AppLocale) : 'en'
}

const fetchOne = async (
  collection: 'rd-headers' | 'rd-footers',
  id: string | number | null | undefined,
  locale?: string,
): Promise<unknown> => {
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
    async () => (await fetchOne('rd-headers', id, locale)) as RdHeader | null,
    ['rd-header', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_header_${id}` : 'rd_header_default'] },
  )

export const getCachedRdFooter = (id: string | number | null | undefined, locale?: string) =>
  unstable_cache(
    async () => (await fetchOne('rd-footers', id, locale)) as RdFooter | null,
    ['rd-footer', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_footer_${id}` : 'rd_footer_default'] },
  )
