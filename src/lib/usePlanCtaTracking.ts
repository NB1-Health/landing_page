'use client'

import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

import { isUnmodifiedPrimaryNavigation } from '@/lib/interactionTracking'
import { resolvePlanSelectionRate, trackPlanSelectionAndNavigate } from '@/lib/planTracking'
import {
  buildRateMap,
  fetchPlansClient,
  getClientCurrency,
  type CurrencyCode,
  type RawPlanClient,
} from '@/lib/plans/clientUtils'

type PlanKey = 'core' | 'advanced'

let plansRequest: Promise<RawPlanClient[]> | undefined

function loadPlans(): Promise<RawPlanClient[]> {
  plansRequest ??= fetchPlansClient().catch((error) => {
    plansRequest = undefined
    throw error
  })
  return plansRequest
}

export function resolvePlanKeyFromHref(href: string, baseUrl: string): PlanKey | null {
  try {
    const url = new URL(href, baseUrl)
    const queryPlan = url.searchParams.get('plan')?.toLowerCase()
    if (queryPlan === 'core' || queryPlan === 'advanced') return queryPlan

    const pathPlan = url.pathname
      .toLowerCase()
      .match(/(?:^|[\/_-])(core|advanced)(?=$|[\/_-])/)?.[1]
    return pathPlan === 'core' || pathPlan === 'advanced' ? pathPlan : null
  } catch {
    return null
  }
}

/** Add canonical plan tracking to an existing link without changing its markup. */
export function usePlanCtaTracking(locale = 'en') {
  const rateMapRef = useRef<Record<string, number>>({})
  const currencyRef = useRef<CurrencyCode>('EUR')
  const planTitlesRef = useRef<Record<PlanKey, string>>({
    core: 'Core',
    advanced: 'Advanced',
  })

  useEffect(() => {
    let active = true

    const applyPlans = async (currency: CurrencyCode) => {
      try {
        const plans = await loadPlans()
        if (!active) return
        rateMapRef.current = buildRateMap(plans, currency)
        currencyRef.current = currency
        for (const plan of plans) {
          const key = plan.title.toLowerCase()
          if (key === 'core' || key === 'advanced') planTitlesRef.current[key] = plan.title
        }
      } catch {
        // Preserve the anchor's normal navigation when pricing cannot be loaded.
      }
    }

    void applyPlans(getClientCurrency(locale))
    const onCurrencyChange = (event: Event) => {
      void applyPlans((event as CustomEvent<CurrencyCode>).detail)
    }
    window.addEventListener('nb1:currencychange', onCurrencyChange)
    return () => {
      active = false
      window.removeEventListener('nb1:currencychange', onCurrencyChange)
    }
  }, [locale])

  return (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isUnmodifiedPrimaryNavigation(event)) return

    const planKey = resolvePlanKeyFromHref(href, window.location.href)
    if (!planKey) return

    const { rate } = resolvePlanSelectionRate(
      rateMapRef.current,
      planKey,
      href,
      window.location.href,
    )
    if (rate <= 0) return

    event.preventDefault()
    trackPlanSelectionAndNavigate({
      href,
      planKey,
      rate,
      currency: currencyRef.current,
      planTitle: planTitlesRef.current[planKey],
    })
  }
}
