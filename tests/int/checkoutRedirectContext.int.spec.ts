import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumeCheckoutRedirectContext,
  persistCheckoutRedirectContext,
  readCheckoutRedirectContext,
} from '@/lib/checkoutRedirectContext'
import { buildNb1Item, resetCheckoutTracking, trackSubscriptionAcquired } from '@/lib/dataLayer'

describe('checkout redirect analytics context', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    window.sessionStorage.clear()
    resetCheckoutTracking()
  })

  it('restores the exact non-default GBP and promo context once after a redirect', () => {
    const item = buildNb1Item('advanced', '12', 129, {
      planTitle: 'Advanced',
      discount: 20,
    })
    const context = {
      checkoutId: 'checkout-gbp-promo',
      planKey: 'advanced',
      planSlug: 'NB1-ADVANCED-12',
      planTitle: 'Advanced',
      billingCycle: '12',
      language: 'en',
      currency: 'GBP',
      value: 129,
      shipping: 12,
      coupon: 'WELCOME20',
      item,
    }

    persistCheckoutRedirectContext(context)

    const restored = readCheckoutRedirectContext()
    expect(restored).toEqual(context)
    expect(readCheckoutRedirectContext()).toEqual(context)
    if (!restored) throw new Error('Expected redirect context')

    const identify = vi.fn((_properties: Record<string, unknown>, callback: () => void) =>
      callback(),
    )
    const track = vi.fn()
    window.klaviyo = { push: vi.fn(), identify, track } as Window['klaviyo']
    trackSubscriptionAcquired({
      ...restored,
      eventId: 'purchase-gbp-promo',
      transactionId: 'subscription-gbp-promo',
      paymentType: 'klarna',
      paymentFlow: 'redirect',
      user: { email: 'buyer@example.com' },
    })

    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'subscription_acquired'),
    ).toMatchObject({
      checkout_id: 'checkout-gbp-promo',
      payment_flow: 'redirect',
      ecommerce: {
        currency: 'GBP',
        value: 129,
        shipping: 12,
        coupon: 'WELCOME20',
        items: [item],
      },
    })
    expect(track).toHaveBeenCalledWith(
      'Checkout Completed',
      expect.objectContaining({
        plan_slug: 'NB1-ADVANCED-12',
        billing_cycle: '12',
        currency: 'GBP',
        cart_value: 129,
        coupon: 'WELCOME20',
        item_id: 'NB1-ADVANCED-12',
      }),
      expect.any(Function),
    )
    expect(consumeCheckoutRedirectContext()).toEqual(context)
    expect(consumeCheckoutRedirectContext()).toBeNull()
  })
})
