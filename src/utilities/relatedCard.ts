import type { JournalCardData, JournalCardImage } from '@/utilities/journalCard'

/**
 * A card in a "related" strip.
 *
 * Deliberately smaller than `JournalCardData`. A Journal grid card carries an
 * excerpt, a read time and a featured flag because it is competing for a click on
 * an index page. A related card is a footnote at the bottom of an article the
 * reader is already finishing, and every preview renders it as a category word, a
 * title and a thumbnail — nothing else. Reusing the bigger card here would put a
 * two-line excerpt under three cards in a strip 220px wide.
 *
 * One shape for all five uses: the pillar's "Related topics" and "From the
 * research", the scientific article's "Related reading", and the lexicon's "Read
 * more" on terms, categories and the index.
 */
export type RelatedCardData = {
  id: string
  href: string
  title: string
  /** The single word above the title — a hub name, or a lexicon category. */
  category?: string | null
  /**
   * The category's SLUG, for the thumbnail tint only — never rendered.
   *
   * Kept separate from `category` because that one is a localized display name:
   * "Bacterial taxa" would produce a CSS class with a space in it, and the same
   * card would tint differently in German. The lexicon category preview makes
   * exactly this mistake in its hrefs.
   */
  categorySlug?: string | null
  /**
   * Source journal and year, for a research card.
   *
   * The designer brief says the research strip "needs a small journal + year
   * line"; the pillar preview renders no such line. Rather than pick a side with
   * a variant flag, the line renders when the data is there and is absent when it
   * is not — so a research card gets it and a topic card does not, which is what
   * both documents actually describe.
   */
  journal?: string | null
  year?: number | string | null
  image?: JournalCardImage | null
}

/**
 * Narrow a Journal/hub card down to a related card.
 *
 * The excerpt and read time are dropped rather than hidden with CSS: a card that
 * ships text it never shows is a card that will eventually show it.
 */
export function toRelatedCard(
  card: JournalCardData,
  extra?: { journal?: string | null; year?: number | string | null },
): RelatedCardData {
  return {
    id: card.id,
    href: card.href,
    title: card.title,
    category: card.categoryTitle,
    categorySlug: card.categorySlug,
    image: card.image,
    ...(extra?.journal ? { journal: extra.journal } : {}),
    ...(extra?.year ? { year: extra.year } : {}),
  }
}

/**
 * "Nature Communications · 2026", or whichever half exists.
 *
 * Returns null rather than an empty string so the caller renders nothing at all,
 * instead of an empty element that still occupies its margin.
 */
export function formatSourceLine(
  journal?: string | null,
  year?: number | string | null,
): string | null {
  const name = typeof journal === 'string' && journal.trim() ? journal.trim() : null
  const when = year === 0 || year ? String(year).trim() : ''

  if (name && when) return `${name} · ${when}`
  return name ?? (when || null)
}
