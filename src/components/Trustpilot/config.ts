import { getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * Trustpilot "Micro Star" TrustBox sources, one per language.
 *
 * The template and business unit are shared across every locale; only the
 * data-locale, the widget token and the review-site host differ. The token is
 * issued per locale in the Trustpilot dashboard and cannot be derived, so a new
 * language needs a new entry here rather than a code change.
 *
 * Region locales resolve through their configured parent language the same way
 * the block i18n tables do (ch -> de, be -> nl, uk/uae -> en), so they get the
 * right language until Trustpilot issues dedicated de-CH / nl-BE / en-GB tokens.
 */
export const TRUSTPILOT_TEMPLATE_ID = '5419b732fbfb950b10de65e5'
export const TRUSTPILOT_BUSINESS_UNIT_ID = '6a58deaa3e37cfe6ecc085d5'

export type TrustpilotConfig = {
  dataLocale: string
  token: string
  reviewUrl: string
}

const en: TrustpilotConfig = {
  dataLocale: 'en-US',
  token: '0da86405-cae9-4384-9a34-c5a073442ea6',
  reviewUrl: 'https://www.trustpilot.com/review/nb1.com',
}

const de: TrustpilotConfig = {
  dataLocale: 'de-DE',
  token: '8d2e6197-cebf-404e-9225-44ab21a07146',
  reviewUrl: 'https://de.trustpilot.com/review/nb1.com',
}

const fr: TrustpilotConfig = {
  dataLocale: 'fr-FR',
  token: '40ae544f-e7f4-4c2d-9298-fc2dff2efc3c',
  reviewUrl: 'https://fr.trustpilot.com/review/nb1.com',
}

const nl: TrustpilotConfig = {
  dataLocale: 'nl-NL',
  token: 'd841ccd9-3e88-4fba-86ea-df5c611f901b',
  reviewUrl: 'https://nl.trustpilot.com/review/nb1.com',
}

const BY_LOCALE: Partial<Record<AppLocale, TrustpilotConfig>> = { en, de, fr, nl }

export function getTrustpilotConfig(locale?: string | null): TrustpilotConfig {
  if (!locale || !isAppLocale(locale)) return en
  const direct = BY_LOCALE[locale]
  if (direct) return direct
  const fallback = getFallbackLocale(locale)
  return (fallback && BY_LOCALE[fallback]) || en
}
