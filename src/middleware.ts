import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { appLocales, defaultLocale, isAppLocale } from '@/i18n/config'
import { isJournalEnabled, isJournalLocale } from '@/utilities/journalEnabled'
import { canCacheMarketingRequest } from '@/utilities/marketingCache'

const GEO_LOCALES: Record<string, string> = {
  CH: 'ch',
  DE: 'de',
  AT: 'de',
  FR: 'fr',
  BE: 'be',
  NL: 'nl',
  GB: 'uk',
  AE: 'uae',
}
const LOCALE_COOKIE = 'nb1_locale'

function geoLocale(req: NextRequest): string {
  const country = (
    req.headers.get('cf-ipcountry') ??
    req.headers.get('x-vercel-ip-country') ??
    ''
  ).toUpperCase()
  return GEO_LOCALES[country] ?? defaultLocale
}

const ROOT_NON_LOCALIZED_ROUTES = ['/login'] as const

const localePattern = appLocales.join('|')

function isRootNonLocalized(pathname: string) {
  return ROOT_NON_LOCALIZED_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isLocalePath(pathname: string) {
  return appLocales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
}

function normalizePathname(pathname: string) {
  return pathname
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/-{2,}/g, '-')
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (pathname.startsWith('/api')) return NextResponse.next()
  if (pathname.startsWith('/cms')) return NextResponse.next()
  if (pathname.startsWith('/_next')) return NextResponse.next()

  const localeCmsMatch = pathname.match(new RegExp(`^/(${localePattern})/cms(/.*)?$`))
  if (localeCmsMatch) {
    const rest = localeCmsMatch[2] || ''
    const url = req.nextUrl.clone()
    url.pathname = `/cms${rest}`
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  const localeLoginMatch = pathname.match(new RegExp(`^/(${localePattern})/login(/.*)?$`))
  if (localeLoginMatch) {
    const rest = localeLoginMatch[2] || ''
    const url = req.nextUrl.clone()
    url.pathname = `/login${rest}`
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  // The Journal has moved twice: /posts → /library (the original content brief)
  // → /journal (TICKET-SEO-007 §8, which treats the name/canonical mismatch as
  // a launch blocker and requires that no reference to /library survives).
  // Both old bases redirect straight to /journal — one hop each, never a chain.
  //
  // Handled here rather than in next.config.js `redirects` because middleware
  // runs first, so the rule cannot be shadowed by the locale-redirect logic
  // further down. Matches the existing /{locale}/cms and /{locale}/login
  // compatibility branches above.
  //
  // Catches both `/{locale}/posts/...` (one hop) and the locale-less
  // `/posts/...` (redirects to `/journal/...`, which the locale branch below
  // then sends on to `/{locale}/journal/...`).
  //
  // Note `/{locale}/posts-sitemap.xml` deliberately does NOT match — the
  // trailing group requires a `/`, and that sitemap URL stays as-is.
  const legacyJournalMatch = pathname.match(
    new RegExp(`^(/(?:${localePattern}))?/(?:posts|library)(/.*)?$`),
  )
  // Only redirect where the Journal exists. Sending /posts to a 404 would be a
  // pointless hop and would make a market that is not switched on look broken
  // rather than absent. An unprefixed /posts still redirects: the locale is
  // resolved downstream, and the target is then subject to the same rule.
  const legacyJournalPrefix = (legacyJournalMatch?.[1] ?? '').replace('/', '')
  const legacyJournalAllowed =
    legacyJournalPrefix === ''
      ? isJournalEnabled()
      : isAppLocale(legacyJournalPrefix) && isJournalLocale(legacyJournalPrefix)
  if (legacyJournalMatch && legacyJournalAllowed) {
    const localePrefix = legacyJournalMatch[1] || ''
    const rest = legacyJournalMatch[2] || ''
    const url = req.nextUrl.clone()
    url.pathname = `${localePrefix}/journal${rest}`
    url.search = search
    return NextResponse.redirect(url, 301)
  }

  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return NextResponse.next()
  }

  if (isRootNonLocalized(pathname)) {
    return NextResponse.next()
  }

  // Per-locale sitemap children skip the extension bypass below, so they still
  // get locale normalization. Matched by SUFFIX rather than named one by one:
  // the list was `sitemap`, `pages` and `posts`, and this branch adds `hubs`,
  // `pillars`, `lexicon`, `lexicon-categories` and `research` — five routes that
  // would otherwise take a different path through the middleware than the three
  // beside them, silently, with nothing to notice it.
  //
  // Anchored to a REAL locale prefix, which is origin/main's contribution: an
  // arbitrary `/anything/x-sitemap.xml` must not claim the bypass. The optional
  // `[a-z-]+-` group keeps the bare `/{locale}/sitemap.xml` index matching too —
  // this branch's suffix-only pattern had silently dropped it.
  const isLocalizedSitemap = new RegExp(`^/(${localePattern})/([a-z-]+-)?sitemap\\.xml$`).test(
    pathname,
  )

  // Sitemaps are public, locale-explicit documents. Do not attach visitor
  // currency/country cookies, otherwise shared caches correctly refuse to cache them.
  if (isLocalizedSitemap) return NextResponse.next()

  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  const normalizedPath = normalizePathname(pathname)
  if (normalizedPath !== pathname) {
    const url = req.nextUrl.clone()
    url.pathname = normalizedPath
    url.search = search
    return NextResponse.redirect(url, 301)
  }

  // CMS redirects are resolved by PayloadRedirects through the tagged Next data
  // cache. Fetching our own REST endpoint here added a failing request per hit.
  const geoLoc = geoLocale(req)

  if (isLocalePath(normalizedPath)) {
    const res = NextResponse.next()
    // Next's header rules see the original Flight headers; middleware does not.
    // Never grant caching here, or a stripped RSC request could become public.
    if (!canCacheMarketingRequest(req)) res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
    // The URL supplies the default currency. Only an explicit switcher choice
    // needs a cookie; country/currency Set-Cookie would prevent shared caching.
    return res
  }

  // Determine locale: honour an explicit cookie preference, otherwise use geo
  const savedLocale = req.cookies.get(LOCALE_COOKIE)?.value
  const isValidSaved = savedLocale && (appLocales as readonly string[]).includes(savedLocale)
  const targetLocale = isValidSaved ? savedLocale : geoLoc

  const url = req.nextUrl.clone()
  url.pathname = `/${targetLocale}${normalizedPath}`
  const res = NextResponse.redirect(url, 307)
  res.headers.set('Cache-Control', 'private, no-store')
  res.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')

  return res
}

export const config = {
  // Keep application APIs and `/cms` (Payload admin + REST API) outside locale
  // routing. This also avoids middleware buffering/capping large CMS request
  // bodies. Localized `/{locale}/cms` paths still match and are redirected to
  // `/cms` by the explicit compatibility branch above.
  matcher: ['/((?!_next|cms|api).*)'],
}
