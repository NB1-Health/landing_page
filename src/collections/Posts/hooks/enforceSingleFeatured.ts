import type { CollectionAfterChangeHook } from 'payload'

import { isPublishedForActiveLocale } from '@/utilities/publishedLocaleAvailability'

const CONTEXT_KEY = 'skipEnforceSingleFeatured'

/**
 * The Journal index has exactly one featured slot. If more than one post can
 * carry `featured: true`, the index query
 * (`where: { featured: { equals: true } }`) matches several rows and Postgres
 * returns whichever the query plan prefers — so the featured article changes at
 * random between requests and between server instances.
 *
 * So: when a post is published with `featured: true`, unset the flag on every
 * other post. Same shape as `Header/hooks/enforceSingleDefault.ts`.
 *
 * `featured` is deliberately NOT localized. A post is a single record shared
 * across all eight locales (the slug is not localized either), so one global
 * feature pick keeps the flag consistent with how posts are actually modelled.
 * A locale where that post is not published simply falls back to the newest
 * published article — handled in the index query, not here.
 */
export const enforceSingleFeatured: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!doc?.featured) return doc

  // Guard against the recursion this hook would otherwise cause: each
  // payload.update below re-enters afterChange on Posts.
  if (req.context[CONTEXT_KEY]) return doc

  // A draft must not steal the live featured slot. Only a published save wins.
  if (!isPublishedForActiveLocale(doc._status, req.locale)) return doc

  const others = await req.payload.find({
    collection: 'posts',
    where: {
      and: [{ featured: { equals: true } }, { id: { not_equals: doc.id } }],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  })

  for (const other of others.docs) {
    try {
      await req.payload.update({
        collection: 'posts',
        id: other.id,
        data: { featured: false },
        depth: 0,
        overrideAccess: true,
        req,
        context: {
          [CONTEXT_KEY]: true,
          // The index and sitemap are already being revalidated for this
          // request by revalidatePost on the post that just won the slot.
          // Without this, each unfeatured post fires its own full
          // revalidation sweep across all eight locales.
          disableRevalidate: true,
        },
      })
    } catch (error) {
      req.payload.logger.warn(
        { err: error, id: other.id },
        'Could not clear featured flag on a previously featured post',
      )
    }
  }

  return doc
}
