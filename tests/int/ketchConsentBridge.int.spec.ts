import { describe, expect, it, vi } from 'vitest'

import { ketchConsentBindingScript } from '@/lib/ketchConsentBridge'

describe('Ketch consent bridge contract', () => {
  it('resolves consent before notifying GTM and does not require gtag', () => {
    const script = ketchConsentBindingScript('en-GB')
    expect(script).toContain('window.__nb1ConsentResolved=true')
    expect(script).toContain("event:'nb1_consent_resolved'")
    expect(script).toContain("new Event('nb1:consent-resolved')")
    expect(script).not.toContain("if(typeof window.gtag!=='function')return")
  })

  it('keeps previously consented attribution inert while Ketch is resolving', () => {
    const values = new Map([
      ['nb1_checkout_attribution', JSON.stringify({ utm_source: 'search', gclid: 'stale' })],
    ])
    const sandbox = {
      __nb1Consent: { analytics: false, targeted_advertising: false },
      __nb1ConsentResolved: false,
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
      setInterval: () => 1,
      clearInterval: () => undefined,
    } as Record<string, unknown>

    Function('window', ketchConsentBindingScript('en'))(sandbox)
    expect(JSON.parse(values.get('nb1_checkout_attribution') ?? '{}')).toEqual({
      utm_source: 'search',
      gclid: 'stale',
    })
  })

  it('scrubs advertising attribution when consent is withdrawn', () => {
    const values = new Map([
      ['nb1_checkout_attribution', JSON.stringify({ utm_source: 'search', gbraid: 'stale' })],
    ])
    let consentHandler: ((consent: unknown) => void) | undefined
    const sandbox = {
      __nb1Consent: { analytics: true, targeted_advertising: true },
      __nb1ConsentResolved: true,
      dataLayer: [],
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
      ketch: (command: string, argument: unknown, callback?: (consent: unknown) => void) => {
        if (command === 'getConsent' && typeof argument === 'function') {
          argument({ purposes: { analytics: true, targeted_advertising: true } })
        }
        if (command === 'on' && argument === 'consent') consentHandler = callback
      },
      setInterval: () => 1,
      clearInterval: () => undefined,
    } as Record<string, unknown>

    Function('window', ketchConsentBindingScript('en'))(sandbox)
    consentHandler?.({ purposes: { analytics: true, targeted_advertising: false } })
    expect(JSON.parse(values.get('nb1_checkout_attribution') ?? '{}')).toEqual({
      utm_source: 'search',
    })
  })

  it('notifies GTM once per normalized consent state', () => {
    let consentHandler: ((consent: unknown) => void) | undefined
    const dataLayer: Array<Record<string, unknown>> = []
    const gtag = vi.fn()
    const dispatchEvent = vi.fn()
    const initialConsent = { purposes: { analytics: true, targeted_advertising: true } }
    const sandbox = {
      __nb1Consent: {},
      __nb1ConsentResolved: false,
      dataLayer,
      gtag,
      dispatchEvent,
      sessionStorage: {
        getItem: () => null,
        removeItem: () => undefined,
      },
      ketch: (command: string, argument: unknown, callback?: (consent: unknown) => void) => {
        if (command === 'getConsent' && typeof argument === 'function') argument(initialConsent)
        if (command === 'on' && argument === 'consent') consentHandler = callback
      },
      setInterval: () => 1,
      clearInterval: () => undefined,
    } as Record<string, unknown>

    Function('window', ketchConsentBindingScript('en'))(sandbox)
    consentHandler?.(initialConsent)
    consentHandler?.({ purposes: { analytics: true, targeted_advertising: false } })
    consentHandler?.({ purposes: { analytics: true, targeted_advertising: false } })

    expect(dataLayer).toEqual([
      {
        event: 'nb1_consent_resolved',
        analytics_consent: true,
        marketing_consent: true,
      },
      {
        event: 'nb1_consent_resolved',
        analytics_consent: true,
        marketing_consent: false,
      },
    ])
    expect(gtag).toHaveBeenCalledTimes(2)
    expect(dispatchEvent).toHaveBeenCalledTimes(2)
  })
})
