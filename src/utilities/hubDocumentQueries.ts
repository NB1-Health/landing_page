import type { Payload } from 'payload'

import { appLocales, type AppLocale } from '@/i18n/config'
import type { JournalCardData, JournalCardImage } from '@/utilities/journalCard'
import { getMediaUrl } from '@/utilities/getMediaUrl'

/**
 * Reads shared by every collection that lives under a hub.
 *
 * `pillars` was the first, `scientific-articles` the second, `lexicon-terms` the
 * third. The three reads below are identical apart from the collection name and
 * which field supplies the card summary, and P5 established what happens when a
 * shape is written out per collection instead — it drifts, and each copy has to be
 * fixed separately.
 *
 * `pillarQueries.ts` predates this and still has its own copies. It should be
 * moved onto these, but not in the same change that adds a collection: a refactor
 * of working code and a new feature in one commit is two things to review as one.
 */

export type HubCollection = 'pillars' | 'scientific-articles' | 'lexicon-terms'

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
 * Cover image for a card. Prefers the 900px "medium" size — a card is ~370px
 * wide at most, so shipping the original wastes most of the bytes.
 */
export function pickCardImage(resource: unknown): JournalCardImage | null {
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
 * The published documents in one hub, as cards.
 *
 * `fallbackLocale: false` throughout: a document not published in THIS locale
 * must not leak in through Payload's content fallback, because the card would
 * link to a URL that 404s here.
 */
export async function getHubDocumentCards({
  payload,
  collection,
  locale,
  hubId,
  hubSlug,
  hubTitle,
  hubKey,
  imageField,
  limit = 24,
  sort = '-publishedAt',
}: {
  payload: Payload
  collection: HubCollection
  locale: AppLocale
  hubId: number | string
  hubSlug: string
  hubTitle: string
  hubKey: string
  /** Which upload field holds the cover, if the collection has one. */
  imageField?: string
  limit?: number
  sort?: string
}): Promise<JournalCardData[]> {
  const result = await payload.find({
    // Narrowed to one literal because `find` is typed per collection and a union
    // of slugs gives it a union of `select`/`where` shapes it will not accept.
    // Every field read below is guarded.
    collection: collection as 'pillars',
    depth: imageField ? 1 : 0,
    limit,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    sort,
    where: {
      and: [{ _status: { equals: 'published' } }, { hub: { equals: hubId } }],
    },
  })

  return result.docs
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
        // No read-time slot for hub documents in the brief, and `toJournalCard`
        // renders nothing rather than "0 min read" for null.
        readTime: null,
        // Slot 2 of the designer brief is "Category label — always {Hub}", so the
        // hub name is the label.
        categoryTitle: hubTitle,
        categorySlug: hubKey,
        image: imageField ? pickCardImage(record[imageField]) : null,
      }
    })
    .filter((card): card is JournalCardData => card !== null)
}

/**
 * One document, by hub AND slug.
 *
 * Scoped to both so a document can never be reached through the wrong hub's URL.
 * Duplicate URLs for one document is what canonicals exist to clean up after; not
 * creating them is cheaper.
 */
export async function getHubDocumentBySlug({
  payload,
  collection,
  locale,
  hubId,
  slug,
  draft = false,
}: {
  payload: Payload
  collection: HubCollection
  locale: AppLocale
  hubId: number | string
  slug: string
  draft?: boolean
}) {
  const result = await payload.find({
    collection: collection as 'pillars',
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

/** Every locale's slug for one document, for the hreflang cluster. */
export async function getHubDocumentSlugsByLocale(
  payload: Payload,
  collection: HubCollection,
  id: number | string,
): Promise<Partial<Record<AppLocale, string>>> {
  const doc = await payload.findByID({
    collection: collection as 'pillars',
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
