import definitions from './localeConfig.json'

export type AppLocale = keyof typeof definitions

type LocaleDefinition = {
  fallbackLocale?: AppLocale
  hreflangCodes: readonly string[]
  /**
   * The browse segment in lexicon category URLs: `/en/lexicon/topics/...` but
   * `/de/glossar/themen/...`.
   *
   * Config rather than a dictionary string, even though it is a translated word.
   * It is a URL path component — changing it breaks every link to every category
   * page and every sitemap row — so it belongs beside `urlPrefix`, which is
   * stable for the same reason, and not in the file translators churn.
   *
   * Stated explicitly for every locale including the ones with a `fallbackLocale`:
   * a Swiss URL should read `themen` because that is German, not because a
   * fallback happened to reach it.
   */
  lexiconBrowseSegment: string
  htmlLang: string
  label: string
  urlPrefix: `/${string}`
}

export const localeConfig = definitions as Record<AppLocale, LocaleDefinition>

export const appLocales = Object.keys(localeConfig) as AppLocale[]

export const defaultLocale: AppLocale = 'en'

export const payloadLocales = appLocales.map((code) => {
  const definition = localeConfig[code]
  return {
    code,
    label: definition.label,
    ...(definition.fallbackLocale ? { fallbackLocale: definition.fallbackLocale } : {}),
  }
})

export function isAppLocale(value: string): value is AppLocale {
  return Object.hasOwn(localeConfig, value)
}

export function getFallbackLocale(locale: AppLocale): AppLocale | false {
  const definition = localeConfig[locale]
  return definition.fallbackLocale ?? false
}
