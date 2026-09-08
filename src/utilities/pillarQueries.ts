import type { Payload } from 'payload'

import { appLocales, type AppLocale } from '@/i18n/config'
import type { JournalCardData, JournalCardImage } from '@/utilities/journalCard'
import type { RelatedCardData } from '@/utilities/relatedCard'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaLike = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  updatedAt?: string | null
  sizes?: {
    medium?: { url?: string | null; width?: number | null; height?: number | null } | null
    large?: { url?: string | null; width?: number | null; height?: number | null } | null
  } | null
}

/**
 * Cover image for a pillar card. Prefers the 900px "medium" size — a card is
 * ~370px wide at most, so shipping the original wastes most of the bytes. Same
 * ladder `pickCardImage` uses for Journal cards.
 */
function pickImage(resource: unknown): JournalCardImage | null {
  if (!resource || typeof resource !== 'object') return null
  const media = resource as MediaLike

  const sized = media.sizes?.medium?.url
    ? media.sizes.medium
    : media.sizes?.large?.url
      ? media.sizes.large
      : null

  const url = sized?.url ?? media.url
  if (!url) return null

  return {
    src: getMediaUrl(url, media.updatedAt),
    alt: media.alt ?? '',
    width: sized?.width ?? media.width ?? undefined,
    height: sized?.height ?? media.height ?? undefined,
  }
}

/**
 * The pillars in one hub, as cards.
 *
 * Reuses `JournalCardData` and therefore the approved card design — the brief
 * that locked that design is still in force, and a second card treatment for
 * what is visibly the same object would be a gratuitous inconsistency.
 *
 * Two fields map differently from a Journal card, and deliberately:
 *
 * - `categoryTitle` is the HUB name, not a category. The designer brief's slot 2
 *   for a pillar is "Category label ✓ 1 word — always Microbiome", so the hub
 *   name is the label.
 * - `readTime` is null. Pillars have no read-time slot in the brief, and
 *   `toJournalCard` already renders nothing rather than "0 min read" for null.
 */
export async function getPillarCardsForHub({
  payload,
  locale,
  hubId,
  hubSlug,
  hubTitle,
  hubKey,
  limit = 24,
}: {
  payload: Payload
  locale: AppLocale
  hubId: number | string
  hubSlug: string
  hubTitle: string
  hubKey: string
  limit?: number
}): Promise<JournalCardData[]> {
  const result = await payload.find({
    collection: 'pillars',
    depth: 1,
    limit,
    locale,
    // A pillar not published in THIS locale must not leak in via Payload's
    // content fallback: the card would link to a URL that 404s here.
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [{ _status: { equals: 'published' } }, { hub: { equals: hubId } }],
    },
    select: {
      title: true,
      slug: true,
      standfirst: true,
      heroImage: true,
    },
  })

  return result.docs
    // Annotated `JournalCardData | null` rather than inferred. With `satisfies`
    // the literal `null` pinned `readTime` to the `null` TYPE, which made the
    // filter's predicate wider than its own parameter and therefore illegal.
    .map((doc): JournalCardData | null => {
      const record = doc as unknown as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      const slug = typeof record.slug === 'string' ? record.slug.trim() : ''

      // No slug or title in this locale means no valid card. Skip rather than
      // render one that leads nowhere.
      if (!title || !slug) return null

      return {
        id: String(record.id),
        href: `/${locale}/${hubSlug}/${slug}`,
        title,
        excerpt: typeof record.standfirst === 'string' ? record.standfirst : '',
        readTime: null,
        categoryTitle: hubTitle,
        categorySlug: hubKey,
        image: pickImage(record.heroImage),
      }
    })
    .filter((card): card is JournalCardData => card !== null)
}

function readId(value: unknown): string | null {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }
  return null
}

/**
 * The "Related topics" strip — designer brief §5, slot 11.
 *
 * Editor picks first, in the order they chose, then the rest of the hub newest
 * first. The strip is never partly full and never empty while siblings exist:
 * §4 of that brief is explicit that generated components are assembled
 * automatically, and a slot that renders three cards for one article and none
 * for the next reads as a bug to everyone except the editor who knows why.
 *
 * The manual picks are re-queried by id rather than read off the populated
 * relationship. Payload will happily hand back a related pillar that is a draft
 * in this locale, or has no slug here — both of which produce a card linking to a
 * 404. Re-querying puts them through the same publication and slug guards as
 * every other card, and it is one extra indexed lookup.
 *
 * `limit` is 3 by default: the grid is three across, and a fourth card wraps to a
 * lonely second row.
 */
