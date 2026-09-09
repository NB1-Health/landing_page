/**
 * Client-safe plan pricing utilities — no server-only imports.
 * Used by client components that fetch /subscriptions/plans in useEffect
 * instead of (or in addition to) the server-side API layer.
 */

import { resolveCurrency } from '@/utilities/currency'
import { getDictionary } from '@/i18n/getDictionary'
import { AMOUNT_TOKEN_RE, TOKEN_RE, evalArithmetic, hasToken, resolveExpr } from './priceExpr'
import { getFee } from './fees'

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

let plansRequest: Promise<RawPlanClient[]> | undefined
let plansExpireAt = 0

/** Share one short-lived request across the page's price components. Failures can retry. */
export function fetchPlansClient(): Promise<RawPlanClient[]> {
  if (!plansRequest || Date.now() >= plansExpireAt) {
    plansExpireAt = Infinity
    plansRequest = fetch(`${BACKEND_URL}/subscriptions/plans?preferred_first=false`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`plans fetch failed: ${response.status}`)
        const plans = await response.json() as RawPlanClient[]
        plansExpireAt = Date.now() + 60_000
        return plans
      })
      .catch((error) => {
        plansRequest = undefined
        plansExpireAt = 0
        throw error
      })
  }
  return plansRequest
}

/** Locale-only seed shared by the server and the first browser render. */
export function getDefaultCurrency(locale: string): CurrencyCode {
  return resolveCurrency(undefined, locale)
}

export function getClientCurrency(locale: string): CurrencyCode {
  const raw = typeof document === 'undefined'
    ? undefined
    : document.cookie.match(/(?:^|;\s*)nb1_currency=([^;]*)/)?.[1]
  return resolveCurrency(raw, locale)
}

export function formatPrice(amount: number, currency: CurrencyCode, locale: string): string {
  const intlLocale = locale === 'de' ? 'de-DE' : locale === 'fr' ? 'fr-FR' : locale === 'nl' ? 'nl-NL' : locale === 'it' ? 'it-IT' : 'en-IE'
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
  return text.replace(TOKEN_RE, (_full, inner: string) => {
    const val = resolveExpr(
      inner,
      (fam, mo) => rateMap[`${fam}:${mo}`],
      (name) => getFee(name, currency),
    )
    return val == null ? '' : formatPrice(val, currency, locale)
  })
}

export function resolveTokens(
  text: string | null | undefined,
  rateMap: Record<string, number>,
  currency: CurrencyCode,
  locale: string,
): string | null | undefined {
  if (!hasToken(text)) return text
  return replaceTokens(text as string, rateMap, currency, locale)
}

/**
 * Resolve plain-number amount tokens — `{{0}}`, `{{49}}`, `{{floor(99/2)}}` —
 * to prices formatted in the selected currency (€0 / £0 / 0 CHF …). Price-ref
 * tokens (`{{price:core:4}}`) and any non-numeric brace text are left untouched,
 * so this is safe to run over free-form copy. Returns '' for null/undefined.
 */
export function resolveCurrencyTokens(
  text: string | null | undefined,
  currency: CurrencyCode,
  locale: string,
): string {
  if (text == null) return ''
  return text.replace(AMOUNT_TOKEN_RE, (full, inner: string) => {
    const val = evalArithmetic(inner)
    return val == null ? full : formatPrice(val, currency, locale)
  })
}

export function resolveTokensDeep<T>(
  value: T,
  rateMap: Record<string, number>,
  currency: CurrencyCode,
  locale: string,
): T {
  if (value == null) return value
  const scan = typeof value === 'string' ? value : JSON.stringify(value)
  if (!hasToken(scan)) return value
  const resolved = replaceTokens(scan, rateMap, currency, locale)
  return typeof value === 'string' ? (resolved as T) : JSON.parse(resolved)
}

// These all delegate to getDictionary, which collapses regional locales onto
// their base language (uk/uae→en, ch→de, be→nl). Keying a local lookup table
// by the raw locale instead silently missed those and fell back to English
// templates like `1 months` on /uk and /uae.
export function formatMonthLabel(month: number, locale: string): string {
  const dict = getDictionary(locale)
  return dict.plans.months[month as 1 | 4 | 12] ?? `${month} months`
}

export function formatSavingsLabel(
  savings: number,
  currency: CurrencyCode,
  locale: string,
): string | null {
  if (!savings || savings <= 0) return null
  const dict = getDictionary(locale)
  const amount = formatPrice(savings, currency, locale)
  return [dict.plans.savingsPrefix, amount, dict.plans.savingsSuffix].filter(Boolean).join(' ')
}

export function getBestValueLabel(locale: string): string {
  return getDictionary(locale).plans.bestValue
}

export function computeSavings(rate: number, baselineRate: number, month: number): number {
  return Math.round((baselineRate - rate) * month)
}
