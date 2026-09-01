import type { CollectionAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { appLocales } from '@/i18n/config'

/**
 * Invalidate everything a hub feeds when one is saved.
 *
 * Layout scope per locale, rather than a list of hub paths, for two reasons.
 *
 * First, the hub's own slug may be what changed — in which case the path that
 * needs invalidating is the OLD one, and `doc` no longer knows it. Revalidating
 * the locale layout covers both the old and the new URL without having to diff
 * them.
 *
 * Second, a hub's title is its breadcrumb rung and its nav label, so it appears
 * on every document beneath it. Renaming Microbiome changes the trail on all ten
 * pillars; enumerating those paths here would mean querying the hub's documents
 * on every save, and getting it wrong means a stale rung that contradicts the
 * JSON-LD — which §5 calls a P1 defect.
 *
 * The same layout-scoped approach and the same reasoning are in
 * `Header/hooks/revalidateHeader.ts`: `revalidateTag` alone does not reliably
 * regenerate already-static ISR HTML when the data came from `unstable_cache`
 * rather than a plain `fetch()`.
 */
export const revalidateHub: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (context.disableRevalidate) return doc

  payload.logger.info(`Revalidating hub ${doc?.key ?? doc?.id}`)

  revalidateTag('hubs')
  revalidateTag(`hub_${doc?.key ?? doc?.id}`)

  appLocales.forEach((locale) => {
    revalidatePath(`/${locale}`, 'layout')
  })

  return doc
}
