import { appLocales, defaultLocale, isAppLocale, localeConfig, type AppLocale } from '@/i18n/config'

export type LocalizedPaths = Partial<Record<AppLocale, string>>

export type HreflangOverrides = {
  enabled?: boolean | null
  excludedLocales?: AppLocale[] | null
  xDefaultLocale?: AppLocale | null
}

/**
 * Report only the explicit reason a cluster must be suppressed. Keeping this
 * check separate from the builder lets the deployed crawl distinguish a valid
 * missing-x-default case from an unexpected metadata regression.
 */
export function isHreflangXDefaultMissing(
  pathsByLocale: LocalizedPaths,
  overrides?: HreflangOverrides | null,
): boolean {
  const defaultTarget =
    overrides?.enabled && overrides.xDefaultLocale ? overrides.xDefaultLocale : defaultLocale
  const excluded = overrides?.enabled
    ? (overrides.excludedLocales ?? []).includes(defaultTarget)
    : false

  return excluded || typeof pathsByLocale[defaultTarget] !== 'string'
}

/**
 * Build a reciprocal hreflang cluster from the locale paths that actually exist.
 * Paths are relative to their locale prefix; an empty path represents a homepage.
 */
export function buildHreflangAlternates({
  pathsByLocale,
  siteURL,
  overrides,
}: {
  pathsByLocale: LocalizedPaths
  siteURL: string
  overrides?: HreflangOverrides | null
}): { languages: Record<string, string> } | undefined {
  const excluded = new Set(overrides?.enabled ? (overrides.excludedLocales ?? []) : [])
  const defaultTarget =
    overrides?.enabled && overrides.xDefaultLocale ? overrides.xDefaultLocale : defaultLocale

  if (typeof pathsByLocale[defaultTarget] !== 'string' || excluded.has(defaultTarget)) {
    return undefined
  }

  const languages: Record<string, string> = {}

  for (const locale of appLocales) {
    if (excluded.has(locale)) continue
    const relativePath = pathsByLocale[locale]
    if (typeof relativePath !== 'string') continue

    const { hreflangCodes, urlPrefix } = localeConfig[locale]
    const suffix = relativePath.replace(/^\/+|\/+$/g, '')
    const url = new URL(suffix ? `${urlPrefix}/${suffix}` : urlPrefix, siteURL).toString()

    for (const code of hreflangCodes) languages[code] = url
  }

  const defaultCode = localeConfig[defaultTarget].hreflangCodes[0]
  languages['x-default'] = languages[defaultCode]

  return { languages }
}

export function readHreflangOverrides(value: unknown): HreflangOverrides | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const input = value as Record<string, unknown>
  const excludedLocales = Array.isArray(input.excludedLocales)
    ? input.excludedLocales.filter(
        (locale): locale is AppLocale => typeof locale === 'string' && isAppLocale(locale),
      )
    : undefined

  return {
    enabled: input.enabled === true,
    excludedLocales,
    xDefaultLocale:
      typeof input.xDefaultLocale === 'string' && isAppLocale(input.xDefaultLocale)
        ? input.xDefaultLocale
        : undefined,
  }
}
