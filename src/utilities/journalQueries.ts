import type { Payload, Where } from 'payload'

import { appLocales, defaultLocale, type AppLocale } from '@/i18n/config'
import { toJournalCard, type JournalCardData } from '@/utilities/journalCard'

export const JOURNAL_PAGE_SIZE = 12

export type JournalTopic = { slug: string; title: string }

export type JournalIndexData = {
  featured: JournalCardData | null
  cards: JournalCardData[]
  topics: JournalTopic[]
  page: number
  totalPages: number
  totalDocs: number
}

type Args = {
  payload: Payload
  locale: AppLocale
  /** 1-based. Page 2+ omits the featured slot. */
  page?: number
}

export type JournalCategory = { id: number | string; title: string; slug: string }

/**
 * Every locale's slug for one category.
 *
 * Currently unused by the Journal — the category archives it was written for were
 * removed per TICKET-SEO-007 §10, which requires the topic chips to carry no URL
 * so they cannot compete with the Microbiome pillars. Kept because the lexicon
 * category hubs need exactly this: a localized taxonomy slug resolved across every
 * locale at once.
 *
 * Category slugs are localized, so the same category has a different URL in each
 * market. Building an hreflang cluster needs all of them, which a locale-scoped
 * read cannot give — hence `locale: 'all'`, the same approach
 * `resolvePublishedLocaleSlugs` takes for posts.
 *
 * Locales with no slug are omitted rather than guessed: pointing hreflang at a
 * URL that 404s is worse than leaving the locale out of the cluster.
 */
export async function getCategorySlugsByLocale(
  payload: Payload,
  id: number | string,
): Promise<Partial<Record<AppLocale, string>>> {
  const doc = await payload.findByID({
    collection: 'categories',
    id,
    depth: 0,
    disableErrors: true,
    locale: 'all',
    overrideAccess: false,
    select: { slug: true },
  })

  const raw = (doc as { slug?: unknown } | null)?.slug
  const slugs: Partial<Record<AppLocale, string>> = {}

  if (raw && typeof raw === 'object') {
    for (const locale of appLocales) {
      const value = (raw as Record<string, unknown>)[locale]
      if (typeof value === 'string' && value.trim()) slugs[locale] = value
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    // A plain scalar means legacy data written before the field was localized;
    // it can only belong to the default locale.
    slugs[defaultLocale] = raw
  }

  return slugs
}

/**
 * Topic chips are driven by the Category taxonomy, never hard-coded.
 * Categories with no posts still render a chip; selecting one shows the empty
 * state, which is what the brief asks for.
 */
async function getTopics(payload: Payload, locale: AppLocale): Promise<JournalTopic[]> {
  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
    locale,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    select: { title: true, slug: true },
  })

  return result.docs
    .filter((doc) => typeof doc.slug === 'string' && typeof doc.title === 'string')
    .map((doc) => ({ slug: doc.slug as string, title: doc.title as string }))
}

export async function getJournalIndexData({
  payload,
  locale,
  page = 1,
}: Args): Promise<JournalIndexData> {
  // `fallbackLocale: false` is deliberate: a post that is not published in this
  // locale must not leak in via Payload's content fallback, or the card would
  // link to a URL that 404s for this locale.
  const shared = {
    collection: 'posts' as const,
    depth: 1,
    locale,
    fallbackLocale: false as const,
    overrideAccess: false,
    sort: '-publishedAt',
  }

  // Annotated `Where[]` rather than inferred, so a future conditional spread here
  // cannot silently produce a union of object literals carrying `?: undefined`
  // keys, which `Where`'s index signature rejects.
  const publishedAndInScope: Where[] = [{ _status: { equals: 'published' } }]

  const wantsFeatured = page === 1

  const [topics, featuredResult] = await Promise.all([
    getTopics(payload, locale),
    // The featured flag is global, not per-locale (a post is one record shared
    // by all eight locales). So the flagged post may not be published in THIS
    // locale — the `_status` filter drops it here and the fallback below picks
    // the newest article that is. Without that fallback the slot would be empty
    // on most locales.
    wantsFeatured
      ? payload.find({
          ...shared,
          limit: 1,
          pagination: false,
          where: { and: [...publishedAndInScope, { featured: { equals: true } }] },
          select: {
            title: true,
            slug: true,
            excerpt: true,
            readTime: true,
            heroImage: true,
            primaryCategory: true,
          },
        })
      : Promise.resolve({ docs: [] as never[] }),
  ])

  let featuredDoc = featuredResult.docs[0] ?? null

  // "If none is flagged, fall back to the most recent; never show two."
  if (!featuredDoc && wantsFeatured) {
    const newest = await payload.find({
      ...shared,
      limit: 1,
      pagination: false,
      where: { and: publishedAndInScope },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        readTime: true,
        heroImage: true,
        primaryCategory: true,
      },
    })
    featuredDoc = newest.docs[0] ?? null
  }

  const featured = wantsFeatured && featuredDoc ? toJournalCard(featuredDoc, locale) : null

  // Exclude the featured post from the grid on every page, so pagination totals
  // stay consistent and it is never rendered twice.
  const grid = await payload.find({
    ...shared,
    limit: JOURNAL_PAGE_SIZE,
    page,
    where: {
      and: [
        ...publishedAndInScope,
        ...(featuredDoc ? [{ id: { not_equals: featuredDoc.id } }] : []),
      ],
    },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      readTime: true,
      heroImage: true,
      primaryCategory: true,
    },
  })

  const cards = grid.docs
    .map((doc) => toJournalCard(doc, locale))
    .filter((card): card is JournalCardData => card !== null)

  return {
    featured,
    cards,
    topics,
    page: grid.page ?? page,
    totalPages: grid.totalPages ?? 1,
    totalDocs: grid.totalDocs ?? cards.length,
  }
}