export async function getRelatedPillars({
  payload,
  locale,
  hubId,
  hubSlug,
  hubTitle,
  hubKey,
  currentId,
  manualIds,
  limit = 3,
}: {
  payload: Payload
  locale: AppLocale
  hubId: number | string
  hubSlug: string
  hubTitle: string
  hubKey: string
  currentId: number | string
  /** Raw `relatedPillars` from the document — ids or populated docs. */
  manualIds?: unknown
  limit?: number
}): Promise<JournalCardData[]> {
  const current = String(currentId)

  const picked = (Array.isArray(manualIds) ? manualIds : [])
    .map(readId)
    .filter((id): id is string => Boolean(id) && id !== current)

  // One query for the whole hub, then order in memory. The alternative — a
  // query for the picks plus a query for the filler — is two round trips to
  // choose at most three items from a set of ten.
  const candidates = await getPillarCardsForHub({
    payload,
    locale,
    hubId,
    hubSlug,
    hubTitle,
    hubKey,
    limit: 24,
  })

  const byId = new Map(candidates.map((card) => [card.id, card]))
  const ordered: JournalCardData[] = []

  for (const id of picked) {
    const card = byId.get(id)
    // A pick that did not survive the guards above is dropped silently rather
    // than leaving a gap: it has no URL in this locale, so there is nothing to
    // link to and nothing an editor could do about it from this article.
    if (card) {
      ordered.push(card)
      byId.delete(id)
    }
  }

  for (const card of candidates) {
    if (ordered.length >= limit) break
    if (card.id === current || !byId.has(card.id)) continue
    ordered.push(card)
    byId.delete(card.id)
  }

  return ordered.slice(0, limit)
}

/**
 * One pillar, by hub and slug.
 *
 * Scoped to the hub as well as the slug, so a pillar can never be reached
 * through the wrong hub's URL — `/en/research/gut-bacteria` must 404 rather than
 * serve the Microbiome page under a second address. Duplicate URLs for one
 * document is the thing canonicals exist to clean up after; not creating them is
 * cheaper.
 *
 * `fallbackLocale: false` for the same reason it is set on the hub lookup: a
 * pillar written only in English must not answer on a German URL.
 */
export async function getPillarBySlug({
  payload,
  locale,
  hubId,
  slug,
  draft = false,
}: {
  payload: Payload
  locale: AppLocale
  hubId: number | string
  slug: string
  draft?: boolean
}) {
  const result = await payload.find({
    collection: 'pillars',
    depth: 2,
    draft,
    limit: 1,
    locale,
    fallbackLocale: false,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, { hub: { equals: hubId } }],
    },
  })

  return result.docs[0] ?? null
}

/** Every locale's slug for one pillar, for the hreflang cluster. */
export async function getPillarSlugsByLocale(
  payload: Payload,
  id: number | string,
): Promise<Partial<Record<AppLocale, string>>> {
  const doc = await payload.findByID({
    collection: 'pillars',
    id,
    depth: 0,
    disableErrors: true,
    locale: 'all',
    overrideAccess: false,
  })

  const raw = (doc as unknown as { slug?: unknown } | null)?.slug
  const slugs: Partial<Record<AppLocale, string>> = {}

  if (raw && typeof raw === 'object') {
    for (const locale of appLocales) {
      const value = (raw as Record<string, unknown>)[locale]
      if (typeof value === 'string' && value.trim()) slugs[locale] = value.trim()
    }
  }

  return slugs
}

/**
 * The "Related research" strip — designer brief §5, slot 11. Three cards.
 *
 * Editor picks first, then the newest published articles as filler, so the slot
 * is never partly full. Same rule as `getRelatedPillars`, and the same reason: a
 * generated slot that shows three cards on one pillar and none on the next reads
 * as a bug to everyone except the person who knows why.
 *
 * "Related" currently means "recent, unless an editor said otherwise" — Pillars
 * and Scientific articles share no taxonomy yet, so there is nothing to compute
 * relevance from. Once the article category field exists it can narrow the filler
 * to matching categories; until then this is honest rather than clever.
 *
 * Cards carry `journal` and `year`, which is what makes this strip visibly
 * different from "Related topics" without needing a second card component.
 */
