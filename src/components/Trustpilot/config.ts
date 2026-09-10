import { getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * Trustpilot TrustBox sources, one per language.
 *
 * The business unit is shared across every locale and every template; only the
 * data-locale, the widget token and the review-site host differ. Tokens are
 * issued per template AND per locale in the Trustpilot dashboard and cannot be
 * derived, so a new language or a new template needs a new entry here rather
 * than a code change.
 *
 * Region locales resolve through their configured parent language the same way
 * the block i18n tables do (ch -> de, be -> nl, uk/uae -> en), so they get the
 * right language until Trustpilot issues dedicated de-CH / nl-BE / en-GB tokens.
 *
 * A language can also be issued some templates but not others, so resolution is
 * per variant: a locale missing the requested template falls through to its
 * parent language and then English. The whole source falls back together --
 * data-locale, token and review URL -- because a token only renders under the
 * locale it was issued for.
 */
export const TRUSTPILOT_BUSINESS_UNIT_ID = '6a58deaa3e37cfe6ecc085d5'

/** Which TrustBox template to render. */
export type TrustpilotVariant = 'microStar' | 'microTrustScore'

export const TRUSTPILOT_TEMPLATE_IDS: Record<TrustpilotVariant, string> = {
  /** Star row + score, used in the homepage hero trust strip. */
  microStar: '5419b732fbfb950b10de65e5',
  /** Compact "TrustScore x.x | n reviews" line, used as a final CTA reassurance. */
  microTrustScore: '5419b637fa0340045cd0c936',
}

export const DEFAULT_TRUSTPILOT_VARIANT: TrustpilotVariant = 'microStar'

type LocaleSource = {
  dataLocale: string
  reviewUrl: string
  /**
   * One dashboard-issued token per template. Partial: a template the dashboard
   * has not issued for this language is left out, and resolves through the
   * fallback chain instead of rendering under a token from another locale.
   */
  tokens: Partial<Record<TrustpilotVariant, string>>
}

/** English closes every fallback chain, so it must carry every template. */
type CompleteLocaleSource = LocaleSource & { tokens: Record<TrustpilotVariant, string> }

const en: CompleteLocaleSource = {
  dataLocale: 'en-US',
  reviewUrl: 'https://www.trustpilot.com/review/nb1.com',
  tokens: {
    microStar: '0da86405-cae9-4384-9a34-c5a073442ea6',
    microTrustScore: '08a4d6fc-3b61-42a8-93d3-d8fca4d38822',
  },
}

const de: LocaleSource = {
  dataLocale: 'de-DE',
  reviewUrl: 'https://de.trustpilot.com/review/nb1.com',
  tokens: {
    microStar: '8d2e6197-cebf-404e-9225-44ab21a07146',
    microTrustScore: '213d54f5-1e0d-4983-b040-5dd8cefd9261',
  },
}

const fr: LocaleSource = {
  dataLocale: 'fr-FR',
  reviewUrl: 'https://fr.trustpilot.com/review/nb1.com',
  tokens: {
    microStar: '40ae544f-e7f4-4c2d-9298-fc2dff2efc3c',
    microTrustScore: '9b6ff225-9442-4da2-bd30-6e7071787911',
  },
}

const nl: LocaleSource = {
  dataLocale: 'nl-NL',
  reviewUrl: 'https://nl.trustpilot.com/review/nb1.com',
  tokens: {
    microStar: 'd841ccd9-3e88-4fba-86ea-df5c611f901b',
    microTrustScore: '6cdf4dc5-e62f-49bf-b99c-839d6bb7b9d9',
  },
}

const it: LocaleSource = {
  dataLocale: 'it-IT',
  reviewUrl: 'https://it.trustpilot.com/review/nb1.com',
  tokens: {
    microStar: '30c9ffa2-327c-4a46-8f23-c6cdc41b069e',
    microTrustScore: '5106703c-7fe9-45e4-82d9-fa5917a6c66d',
  },
}

const BY_LOCALE: Partial<Record<AppLocale, LocaleSource>> = { en, de, fr, nl, it }

export type TrustpilotConfig = {
  dataLocale: string
  token: string
  reviewUrl: string
  templateId: string
}

export function getTrustpilotConfig(
  locale?: string | null,
  variant: TrustpilotVariant = DEFAULT_TRUSTPILOT_VARIANT,
): TrustpilotConfig {
  const source = resolveSource(locale, variant)
  return {
    dataLocale: source.dataLocale,
    reviewUrl: source.reviewUrl,
    token: source.tokens[variant] ?? en.tokens[variant],
    templateId: TRUSTPILOT_TEMPLATE_IDS[variant],
  }
}

/** First source in the locale's fallback chain that has a token for `variant`. */
function resolveSource(
  locale: string | null | undefined,
  variant: TrustpilotVariant,
): LocaleSource {
  if (!locale || !isAppLocale(locale)) return en

  const direct = BY_LOCALE[locale]
  if (direct?.tokens[variant]) return direct

  const fallback = getFallbackLocale(locale)
  const parent = fallback ? BY_LOCALE[fallback] : undefined
  if (parent?.tokens[variant]) return parent

  return en
}
