import { beforeEach, describe, expect, it } from 'vitest'

import {
  getCommercialIdentity,
  getKlarSeptemberId,
  sanitizeAttributionUrl,
  waitForCommercialConsentResolution,
} from '@/lib/commercialIdentity'
import { getPermittedCheckoutAttribution } from '@/lib/checkoutApi'

describe('checkout commercial identity bridge', () => {
  beforeEach(() => {
    for (const name of ['september_id', '_ga', '_fbp', '_fbc']) {
      document.cookie = `${name}=; Path=/; Max-Age=0`
    }
    window.sessionStorage.clear()
    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    window.__nb1KlarSeptemberId = undefined
    window.history.replaceState({}, '', '/checkout?utm_source=search&fbclid=click-1')
  })

  it('reads the Klar September ID without minting a substitute', () => {
    document.cookie = 'september_id=abcdefghijklmnop; Path=/'
    expect(getKlarSeptemberId()).toBe('abcdefghijklmnop')
    window.__nb1KlarSeptemberId = 'ponmlkjihgfedcba'
    expect(getKlarSeptemberId()).toBe('ponmlkjihgfedcba')
  })

  it('returns no marketing identifiers without consent', () => {
    window.__nb1Consent = { analytics: true, targeted_advertising: false }
    document.cookie = '_ga=GA1.2.1.2; Path=/'
    document.cookie = '_fbp=fb.1.2.3; Path=/'

    expect(getCommercialIdentity()).toEqual({
      marketing_consent: false,
      consent_resolved: true,
    })
    expect(getKlarSeptemberId()).toBeUndefined()
  })

  it('returns only the consented allowlisted context', () => {
    document.cookie = 'september_id=abcdefghijklmnop; Path=/'
    document.cookie = '_ga=GA1.2.1.2; Path=/'
    document.cookie = '_fbp=fb.1.2.3; Path=/'
    document.cookie = '_fbc=fb.1.2.click; Path=/'

    expect(getCommercialIdentity()).toMatchObject({
      marketing_consent: true,
      september_id: 'abcdefghijklmnop',
      google_analytics_id: 'GA1.2.1.2',
      facebook_browser_id: 'fb.1.2.3',
      facebook_click_id: 'fb.1.2.click',
      page_url: expect.stringMatching(/\/checkout$/),
      screen: expect.stringMatching(/^\d+x\d+$/),
    })
  })

  it('preserves the existing fbclid fallback when the _fbc cookie is unavailable', () => {
    expect(getCommercialIdentity().facebook_click_id).toMatch(/^fb\.1\.\d+\.click-1$/)
  })

  it('strips Stripe secrets, query parameters, and fragments from URLs', () => {
    expect(
      sanitizeAttributionUrl(
        'https://nb1.com/checkout?setup_intent_client_secret=seti_secret&fbclid=click#done',
      ),
    ).toBe('https://nb1.com/checkout')
  })

  it('waits for restored consent after a redirect but remains bounded', async () => {
    window.__nb1ConsentResolved = false
    const restored = waitForCommercialConsentResolution(100)
    window.__nb1ConsentResolved = true
    window.dispatchEvent(new Event('nb1:consent-resolved'))
    await expect(restored).resolves.toBeUndefined()

    window.__nb1ConsentResolved = false
    await expect(waitForCommercialConsentResolution(0)).resolves.toBeUndefined()
  })

  it('persists only consented allowlisted attribution across redirects', () => {
    window.history.replaceState(
      {},
      '',
      '/checkout?utm_source=search&gclid=google-1&gbraid=braid-1&wbraid=web-braid-1&fbclid=click-1',
    )
    expect(getPermittedCheckoutAttribution()).toEqual({
      utm_source: 'search',
      gclid: 'google-1',
      gbraid: 'braid-1',
      wbraid: 'web-braid-1',
      fbclid: 'click-1',
    })

    window.history.replaceState({}, '', '/checkout')
    window.sessionStorage.setItem(
      'nb1_checkout_attribution',
      JSON.stringify({ utm_source: 'search', gclid: 'google-1', health_answer: 'drop-me' }),
    )
    expect(getPermittedCheckoutAttribution()).toEqual({
      utm_source: 'search',
      gclid: 'google-1',
    })
  })

  it('keeps advertising attribution inert while unresolved and removes it when denied', () => {
    window.__nb1ConsentResolved = false
    window.sessionStorage.setItem(
      'nb1_checkout_attribution',
      JSON.stringify({ utm_campaign: 'stored', gclid: 'stale', fbclid: 'stale' }),
    )

    expect(getPermittedCheckoutAttribution()).toEqual({
      utm_campaign: 'stored',
      utm_source: 'search',
    })
    expect(JSON.parse(window.sessionStorage.getItem('nb1_checkout_attribution') ?? '{}')).toEqual({
      utm_campaign: 'stored',
      utm_source: 'search',
      gclid: 'stale',
      fbclid: 'stale',
    })

    window.__nb1ConsentResolved = true
    window.__nb1Consent = { analytics: true, targeted_advertising: false }
    expect(getPermittedCheckoutAttribution()).toEqual({
      utm_campaign: 'stored',
      utm_source: 'search',
    })
    expect(JSON.parse(window.sessionStorage.getItem('nb1_checkout_attribution') ?? '{}')).toEqual({
      utm_campaign: 'stored',
      utm_source: 'search',
    })
  })
})
