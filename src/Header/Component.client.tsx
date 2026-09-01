'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { getDictionary } from '@/i18n/getDictionary'
import { isAppLocale, localeConfig, type AppLocale } from '@/i18n/config'
import { buildLocalizedDocumentPath, type LocalizedDocument } from './localizedDocument'
import type { JournalNavNode } from '@/utilities/journalNav'

type Theme = 'light' | 'dark'

/**
 * Prefix a nav link's URL with the locale from the current path.
 *
 * The URL an editor types in a nav item is locale-agnostic (`/journal`), so it
 * gets the active locale prepended at render time. Nav items live in a
 * `localized: true` array, so each locale already has its own rows — this only
 * saves the editor from typing the prefix, and from getting it wrong.
 *
 * The boundary check matters. This was four copies of
 * `!raw.startsWith(`/${loc}`)`, with no trailing slash, so any path whose first
 * segment merely *begins* with a locale code was treated as already-prefixed and
 * rendered without one: `/deals` on `/de`, `/benefits` on `/be`, `/chat` on
 * `/ch`, `/uk...` on `/uk`. Those links silently dropped their locale. Matching
 * on a full segment fixes it, and cannot regress a URL that really is prefixed.
 */
function localizeNavHref(raw: string, localeFromPath: string): string {
  if (!raw) return '#'
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('#')) return raw
  if (raw === `/${localeFromPath}` || raw.startsWith(`/${localeFromPath}/`)) return raw
  return `/${localeFromPath}${raw.startsWith('/') ? raw : `/${raw}`}`
}

type HeaderVariant = {
  variantKey: string
  theme: Theme
  loginTextColor?: string | null
}

export interface HeaderClientProps {
  locale: string
  /** The current document's semantic route and published localized slugs. */
  localizedDocument?: LocalizedDocument | null
  /** Resolved server-side from the currency cookie (see src/utilities/currency.ts).
   * Used as the initial state below instead of reading localStorage, so the
   * SSR markup and the first client render match exactly — reading
   * localStorage in a useState initializer caused a hydration mismatch for
   * any returning visitor whose stored currency differed from the 'EUR'
   * fallback used during SSR (localStorage isn't available on the server). */
  initialCurrency?: string
  logo?: {
    url?: string | null
    alt?: string | null
    width?: number | null
    height?: number | null
  } | null
  logoDark?: {
    url?: string | null
    alt?: string | null
    width?: number | null
    height?: number | null
  } | null
  defaultTheme?: Theme
  darkHero?: boolean
  loginText?: string | null
  loginUrl?: string | null
  loginTextColor?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  navItems?: Array<{
    link?: {
      label?: string | null
      localizedLabel?: string | null
      url?: string | null
      newTab?: boolean | null
    } | null
  }>
  variants?: HeaderVariant[]
  langs?: Array<[string, string]>
  currencies?: Array<[string, string, string]>
  langCurrencies?: Record<string, string[]>
  sectionNavEnabled?: boolean
  sectionNavItems?: Array<{ sectionId: string; label: string }>
  discoverNavEnabled?: boolean
  discoverNavLabel?: string | null
  /**
   * The Journal branch, generated server-side from hub and pillar slugs.
   * `null` in a locale with no hub slugs — the item is then absent entirely
   * rather than an arrow opening a blank panel.
   */
  journalNav?: JournalNavNode | null
  discoverNavItems?: Array<{
    link?: {
      label?: string | null
      localizedLabel?: string | null
      url?: string | null
      newTab?: boolean | null
    } | null
  }>
}

