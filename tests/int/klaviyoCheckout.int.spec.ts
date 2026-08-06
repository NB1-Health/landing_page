import {
  captureFirstTouchAttribution,
  resetKlaviyoCheckoutTracking,
  trackKlaviyoCheckoutCompleted,
  trackKlaviyoStartedCheckout,
} from '@/lib/klaviyoCheckout'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type MemoryStorage = Storage & { values: Map<string, string> }

function memoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const values = new Map(Object.entries(initial))
  return {
    values,
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, String(value)),
  }
}

function locationFor(url: string): Location {
  const parsed = new URL(url)
  return {
    href: parsed.href,
    origin: parsed.origin,
    protocol: parsed.protocol,
    host: parsed.host,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
  } as Location
}

function browserHarness(
  options: {
    url?: string
    referrer?: string
    cookie?: string
    local?: Record<string, string>
  } = {},
) {
  const cookieWrites: string[] = []
  let cookie = options.cookie ?? ''
  const documentStub = {
    documentElement: { lang: 'en' },
    referrer: options.referrer ?? '',
    get cookie() {
      return cookie
    },
    set cookie(value: string) {
      cookieWrites.push(value)
      const pair = value.split(';', 1)[0]
      const name = pair.slice(0, pair.indexOf('='))
      const entries = cookie
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !part.startsWith(`${name}=`))
      entries.push(pair)
      cookie = entries.join('; ')
    },
  }
  const localStorage = memoryStorage(options.local)
  const sessionStorage = memoryStorage()
  const fakeWindow = {
    document: documentStub,
    location: locationFor(
      options.url ?? 'https://nb1.com/en/order?utm_source=meta&utm_medium=paid&utm_campaign=summer',
    ),
    localStorage,
    sessionStorage,
    klaviyo: undefined as Window['klaviyo'] | undefined,
  }
  vi.stubGlobal('window', fakeWindow)
  vi.stubGlobal('document', documentStub)
  return {
    cookie: () => cookie,
    cookieWrites,
    document: documentStub,
    localStorage,
    sessionStorage,
    window: fakeWindow,
  }
}

describe('shared first-touch attribution', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)
    resetKlaviyoCheckoutTracking()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('captures only allowlisted fields and strips query data from landing and referrer URLs', () => {
    const browser = browserHarness({
      url: 'https://nb1.com/en/order?utm_source=meta&utm_campaign=summer&secret=drop-me#payment',
      referrer: 'https://www.google.com/search?q=sensitive#result',
    })

    expect(captureFirstTouchAttribution()).toEqual({
      v: 1,
      ts: 1_800_000_000_000,
      landing_url: 'https://nb1.com/en/order',
      referrer: 'https://www.google.com/search',
      params: { utm_source: 'meta', utm_campaign: 'summer' },
    })
    expect(JSON.parse(browser.localStorage.getItem('nb1_attr') ?? '{}')).not.toHaveProperty(
      'secret',
    )
    expect(browser.cookieWrites[0]).toContain('Domain=.nb1.com')
    expect(browser.cookieWrites[0]).toContain('Max-Age=7776000')
    expect(browser.cookieWrites[0]).toContain('SameSite=Lax')
    expect(browser.cookieWrites[0]).toContain('Secure')
    expect(browser.cookieWrites[0]).not.toContain('drop-me')
    expect(browser.cookieWrites[0]).not.toContain('sensitive')
  })

  it('migrates Oscar’s existing localStorage record and never overwrites the first touch', () => {
    const legacy = JSON.stringify({
      ts: 1_799_999_000_000,
      landing_path: '/early-access/',
      params: { utm_source: 'meta', utm_campaign: 'first-touch' },
    })
    const browser = browserHarness({
      url: 'https://try.nb1.com/second/?utm_source=google&utm_campaign=second-touch',
      local: { nb1_attr: legacy },
    })

    expect(captureFirstTouchAttribution()).toMatchObject({
      ts: 1_799_999_000_000,
      landing_url: 'https://try.nb1.com/early-access/',
      params: { utm_source: 'meta', utm_campaign: 'first-touch' },
    })
    expect(decodeURIComponent(browser.cookie().split('=', 2)[1])).toContain('first-touch')

    browser.window.location = locationFor(
      'https://try.nb1.com/third/?utm_source=meta&utm_campaign=third-touch',
    )
    expect(captureFirstTouchAttribution()?.params.utm_campaign).toBe('first-touch')
  })

  it('upgrades an organic visit at the first attributable touch, then preserves it', () => {
    const organic = JSON.stringify({
      v: 1,
      ts: 1_799_999_000_000,
      landing_url: 'https://try.nb1.com/organic/',
      params: {},
    })
    const browser = browserHarness({
      url: 'https://try.nb1.com/paid/?utm_source=meta&utm_campaign=first-paid',
      local: { nb1_attr: organic },
      cookie: `nb1_attr=${encodeURIComponent(organic)}`,
    })

    expect(captureFirstTouchAttribution()).toMatchObject({
      ts: 1_800_000_000_000,
      landing_url: 'https://try.nb1.com/paid/',
      params: { utm_source: 'meta', utm_campaign: 'first-paid' },
    })

    browser.window.location = locationFor(
      'https://nb1.com/en/order?utm_source=google&utm_campaign=second-paid',
    )
    expect(captureFirstTouchAttribution()).toMatchObject({
      landing_url: 'https://try.nb1.com/paid/',
      params: { utm_source: 'meta', utm_campaign: 'first-paid' },
    })
  })

  it('recovers safely from malformed and expired stored values', () => {
    const expired = JSON.stringify({
      v: 1,
      ts: 1_700_000_000_000,
      landing_url: 'https://try.nb1.com/expired',
      params: { utm_source: 'expired' },
    })
    browserHarness({
      url: 'https://nb1.com/en/order?utm_source=fresh',
      cookie: 'nb1_attr=%7Bbad-json',
      local: { nb1_attr: expired },
    })

    expect(captureFirstTouchAttribution()).toMatchObject({
      ts: 1_800_000_000_000,
      landing_url: 'https://nb1.com/en/order',
      params: { utm_source: 'fresh' },
    })
  })

  it('keeps the shared cookie within its byte budget without truncating local attribution', () => {
    class RawUnicodeUrl extends URL {
      get pathname() {
        return this.hostname === 'try.nb1.com' ? `/${'\u2028'.repeat(600)}` : super.pathname
      }
    }

    const browser = browserHarness({
      url: 'https://try.nb1.com/extreme/',
      referrer: 'https://example.com/referrer/',
    })
    vi.stubGlobal('URL', RawUnicodeUrl)

    captureFirstTouchAttribution()

    const fullRecord = JSON.parse(browser.localStorage.getItem('nb1_attr') ?? '{}')
    const encodedCookie = browser.cookie().split(';', 1)[0].slice('nb1_attr='.length)
    const boundedRecord = JSON.parse(decodeURIComponent(encodedCookie))
    expect(fullRecord.referrer).toBe('https://example.com/referrer/')
    expect(boundedRecord.referrer).toBeUndefined()
    expect(boundedRecord.landing_url.length).toBeLessThan(fullRecord.landing_url.length)
    expect(new TextEncoder().encode(encodedCookie).length).toBeLessThanOrEqual(3800)
  })
})

