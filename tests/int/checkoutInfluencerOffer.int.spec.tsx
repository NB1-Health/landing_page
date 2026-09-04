import { CheckoutFormClient } from '@/blocks/checkoutBlocks/CheckoutForm/Component.client'
import { clearCheckoutId, resetCheckoutTracking } from '@/lib/dataLayer'
import { storeInfluencerOffer } from '@/lib/influencerOffer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
const checkoutApi = vi.hoisted(() => ({
  checkoutConfirm: vi.fn(),
  checkoutPaymentIntent: vi.fn(),
  checkoutPreview: vi.fn(),
  trackLanguagePublic: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))
vi.mock('next/link', () => ({ default: () => null }))
vi.mock('@stripe/stripe-js', () => ({ loadStripe: () => Promise.resolve(null) }))
vi.mock('@stripe/react-stripe-js', () => ({
  CardElement: () => null,
  Elements: ({ children }: { children: React.ReactNode }) => children,
  ExpressCheckoutElement: () => null,
  useElements: () => null,
  useStripe: () => null,
}))
vi.mock('react-phone-number-input', () => ({
  default: () => null,
  isValidPhoneNumber: () => true,
}))
vi.mock('@/blocks/checkoutBlocks/CheckoutForm/AddressAutocomplete', () => ({
  default: () => null,
}))
vi.mock('@/lib/createAccount', () => ({ createFirebaseAccount: vi.fn() }))
vi.mock('@/lib/checkoutApi', () => checkoutApi)
vi.mock('@/lib/meta/browser', () => ({
  getMetaSidecar: () => ({}),
  sendMetaCapiEvent: vi.fn(),
}))
vi.mock('@/lib/plans/clientUtils', () => ({ getClientCurrency: () => 'EUR' }))
vi.mock('@/lib/klarnaMarkets', () => ({ isKlarnaAvailable: () => false }))

function memoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, String(value)),
  }
}

function validPreview(overrides: Record<string, unknown> = {}) {
  return {
    plan_id: 'core-4',
    plan_slug: 'NB1-CORE-4',
    title: 'Core',
    month: 4,
    currency: 'EUR',
    monthly_price: 99,
    shipping_option: 'standard',
    shipping_price: 0,
    promo_discount: 19.8,
    first_month_price: 79.2,
    due_today: 0,
    discount_code: '20OFF',
    discount_code_valid: true,
    discount_message: 'Discount code is valid',
    discount_message_custom: null,
    exclude_one_month: false,
    ...overrides,
  }
}

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
}

