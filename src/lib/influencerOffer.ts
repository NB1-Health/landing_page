'use client'

export const INFLUENCER_OFFER_STORAGE_KEY = 'nb1_influencer_offer'
export const INFLUENCER_OFFER_MAX_AGE_MS = 30 * 60 * 1000

const CODE_PATTERN = /^[A-Z0-9_-]{1,64}$/
const SOURCE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CLOCK_SKEW_MS = 60 * 1000

export type InfluencerOffer = {
  code: string
  sourceSlug: string
  storedAt: number
}

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

export function clearInfluencerOffer(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(INFLUENCER_OFFER_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}
