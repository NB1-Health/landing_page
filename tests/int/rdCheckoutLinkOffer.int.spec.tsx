import { RdChk } from '@/blocks/redesign/CheckoutPage/Component'
import { clearCheckoutId, resetCheckoutTracking } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
const checkoutApi = vi.hoisted(() => ({
  checkoutConfirm: vi.fn(),
  checkoutPaymentIntent: vi.fn(),
  checkoutPreview: vi.fn(),
  getPermittedCheckoutAttribution: vi.fn(() => ({})),
  persistPostPurchaseSurveyResponse: vi.fn(),
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
  CardCvcElement: () => null,
  CardElement: () => null,
  CardExpiryElement: () => null,
  CardNumberElement: () => null,
  Elements: ({ children }: { children: React.ReactNode }) => children,
  ExpressCheckoutElement: () => null,
  useElements: () => ({ getElement: vi.fn() }),
  useStripe: () => ({ confirmCardSetup: vi.fn() }),
}))
vi.mock('react-phone-number-input', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-phone-number-input')>()),
  default: () => null,
  isValidPhoneNumber: () => true,
}))
vi.mock('@/blocks/checkoutBlocks/CheckoutForm/AddressAutocomplete', () => ({
  default: () => null,
}))
vi.mock('@/components/MentionMe/MentionMeRefereeLink', () => ({ default: () => null }))
vi.mock('@/components/ArminWidget', () => ({ openArminChat: vi.fn() }))
vi.mock('@/lib/createAccount', () => ({ createFirebaseAccount: vi.fn() }))
vi.mock('@/lib/checkoutApi', () => checkoutApi)
vi.mock('@/lib/meta/browser', () => ({
  getMetaSidecar: () => ({}),
  sendMetaCapiEvent: vi.fn(),
}))
vi.mock('@/lib/plans/clientUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/plans/clientUtils')>()),
  getClientCurrency: () => 'EUR' as const,
}))
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

function preview(overrides: Record<string, unknown> = {}) {
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
    discount_code: 'SPRING20',
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

describe('redesign checkout ad link code', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    Object.defineProperties(window, {
      localStorage: { configurable: true, value: memoryStorage() },
      sessionStorage: { configurable: true, value: memoryStorage() },
    })
    window.history.replaceState(null, '', '/en/checkout')
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: false }
    window.__nb1ConsentResolved = true
    window.sessionStorage.setItem('nb1_checkout_plan', JSON.stringify({ plan: 'core', cycle: '4' }))
    clearCheckoutId()
    resetCheckoutTracking()
    checkoutApi.checkoutPreview.mockReset()
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
    document.cookie = 'nb1_discount=; Path=/; Max-Age=0'
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function render() {
    await act(async () => {
      root.render(<RdChk {...({} as React.ComponentProps<typeof RdChk>)} locale="en" />)
      await flushEffects()
    })
  }

  it('auto-applies the nb1_discount code as a link voucher', async () => {
    document.cookie = 'nb1_discount=SPRING20; Path=/'
    checkoutApi.checkoutPreview.mockResolvedValueOnce(preview())

    await render()

    expect(checkoutApi.checkoutPreview).toHaveBeenCalledTimes(1)
    expect(checkoutApi.checkoutPreview.mock.calls[0][0]).toMatchObject({
      plan_slug: 'NB1-CORE-4',
      discount_code: 'SPRING20',
    })
    const voucher = window.dataLayer.find((entry) => entry.event === 'add_voucher')
    expect(voucher).toMatchObject({ voucher_source: 'link', ecommerce: { coupon: 'SPRING20' } })
    expect(voucher).not.toHaveProperty('influencer_slug')
    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'begin_checkout'),
    ).toMatchObject({ offer_source: 'link', ecommerce: { coupon: 'SPRING20' } })
  })

  it('drops an invalid link code quietly and forgets it', async () => {
    document.cookie = 'nb1_discount=EXPIRED; Path=/'
    checkoutApi.checkoutPreview.mockResolvedValueOnce(
      preview({
        promo_discount: 0,
        discount_code: 'EXPIRED',
        discount_code_valid: false,
        discount_message: 'Discount code not found',
      }),
    )

    await render()

    expect(container.textContent).not.toContain('Discount code not found')
    expect(document.cookie).not.toContain('nb1_discount')
    expect(window.dataLayer.find((entry) => entry.event === 'add_voucher_error')).toMatchObject({
      voucher_source: 'link',
    })
  })
})
