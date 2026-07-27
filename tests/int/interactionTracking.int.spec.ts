import { describe, expect, it } from 'vitest'

import {
  isPaymentAttemptReady,
  isUnmodifiedPrimaryNavigation,
  resolveWalletPaymentType,
} from '@/lib/interactionTracking'

describe('payment attempt acceptance', () => {
  it('rejects an incomplete card or unavailable Stripe context', () => {
    expect(
      isPaymentAttemptReady({
        paymentType: 'card',
        stripeReady: true,
        elementsReady: true,
        cardElementReady: true,
        cardComplete: false,
      }),
    ).toBe(false)
    expect(
      isPaymentAttemptReady({
        paymentType: 'card',
        stripeReady: false,
        elementsReady: true,
        cardElementReady: true,
        cardComplete: true,
      }),
    ).toBe(false)
  })

  it.each(['paypal', 'klarna'] as const)(
    'requires Stripe before accepting a %s redirect attempt',
    (paymentType) => {
      expect(isPaymentAttemptReady({ paymentType, stripeReady: false })).toBe(false)
      expect(isPaymentAttemptReady({ paymentType, stripeReady: true })).toBe(true)
    },
  )

  it('accepts locally valid SEPA and provider-authorized wallet attempts', () => {
    expect(
      isPaymentAttemptReady({
        paymentType: 'sepa',
        localPaymentFieldsValid: true,
      }),
    ).toBe(true)
    expect(
      isPaymentAttemptReady({
        paymentType: 'apple_pay',
        walletAuthorized: true,
      }),
    ).toBe(true)
  })
})

describe('tracked anchor behavior', () => {
  it('tracks only an unmodified primary navigation', () => {
    expect(
      isUnmodifiedPrimaryNavigation({
        button: 0,
        defaultPrevented: false,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe(true)
    expect(
      isUnmodifiedPrimaryNavigation({
        button: 0,
        defaultPrevented: false,
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe(false)
  })
})

describe('wallet payment identity', () => {
  it.each([
    ['applePay', 'apple_pay'],
    ['apple_pay', 'apple_pay'],
    ['googlePay', 'google_pay'],
    ['google_pay', 'google_pay'],
    ['link', 'card'],
    ['browserCard', 'card'],
    [undefined, 'card'],
  ] as const)('normalizes %s to %s', (providerValue, expected) => {
    expect(resolveWalletPaymentType(providerValue)).toBe(expected)
  })
})
