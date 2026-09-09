// Next evaluates header rules before removing Flight headers and `_rsc` from
// middleware requests. Keep the cache grant here; middleware can only veto it.
export const MARKETING_EDGE_CONTROL =
  'public, max-age=60, stale-while-revalidate=30, stale-if-error=300'

export const MARKETING_PRIVATE_HEADERS = [
  'cookie',
  'authorization',
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-url',
  'next-action',
  'next-hmr-refresh',
  'x-nextjs-data',
  'x-middleware-prefetch',
  'range',
]

const privateSegment =
  /^(?:api|cms|next|login|logout|account|checkout|bestellen|commander|order|orders|payment|success|thank-you|influencers|topics|themen|search)(?:-|$)/

/** @param {string[]} locales */
export function getMarketingCachePaths(locales) {
  const configured = process.env.MARKETING_EDGE_CACHE_PATHS
  const paths =
    configured === undefined
      ? locales.map((locale) => `/${locale}`)
      : configured.split(',').map((path) => path.trim())
  return paths.filter((path) => {
    const segments = path.split('/').slice(1)
    return (
      /^\/[a-z]+(?:\/[a-z0-9-]+)*$/.test(path) &&
      locales.includes(segments[0]) &&
      !segments.some((segment) => privateSegment.test(segment))
    )
  })
}

/** @param {string[]} locales
 * @returns {import('next/dist/lib/load-custom-routes').Header[]}
 */
export function marketingCacheHeaders(locales) {
  if (process.env.MARKETING_EDGE_CACHE_ENABLED !== 'true') return []
  return getMarketingCachePaths(locales).flatMap((source) => [
    { source, headers: [{ key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' }] },
    {
      source,
      missing: [
        { type: 'query', key: '_rsc' },
        ...MARKETING_PRIVATE_HEADERS.map((key) => ({ type: /** @type {const} */ ('header'), key })),
      ],
      headers: [{ key: 'Cloudflare-CDN-Cache-Control', value: MARKETING_EDGE_CONTROL }],
    },
  ])
}