export async function getRelatedResearch({
  payload,
  locale,
  researchHub,
  manualIds,
  limit = 3,
}: {
  payload: Payload
  locale: AppLocale
  /** Needed for the URL — an article's path is composed from its hub's slug. */
  researchHub: { id: number | string; slug: string; title: string } | null
  manualIds?: unknown
  limit?: number
}): Promise<RelatedCardData[]> {
  // No Research hub in this locale means no article has a URL here, so there is
  // nothing linkable to show.
  if (!researchHub) return []

  const picked = (Array.isArray(manualIds) ? manualIds : [])
    .map(readId)
    .filter((id): id is string => Boolean(id))

  const result = await payload.find({
    collection: 'scientific-articles',
    depth: 0,
    limit: 24,
    locale,
    // An article not published in THIS locale has no URL here; a card linking to
    // it would 404.
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [{ _status: { equals: 'published' } }, { hub: { equals: researchHub.id } }],
    },
  })

  const cards = new Map<string, RelatedCardData>()

  for (const doc of result.docs) {
    const record = doc as unknown as Record<string, unknown>
    const title = typeof record.title === 'string' ? record.title.trim() : ''
    const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
    if (!title || !slug) continue

    cards.set(String(record.id), {
      id: String(record.id),
      href: `/${locale}/${researchHub.slug}/${slug}`,
      title,
      category: researchHub.title,
      categorySlug: 'research',
      journal: typeof record.sourceJournal === 'string' ? record.sourceJournal : null,
      year: typeof record.studyYear === 'number' ? record.studyYear : null,
    })
  }

  const ordered: RelatedCardData[] = []

  for (const id of picked) {
    const card = cards.get(id)
    if (card) {
      ordered.push(card)
      cards.delete(id)
    }
  }

  for (const card of cards.values()) {
    if (ordered.length >= limit) break
    ordered.push(card)
  }

  return ordered.slice(0, limit)
}

/**
 * "Related reading" — designer brief §6, slot 12. Three cards.
 *
 * No manual-picks field, unlike the pillar's two strips. §11 of that brief is
 * explicit: "a new slot means a new field, and a new field means that content has
 * to exist across all 2,000 documents." Slot 12 says "Generated", so it is
 * generated — adding an editor override would put a field on 408 pipeline-filled
 * documents that nobody will ever set.
 *
 * Same category first, then the newest of anything else. Now that articles carry
 * a category this is real relevance rather than recency, which is what the
 * pillar's research strip still lacks — a pillar has no category to match on.
 */
export async function getRelatedReading({
  payload,
  locale,
  hub,
  currentId,
  categoryId,
  limit = 3,
}: {
  payload: Payload
  locale: AppLocale
  hub: { id: number | string; slug: string; title: string }
  currentId: number | string
  /** The current article's category, if it has one. */
  categoryId?: number | string | null
  limit?: number
}): Promise<RelatedCardData[]> {
  const current = String(currentId)

  const result = await payload.find({
    collection: 'scientific-articles',
    depth: 1,
    // Wide enough that same-category matches are likely to be in the set without
    // a second query. At 408 articles across 26 categories the average category
    // holds ~16, so 48 usually contains several.
    limit: 48,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [{ _status: { equals: 'published' } }, { hub: { equals: hub.id } }],
    },
  })

  const sameCategory: RelatedCardData[] = []
  const others: RelatedCardData[] = []

  for (const doc of result.docs) {
    const record = doc as unknown as Record<string, unknown>
    if (String(record.id) === current) continue

    const title = typeof record.title === 'string' ? record.title.trim() : ''
    const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
    if (!title || !slug) continue

    const category = record.category
    const thisCategoryId =
      category && typeof category === 'object'
        ? String((category as { id?: unknown }).id)
        : category != null
          ? String(category)
          : null

    const card: RelatedCardData = {
      id: String(record.id),
      href: `/${locale}/${hub.slug}/${slug}`,
      title,
      // The card shows the hub, not the article's own category — that is what the
      // preview renders, and it is what tells a reader which section they are
      // being sent to.
      category: hub.title,
      categorySlug: 'research',
      journal: typeof record.sourceJournal === 'string' ? record.sourceJournal : null,
      year: typeof record.studyYear === 'number' ? record.studyYear : null,
    }

    if (categoryId != null && thisCategoryId === String(categoryId)) sameCategory.push(card)
    else others.push(card)
  }

  return [...sameCategory, ...others].slice(0, limit)
}

