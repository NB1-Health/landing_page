/**
 * Client-safe plan pricing utilities — no server-only imports.
 * Used by client components that fetch /subscriptions/plans in useEffect
 * instead of (or in addition to) the server-side API layer.
 */

import { PRICE_TOKEN_RE, hasPriceToken, resolveExpr } from './priceExpr'

export type CurrencyCode = 'EUR' | 'GBP' | 'AED' | 'CHF'

export interface RawPlanClient {
  title: string
  month: number
  is_preferred: boolean
  prices: Record<string, number>
  /** Keyed by locale (e.g. "en", "de"), then by 1-based index string */
  options?: Record<string, Record<string, string>> | null
}

/**
 * Extract the ordered feature bullet strings for a plan family + locale.
 * Falls back to "en" when the locale has no entries.
 * Options are the same across all months for a given family, so any plan
 * for that family works as the source.
 */
export function extractBullets(
  plans: RawPlanClient[],
  family: 'core' | 'advanced',
  locale: string,
): string[] {
  const apiTitle = family === 'advanced' ? 'Advanced' : 'Core'
  const plan = plans.find((p) => p.title === apiTitle)
  if (!plan?.options) return []
  const localeOpts = plan.options[locale] ?? plan.options['en'] ?? {}
  return Object.keys(localeOpts)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => localeOpts[k])
    .filter(Boolean)
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://apistg.nb1.com'

export async function fetchPlansClient(): Promise<RawPlanClient[]> {
  const r = await fetch(`${BACKEND_URL}/subscriptions/plans?preferred_first=false`)
  if (!r.ok) throw new Error(`plans fetch failed: ${r.status}`)
  return r.json()
}

const LANG_CURRENCIES: Record<string, CurrencyCode[]> = {
  en: ['EUR', 'GBP', 'AED', 'CHF'],
  de: ['EUR', 'CHF'],
  fr: ['EUR', 'CHF'],
  nl: ['EUR'],
  ch: ['CHF'],
  be: ['EUR'],
  uk: ['GBP'],
  uae: ['AED'],
}

const LOCALE_DEFAULT_CURRENCY: Record<string, CurrencyCode> = {
  en: 'GBP', de: 'EUR', fr: 'EUR', nl: 'EUR',
  ch: 'CHF', uk: 'GBP', uae: 'AED', be: 'EUR',
}

export function getClientCurrency(locale: string): CurrencyCode {
  if (typeof document === 'undefined') return LOCALE_DEFAULT_CURRENCY[locale] ?? 'EUR'
  const cookie = document.cookie.match(/nb1_currency=([^;]+)/)?.[1] as CurrencyCode | undefined
  const valid = LANG_CURRENCIES[locale] ?? (['EUR', 'GBP', 'AED', 'CHF'] as CurrencyCode[])
  const result = cookie && valid.includes(cookie) ? cookie : (LOCALE_DEFAULT_CURRENCY[locale] ?? 'EUR')
  console.log('[getClientCurrency]', { locale, cookie, valid, result })
  return result
}

export function formatPrice(amount: number, currency: CurrencyCode, locale: string): string {
  const intlLocale = locale === 'de' ? 'de-DE' : locale === 'fr' ? 'fr-FR' : locale === 'nl' ? 'nl-NL' : 'en-IE'
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}

/** Build a lookup map from "core:1" / "advanced:4" etc. → price number */
export function buildRateMap(
  plans: RawPlanClient[],
  currency: CurrencyCode,
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const p of plans) {
    const fam = p.title === 'Advanced' ? 'advanced' : 'core'
    map[`${fam}:${p.month}`] = p.prices[currency] ?? p.prices.EUR ?? 0
  }
  return map
}

/**
 * Resolve `{{ … }}` price tokens — including arithmetic such as
 * `{{(price:core:4-price:core:12)*12}}/yr` — to formatted prices, using a
 * prebuilt `family:month → rate` map. See priceExpr.ts for the grammar.
 */
function replaceTokens(
  text: string,
  rateMap: Record<string, number>,
  currency: CurrencyCode,
  locale: string,
): string {
  return text.replace(PRICE_TOKEN_RE, (_full, inner: string) => {
    const val = resolveExpr(inner, (fam, mo) => rateMap[`${fam}:${mo}`])
    return val == null ? '' : formatPrice(val, currency, locale)
  })
}

export function resolveTokens(
  text: string | null | undefined,
  rateMap: Record<string, number>,
  currency: CurrencyCode,
  locale: string,
): string | null | undefined {
  if (!hasPriceToken(text)) return text
  return replaceTokens(text as string, rateMap, currency, locale)
}

export function resolveTokensDeep<T>(
  value: T,
  rateMap: Record<string, number>,
  currency: CurrencyCode,
  locale: string,
): T {
  if (value == null) return value
  const scan = typeof value === 'string' ? value : JSON.stringify(value)
  if (!hasPriceToken(scan)) return value
  const resolved = replaceTokens(scan, rateMap, currency, locale)
  return typeof value === 'string' ? (resolved as T) : JSON.parse(resolved)
}

const MONTH_LABELS: Record<string, Record<number, string>> = {
  en: { 1: '1 month', 4: '4 months', 12: '12 months' },
  de: { 1: '1 Monat', 4: '4 Monate', 12: '12 Monate' },
  fr: { 1: '1 mois', 4: '4 mois', 12: '12 mois' },
  nl: { 1: '1 maand', 4: '4 maanden', 12: '12 maanden' },
}

export function formatMonthLabel(month: number, locale: string): string {
  return MONTH_LABELS[locale]?.[month] ?? `${month} months`
}

const SAVINGS_DICT: Record<string, { prefix: string; suffix: string }> = {
  en: { prefix: 'Save', suffix: '/ cycle' },
  de: { prefix: '', suffix: 'pro Zyklus sparen' },
  fr: { prefix: 'Économisez', suffix: '/ cycle' },
  nl: { prefix: 'Bespaar', suffix: '/ cyclus' },
}

export function formatSavingsLabel(
  savings: number,
  currency: CurrencyCode,
  locale: string,
): string | null {
  if (!savings || savings <= 0) return null
  const dict = SAVINGS_DICT[locale] ?? SAVINGS_DICT.en
  const amount = formatPrice(savings, currency, locale)
  return [dict.prefix, amount, dict.suffix].filter(Boolean).join(' ')
}

export const BEST_VALUE_DICT: Record<string, string> = {
  en: 'Best value',
  de: 'Bester Wert',
  fr: 'Meilleur rapport',
  nl: 'Beste waarde',
}

export const PER_MONTH_DICT: Record<string, string> = {
  en: '/mo',
  de: '/Mon.',
  fr: '/mois',
  nl: '/mnd',
}

export function computeSavings(rate: number, baselineRate: number, month: number): number {
  return Math.round((baselineRate - rate) * month)
}
