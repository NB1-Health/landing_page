import type { AppLocale } from '@/i18n/config'
import type { PublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'
import { isJournalLocale, journalLocales } from '@/utilities/journalEnabled'

/**
 * `'absolute'` carries a ready-made path per locale rather than a slug.
 *
 * Journal URLs are composed from TWO or THREE localized parts — `locale +
 * hub.slug + doc.slug`, and for a category `+ browse segment` — so no single slug
 * can produce them and no formula here could either without duplicating the hub
 * lookup. Every Journal route already computes exactly this map for its hreflang
 * cluster, so the switcher reuses that rather than deriving it a second way and
 * risking the two disagreeing.
 *
 * `'influencer'` is origin/main's, and is an ordinary single-slug route.
 */
export type LocalizedDocumentRoute = 'home' | 'page' | 'post' | 'absolute' | 'influencer'

export type LocalizedDocument = {
  route: LocalizedDocumentRoute
  /**
   * Keyed by locale. For every route but `'absolute'` the value is a slug; for
   * `'absolute'` it is the full locale-prefixed path.
   *
   * The switcher only ever asks "is there a string for this locale?" to decide
   * whether the option is offered, so both shapes answer that question
   * identically — which is why this stayed one type instead of becoming a union
   * that every caller would have to narrow.
   */
  slugs: PublishedLocaleSlugs
}

export function buildLocalizedDocumentPath(
  locale: AppLocale,
  slug: string,
  route: LocalizedDocumentRoute,
): string {
  // Already a complete path. Prefixing it would produce `/de/de/glossar/...`.
  if (route === 'absolute') return slug
  if (route === 'home') return `/${locale}`
  // Posts are served under /journal (JOURNAL_INTEGRATION_PLAN.md, Phase 2).
  // origin/main still had /posts here; the old paths 301 from middleware.
  if (route === 'post') return `/${locale}/journal/${slug}`
  if (route === 'influencer') return `/${locale}/influencers/${slug}`
  return `/${locale}/${slug}`
}

/**
 * The locales a hub page exists in — free, because the hub already carries them.
 *
 * Used by the hub indexes (Microbiome, Research, Lexicon). A hub with no slug in
 * a locale has no URL there, so the switcher must not offer it.
 */
export function hubLocalizedDocument(
  slugsByLocale: Partial<Record<AppLocale, string>>,
): LocalizedDocument {
  const slugs: PublishedLocaleSlugs = {}
  for (const [locale, slug] of Object.entries(slugsByLocale)) {
    if (typeof slug === 'string' && slug.trim()) {
      slugs[locale as AppLocale] = `/${locale}/${slug.trim()}`
    }
  }
  return { route: 'absolute', slugs }
}

/**
 * The Journal index in every live market, for the switcher on `/journal` and its
 * paginated pages.
 *
 * Without a `localizedDocument` the switcher falls back to swapping the locale
 * segment of the current path, which happily produces `/it/journal` — a route
 * that `isJournalLocale` 404s. Naming the live markets explicitly is what makes
 * the switcher grey the others out instead.
 *
 * Every market points at page 1 rather than the page number being viewed: the
 * markets hold different numbers of articles, so `/de/journal/page/5` may not
 * exist even though `/en/journal/page/5` does.
 */
export function journalIndexLocalizedDocument(): LocalizedDocument {
  const slugs: PublishedLocaleSlugs = {}
  for (const locale of journalLocales) slugs[locale] = `/${locale}/journal`
  return { route: 'absolute', slugs }
}

/**
 * Drop the markets the Journal is not live in from a published-slug map.
 *
 * An article translated ahead of its market's launch is published in that locale
 * but has no route there yet, so the switcher must not offer it. The hreflang
 * cluster in each Journal route already filters the same way.
 */
export function journalSwitcherSlugs(slugs: PublishedLocaleSlugs): PublishedLocaleSlugs {
  const out: PublishedLocaleSlugs = {}
  for (const [locale, slug] of Object.entries(slugs)) {
    if (isJournalLocale(locale as AppLocale)) out[locale as AppLocale] = slug
  }
  return out
}
