import {
  EVENT_REGISTRY,
  buildEventEnvelope,
  clearCheckoutId,
  getOrCreateCheckoutId,
  markCheckoutCompleted,
  primeEnhancedUserData,
  pushEvent,
  pushEventAndNavigate,
  pushEventWithUser,
  resetEnhancedUserDataCache,
  resetLeadDedupe,
  trackLeadSuccess,
} from '@/lib/dataLayer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('V1 event contract', () => {
  beforeEach(() => {
    window.dataLayer = []
    sessionStorage.clear()
    clearCheckoutId()
    resetEnhancedUserDataCache()
    resetLeadDedupe()
    vi.restoreAllMocks()
  })

  it('defines the complete V1 acquisition registry and derives each event key', () => {
    expect(EVENT_REGISTRY).toEqual({
      page_view: { stage: 10, group: 'site', destinationEvent: 'page_view' },
      lead: { stage: 20, group: 'site', destinationEvent: 'lead' },
      start_order: { stage: 110, group: 'order', destinationEvent: 'start_order' },
      plan_selected: { stage: 120, group: 'order', destinationEvent: 'plan_selected' },
      add_to_cart: { stage: 130, group: 'order', destinationEvent: 'add_to_cart' },
      begin_checkout: { stage: 210, group: 'checkout', destinationEvent: 'begin_checkout' },
      email_submitted: {
        stage: 215,
        group: 'checkout',
        destinationEvent: 'email_submitted',
      },
      add_shipping_info: {
        stage: 220,
        group: 'checkout',
        destinationEvent: 'add_shipping_info',
      },
      add_payment_info: {
        stage: 230,
        group: 'checkout',
        destinationEvent: 'add_payment_info',
      },
      subscription_acquired: {
        stage: 310,
        group: 'acquisition',
        destinationEvent: 'purchase',
      },
      checkout_success_viewed: {
        stage: 320,
        group: 'acquisition',
        destinationEvent: 'checkout_success_viewed',
      },
      post_purchase_survey_viewed: {
        stage: 330,
        group: 'acquisition',
        destinationEvent: 'post_purchase_survey_viewed',
      },
      post_purchase_survey_answered: {
        stage: 340,
        group: 'acquisition',
        destinationEvent: 'post_purchase_survey_answered',
      },
    })

    for (const [canonicalEvent, definition] of Object.entries(EVENT_REGISTRY)) {
      const envelope = buildEventEnvelope(canonicalEvent as keyof typeof EVENT_REGISTRY, {
        eventId: `id-${canonicalEvent}`,
        occurredAt: '2026-07-23T00:00:00.000Z',
      })
      expect(envelope.event_key).toBe(
        `${String(definition.stage).padStart(3, '0')}_${canonicalEvent}`,
      )
    }
  })

  it('maps acquisition to destination purchase without losing its canonical meaning', () => {
    expect(
      buildEventEnvelope('subscription_acquired', {
        eventId: 'acquisition-1',
        occurredAt: '2026-07-23T01:02:03.000Z',
      }),
    ).toEqual({
      event: 'purchase',
      canonical_event: 'subscription_acquired',
      event_stage: 310,
      event_group: 'acquisition',
      event_key: '310_subscription_acquired',
      schema_version: 1,
      event_id: 'acquisition-1',
      occurred_at: '2026-07-23T01:02:03.000Z',
      event_source: 'browser',
    })
  })

  it('pushes a protected canonical envelope and preserves a caller-supplied occurrence ID', () => {
    pushEvent('plan_selected', {
      event_id: 'plan-click-1',
      canonical_event: 'wrong',
      event_stage: 999,
      event_key: '999_wrong',
      checkout_id: 'checkout-1',
      ecommerce: { currency: 'EUR', value: 99 },
    })

    expect(window.dataLayer).toHaveLength(2)
    expect(window.dataLayer[0]).toEqual({ ecommerce: null })
    expect(window.dataLayer[1]).toMatchObject({
      event: 'plan_selected',
      canonical_event: 'plan_selected',
      event_stage: 120,
      event_group: 'order',
      event_key: '120_plan_selected',
      schema_version: 1,
      event_id: 'plan-click-1',
      event_source: 'browser',
      checkout_id: 'checkout-1',
      ecommerce: { currency: 'EUR', value: 99 },
    })
    expect(Date.parse(String(window.dataLayer[1].occurred_at))).not.toBeNaN()
  })
})

