'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { getDictionary } from '@/i18n/getDictionary'
import { isAppLocale } from '@/i18n/config'

type Theme = 'light' | 'dark'

type HeaderVariant = {
  variantKey: string
  theme: Theme
  loginTextColor?: string | null
}

export interface HeaderClientProps {
  locale: string
  /** Per-locale slug map for the page currently being viewed (see Header/Component.tsx
   * for why this is a prop rather than a global). */
  pageSlugs?: Partial<Record<string, string>> | null
  /** Resolved server-side from the currency cookie (see src/utilities/currency.ts).
   * Used as the initial state below instead of reading localStorage, so the
   * SSR markup and the first client render match exactly — reading
   * localStorage in a useState initializer caused a hydration mismatch for
   * any returning visitor whose stored currency differed from the 'EUR'
   * fallback used during SSR (localStorage isn't available on the server). */
  initialCurrency?: string
  logo?: { url?: string | null; alt?: string | null } | null
  logoDark?: { url?: string | null; alt?: string | null } | null
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

// Maps locale path segments that aren't themselves display languages back to their language
const LOCALE_TO_LANG: Record<string, string> = {
  ch: 'de',
  uk: 'en',
  uae: 'en',
  be: 'nl',
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
  return LOCALE_TO_LANG[locale] ?? locale
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
  pageSlugs = null,
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
}) => {
  const searchParams = useSearchParams()
  const variantParam = searchParams.get('v')

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
  const activeLocale = isAppLocale(langFromPath) ? langFromPath : (locale || 'en')
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

  function resolveTargetLocale(lang: string, cur: string): string {
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
    const segments = pathname.split('/')
    segments[1] = targetLocale
    // Use the current page's own per-locale slug map (passed as a prop, so it's
    // always current — see Header/Component.tsx) instead of keeping the current
    // locale's slug, which would 404 or belong to a different page on the target
    // locale (slugs are localized per-page, e.g. en "our-plans" vs de "unsere-plane").
    if (pageSlugs) {
      const targetSlug = pageSlugs[targetLocale] ?? pageSlugs['en']
      if (targetSlug && segments[2] !== undefined) segments[2] = targetSlug
    }
    window.location.href = segments.join('/')
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
  `

  return (
    <>
      {}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <nav className={`nb1-nav${hidden ? ' nb1-hidden' : ''}`} aria-label="Main navigation">
        <div className="nb1-nav-in">
          <Link href={`/${locale}/home-page`} className="nb1-logo" aria-label="NB1">
            {activeLogo?.url ? (
              <img src={activeLogo.url} alt={activeLogo.alt || 'NB1'} />
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
                const raw = link.url || ''
                const isExternal =
                  raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('#')
                // Use the locale from the URL path (e.g. 'be'), not curLang (e.g. 'nl'),
                // to avoid double-prefixing when locale differs from language code.
                const localeFromPath = pathname.split('/')[1] || locale
                const href =
                  raw && !isExternal && !raw.startsWith(`/${localeFromPath}`)
                    ? `/${localeFromPath}${raw.startsWith('/') ? raw : `/${raw}`}`
                    : raw || '#'
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
                    const raw = link.url || ''
                    const isExternal =
                      raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('#')
                    const localeFromPath = pathname.split('/')[1] || locale
                    const href =
                      raw && !isExternal && !raw.startsWith(`/${localeFromPath}`)
                        ? `/${localeFromPath}${raw.startsWith('/') ? raw : `/${raw}`}`
                        : raw || '#'
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
                  onClick={() => {
                    applyLang(pendingLang)
                    setLocOpen(false)
                  }}
                >
                  {dict.header.apply}
                </button>
              </div>
            </div>

            {loginText && loginUrl && (
              <a href={loginUrl} className="nb1-nav-login">
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
          const rawM = link.url || ''
          const isExternalM =
            rawM.startsWith('http://') || rawM.startsWith('https://') || rawM.startsWith('#')
          const localeFromPathM = pathname.split('/')[1] || locale
          const hrefM =
            rawM && !isExternalM && !rawM.startsWith(`/${localeFromPathM}`)
              ? `/${localeFromPathM}${rawM.startsWith('/') ? rawM : `/${rawM}`}`
              : rawM || '#'
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
            const rawD = link.url || ''
            const isExternalD =
              rawD.startsWith('http://') || rawD.startsWith('https://') || rawD.startsWith('#')
            const localeFromPathD = pathname.split('/')[1] || locale
            const hrefD =
              rawD && !isExternalD && !rawD.startsWith(`/${localeFromPathD}`)
                ? `/${localeFromPathD}${rawD.startsWith('/') ? rawD : `/${rawD}`}`
                : rawD || '#'
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
        {loginText && loginUrl && (
          <a href={loginUrl} onClick={() => setSheetOpen(false)}>
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
