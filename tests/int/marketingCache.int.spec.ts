import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { middleware } from '@/middleware'
import {
  getMarketingCachePaths,
  MARKETING_EDGE_CONTROL,
  marketingCacheHeaders,
} from '@/utilities/marketingCachePolicy.mjs'
import { matchHas } from 'next/dist/shared/lib/router/utils/prepare-destination'
import { canCacheMarketingRequest } from '@/utilities/marketingCache'

const request = (path = '/en', headers: Record<string, string> = {}, method = 'GET') =>
  new NextRequest(`https://nb1.com${path}`, { method, headers })

beforeEach(() => {
  vi.stubEnv('MARKETING_EDGE_CACHE_ENABLED', 'true')
  vi.stubEnv('MARKETING_EDGE_CACHE_PATHS', undefined)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('marketing HTML cache boundary', () => {
  it.each(['Mozilla/5.0', 'facebookexternalhit/1.1', 'meta-externalagent/1.1', 'Googlebot'])(
    'gives %s the same cookie-free public response without a REST lookup',
    async (agent) => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://nb1.com')
      const response = await middleware(
        request('/en', {
          'user-agent': agent,
          'cf-ipcountry': 'DE',
          accept: 'text/html',
        }),
      )
      expect(canCacheMarketingRequest(request('/en', { 'user-agent': agent }))).toBe(true)
      expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBeNull()
      expect(response.headers.get('set-cookie')).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('is disabled unless explicitly enabled', () => {
    vi.stubEnv('MARKETING_EDGE_CACHE_ENABLED', undefined)
    expect(canCacheMarketingRequest(request())).toBe(false)
  })

  it.each([
    '/en/checkout',
    '/en/order-cycle-core',
    '/de/bestellen-details',
    '/fr/commander-details',
    '/de/bestellen',
    '/fr/commander',
    '/en/influencers/alex',
    '/en/journal/topics/health',
    '/de/journal/themen/darm',
    '/en/search',
    '/api/meta/events',
    '/cms/admin',
    '/en/next/preview',
    '/en/unknown',
    '/en.jpg',
    '/',
    '/en/',
    '/xx',
    '/en?preview=true',
    '/en?_rsc=123',
    '/en?utm_source=facebook',
  ])('does not opt %s into shared HTML caching', (path) => {
    expect(canCacheMarketingRequest(request(path))).toBe(false)
  })

  it.each<Record<string, string>>([
    { cookie: 'nb1_currency=CHF' },
    { cookie: 'nb1_currency=GBP' },
    { cookie: 'payload-token=editor' },
    { cookie: '__prerender_bypass=preview' },
    { cookie: 'unknown-session=anything' },
    { cookie: '_ga=analytics' },
    { authorization: 'Basic staging' },
    { rsc: '1' },
    { 'next-router-state-tree': '[]' },
    { 'next-router-prefetch': '1' },
    { 'next-router-segment-prefetch': '/en' },
    { 'next-url': '/en' },
    { 'next-action': 'action' },
    { 'x-nextjs-data': '1' },
    { 'x-middleware-prefetch': '1' },
    { range: 'bytes=0-10' },
    { accept: 'text/x-component' },
    { accept: 'application/json' },
  ])('bypasses visitor state and alternate representations: %j', async (headers) => {
    const response = await middleware(request('/en', headers))
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store')
  })

  it('allows HEAD but never mutations', () => {
    expect(canCacheMarketingRequest(request('/en', {}, 'HEAD'))).toBe(true)
    expect(canCacheMarketingRequest(request('/en', {}, 'POST'))).toBe(false)
  })

  it('requires exact reviewed paths and cannot opt known private routes in', () => {
    vi.stubEnv(
      'MARKETING_EDGE_CACHE_PATHS',
      '/en, /en/biology, /de/bestellen, /en/influencers/alex',
    )
    expect(canCacheMarketingRequest(request('/en/biology'))).toBe(true)
    expect(canCacheMarketingRequest(request('/en/biology/details'))).toBe(false)
    expect(canCacheMarketingRequest(request('/de'))).toBe(false)
    expect(canCacheMarketingRequest(request('/de/bestellen'))).toBe(false)
    expect(canCacheMarketingRequest(request('/en/influencers/alex'))).toBe(false)
    vi.stubEnv('MARKETING_EDGE_CACHE_PATHS', '')
    expect(canCacheMarketingRequest(request())).toBe(false)
  })

  it.each(['Mozilla/5.0', 'facebookexternalhit/1.1'])(
    'preserves canonical redirects for %s',
    async (agent) => {
      const response = await middleware(request('/en/Our_Plan', { 'user-agent': agent }))
      expect(response.status).toBe(301)
      expect(response.headers.get('location')).toBe('https://nb1.com/en/our-plan')
      expect(response.headers.get('Cloudflare-CDN-Cache-Control')).not.toBe(MARKETING_EDGE_CONTROL)
    },
  )

  it('uses Cloudflare geography for private locale redirects and honours a saved locale', async () => {
    const geo = await middleware(
      request('/', { 'cf-ipcountry': 'BE', 'x-vercel-ip-country': 'DE' }),
    )
    expect(geo.headers.get('location')).toBe('https://nb1.com/be')
    expect(geo.headers.get('Cache-Control')).toBe('private, no-store')
    expect(geo.headers.get('set-cookie')).toBeNull()
    const saved = await middleware(request('/', { 'cf-ipcountry': 'BE', cookie: 'nb1_locale=fr' }))
    expect(saved.headers.get('location')).toBe('https://nb1.com/fr')
  })
})

// Run the real Next header-rule matcher before its middleware adapter strips Flight inputs.
describe('Next raw request cache grant', () => {
  function edgeHeader(query: Record<string, string> = {}, headers: Record<string, string> = {}) {
    let value: string | undefined
    for (const rule of marketingCacheHeaders(['en'])) {
      if (matchHas({ headers } as Parameters<typeof matchHas>[0], query, rule.has, rule.missing)) {
        value = rule.headers[0].value
      }
    }
    return value
  }
  it('grants only public HTML candidates and keeps the origin flag opt-in', () => {
    expect(edgeHeader()).toBe(MARKETING_EDGE_CONTROL)
    vi.stubEnv('MARKETING_EDGE_CACHE_ENABLED', undefined)
    expect(marketingCacheHeaders(['en'])).toEqual([])
  })
  it.each<Record<string, string>>([
    { rsc: '1' },
    { 'next-router-state-tree': '[]' },
    { 'next-router-prefetch': '1' },
    { 'next-router-segment-prefetch': '/en' },
    { 'next-hmr-refresh': '1' },
    { cookie: 'payload-token=editor' },
    { authorization: 'Basic staging' },
  ])('denies the grant before Next strips %j', (headers) => {
    expect(edgeHeader({}, headers)).toBe('no-store')
  })
  it('denies RSC query variants before Next removes the query', () => {
    expect(edgeHeader({ _rsc: '123' })).toBe('no-store')
  })
  it('does not generate public rules for private paths even if configured', () => {
    vi.stubEnv(
      'MARKETING_EDGE_CACHE_PATHS',
      '/en,/de/bestellen-details,/en/checkout,/en/order-cycle-core',
    )
    expect(getMarketingCachePaths(['en', 'de'])).toEqual(['/en'])
  })
})
