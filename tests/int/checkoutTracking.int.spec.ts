import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumeRedirectPaymentType,
  nextPaymentAttempt,
  resetEnhancedUserDataCache,
  resetCheckoutTracking,
  resolveRedirectPaymentType,
  setRedirectPaymentType,
  trackCheckoutSuccessViewed,
  trackPostPurchaseSurveyAnswered,
  trackPostPurchaseSurveyViewed,
  trackSubscriptionAcquired,
} from '@/lib/dataLayer'

describe('checkout event boundaries', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.sessionStorage.clear()
    resetCheckoutTracking()
    resetEnhancedUserDataCache()
  })

  it.each([
    ['card', 'inline'],
    ['apple_pay', 'wallet'],
    ['paypal', 'redirect'],
    ['klarna', 'redirect'],
  ] as const)(
    'emits the same confirmed acquisition contract for %s',
    (paymentType, paymentFlow) => {
      const eventId = trackSubscriptionAcquired({
        checkoutId: 'checkout-1',
        eventId: `acquisition-${paymentType}`,
        transactionId: `subscription-${paymentType}`,
        externalId: 'customer-1',
        paymentType,
        paymentFlow,
        currency: 'EUR',
        value: 99,
        item: { item_id: 'core-4', item_name: 'Core 4 months', price: 99, quantity: 1 },
        user: { email: 'buyer@example.com' },
      })

      expect(eventId).toBe(`acquisition-${paymentType}`)
      const acquisition = window.dataLayer.find(
        (entry) => entry.canonical_event === 'subscription_acquired',
      )
      expect(acquisition).toMatchObject({
        event: 'purchase',
        canonical_event: 'subscription_acquired',
        event_id: `acquisition-${paymentType}`,
        checkout_id: 'checkout-1',
        transaction_id: `subscription-${paymentType}`,
        payment_type: paymentType,
        payment_flow: paymentFlow,
        confirmation_source: 'checkout_confirm',
        signal_quality: 'confirmed',
      })
    },
  )

  it('deduplicates a reconfirmed transaction and reuses its acquisition ID', () => {
    const input = {
      checkoutId: 'checkout-1',
      eventId: 'acquisition-1',
      transactionId: 'subscription-1',
      paymentType: 'card' as const,
      paymentFlow: 'inline' as const,
      currency: 'EUR',
      value: 99,
      item: { item_id: 'core-4', item_name: 'Core 4 months', price: 99, quantity: 1 },
      user: { email: 'buyer@example.com' },
    }

    expect(trackSubscriptionAcquired(input)).toBe('acquisition-1')
    expect(trackSubscriptionAcquired({ ...input, eventId: 'unexpected-retry-id' })).toBe(
      'acquisition-1',
    )
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'subscription_acquired'),
    ).toHaveLength(1)
  })

  it('emits a confirmed acquisition without waiting for optional identity hashing', () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockReturnValue(new Promise<ArrayBuffer>(() => {}))

    const eventId = trackSubscriptionAcquired({
      checkoutId: 'checkout-1',
      eventId: 'acquisition-1',
      transactionId: 'subscription-1',
      paymentType: 'card',
      paymentFlow: 'inline',
      currency: 'EUR',
      value: 99,
      item: { item_id: 'core-4', item_name: 'Core 4 months', price: 99, quantity: 1 },
      user: { email: 'buyer@example.com' },
    })

    expect(eventId).toBe('acquisition-1')
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'subscription_acquired'),
    ).toHaveLength(1)
  })

  it('counts valid payment attempts per checkout', () => {
    expect(nextPaymentAttempt('checkout-1')).toBe(1)
    expect(nextPaymentAttempt('checkout-1')).toBe(2)
    expect(nextPaymentAttempt('checkout-2')).toBe(1)
  })

  it('persists the redirect payment type through provider navigation and consumes it once', () => {
    setRedirectPaymentType('paypal')
    expect(consumeRedirectPaymentType()).toBe('paypal')
    expect(consumeRedirectPaymentType()).toBeNull()
  })

  it('restores explicit redirect state before legacy setup-intent fallbacks', () => {
    expect(
      resolveRedirectPaymentType({
        storedPaymentType: 'paypal',
        returnUrlPaymentType: 'klarna',
        paypalSetupIntentId: null,
        klarnaSetupIntentId: 'seti_klarna',
      }),
    ).toBe('paypal')
    expect(
      resolveRedirectPaymentType({
        storedPaymentType: null,
        returnUrlPaymentType: 'klarna',
        paypalSetupIntentId: 'seti_paypal',
        klarnaSetupIntentId: null,
      }),
    ).toBe('klarna')
    expect(
      resolveRedirectPaymentType({
        storedPaymentType: null,
        returnUrlPaymentType: null,
        paypalSetupIntentId: null,
        klarnaSetupIntentId: 'seti_klarna',
      }),
    ).toBe('klarna')
  })

  it('emits one supporting success view linked to the acquisition', () => {
    expect(
      trackCheckoutSuccessViewed({
        checkoutId: 'checkout-1',
        acquisitionEventId: 'acquisition-1',
        transactionId: 'subscription-1',
      }),
    ).toBe(true)
    expect(
      trackCheckoutSuccessViewed({
        checkoutId: 'checkout-1',
        acquisitionEventId: 'acquisition-1',
        transactionId: 'subscription-1',
      }),
    ).toBe(false)

    const success = window.dataLayer.find(
      (entry) => entry.canonical_event === 'checkout_success_viewed',
    )
    expect(success).toMatchObject({
      event: 'checkout_success_viewed',
      checkout_id: 'checkout-1',
      transaction_id: 'subscription-1',
      related_event_id: 'acquisition-1',
    })
  })

  it('tracks one client-side PPS view and one normalized answer', () => {
    const context = {
      checkoutId: 'checkout-1',
      acquisitionEventId: 'acquisition-1',
      transactionId: 'subscription-1',
      customerId: 'customer-1',
      externalId: 'email-hash-1',
      orderNumber: 'NB1-ABC234',
      email: 'buyer@example.com',
      pageLanguage: 'de',
      surveyKey: 'checkout_attribution',
      surveyVersion: 1,
      surveyPlacement: 'checkout_confirmation',
    }

    expect(trackPostPurchaseSurveyViewed(context)).toBe(true)
    expect(trackPostPurchaseSurveyViewed(context)).toBe(false)
    resetCheckoutTracking()
    expect(trackPostPurchaseSurveyViewed(context)).toBe(false)
    expect(
      trackPostPurchaseSurveyAnswered({
        ...context,
        eventId: 'pps-answer-1',
        questionKey: 'discovery_source',
        questionVersion: 1,
        answerType: 'single_choice',
        answerCode: 'social_media',
        answerDetailCode: 'instagram',
        hasFreeText: false,
      }),
    ).toBe('pps-answer-1')

    const viewed = window.dataLayer.find(
      (entry) => entry.canonical_event === 'post_purchase_survey_viewed',
    )
    expect(viewed).toMatchObject({
      event: 'post_purchase_survey_viewed',
      event_key: '330_post_purchase_survey_viewed',
      customer_id: 'customer-1',
      external_id: 'email-hash-1',
      transaction_id: 'subscription-1',
      survey_key: 'checkout_attribution',
      survey_version: 1,
      survey_placement: 'checkout_confirmation',
    })

    const answered = window.dataLayer.find(
      (entry) => entry.canonical_event === 'post_purchase_survey_answered',
    )
    expect(answered).toMatchObject({
      event: 'post_purchase_survey_answered',
      event_key: '340_post_purchase_survey_answered',
      event_id: 'pps-answer-1',
      customer_id: 'customer-1',
      external_id: 'email-hash-1',
      transaction_id: 'subscription-1',
      question_key: 'discovery_source',
      question_version: 1,
      answer_type: 'single_choice',
      answer_code: 'social_media',
      answer_detail_code: 'instagram',
      has_free_text: false,
      response_source: 'customer_reported',
      persistence_status: 'client_only',
    })
  })

  it('deduplicates PPS answers and omits identity without advertising consent', () => {
    window.__nb1Consent = { analytics: true, targeted_advertising: false }
    const input = {
      checkoutId: 'checkout-1',
      acquisitionEventId: 'acquisition-1',
      transactionId: 'subscription-1',
      customerId: 'customer-1',
      externalId: 'email-hash-1',
      email: 'buyer@example.com',
      pageLanguage: 'en',
      surveyKey: 'checkout_attribution',
      surveyVersion: 1,
      surveyPlacement: 'checkout_confirmation',
      eventId: 'pps-answer-1',
      questionKey: 'discovery_source',
      questionVersion: 1,
      answerType: 'single_choice',
      answerCode: 'other',
      hasFreeText: true,
    }

    expect(trackPostPurchaseSurveyAnswered(input)).toBe('pps-answer-1')
    expect(trackPostPurchaseSurveyAnswered({ ...input, eventId: 'pps-answer-retry' })).toBe(
      'pps-answer-1',
    )

    const answers = window.dataLayer.filter(
      (entry) => entry.canonical_event === 'post_purchase_survey_answered',
    )
    expect(answers).toHaveLength(1)
    expect(answers[0]).not.toHaveProperty('customer_id')
    expect(answers[0]).not.toHaveProperty('external_id')
    expect(answers[0]).not.toHaveProperty('user_id')
    expect(answers[0]).not.toHaveProperty('user_data')
    expect(answers[0]).not.toHaveProperty('answer_text')
  })

  it('keeps separate answer identities for future survey questions', () => {
    const input = {
      checkoutId: 'checkout-1',
      acquisitionEventId: 'acquisition-1',
      transactionId: 'subscription-1',
      customerId: 'customer-1',
      pageLanguage: 'en',
      surveyKey: 'checkout_attribution',
      surveyVersion: 1,
      surveyPlacement: 'checkout_confirmation',
      questionVersion: 1,
      answerType: 'single_choice',
      answerCode: 'social_media',
      hasFreeText: false,
    }

    expect(
      trackPostPurchaseSurveyAnswered({
        ...input,
        eventId: 'pps-discovery-1',
        questionKey: 'discovery_source',
      }),
    ).toBe('pps-discovery-1')
    expect(
      trackPostPurchaseSurveyAnswered({
        ...input,
        eventId: 'pps-influence-1',
        questionKey: 'purchase_influence',
      }),
    ).toBe('pps-influence-1')

    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'post_purchase_survey_answered'),
    ).toHaveLength(2)
  })
})