describe('checkout identity', () => {
  beforeEach(() => {
    sessionStorage.clear()
    clearCheckoutId()
  })

  it('persists one checkout ID through navigation and provider return', () => {
    vi.spyOn(window.crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111')

    const first = getOrCreateCheckoutId()
    const second = getOrCreateCheckoutId()

    expect(first).toBe('11111111-1111-4111-8111-111111111111')
    expect(second).toBe(first)
    expect(sessionStorage.getItem('nb1_checkout_id')).toBe(first)
  })

  it('starts a genuinely new journey only after the previous checkout ID is cleared', () => {
    vi.spyOn(window.crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')

    expect(getOrCreateCheckoutId()).toBe('11111111-1111-4111-8111-111111111111')
    clearCheckoutId()
    expect(getOrCreateCheckoutId()).toBe('22222222-2222-4222-8222-222222222222')
  })

  it('keeps a completed journey for success refresh but starts a new ID at the next order entry', () => {
    vi.spyOn(window.crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')

    const completed = getOrCreateCheckoutId()
    markCheckoutCompleted()
    expect(getOrCreateCheckoutId()).toBe(completed)
    expect(getOrCreateCheckoutId({ startNewJourney: true })).toBe(
      '22222222-2222-4222-8222-222222222222',
    )
  })
})

describe('loss-resistant delivery', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    resetEnhancedUserDataCache()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('waits for the GTM callback before navigating and only navigates once', () => {
    const navigate = vi.fn()

    pushEventAndNavigate(
      'plan_selected',
      {
        checkout_id: 'checkout-1',
        ecommerce: { currency: 'EUR', value: 99 },
      },
      navigate,
      { timeoutMs: 250 },
    )

    expect(navigate).not.toHaveBeenCalled()
    const event = window.dataLayer[1]
    expect(event.event).toBe('plan_selected')
    expect(event.eventTimeout).toBe(250)
    expect(event.eventCallback).toBeTypeOf('function')
    ;(event.eventCallback as () => void)()
    ;(event.eventCallback as () => void)()
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('uses the safety timeout when GTM does not invoke the callback', () => {
    vi.useFakeTimers()
    const navigate = vi.fn()

    pushEventAndNavigate('add_to_cart', { checkout_id: 'checkout-1' }, navigate, {
      timeoutMs: 250,
    })

    vi.advanceTimersByTime(249)
    expect(navigate).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('still emits exactly one base event when optional hashing fails', async () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockRejectedValue(new Error('crypto unavailable'))

    await expect(
      pushEventWithUser(
        'email_submitted',
        {
          checkout_id: 'checkout-1',
          ecommerce: { currency: 'EUR', value: 99 },
        },
        { email: 'person@example.com' },
        { identityWaitMs: 250 },
      ),
    ).resolves.toBeUndefined()

    expect(window.dataLayer).toHaveLength(2)
    expect(window.dataLayer[1]).toMatchObject({
      event: 'email_submitted',
      canonical_event: 'email_submitted',
      checkout_id: 'checkout-1',
    })
    expect(window.dataLayer[1]).not.toHaveProperty('external_id')
    expect(window.dataLayer[1]).not.toHaveProperty('user_data')
  })

  it('emits one base email event after the bounded identity wait times out', async () => {
    vi.useFakeTimers()
    vi.spyOn(window.crypto.subtle, 'digest').mockReturnValue(new Promise<ArrayBuffer>(() => {}))

    const pending = pushEventWithUser(
      'email_submitted',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
      { identityWaitMs: 250 },
    )

    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'email_submitted'),
    ).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(250)
    await pending
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'email_submitted'),
    ).toHaveLength(1)
    expect(window.dataLayer[1]).not.toHaveProperty('external_id')
  })

  it('pushes the base event synchronously while optional identity preparation is pending', async () => {
    let finishHash: ((value: ArrayBuffer) => void) | undefined
    vi.spyOn(window.crypto.subtle, 'digest').mockReturnValue(
      new Promise<ArrayBuffer>((resolve) => {
        finishHash = resolve
      }),
    )

    const pending = pushEventWithUser(
      'add_payment_info',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
    )

    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'add_payment_info'),
    ).toHaveLength(1)

    finishHash?.(new Uint8Array([1, 2, 3]).buffer)
    await pending
    expect(
      window.dataLayer.filter((entry) => entry.canonical_event === 'add_payment_info'),
    ).toHaveLength(1)
  })

  it('reuses identity prepared at the accepted email boundary', async () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockResolvedValue(
      new Uint8Array([1, 2, 3]).buffer,
    )

    await pushEventWithUser(
      'email_submitted',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
      { identityWaitMs: 250 },
    )

    expect(window.dataLayer[1]).toHaveProperty('external_id', '010203')
    expect(window.dataLayer[1]).toHaveProperty('email_sha256', '010203')
    window.dataLayer = []

    await pushEventWithUser(
      'add_shipping_info',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
    )

    expect(window.dataLayer[1]).toHaveProperty(
      'user_data.sha256_email_address',
      '010203',
    )
    expect(window.dataLayer[1]).toHaveProperty('email_sha256', '010203')
    expect(window.dataLayer[1]).toHaveProperty('external_id', '010203')
    expect(window.dataLayer[1]).not.toHaveProperty('user_id')
  })

  it('omits identity until advertising consent has resolved', async () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockResolvedValue(
      new Uint8Array([1, 2, 3]).buffer,
    )
    await primeEnhancedUserData({ email: 'person@example.com' })
    window.__nb1ConsentResolved = false
    window.dataLayer = []

    await pushEventWithUser(
      'add_shipping_info',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
    )

    expect(window.dataLayer[1]).not.toHaveProperty('external_id')
    expect(window.dataLayer[1]).not.toHaveProperty('email_sha256')
    expect(window.dataLayer[1]).not.toHaveProperty('user_data')
    expect(window.dataLayer[1]).not.toHaveProperty('user_id')
  })

  it('omits matching identifiers after consent is rejected', async () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockResolvedValue(
      new Uint8Array([1, 2, 3]).buffer,
    )
    await primeEnhancedUserData({ email: 'person@example.com' })
    window.__nb1Consent = { analytics: false, targeted_advertising: false }
    window.dataLayer = []

    await pushEventWithUser(
      'add_shipping_info',
      { checkout_id: 'checkout-1' },
      { email: 'person@example.com' },
    )

    expect(window.dataLayer[1]).not.toHaveProperty('external_id')
    expect(window.dataLayer[1]).not.toHaveProperty('user_id')
    expect(window.dataLayer[1]).not.toHaveProperty('user_data')
  })
})

