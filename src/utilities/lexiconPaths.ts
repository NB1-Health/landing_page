import { localeConfig, type AppLocale } from '@/i18n/config'

/**
 * Every lexicon URL, built in one place.
 *
 * The browse segment is TRANSLATED — `/en/lexicon/topics/metabolites` but
 * `/de/glossar/themen/stoffwechselprodukte` — and it was previously the literal
 * string `topics` hardcoded in eight files plus a static route folder. That made
 * the German category page unreachable at the address the brief specifies, and it
 * made the fix an eight-site edit with eight chances to miss one.
 *
 * Same argument as the hub slug: a URL assembled from a localized part belongs
 * behind a function, because the alternative is every caller remembering that the
 * part is localized. The one that forgets does not fail loudly — it emits a URL
 * that 404s in one language only.
 */

/** `topics` in English, `themen` in German. */
export function browseSegmentFor(locale: AppLocale): string {
  return localeConfig[locale].lexiconBrowseSegment
}

/**
 * True when `value` is the browse segment for this locale.
 *
 * Deliberately exact rather than "is it any locale's browse segment": accepting
 * `/de/glossar/topics/x` because English says `topics` would serve one page at two
 * addresses, which is the duplicate-content problem the flat term URL exists to
 * avoid. One address per page, per language.
 */
export function isBrowseSegment(locale: AppLocale, value: string): boolean {
  return value === browseSegmentFor(locale)
}

/**
 * A lexicon category browse page.
 *
 * `hubSlug` is passed in rather than looked up: callers already hold the hub, and
 * a lookup here would turn a string concatenation into an async call in the middle
 * of render paths that have no other reason to await anything.
 */
export function lexiconCategoryPath({
  locale,
  hubSlug,
  categorySegment,
}: {
  locale: AppLocale
  hubSlug: string
  /** The category's localized slug, or its `key` where no slug is set. */
  categorySegment: string
}): string {
  return `/${locale}/${hubSlug}/${browseSegmentFor(locale)}/${categorySegment}`
}

/**
 * The same path WITHOUT the locale prefix, for hreflang clusters.
 *
 * `buildHreflangAlternates` takes paths relative to each locale's prefix and adds
 * the prefix itself, so passing a fully-prefixed path there would produce
 * `/de/de/glossar/...`. The browse segment still has to be that locale's, which is
 * exactly the bug this module exists to prevent — hence a second function rather
 * than callers trimming the first one's output.
 */
export function lexiconCategoryPathForLocale({
  locale,
  hubSlug,
  categorySegment,
}: {
  locale: AppLocale
  hubSlug: string
  categorySegment: string
}): string {
  return `${hubSlug}/${browseSegmentFor(locale)}/${categorySegment}`
}
