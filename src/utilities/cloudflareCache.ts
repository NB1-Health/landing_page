const CLOUDFLARE_API_BASE_URL = 'https://api.cloudflare.com/client/v4'
const PURGE_TIMEOUT_MS = 2_000

export const CLOUDFLARE_SITEMAP_CACHE_TAG = 'nb1-sitemaps'
export const CLOUDFLARE_MEDIA_CACHE_TAG = 'nb1-media'

const SITEMAP_CACHE_CONTROL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=60'
const CLOUDFLARE_SITEMAP_CACHE_CONTROL = 'public, max-age=600, stale-while-revalidate=60'

export function isCloudflareEdgeCacheEnabled(environment = process.env) {
  return (
    environment.DEPLOY_ENV === 'production' && environment.CLOUDFLARE_EDGE_CACHE_ENABLED === 'true'
  )
}

export function getSitemapCacheHeaders(environment = process.env): Record<string, string> {
  const headers: Record<string, string> = {
    'Cache-Control': SITEMAP_CACHE_CONTROL,
  }

  if (isCloudflareEdgeCacheEnabled(environment)) {
    headers['Cloudflare-CDN-Cache-Control'] = CLOUDFLARE_SITEMAP_CACHE_CONTROL
    headers['Cache-Tag'] = CLOUDFLARE_SITEMAP_CACHE_TAG
  }

  return headers
}

/** Purge tagged public responses after Payload has updated their origin data. */
export async function purgeCloudflareCacheTags(
  cacheTags: readonly string[],
  environment = process.env,
): Promise<boolean> {
  if (!isCloudflareEdgeCacheEnabled(environment)) return false

  const zoneID = environment.CLOUDFLARE_ZONE_ID?.trim()
  const token = environment.CLOUDFLARE_CACHE_PURGE_TOKEN?.trim()
  if (!zoneID || !token) {
    throw new Error('Cloudflare edge caching is enabled without purge credentials')
  }

  const tags = [...new Set(cacheTags.map((tag) => tag.trim()).filter(Boolean))]
  if (tags.length === 0) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PURGE_TIMEOUT_MS)

  try {
    const response = await fetch(`${CLOUDFLARE_API_BASE_URL}/zones/${zoneID}/purge_cache`, {
      body: JSON.stringify({ tags }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: controller.signal,
    })

    const result = (await response.json().catch(() => null)) as { success?: boolean } | null
    if (!response.ok || result?.success !== true) {
      throw new Error(`Cloudflare cache purge failed with status ${response.status}`)
    }

    return true
  } finally {
    clearTimeout(timeout)
  }
}
