'use client'

/**
 * Resolve PLAIN AMOUNT tokens — `{{149}}`, `{{0}}`, `{{floor(99/2)}}` — across a
 * block's whole props tree, in the visitor's own currency.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT IN usePriceTokens.
 *
 * `RenderBlocks.client.tsx` already runs `usePriceTokens(rawBlocks)` over every
 * block's props, but that resolves only REFS — `{{price:core:4}}` and
 * `{{fee:kit}}` — because `hasToken()` tests for `price:` or `fee:` and
 * `replaceTokens()` walks `TOKEN_RE`. A plain amount matches neither and passes
 * through to the page literally, which is exactly what `{{463}}` did.
 *
 * The repo has the resolver for it — `resolveCurrencyTokens` in
 * lib/plans/clientUtils — and one caller, CycleSelector, which applies it
 * per-field inside the component. So the pattern is established: a block that
 * wants amount tokens resolves them itself.
 *
 * Teaching `usePriceTokens` to do it would be one line and would serve every
 * block, and it is deliberately NOT done here: that function runs for every
 * block on the site, including the ones the redesign has not touched, and the
 * standing rule is that current versions are not put at risk to make a new one
 * easier. If the plain-amount grammar is ever wanted site-wide, that is the
 * place — as its own decision, not as a side effect of this.
 *
 * The mockups are drawn in pounds, which is why the redesign needs this at all:
 * every amount the capture read off them is a GBP amount, and the seeds carry
 * `{{N}}` so the number stays what the design drew and only the symbol moves.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  getClientCurrency,
  getDefaultCurrency,
  resolveCurrencyTokens,
} from '@/lib/plans/clientUtils'
import { useTokenCurrency } from '@/lib/plans/PriceTokensProvider'

/** `{{ … }}` whose body is numeric — the same shape AMOUNT_TOKEN_RE matches. */
const HAS_AMOUNT = /\{\{\s*(?:floor|ceil|round|[\d+\-*/().\s])+?\s*\}\}/i

function walk<T>(value: T, currency: ReturnType<typeof getDefaultCurrency>, locale: string): T {
  if (typeof value === 'string') {
    return (HAS_AMOUNT.test(value)
      ? resolveCurrencyTokens(value, currency, locale)
      : value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((v) => walk(v, currency, locale)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walk(v, currency, locale)
    }
    return out as unknown as T
  }
  return value
}

/**
 * Resolve on the client, and re-resolve when the visitor switches currency.
 *
 * The FIRST render must match the server's, or React throws a hydration error —
 * `getClientCurrency` reads a cookie the server did not write. So the first
 * pass runs with the locale's default and the effect swaps in the real one,
 * exactly as PriceTokensProvider does for price refs.
 */
export function useAmountTokens<T>(props: T, locale?: string | null): T {
  const loc = locale || 'en'

  // THE PROVIDER IS THE SOURCE OF TRUTH WHEN THERE IS ONE.
  //
  // PriceTokensProvider is seeded on the server from the `nb1_currency`
  // cookie, so its value is already the visitor's own currency in the HTML.
  // Reading it here is what stops this hook rendering the locale default
  // first — `/en` defaults to GBP — and correcting itself after hydration,
  // which is what made a Berlin visitor watch £99 become €99.
  const provided = useTokenCurrency()

  // The fallback path, for a block mounted outside the provider. It keeps the
  // old behaviour exactly: locale default on the server and the first client
  // render (so hydration still matches), then the cookie.
  const [own, setOwn] = useState(() => getDefaultCurrency(loc))

  useEffect(() => {
    if (provided) return
    const sync = () => setOwn(getClientCurrency(loc))
    sync()
    window.addEventListener('nb1:currencychange', sync)
    return () => window.removeEventListener('nb1:currencychange', sync)
  }, [loc, provided])

  const currency = provided ?? own

  return useMemo(() => walk(props, currency, loc), [props, currency, loc])
}
