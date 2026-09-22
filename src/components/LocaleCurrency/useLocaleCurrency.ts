'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { isAppLocale, localeConfig, type AppLocale } from '@/i18n/config'
import {
  buildLocalizedDocumentPath,
  type LocalizedDocument,
} from '@/Header/localizedDocument'

/**
 * The header's language / currency selector, as a headless hook.
 *
 * EXTRACTED VERBATIM from `src/Header/Component.client.tsx`, where it was 160
 * lines woven through a 1400-line component that every page on the live site
 * renders. It was moved so the redesign header can reuse it rather than draw a
 * second, decorative switcher beside the real one.
 *
 * Deliberately headless: it returns state and handlers, no markup. The live
 * header keeps its own JSX exactly as it was — nothing about what it renders
 * moved — and the redesign header writes the mockup's markup against the same
 * logic. That is what makes this extraction safe to do at all: a shared
 * COMPONENT would have forced the live header's markup to change; a shared hook
 * cannot.
 *
 * Everything below is a move, not a rewrite. The cookie names, the localStorage
 * keys, the `nb1:currencychange` event, the nl/be geo resolution and the
 * locale/currency matrices are the originals, unedited, so the live header
 * behaves exactly as before.
 */

const DEFAULT_LANGS: Array<[string, string]> = [
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['nl', 'Dutch'],
  ['it', 'Italiano'],
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
  it: ['EUR'],
}

// Fixed default currency per locale — overrides cookie when the cookie value isn't valid for that locale
const LOCALE_DEFAULT_CURRENCY: Record<string, string> = {
  ch: 'CHF',
  uk: 'GBP',
  uae: 'AED',
  be: 'EUR',
  nl: 'EUR',
  it: 'EUR',
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
  it: ['EUR'],
  ch: ['CHF'],
  be: ['EUR'],
  uk: ['GBP'],
  uae: ['AED'],
}

function localeToLang(locale: string): string {
  return isAppLocale(locale) ? localeConfig[locale].htmlLang : locale
}

function lsSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* noop */
  }
}

export type UseLocaleCurrencyArgs = {
  /** The locale the server rendered with; the pathname wins when it disagrees. */
  locale?: string | null
  /** Locale default, so server and client hydrate the same currency. */
  initialCurrency?: string
  /** Present when the current document has per-locale slugs to switch between. */
  localizedDocument?: LocalizedDocument | null
  langs?: Array<[string, string]>
  currencies?: Array<[string, string, string]>
  langCurrencies?: Record<string, string[]>
}

export function useLocaleCurrency({
  locale,
  initialCurrency,
  localizedDocument = null,
  langs = DEFAULT_LANGS,
  currencies = DEFAULT_CURRENCIES,
  langCurrencies = DEFAULT_LANG_CURRENCIES,
}: UseLocaleCurrencyArgs) {
  const pathname = usePathname()


  // Lang / currency — derive from URL pathname (e.g. /de/...) so the selector
  // always reflects the page the user is actually on, regardless of localStorage.
  const langFromPath = pathname.split('/')[1]
  const validLangCodes = langs.map(([code]) => code)
  const resolvedLang = localeToLang(langFromPath)
  const activeLang = validLangCodes.includes(resolvedLang)
    ? resolvedLang
    : localeToLang(locale || 'en')
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
  // Start with the locale default so shared HTML hydrates consistently.
  const [curCur, setCurCur] = useState(initialCurrency || 'EUR')
  // On mount, sync curCur from cookie — but validate it against the current locale.
  // If the cookie currency isn't allowed for this locale, use the locale's default.
  useEffect(() => {
    const syncCurrency = () => {
      try {
        const currentLocale = pathname.split('/')[1] || 'en'
        const allowed = LOCALE_ALLOWED_CURRENCIES[currentLocale]
        const localDefault = LOCALE_DEFAULT_CURRENCY[currentLocale]
        const match = document.cookie.match(/(?:^|; )nb1_currency=([^;]*)/)
        const cookieCur = match ? decodeURIComponent(match[1]) : ''
        const resolved = cookieCur && allowed?.includes(cookieCur) ? cookieCur : localDefault || 'EUR'
        setCurCur(resolved)
        // Repair an existing preference, but do not create a cookie for a default.
        if (cookieCur && resolved !== cookieCur) {
          document.cookie = `nb1_currency=${resolved}; path=/; max-age=31536000; samesite=lax`
        }
      } catch {
        /* noop */
      }
    }
    syncCurrency()
    window.addEventListener('nb1:currencychange', syncCurrency)
    return () => window.removeEventListener('nb1:currencychange', syncCurrency)
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
    if (lang === 'it') return 'it'
    if (lang === 'nl') {
      // Resolve nl vs be via geo country cookie; if neither, fall back to nl
      const country = (() => {
        try {
          return document.cookie.match(/(?:^|; )nb1_country=([^;]*)/)?.[1] || ''
        } catch {
          return ''
        }
      })()
      if (country === 'BE' || curLocale === 'be') return 'be'
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
    if (targetLocale === curLocale && lang === curLang) {
      applyCur(targetCurrency)
      setLocOpen(false)
      return
    }
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
    // Persist across navigation; pricing components update through the event below.
    try {
      document.cookie = `nb1_currency=${cur}; path=/; max-age=31536000; samesite=lax`
    } catch {
      /* noop */
    }
    window.dispatchEvent(new CustomEvent('nb1:currencychange', { detail: cur }))
  }

  const pendingTargetLocale = resolveTargetLocale(pendingLang, pendingCur)
  const pendingLocaleAvailable =
    !localizedDocument || typeof localizedDocument.slugs[pendingTargetLocale] === 'string'


  return {
    /** The list the caller renders, so both headers offer the same options. */
    langs,
    currencies,
    /** Language of the page as it is now, collapsed (uk -> en, be -> nl). */
    activeLang,
    /** The URL's own locale segment, uncollapsed. */
    activeLocale,
    curLang,
    curLocale,
    curCur,
    /** Chosen in the menu but not committed until Apply. */
    pendingLang,
    setPendingLang,
    pendingCur,
    setPendingCur,
    pendingTargetLocale,
    /** False when the current document has no translation for that choice. */
    pendingLocaleAvailable,
    locOpen,
    setLocOpen,
    /** Attach to the menu wrapper: an outside click closes it. */
    locRef,
    /** Currencies valid for a language. */
    allowedCurs,
    /** Symbol for a currency code. */
    curSym,
    /** Commit a language choice: cookies, localStorage, then navigate. */
    applyLang,
    /** Commit a currency choice, and tell pricing components about it. */
    applyCur,
  }
}
