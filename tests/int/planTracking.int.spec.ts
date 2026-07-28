import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearCheckoutId } from '@/lib/dataLayer'
import {
  resolvePlanSelectionRate,
  trackPlanSelectionAndNavigate,
} from '@/lib/planTracking'

describe('shared plan selection tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.dataLayer = []
    window.sessionStorage.clear()
    clearCheckoutId()
    window.history.replaceState({}, '', '/plans')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives the selected cycle and emits the canonical item contract', () => {
    trackPlanSelectionAndNavigate({
      href: '/checkout?plan=advanced&cycle=8',
      planKey: 'advanced',
      rate: 141,
      currency: 'EUR',
      planTitle: 'Advanced',
    })

    expect(window.dataLayer[1]).toMatchObject({
      event: 'plan_selected',
      canonical_event: 'plan_selected',
      event_key: '120_plan_selected',
      ecommerce: {
        currency: 'EUR',
        value: 141,
        items: [
          {
            item_id: 'NB1-ADVANCED-8',
            item_name: 'NB1 Advanced Plan',
            item_variant: '8-Month Subscription',
            price: 141,
          },
        ],
      },
    })
    vi.clearAllTimers()
  })

  it('resolves a plan rate from the plan-and-cycle rate map used by the live selector', () => {
    expect(
      resolvePlanSelectionRate(
        { 'core:1': 109, 'core:4': 99, 'core:8': 94 },
        'core',
        '/order-cycle-core',
        'http://localhost:3000/en/order-cold',
      ),
    ).toEqual({ cycle: '4', rate: 99 })
  })
})
