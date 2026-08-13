import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'

export type LocalizedPageSlugs = Partial<Record<AppLocale, string>>

const HOME_SLUGS = new Set(['home', 'home-page'])
const PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSafePageSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 70 &&
    PAGE_SLUG_PATTERN.test(value)
  )
}

export function isHomePageSlugs(slugs: LocalizedPageSlugs): boolean {
  return typeof slugs.en === 'string' && HOME_SLUGS.has(slugs.en)
}

export function getPublicPagePath(locale: unknown, slug: unknown, homePage = false): string | null {
  if (typeof locale !== 'string' || !isAppLocale(locale) || !isSafePageSlug(slug)) return null
  return homePage || (locale === 'en' && HOME_SLUGS.has(slug)) ? `/${locale}` : `/${locale}/${slug}`
}

export function getPagePublicationLocales(): readonly AppLocale[] {
  return appLocales
}

export function getPageRevalidationTargets({
  currentSlugs = {},
  locales,
  previousSlugs = {},
}: {
  currentSlugs?: LocalizedPageSlugs
  locales: readonly AppLocale[]
  previousSlugs?: LocalizedPageSlugs
}) {
  const paths = new Set<string>()
  const tags = new Set<string>()
  const previousIsHome = isHomePageSlugs(previousSlugs)
  const currentIsHome = isHomePageSlugs(currentSlugs)

  for (const locale of locales) {
    const previousPath = getPublicPagePath(locale, previousSlugs[locale], previousIsHome)
    const currentPath = getPublicPagePath(locale, currentSlugs[locale], currentIsHome)

    if (previousPath || currentPath) tags.add(`pages-sitemap-${locale}`)
    if (previousPath) paths.add(previousPath)
    if (currentPath) paths.add(currentPath)
  }

  return { paths: [...paths], tags: [...tags] }
}

export function readLocalizedPageSlugs(value: unknown): LocalizedPageSlugs {
  if (typeof value === 'string') return isSafePageSlug(value) ? { en: value } : {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const slugs: LocalizedPageSlugs = {}
  for (const locale of appLocales) {
    const slug = (value as Record<string, unknown>)[locale]
    if (isSafePageSlug(slug)) slugs[locale] = slug
  }
  return slugs
}
