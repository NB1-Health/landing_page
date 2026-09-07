import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Refuse a slug that a document in another collection already holds, in the same
 * locale.
 *
 * This is a routing constraint, not a tidiness one. `/{locale}/{hub}` and
 * `/{locale}/{page}` are both two segments, so they sit at the same depth in the
 * App Router, and the Pages route resolves a hub before it resolves a Page. One
 * of the two documents therefore becomes permanently unreachable, with nothing in
 * the build output to say which.
 *
 * A factory rather than two hand-written hooks. The check has to run in both
 * directions — whichever document is saved second is the one that breaks the
 * other — and a routing invariant expressed twice is a routing invariant that
 * drifts the first time one side is amended.
 *
 * Per-locale, because both slugs are localized: `forschung` may be free in
 * English and taken in German.
 */
export function rejectSlugCollision({
  collection,
  /** What the OTHER thing is, in the error message: "the page", "the hub". */
  otherLabel,
  /** What this document is. */
  selfLabel,
}: {
  collection: 'pages' | 'hubs'
  otherLabel: string
  selfLabel: string
}): CollectionBeforeValidateHook {
  return async ({ data, req }) => {
    const raw = data?.slug
    if (!req?.payload) return data

    // On a `locale: 'all'` write the value is a map rather than a string. The
    // per-locale check cannot run meaningfully against it, and the individual
    // locale saves that produced the map were each checked already.
    if (typeof raw !== 'string') return data

    const slug = raw.trim()
    if (!slug) return data

    const locale = req.locale as 'en' | undefined

    const clash = await req.payload.find({
      // Narrowed to one literal because `find` is generically typed per
      // collection: a union of slugs gives it a union of `select` and `where`
      // shapes it will not accept. Both collections carry `slug` and `title`, so
      // the read is valid either way. `fields/slug.ts` casts for the same reason.
      collection: collection as 'pages',
      depth: 0,
      limit: 1,
      locale,
      overrideAccess: true,
      pagination: false,
      select: { slug: true, title: true },
      where: { slug: { equals: slug } },
    })

    const other = clash.docs[0]
    if (!other) return data

    const name = (other as { title?: unknown; id?: unknown }).title
    const label = typeof name === 'string' && name.trim() ? name : String(other.id)

    throw new Error(
      `The slug "${slug}" is already used by ${otherLabel} "${label}" in the ${
        locale ?? 'current'
      } locale. A hub and a page cannot share a slug — one route shadows the other and makes it unreachable. Pick a different slug for this ${selfLabel}, or rename the other document first.`,
    )
  }
}
