import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearInfluencerOffer,
  INFLUENCER_OFFER_MAX_AGE_MS,
  INFLUENCER_OFFER_STORAGE_KEY,
  readCheckoutOffer,
  readInfluencerOffer,
  storeInfluencerOffer,
} from '@/lib/influencerOffer'

describe('influencer offer session handoff', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    document.cookie = 'nb1_discount=; Path=/; Max-Age=0'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes and restores an unlimited-use checkout code', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_725_440_000_000)

    expect(storeInfluencerOffer({ code: ' 20off ', sourceSlug: 'creator-example' })).toEqual({
      code: '20OFF',
      sourceSlug: 'creator-example',
      storedAt: 1_725_440_000_000,
    })
    expect(readInfluencerOffer()).toEqual({
      code: '20OFF',
      sourceSlug: 'creator-example',
      storedAt: 1_725_440_000_000,
    })
  })

  it('replaces the previous creator offer and clears it explicitly', () => {
    storeInfluencerOffer({ code: 'FIRST', sourceSlug: 'creator-a' })
    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-b' })

    expect(readInfluencerOffer()).toMatchObject({ code: '20OFF', sourceSlug: 'creator-b' })
    clearInfluencerOffer()
    expect(readInfluencerOffer()).toBeNull()
  })

  it('rejects malformed or corrupt data without throwing', () => {
    expect(storeInfluencerOffer({ code: '<script>', sourceSlug: 'creator' })).toBeNull()
    expect(storeInfluencerOffer({ code: '20OFF', sourceSlug: '../creator' })).toBeNull()

    window.sessionStorage.setItem(INFLUENCER_OFFER_STORAGE_KEY, '{bad json')
    expect(readInfluencerOffer()).toBeNull()
    expect(window.sessionStorage.getItem(INFLUENCER_OFFER_STORAGE_KEY)).toBeNull()

    window.sessionStorage.setItem(
      INFLUENCER_OFFER_STORAGE_KEY,
      JSON.stringify({ code: '20OFF', sourceSlug: '', storedAt: Date.now() }),
    )
    expect(readInfluencerOffer()).toBeNull()
    expect(window.sessionStorage.getItem(INFLUENCER_OFFER_STORAGE_KEY)).toBeNull()
  })

  it('expires an abandoned offer before a later direct checkout', () => {
    const now = 1_725_440_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)
    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-example' })

    vi.mocked(Date.now).mockReturnValue(now + INFLUENCER_OFFER_MAX_AGE_MS + 1)
    expect(readInfluencerOffer()).toBeNull()
    expect(window.sessionStorage.getItem(INFLUENCER_OFFER_STORAGE_KEY)).toBeNull()
  })

  it('fails safely when session storage is blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('blocked')
    })

    expect(storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator' })).toBeNull()
    setItem.mockRestore()
  })

  it('falls back to an ad link code, and a creator handoff wins over it', () => {
    expect(readCheckoutOffer()).toBeNull()

    document.cookie = 'nb1_discount=%20spring_20; Path=/'
    expect(readCheckoutOffer()).toEqual({ code: 'SPRING_20', source: 'link' })

    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-example' })
    expect(readCheckoutOffer()).toMatchObject({
      code: '20OFF',
      sourceSlug: 'creator-example',
      source: 'influencer',
    })
  })

  it('ignores a malformed link code and clears a valid one with the creator offer', () => {
    document.cookie = 'nb1_discount=%3Cscript%3E; Path=/'
    expect(readCheckoutOffer()).toBeNull()

    document.cookie = 'nb1_discount=SPRING20; Path=/'
    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-example' })
    clearInfluencerOffer()
    expect(readCheckoutOffer()).toBeNull()
    expect(document.cookie).not.toContain('nb1_discount')
  })

  it('never throws when the browser rejects cookie writes (runs before the order confirmation)', () => {
    storeInfluencerOffer({ code: '20OFF', sourceSlug: 'creator-example' })
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')!
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => descriptor.get!.call(document),
      set: () => {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      },
    })
    try {
      expect(() => clearInfluencerOffer()).not.toThrow()
      expect(readInfluencerOffer()).toBeNull()
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie
    }
  })
})