/**
 * A lexicon term's "Related terms" row — exactly five, and its "Read more" cards.
 *
 * Both are generated. §7 lists related terms as "Generated. Compact row of links,
 * not cards" with an exact count of five, and read-more as two cards. Manual picks
 * are honoured when set, then the same category fills the rest, then anything.
 *
 * Same category first for a real reason: on a reference section the useful next
 * click is a sibling, not a random term. The fallback beyond that is recency,
 * which at least fills the row rather than leaving four of five slots empty.
 */
export async function getRelatedTerms({
  payload,
  locale,
  hub,
  currentId,
  categoryId,
  manualIds,
  count = 5,
}: {
  payload: Payload
  locale: AppLocale
  hub: { id: number | string; slug: string; title: string }
  currentId: number | string
  categoryId?: number | string | null
  manualIds?: unknown
  count?: number
}): Promise<{ name: string; href: string; italic: boolean; id: string }[]> {
  const current = String(currentId)
  const picked = (Array.isArray(manualIds) ? manualIds : [])
    .map(readId)
    .filter((id): id is string => Boolean(id) && id !== current)

  // Two reads, not one. The window below is bounded at 60 rows so a 2,400-term
  // corpus does not stream through memory to pick five — but that means a
  // manually picked term is almost certainly NOT in it, since the window is
  // alphabetical and the corpus is forty times its size. Fetching the picks by id
  // is what makes the editor's field actually do something; without it the only
  // field an editor sets on this collection would be silently ignored.
  const [result, pickedResult] = await Promise.all([
    payload.find({
      collection: 'lexicon-terms',
      depth: 0,
      limit: 60,
      locale,
      fallbackLocale: false,
      overrideAccess: false,
      pagination: false,
      sort: 'title',
      where: {
        and: [{ _status: { equals: 'published' } }, { hub: { equals: hub.id } }],
      },
    }),
    picked.length
      ? payload.find({
          collection: 'lexicon-terms',
          depth: 0,
          limit: picked.length,
          locale,
          fallbackLocale: false,
          overrideAccess: false,
          pagination: false,
          where: {
            and: [{ _status: { equals: 'published' } }, { id: { in: picked } }],
          },
        })
      : Promise.resolve({ docs: [] as unknown[] }),
  ])

  type Row = { id: string; name: string; href: string; italic: boolean; sameCategory: boolean }
  const rows = new Map<string, Row>()

  for (const doc of [...pickedResult.docs, ...result.docs]) {
    const record = doc as unknown as Record<string, unknown>
    const id = String(record.id)
    if (id === current) continue

    const name = typeof record.title === 'string' ? record.title.trim() : ''
    const slug = typeof record.slug === 'string' ? record.slug.trim() : ''
    if (!name || !slug) continue

    const category = record.category
    const thisCategory =
      category && typeof category === 'object'
        ? String((category as { id?: unknown }).id)
        : category != null
          ? String(category)
          : null

    rows.set(id, {
      id,
      name,
      href: `/${locale}/${hub.slug}/${slug}`,
      italic: record.italicName === true,
      sameCategory: categoryId != null && thisCategory === String(categoryId),
    })
  }

  const ordered: Row[] = []

  for (const id of picked) {
    const row = rows.get(id)
    if (row) {
      ordered.push(row)
      rows.delete(id)
    }
  }

  const remaining = [...rows.values()]
  for (const row of remaining.filter((r) => r.sameCategory)) {
    if (ordered.length >= count) break
    ordered.push(row)
  }
  for (const row of remaining.filter((r) => !r.sameCategory)) {
    if (ordered.length >= count) break
    ordered.push(row)
  }

  return ordered.slice(0, count).map(({ id, name, href, italic }) => ({ id, name, href, italic }))
}
