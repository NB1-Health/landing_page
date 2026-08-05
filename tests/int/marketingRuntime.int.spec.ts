import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ServerEvent } from '@/lib/meta/types'
import { isMarketingRuntimeEnabled } from '@/lib/marketing/runtime'

const event: ServerEvent = {
  consent: true,
  context: { sourceUrl: 'http://localhost:3000/en' },
  event: 'page_view',
  event_id: 'synthetic-page-view',
  user: {},
}

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('marketing runtime isolation', () => {
  it('enables browser integrations only for a production runtime', () => {
    expect(isMarketingRuntimeEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(isMarketingRuntimeEnabled({ NODE_ENV: 'test' })).toBe(false)
    expect(isMarketingRuntimeEnabled({ NODE_ENV: 'production' })).toBe(true)
  })

  it('does not call Meta from development even when credentials are present', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('META_PIXEL_ID', 'local-pixel')
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'local-token')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { sendMetaEvents } = await import('@/lib/meta/server')

    await expect(sendMetaEvents([event])).resolves.toEqual({ sent: 0, skipped: 'disabled' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not call Meta in production when credentials are incomplete', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('META_PIXEL_ID', '')
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { sendMetaEvents } = await import('@/lib/meta/server')

    await expect(sendMetaEvents([event])).resolves.toEqual({ sent: 0, skipped: 'disabled' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('preserves configured production Meta delivery', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('META_PIXEL_ID', 'production-pixel')
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'production-token')
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({ events_received: 1 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { sendMetaEvents } = await import('@/lib/meta/server')

    await expect(sendMetaEvents([event])).resolves.toEqual({
      response: { events_received: 1 },
      sent: 1,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.facebook.com/v21.0/production-pixel/events',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
