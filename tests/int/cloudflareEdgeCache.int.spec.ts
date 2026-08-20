import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSitemapCacheHeaders, purgeCloudflareCacheTags } from '@/utilities/cloudflareCache'

const enabledEnvironment = {
  CLOUDFLARE_CACHE_PURGE_TOKEN: 'cache-purge-token',
  CLOUDFLARE_EDGE_CACHE_ENABLED: 'true',
  CLOUDFLARE_ZONE_ID: 'zone-id',
  DEPLOY_ENV: 'production',
} as NodeJS.ProcessEnv

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Cloudflare edge cache', () => {
  it('adds a short Cloudflare-only contract and purge tag to sitemaps', () => {
    expect(getSitemapCacheHeaders(enabledEnvironment)).toEqual({
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=60',
      'Cache-Tag': 'nb1-sitemaps',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=600, stale-while-revalidate=60',
    })
  })

  it('does not enable Cloudflare edge caching outside the production rollout', () => {
    expect(
      getSitemapCacheHeaders({
        CLOUDFLARE_EDGE_CACHE_ENABLED: 'true',
        DEPLOY_ENV: 'staging',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=60',
    })
  })

  it('purges each requested cache tag once with the scoped bearer token', async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      purgeCloudflareCacheTags(['nb1-sitemaps', 'nb1-sitemaps'], enabledEnvironment),
    ).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/zones/zone-id/purge_cache',
      expect.objectContaining({
        body: JSON.stringify({ tags: ['nb1-sitemaps'] }),
        headers: {
          Authorization: 'Bearer cache-purge-token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }),
    )
  })

  it('does not call Cloudflare when the rollout is disabled', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      purgeCloudflareCacheTags(['nb1-media'], {
        CLOUDFLARE_EDGE_CACHE_ENABLED: 'false',
        DEPLOY_ENV: 'production',
      } as NodeJS.ProcessEnv),
    ).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('surfaces failed purges so Payload hooks can log and continue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ success: false }, { status: 503 })),
    )

    await expect(purgeCloudflareCacheTags(['nb1-media'], enabledEnvironment)).rejects.toThrow(
      'Cloudflare cache purge failed with status 503',
    )
  })

  it('only adds image/media edge headers when the production rollout is enabled', async () => {
    vi.stubEnv('DEPLOY_ENV', 'production')
    vi.stubEnv('CLOUDFLARE_EDGE_CACHE_ENABLED', 'true')
    vi.resetModules()

    const { default: config } = await import('../../next.config.js')
    const routes = await config.headers?.()
    const edgeSources = routes
      ?.filter((route) =>
        route.headers.some((header) => header.key === 'Cloudflare-CDN-Cache-Control'),
      )
      .map((route) => route.source)

    expect(edgeSources).toEqual(['/_next/image', '/cms/api/media/file/:path*'])
    expect(routes?.find((route) => route.source === '/_next/image')?.headers).toContainEqual({
      key: 'Cloudflare-CDN-Cache-Control',
      value: 'public, max-age=60, stale-while-revalidate=60',
    })
    expect(
      routes?.find((route) => route.source === '/cms/api/media/file/:path*')?.headers,
    ).toContainEqual({
      key: 'Cloudflare-CDN-Cache-Control',
      value: 'public, max-age=14400, stale-while-revalidate=60',
    })
  })
})
