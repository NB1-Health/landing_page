import type { NextRequest } from 'next/server'
import { appLocales } from '@/i18n/config'
import { getMarketingCachePaths, MARKETING_PRIVATE_HEADERS } from './marketingCachePolicy.mjs'

/** Also enforce these conditions at the edge BEFORE a hit, using the original request. */
export function canCacheMarketingRequest(req: NextRequest): boolean {
  if (process.env.MARKETING_EDGE_CACHE_ENABLED !== 'true') return false
  if (!getMarketingCachePaths(appLocales).includes(req.nextUrl.pathname)) return false
  if (req.method !== 'GET' && req.method !== 'HEAD') return false
  if (req.nextUrl.search) return false
  if (MARKETING_PRIVATE_HEADERS.some((name) => req.headers.has(name))) return false
  const accept = req.headers.get('accept') ?? ''
  if (accept.includes('text/x-component')) return false
  return !accept || accept.includes('text/html') || accept === '*/*'
}
