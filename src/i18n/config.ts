import definitions from './localeConfig.json'

export type AppLocale = keyof typeof definitions

type LocaleDefinition = {
  fallbackLocale?: AppLocale
  hreflangCodes: readonly string[]
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
