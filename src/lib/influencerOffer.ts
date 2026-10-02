'use client'

export const INFLUENCER_OFFER_STORAGE_KEY = 'nb1_influencer_offer'
export const INFLUENCER_OFFER_MAX_AGE_MS = 30 * 60 * 1000
// Ad links (try.nb1.com or nb1.com with ?discount=CODE) leave the code in this
// .nb1.com cookie; the try.nb1.com lead gates write the same cookie.
export const LINK_DISCOUNT_COOKIE = 'nb1_discount'

const CODE_PATTERN = /^[A-Z0-9_-]{1,64}$/
const SOURCE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CLOCK_SKEW_MS = 60 * 1000

export type InfluencerOffer = {
  code: string
  sourceSlug: string
  storedAt: number
}

/** The code the checkout applies on its own. A creator handoff beats a link code. */
export type CheckoutOffer =
  | (InfluencerOffer & { source: 'influencer' })
  | { code: string; source: 'link' }

export function storeInfluencerOffer({
  code,
  sourceSlug,
}: Pick<InfluencerOffer, 'code' | 'sourceSlug'>): InfluencerOffer | null {
  if (typeof window === 'undefined') return null

  const normalizedCode = code.trim().toUpperCase()
  const normalizedSource = sourceSlug.trim()
  if (
    !CODE_PATTERN.test(normalizedCode) ||
    normalizedSource.length > 70 ||
    !SOURCE_PATTERN.test(normalizedSource)
  )
    return null

  const offer = { code: normalizedCode, sourceSlug: normalizedSource, storedAt: Date.now() }
  try {
    window.sessionStorage.setItem(INFLUENCER_OFFER_STORAGE_KEY, JSON.stringify(offer))
    return offer
  } catch {
    return null
  }
}

export function readInfluencerOffer(): InfluencerOffer | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(INFLUENCER_OFFER_STORAGE_KEY)
    if (!raw) return null
    const offer = JSON.parse(raw) as Partial<InfluencerOffer>
    if (
      typeof offer.code !== 'string' ||
      !CODE_PATTERN.test(offer.code) ||
      typeof offer.sourceSlug !== 'string' ||
      offer.sourceSlug.length > 70 ||
      !SOURCE_PATTERN.test(offer.sourceSlug) ||
      typeof offer.storedAt !== 'number' ||
      !Number.isFinite(offer.storedAt) ||
      offer.storedAt > Date.now() + CLOCK_SKEW_MS ||
      Date.now() - offer.storedAt > INFLUENCER_OFFER_MAX_AGE_MS
    ) {
      window.sessionStorage.removeItem(INFLUENCER_OFFER_STORAGE_KEY)
      return null
    }
    return offer as InfluencerOffer
  } catch {
    clearInfluencerOffer()
    return null
  }
}

export function readLinkDiscountCode(): string | null {
  if (typeof document === 'undefined') return null

  for (const part of document.cookie.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name !== LINK_DISCOUNT_COOKIE) continue
    try {
      const code = decodeURIComponent(value.join('=')).trim().toUpperCase()
      if (CODE_PATTERN.test(code)) return code
    } catch {
      // Malformed cookie value: treat as absent.
    }
  }
  return null
}

export function readCheckoutOffer(): CheckoutOffer | null {
  const influencer = readInfluencerOffer()
  if (influencer) return { ...influencer, source: 'influencer' }
  const code = readLinkDiscountCode()
  return code ? { code, source: 'link' } : null
}

/** Clears both the creator handoff and the link code, so neither comes back on reload. */
export function clearInfluencerOffer(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(INFLUENCER_OFFER_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  // Expire the host-only and the shared .nb1.com copies alike.
  const expired = `${LINK_DISCOUNT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  document.cookie = expired
  if (/(^|\.)nb1\.com$/.test(window.location.hostname)) {
    document.cookie = `${expired}; Domain=.nb1.com`
  }
}
