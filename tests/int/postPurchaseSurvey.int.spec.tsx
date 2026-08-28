import { ConfirmationScreen } from '@/blocks/checkoutBlocks/CheckoutForm/ConfirmationScreen'
import { en } from '@/i18n/dictionaries/en'
import { resetCheckoutTracking, resetEnhancedUserDataCache } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const surveyOptions = [
  {
    code: 'social_media',
    label: 'Social media',
    details: [
      { code: 'instagram', label: 'Instagram' },
      { code: 'tiktok', label: 'TikTok' },
    ],
  },
  { code: 'search_engine', detailCode: 'google', label: 'Google' },
]

describe('post-purchase survey UI tracking', () => {
  let container: HTMLDivElement
  let fetchMock: ReturnType<typeof vi.fn>
  let root: Root

  async function renderConfirmation() {
    await act(async () => {
      root.render(
        <ConfirmationScreen
          fn="Alex"
          email="alex@example.com"
          orderNumber="NB1-ABC234"
          checkoutId="checkout-1"
          acquisitionEventId="acquisition-1"
          transactionId="subscription-1"
          customerId="customer-1"
          planLabel="Core"
          cycleLabel="4 months"
          priceFormatted="99"
          locale="en"
          t={en.checkout}
          inboxBodyPrefix="Sent to "
          inboxBodySuffix="."
          chargeNotePrefix="Charged after "
          chargeNoteSuffix="."
          survOpts={surveyOptions}
        />,
      )
    })
  }

  const button = (container: HTMLDivElement, label: string) =>
    Array.from(container.querySelectorAll('button')).find(
      (candidate) => candidate.textContent === label,
    )

  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    window.sessionStorage.clear()
    resetCheckoutTracking()
    resetEnhancedUserDataCache()
    fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('emits the view and normalized detail answer from the rendered controls', async () => {
    await renderConfirmation()

    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'post_purchase_survey_viewed'),
    ).toMatchObject({
      transaction_id: 'subscription-1',
      customer_id: 'customer-1',
      survey_key: 'checkout_attribution',
    })

    await act(async () => button(container, 'Social media')!.click())
    await act(async () => button(container, 'Instagram')!.click())

    const analyticsEvent = window.dataLayer.find(
      (entry) => entry.canonical_event === 'post_purchase_survey_answered',
    )
    expect(analyticsEvent).toMatchObject({
      related_event_id: 'acquisition-1',
      transaction_id: 'subscription-1',
      customer_id: 'customer-1',
      question_key: 'discovery_source',
      answer_code: 'social_media',
      answer_detail_code: 'instagram',
      persistence_status: 'backend_requested',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toMatch(/\/post-purchase-surveys\/public\/responses$/)
    expect(request).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      keepalive: true,
    })

    const payload = JSON.parse(request.body as string)
    expect(payload).toMatchObject({
      user_id: 'customer-1',
      transaction_id: 'subscription-1',
      survey_key: 'checkout_attribution',
      survey_version: 1,
      survey_placement: 'checkout_confirmation',
      page_language: 'en',
      checkout_id: 'checkout-1',
      related_event_id: 'acquisition-1',
      response_source: 'customer_reported',
      context: {
        order_number: 'NB1-ABC234',
        form: 'checkout_confirmation',
      },
      completed_at: expect.any(String),
      answers: [
        {
          question_key: 'discovery_source',
          question_version: 1,
          answer_type: 'single_choice',
          answer_code: 'social_media',
          answer_detail_code: 'instagram',
          client_event_id: expect.any(String),
          answered_at: expect.any(String),
          metadata: { has_free_text: false },
        },
      ],
    })
    expect(payload.answers[0].client_event_id).toBe(analyticsEvent?.event_id)
    expect(payload.answers[0].answered_at).toBe(payload.completed_at)
  })

  it('persists a trimmed Other response without putting its text in analytics', async () => {
    await renderConfirmation()

    await act(async () => button(container, 'Something else')!.click())
    const input = container.querySelector<HTMLInputElement>('.nb1-surv-other input')!
    await act(async () => {
      const setValue = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!
      setValue.call(input, '  Recommended by a colleague  ')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => button(container, 'Send')!.click())

    const analyticsEvent = window.dataLayer.find(
      (entry) => entry.canonical_event === 'post_purchase_survey_answered',
    )
    expect(analyticsEvent).toMatchObject({
      answer_code: 'other',
      has_free_text: true,
      persistence_status: 'backend_requested',
    })
    expect(analyticsEvent).not.toHaveProperty('answer_text')

    const request = fetchMock.mock.calls[0][1] as RequestInit
    const payload = JSON.parse(request.body as string)
    expect(payload.answers[0]).toMatchObject({
      answer_code: 'other',
      answer_text: 'Recommended by a colleague',
      metadata: { has_free_text: true },
    })
  })

  it('does not interrupt the confirmation UI when persistence fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('backend unavailable'))
    await renderConfirmation()

    await act(async () => button(container, 'Google')!.click())

    expect(container.textContent).toContain('Got it, thank you.')
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(
      window.dataLayer.find(
        (entry) => entry.canonical_event === 'post_purchase_survey_answered',
      ),
    ).toMatchObject({
      answer_code: 'search_engine',
      answer_detail_code: 'google',
      persistence_status: 'backend_requested',
    })
  })
})
