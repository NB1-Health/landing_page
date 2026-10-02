import type { PayloadRequest } from 'payload'

import type { AppLocale } from '@/i18n/config'
import { lexiconCategoryPath } from '@/utilities/lexiconPaths'

/**
 * The content library collections MCP agents can read and draft: pillars,
 * scientific articles, lexicon terms and lexicon categories. Writes live in
 * `libraryOperations`; this module is the shared vocabulary both it and the
 * generic read tools use.
 */

export const LIBRARY_COLLECTIONS = [
  'pillars',
  'scientific-articles',
  'lexicon-terms',
  'lexicon-categories',
] as const
export type LibraryCollection = (typeof LIBRARY_COLLECTIONS)[number]

export function isLibraryCollection(value: string): value is LibraryCollection {
  return (LIBRARY_COLLECTIONS as readonly string[]).includes(value)
}

export const HUB_KEY: Partial<Record<LibraryCollection, string>> = {
  pillars: 'microbiome',
  'scientific-articles': 'research',
  'lexicon-terms': 'lexicon',
}

/**
 * Public paths for a page of library documents in one locale, for linking.
 *
 * The URL a document WILL have once published: the hub's slug in that locale plus
 * the document's. Null where the hub has no slug in this locale, because then the
 * document has no URL there.
 */
export async function libraryPaths(
  req: PayloadRequest,
  collection: LibraryCollection,
  locale: AppLocale,
  docs: Array<Record<string, unknown>>,
): Promise<Map<string, string | null>> {
  const hubKey = collection === 'lexicon-categories' ? 'lexicon' : HUB_KEY[collection]!
  const hubs = await req.payload.find({
    collection: 'hubs',
    depth: 0,
    fallbackLocale: false,
    limit: 1,
    locale,
    pagination: false,
    overrideAccess: false,
    req,
    where: { key: { equals: hubKey } },
  })
  const hubSlug = (hubs.docs[0] as { slug?: string | null } | undefined)?.slug ?? null

  return new Map(
    docs.map((doc) => {
      const docSlug =
        (typeof doc.slug === 'string' && doc.slug) ||
        (collection === 'lexicon-categories' && typeof doc.key === 'string' ? doc.key : '')
      if (!hubSlug || !docSlug) return [String(doc.id), null]
      return [
        String(doc.id),
        collection === 'lexicon-categories'
          ? lexiconCategoryPath({ locale, hubSlug, categorySegment: docSlug })
          : `/${locale}/${hubSlug}/${docSlug}`,
      ]
    }),
  )
}