describe('Klaviyo checkout events', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000)
    resetKlaviyoCheckoutTracking()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('identifies the profile before emitting one Started Checkout event', () => {
    const browser = browserHarness({
      url: 'https://nb1.com/en/order?utm_source=meta&utm_campaign=summer&utm_content=hero',
      referrer: 'https://try.nb1.com/early-access/?utm_source=meta',
    })
    const calls: Array<{ name: string; properties: Record<string, unknown> }> = []
    browser.window.klaviyo = {
      push: vi.fn(),
      identify: vi.fn((properties: Record<string, unknown>, callback: () => void) => {
        calls.push({ name: 'identify', properties })
        callback()
      }),
      track: vi.fn((name: string, properties: Record<string, unknown>) => {
        calls.push({ name, properties })
      }),
    } as Window['klaviyo']

    const input = {
      email: ' Buyer@Example.com ',
      checkoutId: 'checkout-1',
      language: 'en',
      currency: 'EUR',
      cartValue: 99,
      coupon: 'WELCOME',
      item: {
        item_id: 'NB1-CORE-4',
        item_name: 'NB1 Core Plan',
        item_variant: '4-Month Subscription',
        quantity: 1,
      },
    }

    expect(trackKlaviyoStartedCheckout(input)).toBe(true)
    expect(trackKlaviyoStartedCheckout(input)).toBe(false)
    expect(calls.map((call) => call.name)).toEqual(['identify', 'Started Checkout'])
    expect(calls[0].properties).toMatchObject({
      email: 'buyer@example.com',
      language: 'en',
      nb1_utm_source: 'meta',
      nb1_utm_campaign: 'summer',
      nb1_first_landing_url: 'https://nb1.com/en/order',
      nb1_first_referrer: 'https://try.nb1.com/early-access/',
    })
    expect(calls[1].properties).toMatchObject({
      $event_id: expect.stringMatching(/^started_checkout:checkout-1:/),
      checkout_id: 'checkout-1',
      checkout_url: 'https://nb1.com/en/order',
      currency: 'EUR',
      cart_value: 99,
      item_id: 'NB1-CORE-4',
      coupon: 'WELCOME',
      nb1_meta_ad_name: 'hero',
    })

    expect(trackKlaviyoStartedCheckout({ ...input, email: 'corrected@example.com' })).toBe(true)
    expect(calls.map((call) => call.name)).toEqual([
      'identify',
      'Started Checkout',
      'identify',
      'Started Checkout',
    ])
    expect(calls[2].properties.email).toBe('corrected@example.com')
    expect(calls[3].properties.$event_id).not.toBe(calls[1].properties.$event_id)
  })

  it('emits one completed event per confirmed transaction and never reports browser revenue', () => {
    const browser = browserHarness()
    const identify = vi.fn((_properties: Record<string, unknown>, callback: () => void) =>
      callback(),
    )
    const track = vi.fn()
    browser.window.klaviyo = { push: vi.fn(), identify, track } as Window['klaviyo']
    const input = {
      email: 'buyer@example.com',
      checkoutId: 'checkout-1',
      transactionId: 'subscription-1',
      orderNumber: 'NB1-123',
      planSlug: 'core-4',
      billingCycle: '4',
      language: 'en',
      currency: 'EUR',
      cartValue: 99,
      item: { item_id: 'NB1-CORE-4', item_name: 'NB1 Core Plan', quantity: 1 },
    }

    expect(trackKlaviyoCheckoutCompleted(input)).toBe(true)
    expect(trackKlaviyoCheckoutCompleted(input)).toBe(false)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'Checkout Completed',
      expect.objectContaining({
        $event_id: 'checkout_completed:subscription-1',
        transaction_id: 'subscription-1',
        order_number: 'NB1-123',
        plan_slug: 'core-4',
      }),
      expect.any(Function),
    )
    expect(track.mock.calls[0][1]).not.toHaveProperty('$value')
  })

  it('carries try.nb1.com attribution into the confirmed checkout event', () => {
    const attribution = {
      v: 1,
      ts: 1_799_999_000_000,
      landing_url: 'https://try.nb1.com/early-access/',
      referrer: 'https://facebook.com/ad/',
      params: {
        utm_source: 'meta',
        utm_medium: 'paid-social',
        utm_campaign: 'try-launch',
      },
    }
    const browser = browserHarness({
      url: 'https://nb1.com/en/order?utm_source=google&utm_campaign=later',
      cookie: `nb1_attr=${encodeURIComponent(JSON.stringify(attribution))}`,
      local: {
        nb1_attr: JSON.stringify({
          v: 1,
          ts: 1_799_998_000_000,
          landing_url: 'https://nb1.com/organic/',
          params: {},
        }),
      },
    })
    const identify = vi.fn((_properties: Record<string, unknown>, callback: () => void) =>
      callback(),
    )
    const track = vi.fn()
    browser.window.klaviyo = {
      push: vi.fn(),
      identify,
      track,
    } as Window['klaviyo']

    expect(
      trackKlaviyoCheckoutCompleted({
        email: 'buyer@example.com',
        checkoutId: 'checkout-from-try',
        transactionId: 'subscription-from-try',
        language: 'en',
        currency: 'EUR',
        cartValue: 99,
        item: { item_id: 'NB1-CORE-4' },
      }),
    ).toBe(true)
    expect(identify).toHaveBeenCalledWith(
      expect.objectContaining({
        nb1_utm_source: 'meta',
        nb1_utm_medium: 'paid-social',
        nb1_utm_campaign: 'try-launch',
        nb1_first_landing_url: 'https://try.nb1.com/early-access/',
        nb1_first_referrer: 'https://facebook.com/ad/',
      }),
      expect.any(Function),
    )
    expect(track).toHaveBeenCalledWith(
      'Checkout Completed',
      expect.objectContaining({
        nb1_utm_source: 'meta',
        nb1_utm_medium: 'paid-social',
        nb1_utm_campaign: 'try-launch',
        nb1_first_landing_url: 'https://try.nb1.com/early-access/',
        nb1_first_referrer: 'https://facebook.com/ad/',
      }),
      expect.any(Function),
    )
  })

  it('fails open when Klaviyo is unavailable and accepts a later retry', () => {
    const browser = browserHarness()
    const input = {
      email: 'buyer@example.com',
      checkoutId: 'checkout-1',
      language: 'en',
      currency: 'EUR',
      cartValue: 99,
      item: { item_id: 'NB1-CORE-4' },
    }

    expect(() => trackKlaviyoStartedCheckout(input)).not.toThrow()
    expect(trackKlaviyoStartedCheckout(input)).toBe(false)

    browser.window.klaviyo = {
      push: vi.fn(),
      identify: vi.fn((_properties: Record<string, unknown>, callback: () => void) => callback()),
      track: vi.fn(),
    } as Window['klaviyo']
    expect(trackKlaviyoStartedCheckout(input)).toBe(true)
  })

  it('accepts a retry when Klaviyo resolves an event with false', async () => {
    const browser = browserHarness()
    const input = {
      email: 'buyer@example.com',
      checkoutId: 'checkout-1',
      language: 'en',
      currency: 'EUR',
      cartValue: 99,
      item: { item_id: 'NB1-CORE-4' },
    }
    const track = vi.fn().mockResolvedValue(false)
    browser.window.klaviyo = {
      push: vi.fn(),
      identify: vi.fn((_properties: Record<string, unknown>, callback: () => void) => callback()),
      track,
    } as Window['klaviyo']

    expect(trackKlaviyoStartedCheckout(input)).toBe(true)
    await Promise.resolve()
    await Promise.resolve()
    expect(trackKlaviyoStartedCheckout(input)).toBe(true)
    expect(track).toHaveBeenCalledTimes(2)
  })
})