describe('checkout influencer offer', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    Object.defineProperties(window, {
      localStorage: { configurable: true, value: memoryStorage() },
      sessionStorage: { configurable: true, value: memoryStorage() },
    })
    window.history.replaceState(null, '', '/en/order')
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: false }
    window.__nb1ConsentResolved = true
    window.sessionStorage.setItem('nb1_checkout_plan', JSON.stringify({ plan: 'core', cycle: '4' }))
    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-example' })
    clearCheckoutId()
    resetCheckoutTracking()
    checkoutApi.checkoutPreview.mockReset()
    navigation.replace.mockReset()

    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL | Request) => {
        const body = String(input).includes('/subscriptions/plans')
          ? [{ id: 'core-4', title: 'Core', month: 4, prices: { EUR: 99 } }]
          : { shipping_price: 9 }
        return Promise.resolve({ ok: true, json: async () => body })
      }),
    )

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('gates checkout, applies 20OFF once, and starts analytics with the offer', async () => {
    let resolvePreview!: (value: Record<string, unknown>) => void
    checkoutApi.checkoutPreview.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePreview = resolve
      }),
    )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(true)
    expect(window.dataLayer.some((entry) => entry.canonical_event === 'begin_checkout')).toBe(false)

    await act(async () => {
      resolvePreview(validPreview())
      await flushEffects()
    })

    expect(checkoutApi.checkoutPreview).toHaveBeenCalledTimes(1)
    expect(checkoutApi.checkoutPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_slug: 'NB1-CORE-4',
        discount_code: '20OFF',
        currency: 'EUR',
        shipping_option: 'standard',
      }),
      expect.any(AbortSignal),
    )
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    expect(container.textContent).toContain('Creator offer applied')
    expect(container.textContent).not.toContain('20OFF')

    const voucherEvent = window.dataLayer.find((entry) => entry.event === 'add_voucher')
    const beginCheckout = window.dataLayer.find(
      (entry) => entry.canonical_event === 'begin_checkout',
    )
    expect(voucherEvent).toMatchObject({
      voucher_source: 'influencer',
      influencer_slug: 'creator-example',
      ecommerce: { coupon: '20OFF' },
    })
    expect(beginCheckout).toMatchObject({
      offer_source: 'influencer',
      influencer_slug: 'creator-example',
      ecommerce: { coupon: '20OFF' },
    })
    expect(window.dataLayer.indexOf(voucherEvent!)).toBeLessThan(
      window.dataLayer.indexOf(beginCheckout!),
    )
  })

  it('leaves direct checkout unchanged when no creator offer is stored', async () => {
    window.sessionStorage.removeItem('nb1_influencer_offer')

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(checkoutApi.checkoutPreview).not.toHaveBeenCalled()
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'begin_checkout'),
    ).not.toHaveProperty('ecommerce.coupon')
  })

  it('does not re-preview a creator offer while confirming a provider return', async () => {
    window.history.replaceState(
      null,
      '',
      '/en/order?redirect_status=succeeded&setup_intent=seti_returning',
    )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(checkoutApi.checkoutPreview).not.toHaveBeenCalled()
    expect(window.sessionStorage.getItem('nb1_influencer_offer')).not.toBeNull()
    expect(window.dataLayer.some((entry) => entry.canonical_event === 'begin_checkout')).toBe(false)
  })

  it('fails an invalid creator offer open without sending it to payment', async () => {
    checkoutApi.checkoutPreview.mockResolvedValueOnce(
      validPreview({
        promo_discount: 0,
        first_month_price: 99,
        discount_code_valid: false,
        discount_message: 'Discount code not found',
      }),
    )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    expect(container.textContent).not.toContain('Creator offer applied')
    expect(container.querySelector('.nb1-creator-offer-alert')?.textContent).toContain(
      'Discount code not found.',
    )
    expect(window.dataLayer.find((entry) => entry.event === 'add_voucher_error')).toMatchObject({
      voucher_source: 'influencer',
      influencer_slug: 'creator-example',
      ecommerce: { coupon: '20OFF' },
    })
    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'begin_checkout'),
    ).not.toHaveProperty('ecommerce.coupon')
  })

  it('keeps a valid creator offer when a manual replacement is invalid', async () => {
    checkoutApi.checkoutPreview
      .mockResolvedValueOnce(validPreview())
      .mockResolvedValueOnce(
        validPreview({
          promo_discount: 0,
          first_month_price: 99,
          discount_code: 'TYPO',
          discount_code_valid: false,
          discount_message: 'Discount code not found',
        }),
      )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    const toggle = container.querySelector<HTMLButtonElement>('.nb1-sum-promo-toggle')
    await act(async () => {
      toggle?.click()
      await flushEffects()
    })
    const input = container.querySelector<HTMLInputElement>('.nb1-sum .nb1-promo-input')
    if (!input) throw new Error('Promo input missing')
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setValue?.call(input, 'TYPO')
    await act(async () => {
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushEffects()
    })

    const apply = container.querySelector<HTMLButtonElement>('.nb1-sum .nb1-promo-apply')
    await act(async () => {
      apply?.click()
      await flushEffects()
    })

    expect(checkoutApi.checkoutPreview).toHaveBeenCalledTimes(2)
    expect(checkoutApi.checkoutPreview.mock.calls[1][0]).toMatchObject({ discount_code: 'TYPO' })
    expect(toggle?.textContent).toContain('Creator offer applied')
    expect(window.sessionStorage.getItem('nb1_influencer_offer')).not.toBeNull()
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
  })

  it('replaces a stale creator warning with feedback from a manual attempt', async () => {
    checkoutApi.checkoutPreview
      .mockResolvedValueOnce(
        validPreview({
          promo_discount: 0,
          first_month_price: 99,
          discount_code_valid: false,
          discount_message: 'Discount code not found',
        }),
      )
      .mockResolvedValueOnce(
        validPreview({
          promo_discount: 0,
          first_month_price: 99,
          discount_code: 'EXPIRED',
          discount_code_valid: false,
          discount_message: 'Discount code has expired',
        }),
      )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })
    expect(container.querySelector('.nb1-creator-offer-alert')).not.toBeNull()

    await act(async () => {
      container.querySelector<HTMLButtonElement>('.nb1-sum-promo-toggle')?.click()
      await flushEffects()
    })
    const input = container.querySelector<HTMLInputElement>('.nb1-sum .nb1-promo-input')
    if (!input) throw new Error('Promo input missing')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
      input,
      'EXPIRED',
    )
    await act(async () => {
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await flushEffects()
      container.querySelector<HTMLButtonElement>('.nb1-sum .nb1-promo-apply')?.click()
      await flushEffects()
    })

    expect(container.querySelector('.nb1-creator-offer-alert')).toBeNull()
    expect(container.querySelector('.nb1-sum .nb1-promo-msg.err')?.textContent).toContain(
      "That code isn't valid.",
    )
  })

  it('fails a timed-out creator preview open and visibly warns the customer', async () => {
    checkoutApi.checkoutPreview.mockRejectedValueOnce(
      Object.assign(new Error('The discount preview timed out'), { name: 'TimeoutError' }),
    )

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    expect(container.querySelector('.nb1-creator-offer-alert')?.textContent).toContain(
      "That code isn't valid.",
    )
    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'begin_checkout'),
    ).not.toHaveProperty('ecommerce.coupon')
  })

  it('keeps checkout gated while retrying an offer on an eligible plan', async () => {
    window.sessionStorage.setItem(
      'nb1_checkout_plan',
      JSON.stringify({ plan: 'core', cycle: 'monthly' }),
    )

    let resolveRetry!: (value: Record<string, unknown>) => void
    checkoutApi.checkoutPreview
      .mockResolvedValueOnce(
        validPreview({
          plan_id: 'core-1',
          plan_slug: 'NB1-CORE-1',
          month: 1,
          monthly_price: 109,
          promo_discount: 0,
          first_month_price: 109,
          discount_code_valid: false,
          discount_message: 'Discount code is not valid for one-month plans',
          exclude_one_month: true,
        }),
      )
      .mockImplementationOnce(() => {
        expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(true)
        return new Promise((resolve) => {
          resolveRetry = resolve
        })
      })

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    const switchButton = container.querySelector<HTMLButtonElement>('.nb1-promo-switch-btn')
    if (!switchButton) throw new Error('Eligible-plan switch missing')

    await act(async () => {
      switchButton.click()
      await flushEffects()
    })

    expect(checkoutApi.checkoutPreview).toHaveBeenCalledTimes(2)
    expect(checkoutApi.checkoutPreview.mock.calls[1][0]).toMatchObject({
      plan_slug: 'NB1-CORE-4',
      discount_code: '20OFF',
    })
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(true)

    await act(async () => {
      resolveRetry(validPreview())
      await flushEffects()
    })

    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)
    expect(container.textContent).toContain('Creator offer applied')
  })

  it('blocks payment and aborts a stale preview when currency changes', async () => {
    let resolveStale!: (value: Record<string, unknown>) => void
    checkoutApi.checkoutPreview
      .mockResolvedValueOnce(validPreview())
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStale = resolve
        }),
      )
      .mockResolvedValueOnce(validPreview({ currency: 'CHF' }))

    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
    })

    await act(async () => {
      window.dispatchEvent(new CustomEvent('nb1:currencychange', { detail: 'GBP' }))
      await flushEffects()
    })
    const staleSignal = checkoutApi.checkoutPreview.mock.calls[1][1] as AbortSignal
    expect(staleSignal.aborted).toBe(false)
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(true)

    await act(async () => {
      window.dispatchEvent(new CustomEvent('nb1:currencychange', { detail: 'CHF' }))
      await flushEffects()
    })

    expect(staleSignal.aborted).toBe(true)
    expect(checkoutApi.checkoutPreview).toHaveBeenCalledTimes(3)
    expect(checkoutApi.checkoutPreview.mock.calls[2][0]).toMatchObject({ currency: 'CHF' })
    expect(container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.disabled).toBe(false)

    // Resolve the ignored request to avoid retaining a pending promise after unmount.
    resolveStale(validPreview({ currency: 'GBP' }))
  })
})
