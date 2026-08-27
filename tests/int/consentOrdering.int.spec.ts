import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ketchConsentBindingScript } from '@/lib/ketchConsentBridge'

describe('consent bootstrap ordering', () => {
  it('establishes closed consent defaults before loading GTM and Ketch', () => {
    const layout = readFileSync(resolve('src/app/(frontend)/[locale]/layout.tsx'), 'utf8')
    const css = readFileSync(resolve('src/app/(frontend)/[locale]/globals.css'), 'utf8')
    const consent = layout.indexOf('id="gtag-consent-mode"')
    const gtm = layout.indexOf('id="gtm-head"')
    const ketchLanguage = layout.indexOf('id="ketch-lang"')
    const ketchBoot = layout.indexOf('id="ketch-boot"')
    const bootUrl = 'https://global.ketchcdn.com/web/v3/config/nb1_health/website_smart_tag/boot.js'

    expect(consent).toBeGreaterThan(-1)
    expect(consent).toBeLessThan(gtm)
    expect(gtm).toBeLessThan(ketchLanguage)
    expect(ketchLanguage).toBeLessThan(ketchBoot)
    expect(layout.split(bootUrl)).toHaveLength(2)
    expect(layout).toContain('<link href="https://cdn.ketchjs.com" rel="preconnect" />')
    expect(layout).not.toContain('<link href="https://global.ketchcdn.com" rel="preconnect" />')
    expect(layout).toContain("'analytics_storage': 'denied'")
    expect(layout).toContain("'ad_storage': 'denied'")
    expect(layout).toContain(
      'window.__nb1Consent = { analytics: false, targeted_advertising: false }',
    )
    expect(layout).not.toContain('new MutationObserver')
    expect(css).not.toContain('#ketch-consent-banner')
    expect(css).not.toContain('data-ketch-backdrop')
  })

  it('retains the published inline-action compatibility during the dashboard cutover', () => {
    const layout = readFileSync(resolve('src/app/(frontend)/[locale]/layout.tsx'), 'utf8')

    expect(layout).toContain('a[href$="#ketch-accept"]')
    expect(layout).toContain('a[href$="#ketch-reject"]')
    expect(layout).toContain('a[href$="#ketch-settings"]')
    expect(layout).toContain("'ketch-banner-button-tertiary'")
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
      Function('window', ketchConsentBindingScript())(sandbox)
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

  it('keeps providers denied when Ketch reports rejected purposes', () => {
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

    Function('window', ketchConsentBindingScript())(sandbox)

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
