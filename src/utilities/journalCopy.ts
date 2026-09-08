import type { AppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { toChromeId } from '@/utilities/chromeId'

export { toChromeId } from '@/utilities/chromeId'

export type JournalArticleCtaCopy = {
  heading: string
  body: string
  label: string
  /** Ready to use as an href — locale-prefixed for site paths. */
  href: string
}

/**
 * Which header or footer document the Journal index renders, if any.
 *
 * `id` is null for "use the site default" — the document flagged isDefault. It
 * is a string because that is what the `Header` / `Footer` props and
 * `getCachedHeader` / `getCachedFooter` expect, while Postgres ids come back as
 * numbers.
 */
export type JournalChromeChoice = {
  id: string | null
  hide: boolean
}

export type JournalCopy = {
  heroTitle: string
  heroLede: string
  /** Null means "derive from the hero copy" rather than "empty". */
  metaTitle: string | null
  metaDescription: string | null
  cta: JournalArticleCtaCopy
  header: JournalChromeChoice
  footer: JournalChromeChoice
}

/**
 * Turns a stored CTA target into an href.
 *
 * A site path is stored without the locale (`/your-plan`) so one value works
 * everywhere, and the prefix is added here. An absolute URL is passed through so
 * a market can point at an external page. A value that already carries the
 * locale is left alone rather than doubled.
 */
function resolveCtaHref(raw: string | null, locale: AppLocale, fallbackPath: string): string {
  const value = (raw ?? '').trim() || fallbackPath

  if (/^https?:\/\//i.test(value)) return value

  const path = value.startsWith('/') ? value : `/${value}`
  if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return path

  return `/${locale}${path}`
}

/**
 * Editable copy for the Journal, with the shipped translation as the fallback
 * for every field.
 *
 * The fallback matters more than it looks: the Site Settings fields are
 * localized and optional, so a locale nobody has filled in yet would otherwise
 * render an empty hero or a blank CTA. Falling through to the dictionary means
 * the page is never broken, and the agency can override locale by locale as they
 * get to it.
 *
 * `getCachedGlobal` memoises per locale and is tagged `global_site-settings`, so
 * calling this from the page, the article and generateMetadata costs one fetch.
 */
export async function getJournalCopy(locale: AppLocale): Promise<JournalCopy> {
  const dict = getDictionary(locale)
  const settings = await getCachedGlobal('site-settings', 0, locale)()
  const journal = settings?.journal

  const clean = (value: string | null | undefined): string | null => {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    return trimmed.length > 0 ? trimmed : null
  }

  return {
    heroTitle: clean(journal?.heroTitle) ?? dict.journal.heroTitle,
    heroLede: clean(journal?.heroLede) ?? dict.journal.heroLede,
    metaTitle: clean(journal?.metaTitle),
    metaDescription: clean(journal?.metaDescription),
    cta: {
      heading: clean(journal?.ctaHeading) ?? dict.journal.ctaHeading,
      body: clean(journal?.ctaBody) ?? dict.journal.ctaBody,
      label: clean(journal?.ctaLabel) ?? dict.journal.ctaLabel,
      href: resolveCtaHref(clean(journal?.ctaUrl), locale, dict.journal.ctaPath),
    },
    // The global is fetched at depth 0, so these relationships are already ids.
    header: {
      id: toChromeId(journal?.header),
      hide: journal?.hideHeader === true,
    },
    footer: {
      id: toChromeId(journal?.footer),
      hide: journal?.hideFooter === true,
    },
  }
}
