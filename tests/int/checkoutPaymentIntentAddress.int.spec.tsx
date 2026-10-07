import { CheckoutFormClient } from '@/blocks/checkoutBlocks/CheckoutForm/Component.client'
import { clearCheckoutId, resetCheckoutTracking } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The address must reach the backend at /payment-intent, BEFORE a Klarna/PayPal
// redirect: the return can land in a tab without sessionStorage, and the backend keeps
// what it gets here on the SetupIntent (ClickUp 1247bx04cwx).

const navigation = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }))
const checkoutApi = vi.hoisted(() => ({
  checkoutConfirm: vi.fn(),
  checkoutPaymentIntent: vi.fn(),
  checkoutPreview: vi.fn(),
  getPermittedCheckoutAttribution: vi.fn(() => ({})),
  trackLanguagePublic: vi.fn().mockResolvedValue(undefined),
}))
const stripeUi = vi.hoisted(() => ({
  confirmCardSetup: vi.fn(),
  getElement: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => window.location.pathname,
  useRouter: () => navigation,
  useSearchParams: () => new URLSearchParams(window.location.search),
}))
vi.mock('next/link', () => ({ default: () => null }))
vi.mock('@stripe/stripe-js', () => ({ loadStripe: () => Promise.resolve(null) }))
vi.mock('@stripe/react-stripe-js', async () => {
  const { createElement } = await import('react')
  return {
    CardElement: ({ onChange }: { onChange: (event: { complete: boolean }) => void }) =>
      createElement('button', {
        type: 'button',
        className: 'test-card-element',
        onClick: () => onChange({ complete: true }),
      }),
    Elements: ({ children }: { children: React.ReactNode }) => children,
    ExpressCheckoutElement: () => null,
    useElements: () => ({ getElement: stripeUi.getElement }),
    useStripe: () => ({ confirmCardSetup: stripeUi.confirmCardSetup }),
  }
})
// Keep the real phone helpers; only the visual input is replaced and any number passes.
vi.mock('react-phone-number-input', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-phone-number-input')>()),
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

function changeInput(input: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function storeReadyCheckoutForm(): void {
  window.sessionStorage.setItem(
    'nb1_checkout_form',
    JSON.stringify({
      email: 'buyer@example.com',
      fn: 'Test',
      ln: 'Buyer',
      country: 'Germany',
      a1: '1 Test Street',
      zip: '10115',
      city: 'Berlin',
      phone: '+491701234567',
      shipping: 'standard',
      step: 4,
      doneSteps: [1, 2, 3],
    }),
  )
}

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await Promise.resolve()
}

const expectedShipping = {
  first_name: 'Test',
  last_name: 'Buyer',
  email: 'buyer@example.com',
  phone: '+491701234567',
  address_line1: '1 Test Street',
  address_line2: null,
  city: 'Berlin',
  state: null,
  postal_code: '10115',
  country: 'Germany',
  country_code: 'DE',
}

describe('checkout payment-intent carries the address', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    Object.defineProperties(window, {
      localStorage: { configurable: true, value: memoryStorage() },
      sessionStorage: { configurable: true, value: memoryStorage() },
    })
    window.history.replaceState(null, '', '/en/order')
    window.dataLayer = []
    window.__nb1Consent = { analytics: false, targeted_advertising: false }
    window.__nb1ConsentResolved = true
    window.sessionStorage.setItem('nb1_checkout_plan', JSON.stringify({ plan: 'core', cycle: '4' }))
    storeReadyCheckoutForm()
    clearCheckoutId()
    resetCheckoutTracking()
    checkoutApi.checkoutPreview.mockReset().mockResolvedValue({
      plan_id: 'core-4',
      plan_slug: 'NB1-CORE-4',
      title: 'Core',
      month: 4,
      currency: 'EUR',
      monthly_price: 99,
      shipping_option: 'standard',
      shipping_price: 0,
      promo_discount: 0,
      first_month_price: 99,
      due_today: 0,
      discount_code: null,
      discount_code_valid: null,
      discount_message: null,
      discount_message_custom: null,
      exclude_one_month: false,
    })
    checkoutApi.checkoutPaymentIntent
      .mockReset()
      .mockResolvedValue({ client_secret: 'seti_secret', setup_intent_id: 'seti_address' })
    checkoutApi.checkoutConfirm.mockReset().mockResolvedValue({
      order_number: 'NB1-TEST01',
      subscription_id: 'sub_test',
      event_id: 'evt_test',
      user_id: 'user_test',
      user_email: 'buyer@example.com',
      plan_slug: 'NB1-CORE-4',
    })
    stripeUi.confirmCardSetup.mockReset().mockResolvedValue({})
    stripeUi.getElement.mockReset().mockReturnValue({})
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

  async function renderReadyCardForm(): Promise<void> {
    await act(async () => {
      root.render(<CheckoutFormClient locale="en" />)
      await flushEffects()
      await flushEffects()
    })
    const cardName = container.querySelector<HTMLInputElement>('input[autocomplete="cc-name"]')
    const cardElement = container.querySelector<HTMLButtonElement>('.test-card-element')
    if (!cardName || !cardElement) throw new Error('Ready card form missing')
    await act(async () => {
      changeInput(cardName, 'Test Buyer')
      cardElement.click()
      await flushEffects()
    })
  }

  async function pay(): Promise<void> {
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.nb1-confirm-btn')?.click()
      await flushEffects()
      await flushEffects()
    })
  }

  it('sends the shipping address, and no billing when it matches shipping', async () => {
    await renderReadyCardForm()
    await pay()

    expect(checkoutApi.checkoutPaymentIntent).toHaveBeenCalledTimes(1)
    const intentPayload = checkoutApi.checkoutPaymentIntent.mock.calls[0][0]
    expect(intentPayload.shipping_address).toEqual(expectedShipping)
    expect(intentPayload.billing_address).toBeUndefined()

    // The confirm payload is unchanged.
    expect(checkoutApi.checkoutConfirm).toHaveBeenCalledTimes(1)
    const confirmPayload = checkoutApi.checkoutConfirm.mock.calls[0][0]
    expect(confirmPayload.shipping_address).toEqual(expectedShipping)
    expect(confirmPayload.billing_address).toEqual({
      address_type: 'individual',
      first_name: 'Test',
      last_name: 'Buyer',
      company_name: null,
      tax_id: null,
      registration_number: null,
      email: 'buyer@example.com',
      phone: '+491701234567',
      address_line1: '1 Test Street',
      address_line2: null,
      city: 'Berlin',
      state: null,
      postal_code: '10115',
      country: 'DE',
    })
  })

  it('sends a separate company billing address when billing differs from shipping', async () => {
    await renderReadyCardForm()

    const billingSame = container.querySelector<HTMLInputElement>('.nb1-billing-check input')
    if (!billingSame) throw new Error('Billing toggle missing')
    await act(async () => {
      billingSame.click()
      await flushEffects()
    })
    const companyOption = container.querySelectorAll<HTMLElement>('.nb1-billing-addr .nb1-ship-opt')[1]
    await act(async () => {
      companyOption.click()
      await flushEffects()
    })
    const company = container.querySelector<HTMLInputElement>(
      '.nb1-billing-addr input[autocomplete="organization"]',
    )
    const [taxId, regNum] = Array.from(
      company?.closest('.nb1-frow')?.nextElementSibling?.querySelectorAll<HTMLInputElement>(
        'input',
      ) ?? [],
    )
    const field = (autocomplete: string) =>
      container.querySelector<HTMLInputElement>(
        `.nb1-billing-addr input[autocomplete="${autocomplete}"]`,
      )
    if (!company || !taxId || !regNum) throw new Error('Company billing fields missing')
    await act(async () => {
      changeInput(company, 'Acme GmbH')
      changeInput(taxId, 'DE123456789')
      changeInput(regNum, 'HRB 12345')
      changeInput(field('billing address-line1')!, '9 Invoice Road')
      changeInput(field('billing postal-code')!, '20095')
      changeInput(field('billing address-level2')!, 'Hamburg')
      await flushEffects()
    })

    await pay()

    expect(checkoutApi.checkoutPaymentIntent).toHaveBeenCalledTimes(1)
    const intentPayload = checkoutApi.checkoutPaymentIntent.mock.calls[0][0]
    expect(intentPayload.shipping_address).toEqual(expectedShipping)
    expect(intentPayload.billing_address).toMatchObject({
      address_type: 'company',
      company_name: 'Acme GmbH',
      tax_id: 'DE123456789',
      registration_number: 'HRB 12345',
      first_name: 'Test',
      last_name: 'Buyer',
      address_line1: '9 Invoice Road',
      postal_code: '20095',
      city: 'Hamburg',
    })
    // Confirm still sends the same billing the payment-intent carried.
    expect(checkoutApi.checkoutConfirm.mock.calls[0][0].billing_address).toEqual(
      intentPayload.billing_address,
    )
  })
})
