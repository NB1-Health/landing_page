import {
  buildNb1Item,
  getOrCreateCheckoutId,
  mintEventId,
  pushEventAndNavigate,
} from '@/lib/dataLayer'

export type PlanSelectionNavigation = {
  href: string
  planKey: string
  rate: number
  currency: string
  planTitle: string
}

export function resolvePlanSelectionRate(
  rateMap: Record<string, number>,
  planKey: string,
  href: string,
  baseUrl: string,
): { cycle: string; rate: number } {
  const cycle = new URL(href, baseUrl).searchParams.get('cycle') ?? '4'
  return {
    cycle,
    rate: rateMap[`${planKey}:${cycle}`] ?? rateMap[planKey] ?? 0,
  }
}

/**
 * One definition for every plan CTA keeps item identity, checkout identity,
 * and the navigation callback contract aligned as more surfaces are added.
 */
export function trackPlanSelectionAndNavigate(input: PlanSelectionNavigation): void {
  const cycle =
    new URL(input.href, window.location.href).searchParams.get('cycle') ?? '4'
  pushEventAndNavigate(
    'plan_selected',
    {
      event_id: mintEventId(),
      checkout_id: getOrCreateCheckoutId(),
      ecommerce: {
        currency: input.currency,
        value: input.rate,
        items: [
          buildNb1Item(input.planKey, cycle, input.rate, {
            planTitle: input.planTitle,
          }),
        ],
      },
    },
    () => window.location.assign(input.href),
  )
}
