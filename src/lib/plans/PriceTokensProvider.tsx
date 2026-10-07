'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  buildRateMap,
  fetchPlansClient,
  getClientCurrency,
  getDefaultCurrency,
  resolveTokensDeep,
  type RawPlanClient,
} from './clientUtils'

const PriceContext = createContext<{
  locale: string
  currency: ReturnType<typeof getDefaultCurrency>
  rates: Record<string, number>
  plans: RawPlanClient[]
} | null>(null)

export function PriceTokensProvider({
  locale,
  initialPrices,
  enabled,
  initialCurrency,
  children,
}: {
  locale: string
  enabled: boolean
  initialPrices: RawPlanClient[]
  /**
   * The visitor's currency, resolved ON THE SERVER from the `nb1_currency`
   * cookie. Optional so a caller that cannot read cookies still works.
   *
   * WHY THIS EXISTS. `getDefaultCurrency` returns the LOCALE's default, and
   * `/en` defaults to GBP. The server has no `document`, so every price in the
   * HTML was rendered in pounds for every visitor; the browser then hydrated,
   * read the cookie, and re-rendered. A visitor in Berlin watched £99 become
   * €99. Measured 2026-10-07: a credentialed request for /en/order carrying
   * `nb1_currency=EUR` came back with six pound figures and no euros.
   *
   * The cookie is sent with the request and is not httpOnly, so the server can
   * resolve it with the same pure `resolveCurrency` the client uses. Seeded
   * here, the first client render agrees with the server and there is nothing
   * to flip — and the HTML is right for crawlers and for JS-off.
   */
  initialCurrency?: ReturnType<typeof getDefaultCurrency>
  children: ReactNode
}) {
  const [currency, setCurrency] = useState(() => initialCurrency ?? getDefaultCurrency(locale))
  const [prices, setPrices] = useState(initialPrices)

  useEffect(() => {
    const syncCurrency = () => setCurrency(getClientCurrency(locale))
    syncCurrency()
    window.addEventListener('nb1:currencychange', syncCurrency)
    return () => window.removeEventListener('nb1:currencychange', syncCurrency)
  }, [locale])

  useEffect(() => {
    let active = true
    setPrices(initialPrices)
    if (!enabled) return
    fetchPlansClient()
      .then((next) => {
        if (active) setPrices(next)
      })
      .catch(() => {
        /* Keep the public snapshot if the pricing API is unavailable. */
      })
    return () => {
      active = false
    }
  }, [initialPrices, enabled])

  const value = useMemo(
    () => ({
      locale,
      currency,
      rates: buildRateMap(prices, currency),
      plans: prices,
    }),
    [locale, currency, prices],
  )

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
}

/**
 * The currency this subtree is resolving in, or null outside a provider.
 *
 * `useAmountTokens` reads this rather than calling `getClientCurrency` itself:
 * the provider's value is correct on the server as well, so a block that uses
 * it renders the right symbol in the HTML instead of correcting itself after
 * hydration.
 */
export function useTokenCurrency(): ReturnType<typeof getDefaultCurrency> | null {
  return useContext(PriceContext)?.currency ?? null
}

/** Resolve from the original CMS data on every currency change, including rich text. */
export function usePriceTokens<T>(raw: T): T {
  const context = useContext(PriceContext)
  return useMemo(
    () => (context ? resolveTokensDeep(raw, context.rates, context.currency, context.locale) : raw),
    [raw, context],
  )
}

/**
 * Plans known at render time: the server snapshot on the server and the first browser
 * render (identical, so seeding state from it cannot cause a hydration mismatch), then
 * the live list once the provider's fetch lands. Empty when the page loaded no snapshot
 * or the API was down — callers must still handle that.
 */
export function usePlansSnapshot(): RawPlanClient[] {
  return useContext(PriceContext)?.plans ?? EMPTY_PLANS
}

const EMPTY_PLANS: RawPlanClient[] = []
