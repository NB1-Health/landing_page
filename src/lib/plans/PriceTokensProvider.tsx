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
} | null>(null)

export function PriceTokensProvider({
  locale,
  initialPrices,
  enabled,
  children,
}: {
  locale: string
  enabled: boolean
  initialPrices: RawPlanClient[]
  children: ReactNode
}) {
  const [currency, setCurrency] = useState(() => getDefaultCurrency(locale))
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
    }),
    [locale, currency, prices],
  )

  return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
}

/** Resolve from the original CMS data on every currency change, including rich text. */
export function usePriceTokens<T>(raw: T): T {
  const context = useContext(PriceContext)
  return useMemo(
    () => (context ? resolveTokensDeep(raw, context.rates, context.currency, context.locale) : raw),
    [raw, context],
  )
}
