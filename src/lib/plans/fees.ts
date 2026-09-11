/**
 * Fixed fees that are NOT sold through the subscriptions API.
 *
 * Plan prices come from /subscriptions/plans per currency; these do not — they
 * are one-off charges whose amount is a business decision per currency, so they
 * live here as a hardcoded table and are surfaced to editors through the same
 * `{{ … }}` token grammar as live prices:
 *
 *   "a one-time {{fee:kit}} kit fee applies"
 *
 * The token resolves to the amount for the VISITOR's selected currency and is
 * re-resolved in the browser whenever they switch currency, exactly like
 * `{{price:core:4}}`. See ./priceExpr.ts for the grammar, and priceTokens.ts
 * (server) / clientUtils.ts (client) for the resolvers.
 *
 * Amounts are per-currency figures, NOT live FX conversions — they follow the
 * same convention as the plan prices returned by the API, where EUR, GBP and
 * CHF carry the same number and only AED is scaled:
 *
 *   Core   1 / 4 / 12 mo   EUR 99 / 94 / 89   GBP 99 / 94 / 89
 *                          CHF 99 / 94 / 89   AED 419 / 399 / 379
 *
 * A currency missing from a table resolves to null, which collapses the token
 * to an empty string rather than formatting one currency's number under
 * another's symbol (i.e. it never renders "£49" from a 49 that means euros).
 *
 * No imports: this module is pulled into both server and client bundles.
 */

/** Mirrors CurrencyCode in src/utilities/currency.ts (kept local: no imports). */
type Currency = 'EUR' | 'GBP' | 'AED' | 'CHF'

export type FeeName = 'kit'

export const FEES: Record<FeeName, Record<Currency, number>> = {
  /**
   * One-off kit fee, charged only when a sample is not returned in time.
   * EUR 49 is the figure already written into the legal/FAQ copy.
   * GBP/CHF mirror EUR per the pricing convention above. AED is EUR × ~4.23
   * (the ratio the plan prices use: 89→379, 94→399, 99→419), rounded to the
   * house "ends in 9" price point.
   */
  kit: { EUR: 49, GBP: 42, CHF: 47, AED: 210 },
}

/**
 * Amount for `fee:<name>` in the given currency, or null when the fee or the
 * currency is unknown — callers collapse a null to an empty string.
 */
export function getFee(name: string, currency: string): number | null {
  const table = FEES[name.toLowerCase() as FeeName]
  if (!table) return null
  return table[currency as Currency] ?? null
}