const GLOBE = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
)
const CHEV = (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

const DEFAULT_LANGS: Array<[string, string]> = [
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['nl', 'Dutch'],
]
const DEFAULT_CURRENCIES: Array<[string, string, string]> = [
  ['EUR', '€', 'Euro'],
  ['GBP', '£', 'Pound'],
  ['AED', 'AED', 'Dirham'],
  ['CHF', 'CHF', 'Franc'],
]
const DEFAULT_LANG_CURRENCIES: Record<string, string[]> = {
  en: ['EUR', 'GBP', 'AED', 'CHF'],
  de: ['EUR', 'CHF'],
  fr: ['EUR', 'CHF'],
  nl: ['EUR'],
}

// Fixed default currency per locale — overrides cookie when the cookie value isn't valid for that locale
const LOCALE_DEFAULT_CURRENCY: Record<string, string> = {
  ch: 'CHF',
  uk: 'GBP',
  uae: 'AED',
  be: 'EUR',
  nl: 'EUR',
  fr: 'EUR',
  de: 'EUR',
  en: 'GBP',
}

// Currencies allowed per locale
const LOCALE_ALLOWED_CURRENCIES: Record<string, string[]> = {
  en: ['EUR', 'GBP', 'AED', 'CHF'],
  de: ['EUR', 'CHF'],
  fr: ['EUR', 'CHF'],
  nl: ['EUR'],
  ch: ['CHF'],
  be: ['EUR'],
  uk: ['GBP'],
  uae: ['AED'],
}

function localeToLang(locale: string): string {
  return isAppLocale(locale) ? localeConfig[locale].htmlLang : locale
}

function lsGet(k: string, d: string) {
  try {
    return localStorage.getItem(k) || d
  } catch {
    return d
  }
}
function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* noop */
  }
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  locale,
  localizedDocument = null,
  initialCurrency,
  logo,
  logoDark,
  defaultTheme = 'light',
  darkHero = false,
  loginText,
  loginUrl,
  loginTextColor: defaultLoginTextColor,
  ctaLabel,
  ctaUrl,
  navItems = [],
  variants = [],
  langs = DEFAULT_LANGS,
  currencies = DEFAULT_CURRENCIES,
  langCurrencies = DEFAULT_LANG_CURRENCIES,
  sectionNavEnabled = false,
  sectionNavItems = [],
  discoverNavEnabled = false,
  discoverNavLabel,
  discoverNavItems = [],
  journalNav = null,
}) => {
  const searchParams = useSearchParams()
  const variantParam = searchParams.get('v')

  // Resolve the login link against the site ROOT (current origin), not the
  // current page path: a value like "login?lang=en" becomes "/login?lang=en",
  // which the browser resolves to {current origin}/login?lang=en — so it points
  // at stg.nb1.com on staging, nb1.com on prod, localhost in dev, with no
  // hardcoded domain. Absolute (http…) and already-root-relative (/…) values
  // are passed through untouched.
  const loginHref = loginUrl
    ? loginUrl.startsWith('http') || loginUrl.startsWith('/')
      ? loginUrl
      : `/${loginUrl}`
    : null

  let theme: Theme = defaultTheme
  let loginTextColor: string | null | undefined = defaultLoginTextColor
  if (variantParam) {
    const match = variants.find((v) => v.variantKey === variantParam)
    if (match) {
      theme = match.theme
      if (match.loginTextColor) loginTextColor = match.loginTextColor
    }
  }

  const isDark = theme === 'dark'
  const router = useRouter()
  const pathname = usePathname()

  // Scroll / hide state
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const upDelta = useRef(0)
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || 0
      if (darkHero) setScrolled(y > 80)
      const isMobile = window.innerWidth <= 860
      if (y > lastY.current + 6 && y > 120) {
        setHidden(true)
        upDelta.current = 0
      } else if (y < lastY.current) {
        upDelta.current += lastY.current - y
        const upThreshold = isMobile ? 40 : 6
        if (upDelta.current > upThreshold || y < 80) setHidden(false)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [darkHero])

  // "On this page" section-nav pill
  const hasSecNav = sectionNavEnabled && sectionNavItems.length > 0
  const [secNavOpen, setSecNavOpen] = useState(false)
  const [secNavShow, setSecNavShow] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const secNavRef = useRef<HTMLDivElement>(null)
  const secNavBtnRef = useRef<HTMLButtonElement>(null)

  // Reveal the pill once the visitor scrolls past the #toc section (mirrors the
  // mockup's behavior); if the page has no #toc, show it right away.
  useEffect(() => {
    if (!hasSecNav) return
    function upd() {
      const toc = document.getElementById('toc')
      if (!toc) {
        setSecNavShow(true)
        return
      }
      const b = toc.getBoundingClientRect().bottom
      setSecNavShow(b < 120)
      if (b >= 120) setSecNavOpen(false)
    }
    window.addEventListener('scroll', upd, { passive: true })
    window.addEventListener('resize', upd)
    upd()
    return () => {
      window.removeEventListener('scroll', upd)
      window.removeEventListener('resize', upd)
    }
  }, [hasSecNav])

  // Scroll-spy: highlight whichever configured section is currently in view.
  useEffect(() => {
    if (!hasSecNav) return
    if (!('IntersectionObserver' in window)) return
    const targets = sectionNavItems
      .map((item) => ({ id: item.sectionId, el: document.getElementById(item.sectionId) }))
      .filter((t): t is { id: string; el: HTMLElement } => Boolean(t.el))
    if (targets.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSectionId(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    targets.forEach(({ el }) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSecNav])

  useEffect(() => {
    if (!secNavOpen) return
    function handler(e: MouseEvent) {
      if (secNavRef.current && !secNavRef.current.contains(e.target as Node)) setSecNavOpen(false)
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSecNavOpen(false)
        secNavBtnRef.current?.focus()
      }
    }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [secNavOpen])

  const activeSectionLabel = sectionNavItems.find((i) => i.sectionId === activeSectionId)?.label

  // "Discover" page-navigation dropdown — same open/outside-click/Escape
  // model as the "On this page" section nav above, but always visible
  // (no scroll-triggered reveal) and lists other pages rather than
  // in-page anchors. Desktop only, matching the mockup's own
  // `.nb1-disc{display:none}` at ≤860px (mirrors how `.nb1-loc` is
  // likewise hidden on mobile in favor of the sheet).
  const hasDiscoverNav = discoverNavEnabled && discoverNavItems.length > 0
  const [discOpen, setDiscOpen] = useState(false)
  const discRef = useRef<HTMLDivElement>(null)
  const discBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!discOpen) return
    function handler(e: MouseEvent) {
      if (discRef.current && !discRef.current.contains(e.target as Node)) setDiscOpen(false)
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDiscOpen(false)
        discBtnRef.current?.focus()
      }
    }
    document.addEventListener('click', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [discOpen])

  // Mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [locPopOpen, setLocPopOpen] = useState(false)
  const locPopTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!locPopOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLocPopOpen(false)
        locPopTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [locPopOpen])
  useEffect(() => {
    if (sheetOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  // Lang / currency — derive from URL pathname (e.g. /de/...) so the selector
  // always reflects the page the user is actually on, regardless of localStorage.
  const langFromPath = pathname.split('/')[1]
  const validLangCodes = langs.map(([code]) => code)
  const resolvedLang = localeToLang(langFromPath)
  const activeLang = validLangCodes.includes(resolvedLang)
    ? resolvedLang
    : localeToLang(locale || 'en')
  const dict = getDictionary(activeLang)
  const [curLang, setCurLang] = useState(activeLang)
  // The actual URL locale segment (e.g. 'uk', 'be'), as opposed to curLang which
  // collapses regional locales to their base language (uk→en, be→nl). Links that
  // must keep the visitor in their current locale — the CTA button — use this,
  // not curLang, otherwise a /uk visitor gets sent to /en. Mirrors navItems,
  // which are already locale-prefixed server-side with the raw locale.
  const activeLocale = isAppLocale(langFromPath) ? langFromPath : locale || 'en'
  const [curLocale, setCurLocale] = useState(activeLocale)
  useEffect(() => {
    setCurLang(activeLang)
    setCurLocale(activeLocale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  // Seeded from the server-resolved cookie value (not localStorage) so this
  // matches the SSR HTML exactly — see initialCurrency prop doc above.
  const [curCur, setCurCur] = useState(initialCurrency || 'EUR')
  // On mount, sync curCur from cookie — but validate it against the current locale.
  // If the cookie currency isn't allowed for this locale, use the locale's default.
  useEffect(() => {
    try {
      const currentLocale = pathname.split('/')[1] || 'en'
      const allowed = LOCALE_ALLOWED_CURRENCIES[currentLocale]
      const localDefault = LOCALE_DEFAULT_CURRENCY[currentLocale]
      const match = document.cookie.match(/(?:^|; )nb1_currency=([^;]*)/)
      const cookieCur = match ? decodeURIComponent(match[1]) : ''
      const resolved = cookieCur && allowed?.includes(cookieCur) ? cookieCur : localDefault || 'EUR'
      if (resolved !== curCur) setCurCur(resolved)
      // Always write back so the next locale page sees the correct currency in the cookie
      if (resolved !== cookieCur) {
        document.cookie = `nb1_currency=${resolved}; path=/; max-age=31536000; samesite=lax`
      }
    } catch {
      /* noop */
    }
  }, [pathname])
  // Pending selections — only committed when Apply is clicked.
  // Initialised to match current applied values; reset again whenever the menu opens.
  const [pendingLang, setPendingLang] = useState(activeLang)
  const [pendingCur, setPendingCur] = useState(initialCurrency || 'EUR')
  const [locOpen, setLocOpen] = useState(false)
  const locRef = useRef<HTMLDivElement>(null)

  const allowedCurs = (lang = pendingLang) => {
    const codes = langCurrencies[lang] || currencies.map((c) => c[0])
    return currencies.filter((c) => codes.includes(c[0]))
  }
  const curSym = (code: string) => currencies.find((c) => c[0] === code)?.[1] || code

  // When pending lang changes, ensure pending currency is valid for that lang
  useEffect(() => {
    const ac = allowedCurs(pendingLang)
    if (!ac.some((c) => c[0] === pendingCur)) {
      setPendingCur(ac[0]?.[0] || 'EUR')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLang])

  // close loc menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  function resolveTargetLocale(lang: string, cur: string): AppLocale {
    if (lang === 'en') {
      if (cur === 'GBP') return 'uk'
      if (cur === 'AED') return 'uae'
      return 'en'
    }
    if (lang === 'de') {
      if (cur === 'CHF') return 'ch'
      return 'de'
    }
    if (lang === 'fr') return 'fr'
    if (lang === 'nl') {
      // Resolve nl vs be via geo country cookie; if neither, fall back to nl
      const country = (() => {
        try {
          return document.cookie.match(/(?:^|; )nb1_country=([^;]*)/)?.[1] || ''
        } catch {
          return ''
        }
      })()
      if (country === 'BE') return 'be'
      return 'nl'
    }
    return 'en'
  }

  function applyLang(lang: string) {
    const targetLocale = resolveTargetLocale(lang, pendingCur)
    if (localizedDocument && typeof localizedDocument.slugs[targetLocale] !== 'string') return
    // Use pendingCur if it's valid for the target locale, otherwise fall back to locale default.
    // This lets FR+CHF work while still resetting e.g. GBP→EUR when switching to French.
    const allowed = LOCALE_ALLOWED_CURRENCIES[targetLocale]
    const targetCurrency =
      allowed && allowed.includes(pendingCur)
        ? pendingCur
        : (LOCALE_DEFAULT_CURRENCY[targetLocale] ?? pendingCur)
    setCurLang(lang)
    lsSet('nb1_lang', lang)
    lsSet('nb1_currency', targetCurrency)
    try {
      document.cookie = `nb1_locale=${targetLocale}; path=/; max-age=31536000; samesite=lax`
      document.cookie = `nb1_currency=${targetCurrency}; path=/; max-age=31536000; samesite=lax`
    } catch {
      /* noop */
    }
    document.documentElement.setAttribute('lang', lang)
    let targetPath: string
    if (localizedDocument) {
      targetPath = buildLocalizedDocumentPath(
        targetLocale,
        localizedDocument.slugs[targetLocale]!,
        localizedDocument.route,
      )
    } else {
      const segments = pathname.split('/')
      segments[1] = targetLocale
      targetPath = segments.join('/')
    }
    window.location.href = targetPath
    setLocOpen(false)
  }
  function applyCur(cur: string) {
    setCurCur(cur)
    lsSet('nb1_currency', cur)
    // Mirror the selection into a cookie so server components (e.g. live
    // pricing blocks) can read it on the next render — localStorage isn't
    // visible to the server. router.refresh() re-renders server components
    // with the new cookie value without a full page reload or losing the
    // client state of components further down the tree.
    try {
      document.cookie = `nb1_currency=${cur}; path=/; max-age=31536000; samesite=lax`
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent('nb1:currencychange', { detail: cur }))
    router.refresh()
  }

  const pendingTargetLocale = resolveTargetLocale(pendingLang, pendingCur)
  const pendingLocaleAvailable =
    !localizedDocument || typeof localizedDocument.slugs[pendingTargetLocale] === 'string'

  const isTransparent = darkHero && !scrolled
  // After scrolling past dark hero, always go light — dark theme only applies to permanently dark (non-hero) nav
  const scrolledDark = !isTransparent && isDark && !darkHero
  const activeLogo = isTransparent && logoDark?.url ? logoDark : logo
  const resolvedLoginColor =
    loginTextColor || (isTransparent ? '#ffffff' : scrolledDark ? '#ffffff' : 'rgba(18,49,77,0.65)')

  const linkColor = isTransparent || scrolledDark ? 'rgba(255,255,255,0.78)' : 'rgba(18,49,77,0.65)'
  const locBtnColor = isTransparent
    ? '#ffffff'
    : scrolledDark
      ? 'rgba(255,255,255,0.85)'
      : 'rgba(18,49,77,0.7)'
  const locBtnBg = isTransparent
    ? 'rgba(255,255,255,0.13)'
    : scrolledDark
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(18,49,77,0.05)'
  const locBtnBorder = isTransparent
    ? 'rgba(255,255,255,0.22)'
    : scrolledDark
      ? 'rgba(255,255,255,0.20)'
      : 'rgba(18,49,77,0.12)'
  const navBg = isTransparent
    ? 'transparent'
    : scrolledDark
      ? 'rgba(10,30,53,0.92)'
      : 'rgba(255,255,255,0.92)'
  const navBackdrop = isTransparent ? 'none' : 'blur(20px) saturate(140%)'
  const navBorder = isTransparent
    ? 'transparent'
    : scrolledDark
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(18,49,77,0.10)'
  const navShadow = isTransparent ? 'none' : '0 2px 16px -10px rgba(18,49,77,0.18)'
  const burgerColor = isTransparent ? '#fff' : scrolledDark ? '#fff' : 'rgb(18,49,77)'

  const css = `
    .nb1-nav {
      position: ${darkHero ? 'fixed' : 'sticky'};
      top: 0; left: 0; right: 0; z-index: 9000;
      background: ${navBg};
      -webkit-backdrop-filter: ${navBackdrop};
      backdrop-filter: ${navBackdrop};
      border-bottom: 1px solid ${navBorder};
      box-shadow: ${navShadow};
      transition: transform .35s cubic-bezier(.16,.84,.44,1), background .3s, border-color .3s, backdrop-filter .3s;
    }
    .nb1-nav.nb1-hidden { transform: translateY(-100%); }
    .nb1-nav-in { max-width:1380px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; height:68px; padding:0 32px; }
    .nb1-logo { display:inline-flex; align-items:center; text-decoration:none; }
    .nb1-logo img { height:24px; width:auto; display:block; }
    .nb1-nav-links { display:flex; gap:30px; font-size:14px; font-weight:500; color:${linkColor}; }
    .nb1-nav-links a { color:${linkColor} !important; text-decoration:none; transition:color .2s; }
    .nb1-nav-links a:hover { color:${isTransparent || scrolledDark ? '#ffffff' : '#12314D'} !important; }
    .nb1-nav-right { display:flex; align-items:center; gap:20px; }
    .nb1-nav-login { font-size:14px; font-weight:500; color:${resolvedLoginColor}; text-decoration:none; white-space:nowrap; transition:color .2s; }
    .nb1-nav-login:hover { color:${isTransparent ? '#fff' : 'rgb(18,49,77)'}; }
    .nb1-nav-cta { display:inline-flex; align-items:center; font-size:14px; font-weight:700; border-radius:100px; padding:10px 20px; background:#C6FF5B; color:#0B1E33; white-space:nowrap; transition:background .15s; text-decoration:none; }
    .nb1-nav-cta:hover { background:#b8f04a; }
    .nb1-loc { position:relative; }
    .nb1-loc-btn { display:inline-flex; align-items:center; gap:7px; font-family:inherit; font-size:13.5px; font-weight:600; color:${locBtnColor}; background:none; border:1px solid transparent; border-radius:100px; padding:7px 13px; cursor:pointer; transition:background .15s,border-color .15s; white-space:nowrap; }
    .nb1-loc-btn:hover { border-color:${locBtnBorder}; background:${isTransparent ? 'rgba(255,255,255,0.13)' : 'rgba(18,49,77,0.05)'}; }
    .nb1-loc-btn svg.glb { opacity:.75; }
    .nb1-loc-btn svg.chev { opacity:.6; transition:transform .2s; }
    .nb1-loc.open .nb1-loc-btn svg.chev { transform:rotate(180deg); }
    .nb1-loc-menu { position:absolute; top:calc(100% + 12px); right:0; z-index:60; width:248px; background:#fff; border:1px solid rgba(18,49,77,.1); border-radius:16px; box-shadow:0 26px 54px -22px rgba(12,30,52,.34); padding:14px; opacity:0; visibility:hidden; transform:translateY(-6px); transition:opacity .18s,transform .18s,visibility .18s; }
    .nb1-loc.open .nb1-loc-menu { opacity:1; visibility:visible; transform:none; }
    .nb1-loc-menu h5 { margin:4px 6px 8px; font-size:10.5px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:rgba(18,49,77,.42); }
    .nb1-loc-menu h5:not(:first-child) { margin-top:14px; border-top:1px solid rgba(18,49,77,.08); padding-top:14px; }
    .nb1-loc-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px; }
    .nb1-loc-opt { display:flex; align-items:center; gap:8px; font-family:inherit; font-size:13.5px; font-weight:500; color:rgb(18,49,77); background:none; border:none; border-radius:10px; padding:9px 10px; cursor:pointer; text-align:left; transition:background .12s; }
    .nb1-loc-opt:hover { background:rgba(18,49,77,.06); }
    .nb1-loc-opt.sel { background:rgba(10,143,176,.12); color:#0A8FB0; font-weight:700; }
    .nb1-cur-sym { display:inline-flex; width:22px; justify-content:center; font-weight:700; }
    .nb1-loc-done { display:block; width:100%; margin-top:14px; padding:11px; font-family:inherit; font-size:13.5px; font-weight:700; color:#fff; background:#0A8FB0; border:none; border-radius:11px; cursor:pointer; transition:background .15s; }
    .nb1-loc-done:hover { background:#0B7E9C; }
    .nb1-loc-done:disabled { cursor:not-allowed; opacity:.45; }
    .nb1-burger { display:none; flex-direction:column; justify-content:center; gap:5px; width:44px; height:44px; padding:0; background:none; border:none; cursor:pointer; }
    .nb1-burger span { display:block; width:22px; height:2px; border-radius:2px; background:${burgerColor}; margin:0 auto; transition:transform .26s,opacity .18s; }
    .nb1-burger[aria-expanded="true"] span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
    .nb1-burger[aria-expanded="true"] span:nth-child(2) { opacity:0; }
    .nb1-burger[aria-expanded="true"] span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
    .nb1-scrim { position:fixed; inset:68px 0 0; z-index:8998; background:rgba(8,18,30,.2); opacity:0; visibility:hidden; transition:opacity .25s,visibility .25s; }
    .nb1-scrim.open { opacity:1; visibility:visible; }
    .nb1-sheet { position:fixed; left:0; right:0; top:68px; z-index:8999; background:rgba(247,250,251,.92); -webkit-backdrop-filter:blur(26px); backdrop-filter:blur(26px); border-bottom:1px solid rgba(18,49,77,.10); box-shadow:0 26px 44px -26px rgba(12,30,52,.34); padding:6px 0 calc(20px + env(safe-area-inset-bottom)); transform:translateY(-14px); opacity:0; visibility:hidden; transition:transform .28s cubic-bezier(.16,.84,.44,1),opacity .2s,visibility .28s; max-height:calc(100vh - 68px); max-height:calc(100dvh - 68px); overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }
    .nb1-sheet.open { transform:translateY(0); opacity:1; visibility:visible; }
    .nb1-sheet a { display:block; padding:16px 28px; font-size:17px; font-weight:500; color:rgb(18,49,77); border-bottom:1px solid rgba(18,49,77,.08); text-decoration:none; }
    .nb1-sheet a:hover { color:rgb(10,143,176); }
    /* Journal branch rows. Indented by depth so the hierarchy reads without any
       disclosure controls, and stepped down in size so a pillar does not compete
       with a hub for attention. The 16px vertical padding above is unchanged —
       depth affects the left edge, never the tap height. */
    .nb1-sheet a.nb1-sheet-sub { font-size:16px; color:rgba(18,49,77,.82); }
    .nb1-sheet a.nb1-sheet-d1 { padding-left:44px; }
    .nb1-sheet a.nb1-sheet-d2 { padding-left:60px; font-size:15px; color:rgba(18,49,77,.7); }
    .nb1-sheet-cta { margin:18px 24px 0 !important; padding:16px !important; text-align:center; border-radius:100px; background:#C6FF5B; color:#0B1E33 !important; font-weight:700 !important; font-size:15.5px; border-bottom:none !important; display:block; }
    .nb1-sheet-cta:hover { background:#b8f04a; color:#0B1E33 !important; }
    .nb1-sheet-loc { margin:14px 24px 0; padding:16px 0 2px; border-top:1px solid rgba(18,49,77,.10); }
    .nb1-sheet-locbtn { display:flex; align-items:center; gap:9px; width:100%; font:inherit; font-size:14px; font-weight:500; color:rgba(18,49,77,.6); background:transparent; border:1px solid rgba(18,49,77,.16); border-radius:100px; padding:11px 16px; cursor:pointer; transition:color .15s,border-color .15s; }
    .nb1-sheet-locbtn:hover { color:#12314D; border-color:rgba(18,49,77,.3); }
    .nb1-sheet-locbtn .glb { width:15px; height:15px; opacity:.55; flex:none; }
    .nb1-sheet-locbtn .chev { width:12px; height:12px; opacity:.5; margin-left:auto; flex:none; }
    .nb1-sheet-locval { font-weight:600; letter-spacing:.01em; }
    .nb1-locpop { position:fixed; inset:0; z-index:9200; display:flex; align-items:flex-end; justify-content:center; background:rgba(11,26,43,.5); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); opacity:0; visibility:hidden; transition:opacity .22s,visibility .22s; }
    .nb1-locpop.open { opacity:1; visibility:visible; }
    .nb1-locpop-card { width:100%; max-width:520px; background:#fff; border-radius:22px 22px 0 0; padding:22px 22px calc(22px + env(safe-area-inset-bottom)); box-shadow:0 -20px 60px -20px rgba(12,30,52,.5); transform:translateY(14px); transition:transform .26s cubic-bezier(.16,.84,.44,1); }
    .nb1-locpop.open .nb1-locpop-card { transform:none; }
    .nb1-locpop-card h5 { margin:4px 6px 8px; font-size:10.5px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:rgba(18,49,77,.42); }
    .nb1-locpop-card h5:not(:first-child) { margin-top:14px; border-top:1px solid rgba(18,49,77,.08); padding-top:14px; }
    @media (max-width:860px) { .nb1-burger{display:flex;} .nb1-nav-links{display:none;} .nb1-nav-right .nb1-nav-login{display:none;} .nb1-nav-right .nb1-nav-cta{display:none;} .nb1-nav-right .nb1-loc{display:none;} .nb1-sheet-cta{display:none;} }
    @media (min-width:861px) { .nb1-sheet,.nb1-scrim,.nb1-burger{display:none !important;} }
    .lab-secnav{ position:relative; display:flex; align-items:center; margin-left:14px; opacity:0; transform:translateY(-6px); pointer-events:none; transition:opacity .28s ease, transform .28s ease; }
    .lab-secnav.show{ opacity:1; transform:none; pointer-events:auto; }
    @media (prefers-reduced-motion: reduce){ .lab-secnav{ transition:none; } }
    .lab-secnav-btn{ display:inline-flex; align-items:center; gap:8px; font-family:'Instrument Sans',system-ui,sans-serif; font-size:13.5px; font-weight:600; color:#0E2738; background:rgba(46,127,168,.08); border:1px solid #D4E6F0; border-radius:999px; padding:7px 12px 7px 13px; cursor:pointer; max-width:60vw; }
    .lab-secnav-btn .dot{ width:6px; height:6px; border-radius:50%; background:#2E7FA8; flex:none; }
    .lab-secnav-btn .lbl{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .lab-secnav-btn .chev{ transition:transform .2s ease; flex:none; color:#8497A4; }
    .lab-secnav.open .lab-secnav-btn .chev{ transform:rotate(180deg); }
    .lab-secnav-btn:focus-visible{ outline:2px solid #2E7FA8; outline-offset:2px; }
    .lab-secnav-menu{ position:absolute; top:calc(100% + 8px); left:0; min-width:230px; background:#fff; border:1px solid #E4EBF1; border-radius:14px; box-shadow:0 18px 44px -20px rgba(14,39,56,.4); padding:8px; opacity:0; transform:translateY(-6px); pointer-events:none; transition:opacity .18s ease, transform .18s ease; z-index:50; }
    .lab-secnav.open .lab-secnav-menu{ opacity:1; transform:none; pointer-events:auto; }
    @media (prefers-reduced-motion: reduce){ .lab-secnav-menu{ transition:none; } }
    .lab-secnav-h{ font-family:ui-monospace,Menlo,monospace; font-size:10.5px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:#8497A4; padding:6px 10px 8px; }
    .lab-secnav-row{ display:flex; align-items:center; gap:11px; padding:9px 10px; border-radius:9px; font-family:'Instrument Sans',system-ui,sans-serif; font-size:14px; color:#43586A; text-decoration:none; }
    .lab-secnav-row .tick{ width:14px; height:1.5px; border-radius:2px; background:#C2D2DC; flex:none; transition:width .15s ease, background .15s ease; }
    .lab-secnav-row:hover{ background:#F4F8FB; }
    .lab-secnav-row.active{ color:#0E2738; font-weight:600; }
    .lab-secnav-row.active .tick{ width:20px; background:#2E7FA8; }
    .lab-secnav-row:focus-visible{ outline:2px solid #2E7FA8; outline-offset:1px; }
    @media(max-width:760px){ .lab-secnav{ margin-left:10px; } }
    .nb1-disc{ position:relative; display:inline-flex; align-items:center; }
    .nb1-disc-btn{ display:inline-flex; align-items:center; gap:5px; font-family:inherit; font-size:14px; font-weight:500; color:${linkColor}; background:none; border:none; padding:0; cursor:pointer; line-height:1; transition:color .15s; }
    .nb1-disc-btn:hover{ color:${isTransparent || scrolledDark ? '#ffffff' : '#12314D'}; }
    .nb1-disc-btn .chev{ width:11px; height:11px; opacity:.7; transition:transform .2s; }
    .nb1-disc.open .nb1-disc-btn .chev{ transform:rotate(180deg); }
    .nb1-disc-btn:focus-visible{ outline:2px solid #0A8FB0; outline-offset:3px; border-radius:4px; }
    .nb1-disc-menu{ position:absolute; top:calc(100% + 18px); left:auto; right:0; transform:translateY(-6px); min-width:236px; background:#fff; border:1px solid rgba(18,49,77,.1); border-radius:14px; box-shadow:0 26px 54px -22px rgba(12,30,52,.34); padding:8px; opacity:0; visibility:hidden; pointer-events:none; transition:opacity .18s,transform .18s,visibility .18s; z-index:60; }
    .nb1-disc.open .nb1-disc-menu{ opacity:1; visibility:visible; transform:translateY(0); pointer-events:auto; }
    .nb1-disc-menu a{ display:block; padding:10px 13px; border-radius:9px; font-size:14px; font-weight:500; color:rgb(18,49,77); white-space:nowrap; text-decoration:none; transition:background .12s,color .12s; }
    .nb1-disc-menu a:hover{ background:#F4F8FB; color:#0A8FB0; }
    @media (prefers-reduced-motion: reduce){ .nb1-disc-btn .chev, .nb1-disc-menu{ transition:none; } }
    @media (max-width:860px){ .nb1-nav-right .nb1-disc{ display:none; } }

    /* ── Journal branch: three levels, and it works with JavaScript off ──────
       The parent menu is right-aligned (right:0), so panels open LEFTWARD.
       At 1024px: menu 236 + panel 236 + panel 260 = 732px, which clears the
       viewport with room for the logo. Opening rightward would run off-screen
       at the second level, before German ever got a chance to make it worse. */
    .nb1-disc-divider{ height:1px; margin:7px 9px; background:rgba(18,49,77,.1); }

    /* width:100% matters. Without it the sub shrink-wraps its content — measured
       218px at level 2 but only 147px at level 3 — and since the panel is
       positioned with left:calc(100% + …), that 100% shrank with nesting and the
       third panel landed 10px INSIDE its parent. Pinning the sub to its parent
       panel's content width makes the offset mean the same thing at every level. */
    .nb1-disc-sub{ position:relative; }

    /* FIXED widths, not percentages, and this is the third attempt so it is worth
       saying why. The child panel is positioned with left:calc(100% + …), where
       100% resolves against the sub — and the sub's own width:100% resolved
       against the parent panel's CONTENT box, which overflow-y:auto shrinks by
       the scrollbar width. Measured: 218px at level 2, 147px at level 3 against a
       164px content box. So the same offset meant different things at different
       depths and the third panel landed 10px inside its parent.

       Pinning both the panel and the sub to fixed pixels makes the arithmetic
       exact: sub 174 + 14 offset = 188, parent's right edge sits at 182 from the
       same origin, so every level gets a 6px gap regardless of scrollbars. */
    .nb1-disc-menu > .nb1-disc-sub{ width:220px; }
    .nb1-disc-panel > .nb1-disc-sub{ width:174px; }
    .nb1-disc-row{ display:flex; align-items:stretch; gap:2px; }
    /* The label takes the space; the arrow is its own target beside it. */
    .nb1-disc-row > a{ flex:1 1 auto; }

    .nb1-disc-arrow{ display:inline-flex; align-items:center; justify-content:center;
      /* 34px, not the visual 20px. The brief's separate-tap-target rule is
         pointless if the target is too small to hit on a phone. */
      flex:0 0 34px; min-height:34px; padding:0; border:none; border-radius:9px;
      background:none; color:rgb(18,49,77); cursor:pointer; transition:background .12s,color .12s; }
    .nb1-disc-arrow svg{ width:13px; height:13px; opacity:.65; transition:transform .18s; }
    .nb1-disc-arrow:hover{ background:#F4F8FB; color:#0A8FB0; }
    .nb1-disc-arrow:focus-visible{ outline:2px solid #0A8FB0; outline-offset:2px; }

    /* Opens to the RIGHT, and that is measured rather than assumed.
       The Discover menu is right-aligned inside a width-constrained header, so
       the space to its LEFT varies with the viewport — 212px at 880, 356px at
       1024, 612px at 1280 — while the space to its RIGHT is a constant 432px at
       every width. Two 200px panels plus gaps need 416px, so rightward fits
       everywhere the flyout is visible and leftward fails below about 1280.
       Opening left is what pushed the third panel 162px off a 1024px screen.

       The +14px, not +6px: 100% is the ROW's width, and the row sits inside the
       menu's 8px padding — so +6 put the panel 2px INSIDE the parent, which is
       the 9px overlap the brief forbids. 8px padding + 6px gap = 14. */
    .nb1-disc-panel{ position:absolute; top:-8px; left:calc(100% + 14px); width:190px;
      background:#fff; border:1px solid rgba(18,49,77,.1); border-radius:14px;
      box-shadow:0 26px 54px -22px rgba(12,30,52,.34); padding:8px;
      opacity:0; visibility:hidden; pointer-events:none; transform:translateX(-6px);
      transition:opacity .18s,transform .18s,visibility .18s; z-index:61;
      /* Ten pillars in German is a tall panel. Scroll inside it rather than
         off the bottom of a 768px-tall laptop screen. */
      /* Capped against where the panel STARTS, not just the viewport height.
         70vh looked right and was wrong: the Mikrobiom panel opens ~280px down
         the page, so on an 880x700 laptop it ran 65px below the fold with no way
         to reach the last two pillars. Subtracting the start offset keeps the
         whole panel on screen; the floor stops it collapsing on a short window. */
      max-height:max(220px, calc(100vh - 300px)); }

    /* ONLY the deepest panel scrolls, and this is the bug the measurements missed.
       overflow-y:auto on a panel that CONTAINS another panel makes that child part
       of the parent's scrollable area — the nested panel is positioned outside the
       parent's content box on purpose, so the parent grew a horizontal scrollbar,
       scrolled sideways, and clipped its own labels to "ew", "iome", "rch", "n".
       getBoundingClientRect reports layout position, not clipping, so every
       overlap and viewport check passed while the menu was visibly broken.

       :has() asks the only question that matters — does this panel contain
       another? A leaf panel can scroll safely because nothing is positioned
       outside it. */
    .nb1-disc-panel:not(:has(.nb1-disc-panel)){ overflow-y:auto; overflow-x:hidden; }

    /* Panel rows WRAP. The Discover menu sets white-space:nowrap, which is right
       for a 236px menu of short items and wrong once it is inherited into a 190px
       panel of German pillar names: "Ernährung und Mikrobiom" overflowed, the
       panel grew a horizontal scrollbar, and the label was cut mid-word. Wrapping
       to two lines costs a little height and loses nothing. */
    .nb1-disc-panel a{ white-space:normal; line-height:1.35; }

    /* Three ways in, on purpose. :hover and :focus-within are CSS-only, so the
       submenu opens with JavaScript disabled and from the keyboard; [data-open]
       is the React button, which is what touch needs. */
    .nb1-disc-sub:hover > .nb1-disc-panel,
    .nb1-disc-sub:focus-within > .nb1-disc-panel,
    .nb1-disc-sub[data-open='true'] > .nb1-disc-panel{
      opacity:1; visibility:visible; pointer-events:auto; transform:translateX(0); }

    /* No rotation. The chevron already points right, which is now the direction
       the panel opens — rotating it 90deg made it point DOWN at a panel that
       appears to the side. Nudged instead, so open state still reads. */
    .nb1-disc-sub[data-open='true'] > .nb1-disc-row .nb1-disc-arrow svg,
    .nb1-disc-sub:hover > .nb1-disc-row .nb1-disc-arrow svg{ transform:translateX(2px); }

    /* The same CSS-only opening for the top-level Discover menu. Without this the
       four existing items are in the HTML but unreachable with JavaScript off,
       which is the brief's §5 test. */
    .nb1-disc:hover .nb1-disc-menu,
    .nb1-disc:focus-within .nb1-disc-menu{
      opacity:1; visibility:visible; transform:translateY(0); pointer-events:auto; }

    /* Below the desktop breakpoint the whole flyout is replaced by the mobile
       sheet, which renders the same links as a flat list. Three hover panels on a
       360px screen is not a design, it is a trap. */
    @media (max-width:860px){ .nb1-disc-panel{ display:none; } }

    @media (prefers-reduced-motion: reduce){
      .nb1-disc-panel, .nb1-disc-arrow, .nb1-disc-arrow svg{ transition:none; } }
  `

  return (
    <>
      {}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav className={`nb1-nav${hidden ? ' nb1-hidden' : ''}`} aria-label="Main navigation">
        <div className="nb1-nav-in">
          <Link href={`/${locale}`} className="nb1-logo" aria-label="NB1">
            {activeLogo?.url ? (
              <img
                src={activeLogo.url}
                alt={activeLogo.alt || 'NB1'}
                width={activeLogo.width ?? undefined}
                height={activeLogo.height ?? undefined}
              />
            ) : (
              <span
                style={{ fontWeight: 800, fontSize: 18, color: isTransparent ? '#fff' : '#0B1E33' }}
              >
                NB<sup>1</sup>
              </span>
            )}
          </Link>

          {hasSecNav && (
            <div
              className={`lab-secnav${secNavShow ? ' show' : ''}${secNavOpen ? ' open' : ''}`}
              ref={secNavRef}
            >
              <button
                ref={secNavBtnRef}
                className="lab-secnav-btn"
                type="button"
                aria-haspopup="true"
                aria-expanded={secNavOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  setSecNavOpen((o) => !o)
                }}
              >
                <span className="dot" />
                <span className="lbl">{activeSectionLabel || dict.header.onThisPage}</span>
                <svg
                  className="chev"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className="lab-secnav-menu" role="menu">
                <div className="lab-secnav-h">{dict.header.onThisPage}</div>
                {sectionNavItems.map((item) => (
                  <a
                    key={item.sectionId}
                    className={`lab-secnav-row${activeSectionId === item.sectionId ? ' active' : ''}`}
                    role="menuitem"
                    href={`#${item.sectionId}`}
                    onClick={() => setSecNavOpen(false)}
                  >
                    <span className="tick" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {navItems.length > 0 && (
            <nav className="nb1-nav-links">
              {navItems.map(({ link }, i) => {
                if (!link) return null
                const label = link.localizedLabel || link.label || ''
                // Use the locale from the URL path (e.g. 'be'), not curLang (e.g. 'nl'),
                // to avoid double-prefixing when locale differs from language code.
                const localeFromPath = pathname.split('/')[1] || locale
                const href = localizeNavHref(link.url || '', localeFromPath)
                return (
                  <a
                    key={i}
                    href={href}
                    target={link.newTab ? '_blank' : undefined}
                    rel={link.newTab ? 'noopener noreferrer' : undefined}
                  >
                    {label}
                  </a>
                )
              })}
            </nav>
          )}

          <div className="nb1-nav-right">
            {hasDiscoverNav && (
              <div className={`nb1-disc${discOpen ? ' open' : ''}`} ref={discRef}>
                <button
                  ref={discBtnRef}
                  className="nb1-disc-btn"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={discOpen}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDiscOpen((o) => !o)
                  }}
                >
                  {discoverNavLabel || 'Discover'}
                  <svg
                    className="chev"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="nb1-disc-menu" role="menu">
                  {discoverNavItems.map(({ link }, i) => {
                    if (!link) return null
                    const label = link.localizedLabel || link.label || ''
                    const localeFromPath = pathname.split('/')[1] || locale
                    const href = localizeNavHref(link.url || '', localeFromPath)
                    return (
                      <a
                        key={i}
                        role="menuitem"
                        href={href}
                        target={link.newTab ? '_blank' : undefined}
                        rel={link.newTab ? 'noopener noreferrer' : undefined}
                        onClick={() => setDiscOpen(false)}
                      >
                        {label}
                      </a>
                    )
                  })}

                  {/*
                    Journal — last, below a divider, per the brief. The four items
                    above stay on try.nb1.com and are untouched.

                    TWO TAP TARGETS. The label is an `<a href>` to the Journal
                    index; the arrow is a separate `<button>` that opens the
                    submenu. Combining them is the failure the brief calls "the
                    single most common way this pattern breaks": on touch there is
                    no hover, so a combined element always opens the submenu and
                    `/en/journal` becomes unreachable on a phone.
                  */}
                  {journalNav && (
                    <>
                      <div aria-hidden="true" className="nb1-disc-divider" />
                      <JournalNavItem
                        node={journalNav}
                        onNavigate={() => setDiscOpen(false)}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Language / currency picker */}
            <div className="nb1-loc" ref={locRef}>
              <button
                className="nb1-loc-btn"
                type="button"
                aria-haspopup="true"
                aria-expanded={locOpen}
                aria-label="Language and currency"
                onClick={(e) => {
                  e.stopPropagation()
                  setLocOpen((o) => {
                    if (!o) {
                      setPendingLang(curLang)
                      setPendingCur(curCur)
                    }
                    return !o
                  })
                }}
              >
                {GLOBE}
                <span>
                  {curLang.toUpperCase()} · {curSym(curCur)}
                </span>
                {CHEV}
              </button>
              <div
                className={`nb1-loc-menu${locOpen ? '' : ''}`}
                style={locOpen ? { opacity: 1, visibility: 'visible', transform: 'none' } : {}}
              >
                <h5>{dict.header.language}</h5>
                <div className="nb1-loc-grid">
                  {langs.map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      className={`nb1-loc-opt${pendingLang === code ? ' sel' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingLang(code)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <h5>{dict.header.currency}</h5>
                <div className="nb1-loc-grid">
                  {allowedCurs(pendingLang).map(([code, sym, name]) => (
                    <button
                      key={code}
                      type="button"
                      className={`nb1-loc-opt${pendingCur === code ? ' sel' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingCur(code)
                      }}
                    >
                      <span className="nb1-cur-sym">{sym}</span>
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="nb1-loc-done"
                  disabled={!pendingLocaleAvailable}
                  title={
                    pendingLocaleAvailable
                      ? undefined
                      : 'This page is not available in the selected market.'
                  }
                  onClick={() => {
                    applyLang(pendingLang)
                    setLocOpen(false)
                  }}
                >
                  {dict.header.apply}
                </button>
              </div>
            </div>

            {loginText && loginHref && (
              <a href={loginHref} className="nb1-nav-login">
                {loginText}
              </a>
            )}

            {ctaLabel && ctaUrl && (
              <a
                href={`/${curLocale}${ctaUrl.startsWith('/') ? ctaUrl : `/${ctaUrl}`}`}
                className="nb1-nav-cta"
              >
                {ctaLabel}
              </a>
            )}

            {/* Mobile burger */}
            <button
              className="nb1-burger"
              type="button"
              aria-label={sheetOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile scrim */}
      <div className={`nb1-scrim${sheetOpen ? ' open' : ''}`} onClick={() => setSheetOpen(false)} />

      {/* Mobile sheet */}
      <nav className={`nb1-sheet${sheetOpen ? ' open' : ''}`} aria-label="Mobile menu">
        {navItems.map(({ link }, i) => {
          if (!link) return null
          const label = link.localizedLabel || link.label || ''
          const localeFromPathM = pathname.split('/')[1] || locale
          const hrefM = localizeNavHref(link.url || '', localeFromPathM)
          return (
            <a key={i} href={hrefM} onClick={() => setSheetOpen(false)}>
              {label}
            </a>
          )
        })}
        {/* Discover items — desktop shows these in the .nb1-disc dropdown (hidden
            ≤860px); on mobile we surface them here as plain sheet links, directly
            beneath the other nav links. */}
        {hasDiscoverNav &&
          discoverNavItems.map(({ link }, i) => {
            if (!link) return null
            const label = link.localizedLabel || link.label || ''
            const localeFromPathD = pathname.split('/')[1] || locale
            const hrefD = localizeNavHref(link.url || '', localeFromPathD)
            return (
              <a
                key={`disc-${i}`}
                href={hrefD}
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab ? 'noopener noreferrer' : undefined}
                onClick={() => setSheetOpen(false)}
              >
                {label}
              </a>
            )
          })}

        {/*
          The Journal branch on mobile: FLATTENED, not a nested flyout.

          Three hover panels on a 360px screen is not a design. Every link from
          the desktop tree appears here as a sheet row, indented by depth so the
          hierarchy is still readable, and every one is a plain anchor — so the
          brief's "reachable on a phone" requirement holds for `/en/journal` and
          for all ten pillars without a single disclosure control.
        */}
        {journalNav &&
          flattenJournalNav(journalNav).map(({ node, depth }) => (
            <a
              className={depth > 0 ? `nb1-sheet-sub nb1-sheet-d${Math.min(depth, 2)}` : undefined}
              href={node.href}
              key={`jn-${node.href}-${depth}`}
              onClick={() => setSheetOpen(false)}
            >
              {node.label}
            </a>
          ))}

        {loginText && loginHref && (
          <a href={loginHref} onClick={() => setSheetOpen(false)}>
            {loginText}
          </a>
        )}
        {ctaLabel && ctaUrl && (
          <a
            href={`/${curLocale}${ctaUrl.startsWith('/') ? ctaUrl : `/${ctaUrl}`}`}
            className="nb1-sheet-cta"
            onClick={() => setSheetOpen(false)}
          >
            {ctaLabel}
          </a>
        )}
        <div className="nb1-sheet-loc">
          <button
            ref={locPopTriggerRef}
            type="button"
            className="nb1-sheet-locbtn"
            aria-haspopup="dialog"
            onClick={(e) => {
              e.stopPropagation()
              setPendingLang(curLang)
              setPendingCur(curCur)
              setLocPopOpen(true)
            }}
          >
            <svg
              className="glb"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
            </svg>
            <span className="nb1-sheet-locval">
              {langs.find(([c]) => c === curLang)?.[1] ?? curLang.toUpperCase()} · {curSym(curCur)}
            </span>
            <svg
              className="chev"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Locale bottom-sheet popup */}
      <div
        className={`nb1-locpop${locPopOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Language and currency"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setLocPopOpen(false)
            locPopTriggerRef.current?.focus()
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setLocPopOpen(false)
            locPopTriggerRef.current?.focus()
          }
        }}
      >
        <div className="nb1-locpop-card">
          <h5>{dict.header.language}</h5>
          <div className="nb1-loc-grid">
            {langs.map(([code, label]) => (
              <button
                key={code}
                type="button"
                className={`nb1-loc-opt${pendingLang === code ? ' sel' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setPendingLang(code)
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <h5>{dict.header.currency}</h5>
          <div className="nb1-loc-grid">
            {allowedCurs(pendingLang).map(([code, sym, name]) => (
              <button
                key={code}
                type="button"
                className={`nb1-loc-opt${pendingCur === code ? ' sel' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setPendingCur(code)
                }}
              >
                <span className="nb1-cur-sym">{sym}</span>
                {name}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="nb1-loc-done"
            disabled={!pendingLocaleAvailable}
            title={
              pendingLocaleAvailable
                ? undefined
                : 'This page is not available in the selected market.'
            }
            onClick={() => {
              applyLang(pendingLang)
              setLocPopOpen(false)
              locPopTriggerRef.current?.focus()
            }}
          >
            {dict.header.apply}
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * One row in the Journal branch, and its submenu if it has children.
 *
 * ## Two tap targets, always
 *
 * The label is an `<a href>`; the disclosure arrow is a sibling `<button>`. The
 * brief is emphatic about this and it is worth restating: a single element that
 * both navigates and discloses cannot do both on touch, where there is no hover.
 * Tapping it opens the panel, every time, and the parent page becomes unreachable
 * on a phone. That is how `/en/journal` disappears.
 *
 * ## Why the submenu is in the DOM even when closed
 *
 * §12 requires every nav link to be a real anchor in the HTML the server sends,
 * and the brief's test is to disable JavaScript and confirm the links are still
 * clickable. So the panels are always rendered and hidden with CSS — never
 * conditionally mounted. Closed state is `visibility:hidden`, which keeps them out
 * of the tab order and away from screen readers while leaving them in the markup
 * for a crawler.
 *
 * The CSS opens a panel on `:hover` and `:focus-within` as well as on the
 * `data-open` attribute this component sets. That is what makes it work with
 * JavaScript off — and hover-to-open is what the brief specifies anyway ("the same
 * interaction Microbiome already uses"). The button is then an enhancement for
 * touch and for keyboards, not the only way in.
 */
function JournalNavItem({
  node,
  onNavigate,
}: {
  node: JournalNavNode
  onNavigate: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const hasChildren = Boolean(node.children?.length)

  return (
    <div className="nb1-disc-sub" data-open={open ? 'true' : undefined}>
      <div className="nb1-disc-row">
        <a href={node.href} onClick={onNavigate}>
          {node.label}
        </a>

        {hasChildren && (
          <button
            aria-expanded={open}
            aria-label={`${node.label} — submenu`}
            className="nb1-disc-arrow"
            onClick={(event) => {
              // Stop the click reaching the row's anchor or the outside-click
              // handler that closes the whole Discover menu.
              event.preventDefault()
              event.stopPropagation()
              setOpen((value) => !value)
            }}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
              viewBox="0 0 24 24"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}
      </div>

      {hasChildren && (
        <div className="nb1-disc-panel" role="menu">
          {node.children!.map((child) => (
            <JournalNavItem key={child.href} node={child} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Depth-first flattening of the Journal tree, for the mobile sheet.
 *
 * The mobile menu is a vertical list of anchors, not a flyout — so the tree
 * becomes rows carrying their depth, and indentation stands in for nesting. Every
 * link survives the flattening, which is the point: nothing in the desktop menu
 * should be unreachable on a phone.
 *
 * The parent's own link is emitted before its children, so "Journal" is tappable
 * in its own right rather than only being a heading over its contents.
 */
function flattenJournalNav(
  node: JournalNavNode,
  depth = 0,
): Array<{ node: JournalNavNode; depth: number }> {
  return [
    { node, depth },
    ...(node.children ?? []).flatMap((child) => flattenJournalNav(child, depth + 1)),
  ]
}
