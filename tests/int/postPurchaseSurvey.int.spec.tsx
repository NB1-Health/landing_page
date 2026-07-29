import { ConfirmationScreen } from '@/blocks/checkoutBlocks/CheckoutForm/ConfirmationScreen'
import { en } from '@/i18n/dictionaries/en'
import { resetCheckoutTracking, resetEnhancedUserDataCache } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
  let root: Root

  beforeEach(() => {
    window.dataLayer = []
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.sessionStorage.clear()
    resetCheckoutTracking()
    resetEnhancedUserDataCache()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('emits the view and normalized detail answer from the rendered controls', async () => {
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
          externalId="email-hash-1"
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

    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'post_purchase_survey_viewed'),
    ).toMatchObject({
      transaction_id: 'subscription-1',
      customer_id: 'customer-1',
      survey_key: 'checkout_attribution',
    })

    const button = (label: string) =>
      Array.from(container.querySelectorAll('button')).find(
        (candidate) => candidate.textContent === label,
      )

    await act(async () => button('Social media')!.click())
    await act(async () => button('Instagram')!.click())

    expect(
      window.dataLayer.find((entry) => entry.canonical_event === 'post_purchase_survey_answered'),
    ).toMatchObject({
      related_event_id: 'acquisition-1',
      transaction_id: 'subscription-1',
      customer_id: 'customer-1',
      question_key: 'discovery_source',
      answer_code: 'social_media',
      answer_detail_code: 'instagram',
      persistence_status: 'client_only',
    })
  })
})
