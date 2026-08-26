import { CheckoutFormClient } from '@/blocks/checkoutBlocks/CheckoutForm/Component.client'
import { clearCheckoutId, resetCheckoutTracking } from '@/lib/dataLayer'
import { resetKlaviyoCheckoutTracking } from '@/lib/klaviyoCheckout'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))

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
vi.mock('@/lib/checkoutApi', () => ({
  checkoutConfirm: vi.fn(),
  checkoutConfirmProxy: vi.fn(),
  checkoutPaymentIntent: vi.fn(),
  trackLanguagePublic: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/meta/browser', () => ({
  getMetaSidecar: () => ({}),
  sendMetaCapiEvent: vi.fn(),
}))
vi.mock('@/lib/plans/clientUtils', () => ({ getClientCurrency: () => 'EUR' }))
vi.mock('@/lib/klarnaMarkets', () => ({ isKlarnaAvailable: () => false }))

function changeInput(input: HTMLInputElement, value: string): void {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setValue?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

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

describe('checkout form Klaviyo boundary', () => {
  let container: HTMLDivElement
  let root: Root
  let identify: ReturnType<typeof vi.fn>
  let track: ReturnType<typeof vi.fn>

  beforeEach(() => {
    Object.defineProperties(window, {
      localStorage: { configurable: true, value: memoryStorage() },
      sessionStorage: { configurable: true, value: memoryStorage() },
    })
    window.history.replaceState(
      null,
      '',
      '/en/order?plan=core&cycle=4&utm_source=meta&utm_campaign=component-test',
    )
    window.dataLayer = []
    window.__nb1Consent = { analytics: false, targeted_advertising: false }
    window.__nb1ConsentResolved = true
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.sessionStorage.setItem('nb1_checkout_plan', JSON.stringify({ plan: 'core', cycle: '4' }))
    document.cookie = 'nb1_attr=; Path=/; Max-Age=0'
    clearCheckoutId()
    resetCheckoutTracking()
    resetKlaviyoCheckoutTracking()
    navigation.replace.mockReset()
    navigation.push.mockReset()

    identify = vi.fn((_: Record<string, unknown>, callback?: (result: boolean) => void) => {
      callback?.(true)
      return Promise.resolve(true)
    })
    track = vi.fn(
      (_: string, __: Record<string, unknown>, callback?: (result: boolean) => void) => {
        callback?.(true)
        return Promise.resolve(true)
      },
    )
    window.klaviyo = { push: vi.fn(), identify, track } as Window['klaviyo']

    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL | Request) => {
        const url = String(input)
        const body = url.includes('/subscriptions/plans')
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
    if (root) act(() => root.unmount())
    container?.remove()
    vi.unstubAllGlobals()
  })

  it('identifies and starts checkout again when the customer corrects their email', async () => {
    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const email = container.querySelector<HTMLInputElement>('#nb1-email')
    expect(email).not.toBeNull()

    await act(async () => {
      changeInput(email!, 'not-an-email')
      container.querySelector<HTMLButtonElement>('.nb1-acc.open .nb1-acc-next')!.click()
    })
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'email_submitted'),
    ).toHaveLength(0)

    await act(async () => {
      changeInput(email!, 'first@company.com')
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.nb1-acc.open .nb1-acc-next')!.click()
    })
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'email_submitted'),
    ).toHaveLength(1)

    expect(container.querySelector<HTMLButtonElement>('.nb1-acc-edit')).not.toBeNull()
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.nb1-acc-edit')!.click()
      changeInput(email!, 'corrected@company.com')
    })
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.nb1-acc.open .nb1-acc-next')!.click()
      await Promise.resolve()
    })

    expect(identify.mock.calls.map(([profile]) => profile.email)).toEqual([
      'first@company.com',
      'corrected@company.com',
    ])
    expect(track).toHaveBeenCalledTimes(2)
    expect(track.mock.calls.map(([event]) => event)).toEqual([
      'Started Checkout',
      'Started Checkout',
    ])
    expect(track.mock.calls[0][1]).toMatchObject({
      checkout_id: expect.any(String),
      currency: 'EUR',
      cart_value: 99,
      nb1_utm_source: 'meta',
      nb1_utm_campaign: 'component-test',
    })
    expect(track.mock.calls[1][1].$event_id).not.toBe(track.mock.calls[0][1].$event_id)
    const emailEvents = window.dataLayer.filter(
      (entry) => entry.canonical_event === 'email_submitted',
    )
    expect(emailEvents).toHaveLength(2)
    expect(emailEvents[1].event_id).not.toBe(emailEvents[0].event_id)
  })
})
