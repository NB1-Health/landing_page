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

/**
 * The cast above is a promise, not a check — a JSON import cannot satisfy
 * `urlPrefix: `/${string}`` structurally, so the whole object is asserted and
 * TypeScript stops looking. That means a locale added WITHOUT
 * `lexiconBrowseSegment` compiles, and then `browseSegmentFor()` returns
 * `undefined` and every category URL in that language reads
 * `/it/lessico/undefined/probiotici`.
 *
 * It broke exactly that way when Italian was added: the config landed with
 * hreflang, label and prefix, and nothing anywhere said the browse segment was
 * missing. A URL that 404s in one language only is found by a crawler weeks
 * later, if at all.
 *
 * So it is checked here instead, at import. Every entry point — `next build`,
 * every test, `payload migrate` — loads this module, so a missing segment is a
 * loud failure on the first command anyone runs rather than a silent one in
 * production.
 */
for (const [code, definition] of Object.entries(localeConfig)) {
  if (!definition.lexiconBrowseSegment?.trim()) {
    throw new Error(
      `localeConfig.json: locale "${code}" has no lexiconBrowseSegment. ` +
        'It is a URL path component (`/en/lexicon/topics/...`, ' +
        '`/de/glossar/themen/...`) and every locale needs its own word, ' +
        'including locales that declare a fallbackLocale.',
    )
  }
}

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
