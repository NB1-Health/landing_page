'use client'

import { getPermittedCheckoutAttribution } from './checkoutApi'

const KLAR_SEPTEMBER_COOKIE = 'september_id'

export type CommercialIdentity = {
  marketing_consent: boolean
  consent_resolved: boolean
  september_id?: string
  google_analytics_id?: string
  facebook_browser_id?: string
  facebook_click_id?: string
  page_url?: string
  referrer?: string
  screen?: string
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const prefix = `${encodeURIComponent(name)}=`
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
  if (!match) return undefined
  try {
    return decodeURIComponent(match.slice(prefix.length))
  } catch {
    return undefined
  }
}

function validSeptemberId(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{16}$/.test(value))
}

function resolveFacebookClickId(): string | undefined {
  const cookieValue = readCookie('_fbc')
  if (cookieValue) return cookieValue.slice(0, 256)
  const fbclid = getPermittedCheckoutAttribution()?.fbclid
  return fbclid ? `fb.1.${Date.now()}.${fbclid}`.slice(0, 256) : undefined
}

/** Read the consented Klar session ID observed by the existing browser pixel. */
export function getKlarSeptemberId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  if (window.__nb1ConsentResolved !== true || window.__nb1Consent?.targeted_advertising !== true)
    return undefined

  const bridged = window.__nb1KlarSeptemberId
  if (validSeptemberId(bridged)) return bridged
  const cookieValue = readCookie(KLAR_SEPTEMBER_COOKIE)
  return validSeptemberId(cookieValue) ? cookieValue : undefined
}

export function sanitizeAttributionUrl(value: string): string | undefined {
  if (!value) return undefined
  try {
    const base = typeof window === 'undefined' ? undefined : window.location.origin
    const url = new URL(value, base)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    // Stripe return URLs can contain SetupIntent client secrets.
    return `${url.origin}${url.pathname}`.slice(0, 2048)
  } catch {
    return undefined
  }
}

/** Give Ketch a bounded chance to restore persisted consent after a full-page payment redirect. */
export function waitForCommercialConsentResolution(timeoutMs = 2000): Promise<void> {
  if (typeof window === 'undefined' || window.__nb1ConsentResolved === true) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener('nb1:consent-resolved', finish)
      clearTimeout(timeout)
      resolve()
    }
    window.addEventListener('nb1:consent-resolved', finish, { once: true })
    const timeout = setTimeout(finish, Math.max(0, timeoutMs))
  })
}

/** Build the tightly allowlisted context accepted by the backend checkout schema. */
export function getCommercialIdentity(): CommercialIdentity {
  if (typeof window === 'undefined') {
    return { marketing_consent: false, consent_resolved: false }
  }
  const marketingConsent =
    window.__nb1ConsentResolved === true && window.__nb1Consent?.targeted_advertising === true
  if (!marketingConsent) {
    return {
      marketing_consent: false,
      consent_resolved: window.__nb1ConsentResolved === true,
    }
  }

  const pageUrl = sanitizeAttributionUrl(window.location.href)
  const referrer = sanitizeAttributionUrl(document.referrer)
  return {
    marketing_consent: true,
    consent_resolved: true,
    september_id: getKlarSeptemberId(),
    google_analytics_id: readCookie('_ga')?.slice(0, 256),
    facebook_browser_id: readCookie('_fbp')?.slice(0, 256),
    facebook_click_id: resolveFacebookClickId(),
    ...(pageUrl ? { page_url: pageUrl } : {}),
    ...(referrer ? { referrer } : {}),
    screen: `${window.screen.width}x${window.screen.height}`,
  }
}
