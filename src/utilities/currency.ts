/**
 * Shared currency config + helpers for the header currency selector and
 * any server-rendered block that needs to display a live price.
 *
 * The header currency selector (src/Header/Component.client.tsx) is the
 * source of truth for which currencies exist and which are valid per
 * language — kept in sync with DEFAULT_CURRENCIES / DEFAULT_LANG_CURRENCIES
 * there. If you add/remove a currency, update both places.
 */
import { cookies } from 'next/headers'

export const CURRENCY_COOKIE = 'nb1_currency'

export type CurrencyCode = 'EUR' | 'GBP' | 'AED' | 'CHF'

export const CURRENCIES: Array<[CurrencyCode, string, string]> = [
  ['EUR', '€', 'Euro'],
  ['GBP', '£', 'Pound'],
  ['AED', 'AED', 'Dirham'],
  ['CHF', 'CHF', 'Franc'],
]

export const LANG_CURRENCIES: Record<string, CurrencyCode[]> = {
  en: ['EUR', 'GBP', 'AED', 'CHF'],
  de: ['EUR', 'CHF'],
  fr: ['EUR', 'CHF'],
  nl: ['EUR'],
  it: ['EUR'],
  ch: ['CHF'],
  be: ['EUR'],
  uk: ['GBP'],
  uae: ['AED'],
}

// Default currency for each locale path when no cookie is set
const LOCALE_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  en: 'GBP',
  de: 'EUR',
  ch: 'CHF',
  fr: 'EUR',
  nl: 'EUR',
  it: 'EUR',
  be: 'EUR',
  uk: 'GBP',
  uae: 'AED',
}

const DEFAULT_CURRENCY: CurrencyCode = 'EUR'

function isCurrencyCode(value: string): value is CurrencyCode {
  return CURRENCIES.some(([code]) => code === value)
}

/** Validate a currency against the allow-list for a given locale, falling back to the locale's default. */
export function resolveCurrency(value: string | undefined | null, locale: string): CurrencyCode {
  const localDefault = LOCALE_DEFAULT_CURRENCY[locale] ?? DEFAULT_CURRENCY
  const allowed = LANG_CURRENCIES[locale] ?? CURRENCIES.map(([code]) => code)
  if (value && isCurrencyCode(value) && allowed.includes(value)) return value
  return localDefault
}

/**
 * Server-side read of the visitor's selected currency (set via cookie by the
 * header's currency switcher — see applyCur() in Header/Component.client.tsx).
 * Falls back to EUR (or the locale's first allowed currency) when no cookie
 * is present yet, e.g. on a visitor's very first request.
 */
export async function getServerCurrency(locale: string): Promise<CurrencyCode> {
  const store = await cookies()
  const raw = store.get(CURRENCY_COOKIE)?.value
  return resolveCurrency(raw, locale)
}

/**
 * Format an integer amount (the API returns whole-unit integers, e.g. 89, 169 —
 * no decimals for any of the 4 currencies in use today) as a display string.
 * Uses Intl.NumberFormat with maximumFractionDigits/minimumFractionDigits
 * forced to 0 so GBP/CHF/AED render the same whole-number style as the
 * existing EUR copy (e.g. "AED 379", not "AED 379.00").
 */
export function formatPrice(amount: number, currency: CurrencyCode, locale: string): string {
  const intlLocale = locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : 'en-IE'
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    // Fallback if Intl ever rejects an unrecognised currency code.
    return `${currency} ${amount}`
  }
}
