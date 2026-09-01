import { rejectSlugCollision } from '@/collections/hooks/rejectSlugCollision'

/**
 * A hub may not take a slug an ordinary Page already holds.
 *
 * The mirror check lives at `Pages/hooks/rejectHubSlugCollision.ts`; both are the
 * same factory, so the rule cannot drift between the two directions. Previously
 * only this direction existed, which meant a Page created *after* a hub could
 * still take its slug and disappear.
 */
export const rejectPageSlugCollision = rejectSlugCollision({
  collection: 'pages',
  otherLabel: 'the page',
  selfLabel: 'hub',
})
