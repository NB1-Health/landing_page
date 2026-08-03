/**
 * Live-price tokens for any editor copy.
 *
 * Editors write a token inside normal text and it's replaced at render time
 * with the live rate for that (family, month), in the VISITOR's currency:
 *
 *   "Core runs month-to-month at {{price:core:1}}."
 *   "The four-month cycle at {{price:core:4}}/mo …"
 *
 * Tokens also support arithmetic — refs, + - * / and parentheses, plus plain
 * numbers — so editors can compute derived prices inline:
 *
 *   "save up to {{(price:core:4-price:core:12)*12}}/yr on Core"
 *   "{{(price:advanced:4-price:advanced:12)*12}}/yr on Advanced"
 *
 * Token syntax:  {{ <expression with price:<family>:<month> refs> }}
 * (see ./priceExpr.ts for the full grammar)
 *
 * Available tokens (each resolves to the live rate, visitor currency):
 *   {{price:core:1}}       Core — monthly / flexible (1-month) rate
 *   {{price:core:4}}       Core — 4-month cycle rate
 *   {{price:core:12}}      Core — 12-month cycle rate
 *   {{price:advanced:1}}   Advanced — monthly / flexible (1-month) rate
 *   {{price:advanced:4}}   Advanced — 4-month cycle rate
 *   {{price:advanced:12}}  Advanced — 12-month cycle rate
 * (Any other month the API returns for a family also works — the list above is
 *  just what exists today. family is case-insensitive.)
 *
 * Why a token (not a dropdown / structured field): it works in ANY text,
 * textarea, JSON, or rich-text field without per-field wiring or migrations,
 * survives new plans/cycles automatically, and keeps the surrounding copy fully
 * editable + translatable in Payload.
 *
 * Use resolvePriceTokens() for a plain string, or resolvePriceTokensDeep() for
 * a structure (comparison-table `features` JSON, Lexical rich text, etc.) — it
 * replaces tokens in every string leaf. An unresolved token (unknown
 * family/month, API down) collapses to an empty string so visitors never see
 * raw `{{…}}`; a warning is logged server-side.
 */
import { formatPrice, type CurrencyCode } from '@/utilities/currency'
import { getRate, type PlanFamily } from './api'
import { PRICE_REF_RE, PRICE_TOKEN_RE, hasPriceToken, resolveExpr } from './priceExpr'

export { hasPriceToken }

/**
 * Fetch a numeric `family:month → rate` map for every distinct price ref found
 * in `scanText`. A ref that can't be resolved is stored as null so expressions
 * referencing it collapse to an empty string.
 */
async function buildRateMap(
  scanText: string,
  currency: CurrencyCode,
): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>()
  for (const m of scanText.matchAll(PRICE_REF_RE)) {
    const family = m[1].toLowerCase()
    const month = Number(m[2])
    const key = `${family}:${month}`
    if (map.has(key)) continue
    const apiFamily: PlanFamily = family === 'advanced' ? 'Advanced' : 'Core'
    try {
      const rate = await getRate(apiFamily, month, currency)
      map.set(key, rate ?? null)
      if (rate == null) {
        console.warn(`[priceTokens] no rate for ${apiFamily} month=${month}; token dropped`)
      }
    } catch (err) {
      console.error(`[priceTokens] failed to resolve ${apiFamily} month=${month}:`, err)
      map.set(key, null)
    }
  }
  return map
}

function applyTokens(
  text: string,
  map: Map<string, number | null>,
  currency: CurrencyCode,
  locale: string,
): string {
  return text.replace(PRICE_TOKEN_RE, (_full, inner: string) => {
    const val = resolveExpr(inner, (fam, mo) => map.get(`${fam}:${mo}`))
    return val == null ? '' : formatPrice(val, currency, locale)
  })
}

function deepApply<T>(
  value: T,
  map: Map<string, number | null>,
  currency: CurrencyCode,
  locale: string,
): T {
  if (typeof value === 'string') return applyTokens(value, map, currency, locale) as T
  if (Array.isArray(value)) return value.map((v) => deepApply(v, map, currency, locale)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = deepApply(v, map, currency, locale)
    return out as T
  }
  return value
}

/** Replace price tokens in a plain string. Returns the input type unchanged. */
export async function resolvePriceTokens<T extends string | null | undefined>(
  text: T,
  currency: CurrencyCode,
  locale: string,
): Promise<T> {
  if (!text || !hasPriceToken(text)) return text
  const map = await buildRateMap(text, currency)
  return applyTokens(text, map, currency, locale) as T
}

/**
 * Replace price tokens in every string leaf of an arbitrary value — strings,
 * objects, arrays, and Lexical rich-text states alike. Returns a token-free
 * deep copy (or the original when there are no tokens, to avoid needless work).
 */
export async function resolvePriceTokensDeep<T>(
  value: T,
  currency: CurrencyCode,
  locale: string,
): Promise<T> {
  if (value == null) return value
  const scan = typeof value === 'string' ? value : JSON.stringify(value)
  if (!hasPriceToken(scan)) return value
  const map = await buildRateMap(scan, currency)
  return deepApply(value, map, currency, locale)
}
