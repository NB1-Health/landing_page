import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ketchConsentBindingScript } from '@/lib/ketchConsentBridge'

describe('consent bootstrap ordering', () => {
  it('establishes the temporary open consent defaults before loading GTM or Ketch', () => {
    const layout = readFileSync(resolve('src/app/(frontend)/[locale]/layout.tsx'), 'utf8')
    const consent = layout.indexOf('id="gtag-consent-mode"')
    const gtm = layout.indexOf('id="gtm-head"')
    const ketch = layout.indexOf('id="ketch-lang"')

    expect(consent).toBeGreaterThan(-1)
    expect(consent).toBeLessThan(gtm)
    expect(consent).toBeLessThan(ketch)
    expect(layout).toContain("'analytics_storage': 'granted'")
    expect(layout).toContain("'ad_storage': 'granted'")
    expect(layout).toContain("window.__nb1Consent = { analytics: true, targeted_advertising: true }")
  })

  it('waits safely when Ketch is unavailable and binds when it becomes callable', () => {
    let retry: (() => void) | undefined
    const updates: unknown[][] = []
    const sandbox = {
      __nb1Consent: {},
      gtag: (...args: unknown[]) => updates.push(args),
      setInterval: (callback: () => void) => {
        retry = callback
        return 1
      },
      clearInterval: () => undefined,
    } as Record<string, unknown>

    expect(() => {
      Function('window', ketchConsentBindingScript('en'))(sandbox)
    }).not.toThrow()

    sandbox.ketch = (command: string, argument: unknown) => {
      if (command === 'getConsent' && typeof argument === 'function') {
        argument({ purposes: { analytics: true, targeted_advertising: false } })
      }
    }
    retry?.()

    expect(updates).toContainEqual([
      'consent',
      'update',
      {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ])
  })

  it('revokes the temporary open default when Ketch reports rejected purposes', () => {
    const updates: unknown[][] = []
    const sandbox = {
      __nb1Consent: { analytics: true, targeted_advertising: true },
      gtag: (...args: unknown[]) => updates.push(args),
      ketch: (command: string, argument: unknown) => {
        if (command === 'getConsent' && typeof argument === 'function') {
          argument({ purposes: { analytics: false, targeted_advertising: false } })
        }
      },
      setInterval: () => 1,
      clearInterval: () => undefined,
    } as Record<string, unknown>

    Function('window', ketchConsentBindingScript('en'))(sandbox)

    expect(updates).toContainEqual([
      'consent',
      'update',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ])
    expect(sandbox.__nb1Consent).toEqual({
      analytics: false,
      targeted_advertising: false,
    })
  })
})
