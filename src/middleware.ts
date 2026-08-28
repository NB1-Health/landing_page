import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { appLocales, defaultLocale } from '@/i18n/config'

// Maps ISO 3166-1 alpha-2 country codes → { locale, currency }
// Countries not listed fall back to defaultLocale + EUR
const GEO_MAP: Record<string, { locale: string; currency: string }> = {
  CH: { locale: 'ch', currency: 'CHF' }, // Switzerland
  DE: { locale: 'de', currency: 'EUR' }, // Germany
  AT: { locale: 'de', currency: 'EUR' }, // Austria
  FR: { locale: 'fr', currency: 'EUR' }, // France
  BE: { locale: 'be', currency: 'EUR' }, // Belgium
  NL: { locale: 'nl', currency: 'EUR' }, // Netherlands
  GB: { locale: 'uk', currency: 'GBP' }, // United Kingdom
  AE: { locale: 'uae', currency: 'AED' }, // UAE
}

const LOCALE_COOKIE = 'nb1_locale'
const CURRENCY_COOKIE = 'nb1_currency'
const COUNTRY_COOKIE = 'nb1_country'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Default currency for the RESOLVED locale (path segment), used instead of
// GEO_MAP's country-derived currency once we know which locale the visitor
// is actually landing on — otherwise e.g. a German visitor (country DE)
// directly opening /en/... would get DE's EUR default instead of en's own
// default, since GEO_MAP only maps country -> locale/currency as a pair.
// Keep in sync with LOCALE_DEFAULT_CURRENCY in src/utilities/currency.ts and
// src/Header/Component.client.tsx.
const LOCALE_DEFAULT_CURRENCY: Record<string, string> = {
  en: 'GBP',
  de: 'EUR',
  ch: 'CHF',
  fr: 'EUR',
  nl: 'EUR',
  be: 'EUR',
  uk: 'GBP',
  uae: 'AED',
}

function geoLocale(req: NextRequest): { locale: string; currency: string; country: string } {
  // Vercel sets this header automatically; falls back to empty string locally
  const country = req.headers.get('x-vercel-ip-country') ?? ''
  const result = GEO_MAP[country] ?? { locale: defaultLocale, currency: 'EUR' }
  return { ...result, country }
}

const ROOT_NON_LOCALIZED_ROUTES = ['/login'] as const

const localePattern = appLocales.join('|')

function isRootNonLocalized(pathname: string) {
  return ROOT_NON_LOCALIZED_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isLocalePath(pathname: string) {
  return appLocales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
}

function normalizeSiteURL(raw: string) {
  if (!raw) return 'http://localhost:3000'
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `https://${raw}`
}

function normalizePathname(pathname: string) {
  return pathname
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/-{2,}/g, '-')
}

async function lookupRedirect(siteURL: string, fromPath: string) {
  if (!siteURL) return null

  const url =
    `${siteURL}/cms/api/redirects` +
    `?where[from][equals]=${encodeURIComponent(fromPath)}` +
    `&limit=1&depth=0`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })

    if (!res.ok) return null

    const data = await res.json()
    const doc = data?.docs?.[0]
    if (!doc) return null

    const to = typeof doc.to === 'string' ? doc.to : doc.to?.url
    if (!to) return null

    const code = doc.type === '302' ? 302 : 308
    return { to, code }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
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

  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') {
    return NextResponse.next()
  }

  if (isRootNonLocalized(pathname)) {
    return NextResponse.next()
  }

  const isLocalizedSitemap = new RegExp(
    `^/(${localePattern})/(sitemap|pages-sitemap|posts-sitemap)\\.xml$`,
  ).test(pathname)

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

  const siteURLRaw =
    process.env.NEXT_PUBLIC_SERVER_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || ''

  const siteURL = normalizeSiteURL(siteURLRaw)

  if (siteURLRaw) {
    const hit = await lookupRedirect(siteURL, normalizedPath)

    if (hit) {
      const dest = new URL(hit.to, siteURL)

      if (!dest.search) dest.search = search

      if (dest.pathname !== normalizedPath) {
        return NextResponse.redirect(dest, hit.code)
      }
    }
  }

  const { locale: geoLoc, currency: geoCurrency, country: geoCountry } = geoLocale(req)

  if (isLocalePath(normalizedPath)) {
    const res = NextResponse.next()
    const pathLocale = normalizedPath.split('/')[1] ?? defaultLocale
    // Set geo cookies even on direct locale-path hits so the switcher can read them
    if (!req.cookies.get(COUNTRY_COOKIE) && geoCountry) {
      res.cookies.set(COUNTRY_COOKIE, geoCountry, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
    }
    if (!req.cookies.get(CURRENCY_COOKIE)) {
      const localeCurrency = LOCALE_DEFAULT_CURRENCY[pathLocale] ?? geoCurrency
      res.cookies.set(CURRENCY_COOKIE, localeCurrency, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
    }
    return res
  }

  // Determine locale: honour an explicit cookie preference, otherwise use geo
  const savedLocale = req.cookies.get(LOCALE_COOKIE)?.value
  const isValidSaved = savedLocale && (appLocales as readonly string[]).includes(savedLocale)
  const targetLocale = isValidSaved ? savedLocale : geoLoc

  const url = req.nextUrl.clone()
  url.pathname = `/${targetLocale}${normalizedPath}`
  const res = NextResponse.redirect(url, 307)

  if (!req.cookies.get(CURRENCY_COOKIE)) {
    const localeCurrency = LOCALE_DEFAULT_CURRENCY[targetLocale] ?? geoCurrency
    res.cookies.set(CURRENCY_COOKIE, localeCurrency, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  }
  if (!req.cookies.get(COUNTRY_COOKIE) && geoCountry) {
    res.cookies.set(COUNTRY_COOKIE, geoCountry, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  }

  return res
}

export const config = {
  // Keep application APIs and `/cms` (Payload admin + REST API) outside locale
  // routing. This also avoids middleware buffering/capping large CMS request
  // bodies. Localized `/{locale}/cms` paths still match and are redirected to
  // `/cms` by the explicit compatibility branch above.
  matcher: ['/((?!_next|cms|api).*)'],
}