describe('confirmed lead boundary', () => {
  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    resetLeadDedupe()
    resetEnhancedUserDataCache()
    vi.restoreAllMocks()
  })

  it('emits one lowercase canonical lead with consent-approved hashed identity', async () => {
    vi.spyOn(window.crypto.subtle, 'digest').mockResolvedValue(
      new Uint8Array([1, 2, 3]).buffer,
    )
    const context = {
      leadType: 'newsletter',
      leadSource: 'footer',
      formId: 'TPTv44',
      provider: 'klaviyo',
      providerSubmissionId: 'submission-1',
      pageLanguage: 'en',
      email: 'Person@Example.com',
    }

    expect(await trackLeadSuccess(context)).toBe(true)
    expect(await trackLeadSuccess(context)).toBe(false)

    expect(window.dataLayer).toHaveLength(2)
    expect(window.dataLayer[1]).toMatchObject({
      event: 'lead',
      canonical_event: 'lead',
      event_key: '020_lead',
      lead_type: 'newsletter',
      lead_source: 'footer',
      form_id: 'TPTv44',
      provider: 'klaviyo',
      provider_submission_id: 'submission-1',
      page_language: 'en',
      external_id: '010203',
      email_sha256: '010203',
      user_data: {
        sha256_email_address: '010203',
      },
    })
    expect(window.dataLayer[1]).not.toHaveProperty('email')
  })

  it('emits the lead without matching identity when advertising consent is denied', async () => {
    window.__nb1Consent = { analytics: true, targeted_advertising: false }

    expect(
      await trackLeadSuccess({
        leadType: 'newsletter',
        leadSource: 'footer',
        email: 'person@example.com',
      }),
    ).toBe(true)

    expect(window.dataLayer[1]).not.toHaveProperty('email')
    expect(window.dataLayer[1]).not.toHaveProperty('email_sha256')
    expect(window.dataLayer[1]).not.toHaveProperty('user_data')
  })
})
