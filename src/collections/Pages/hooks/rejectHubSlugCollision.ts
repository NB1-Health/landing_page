import { rejectSlugCollision } from '@/collections/hooks/rejectSlugCollision'

/**
 * A Page may not take a slug one of the hubs already holds.
 *
 * The direction that was missing. `[locale]/[slug]` asks "is this slug a hub?"
 * first and renders `HubPage` if so, so a Page saved onto `microbiome` is not
 * merely ambiguous — it is unreachable, and nothing in the build or the admin
 * would say so.
 */
export const rejectHubSlugCollision = rejectSlugCollision({
  collection: 'hubs',
  otherLabel: 'the hub',
  selfLabel: 'page',
})
