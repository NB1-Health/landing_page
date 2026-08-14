'use client'

import type { Ga4EventName, Ecommerce, UserData, MetaEventPayload } from './types'
import { sanitizeAttributionUrl } from '@/lib/commercialIdentity'

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

function hasMktConsent(): boolean {
  return window.__nb1Consent?.targeted_advertising === true
}

let consentResolution: Promise<void> | undefined

function waitForConsentResolution(): Promise<void> {
  if (window.__nb1ConsentResolved === true || hasMktConsent()) return Promise.resolve()
  if (!consentResolution) {
    consentResolution = new Promise((resolve) => {
      window.addEventListener(
        'nb1:consent-resolved',
        () => {
          consentResolution = undefined
          resolve()
        },
        { once: true },
      )
    })
  }
  return consentResolution
}

/** Build fbc from fbclid query param if _fbc cookie is absent */
function resolveFbc(): string | undefined {
  const fbc = getCookie('_fbc')
  if (fbc) return fbc
  const params = new URLSearchParams(window.location.search)
  const fbclid = params.get('fbclid')
  if (fbclid) return `fb.1.${Date.now()}.${fbclid}`
  return undefined
}

export async function sendMetaCapiEvent(
  event: Ga4EventName,
  event_id: string,
  opts: {
    ecommerce?: Ecommerce
    user?: UserData
  } = {},
) {
  if (typeof window === 'undefined') return
  await waitForConsentResolution()
  if (!hasMktConsent()) return

  const payload: MetaEventPayload = {
    event,
    event_id,
    ecommerce: opts.ecommerce,
    user: opts.user,
    fbp: getCookie('_fbp'),
    fbc: resolveFbc(),
    sourceUrl: sanitizeAttributionUrl(window.location.href),
    consent: true,
  }

  try {
    await fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // fire-and-forget — don't block UI
      keepalive: true,
    })
  } catch {
    // non-critical; swallow silently
  }
}
