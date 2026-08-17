'use client'

import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { isAppLocale, localeConfig, type AppLocale } from '@/i18n/config'

// Languages shown in the switcher (never exposes ch/be/uk/uae directly)
const LANGUAGES = ['en', 'de', 'fr', 'nl'] as const
type Language = (typeof LANGUAGES)[number]

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  nl: 'Nederlands',
}

// Currencies available per language
const LANGUAGE_CURRENCIES: Record<Language, string[]> = {
  en: ['EUR', 'GBP', 'AED'],
  de: ['EUR', 'CHF'],
  fr: ['EUR'],
  nl: ['EUR'],
}

// Map (language, currency) → locale path segment
// Dutch + EUR is ambiguous (nl vs be) — resolved via geo country cookie
function resolveLocale(lang: Language, currency: string, geoCountry: string): string {
  if (lang === 'en') {
    if (currency === 'GBP') return 'uk'
    if (currency === 'AED') return 'uae'
    return 'en'
  }
  if (lang === 'de') {
    if (currency === 'CHF') return 'ch'
    return 'de'
  }
  if (lang === 'fr') return 'fr'
  if (lang === 'nl') {
    if (geoCountry === 'BE') return 'be'
    if (geoCountry === 'NL') return 'nl'
    return 'en' // neither NL nor BE → default to English
  }
  return 'en'
}

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}

// Derive display language from the shared SEO locale definition.
function localeToLanguage(locale: string): Language {
  if (!isAppLocale(locale)) return 'en'
  const language = localeConfig[locale].htmlLang
  return isLanguage(language) ? language : 'en'
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : ''
}

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

function normalizePath(p: string) {
  if (!p) return '/'
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1)
  return p
}

function stripLeadingLocale(pathname: string, currentLocale: string) {
  const p = normalizePath(pathname)
  const prefix = `/${currentLocale}`
  if (p === prefix) return ''
  if (p.startsWith(prefix + '/')) return p.slice(prefix.length)
  return p
}

type Props = {
  locale?: string
  isDark?: boolean
  pageSlugs?: Partial<Record<AppLocale, string>> | null
  textColor?: string
}

export const LocaleSwitcher: React.FC<Props> = ({
  locale,
  isDark = false,
  pageSlugs = null,
  textColor: textColorProp,
}) => {
  const pathname = usePathname() || '/'
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Derive current locale from prop or URL
  const currentLocale = useMemo(() => {
    if (locale) return locale
    return pathname.split('/')[1] || 'en'
  }, [locale, pathname])

  const currentLanguage = useMemo(() => localeToLanguage(currentLocale), [currentLocale])

  const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    () => getCookie('nb1_currency') || 'EUR',
  )

  // Keep selectedLang in sync if locale prop changes
  useEffect(() => {
    setSelectedLang(localeToLanguage(currentLocale))
  }, [currentLocale])

  // When language changes, reset currency to first available option
  const handleLangChange = (lang: Language) => {
    setSelectedLang(lang)
    const available = LANGUAGE_CURRENCIES[lang]
    if (!available.includes(selectedCurrency)) {
      setSelectedCurrency(available[0]!)
    }
  }

  const handleApply = () => {
    const geoCountry = getCookie('nb1_country')
    const targetLocale = resolveLocale(selectedLang, selectedCurrency, geoCountry) as AppLocale
    if (pageSlugs && typeof pageSlugs[targetLocale] !== 'string') return

    const rest = stripLeadingLocale(pathname, currentLocale)
    const targetPath =
      pageSlugs && rest
        ? `/${targetLocale}/${encodeURIComponent(pageSlugs[targetLocale]!)}`
        : `/${targetLocale}${rest}` || `/${targetLocale}`

    // Persist locale + currency cookies so middleware respects the manual choice
    setCookie('nb1_locale', targetLocale)
    setCookie('nb1_currency', selectedCurrency)

    setOpen(false)
    window.location.href = targetPath
  }

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const textColor = textColorProp ?? (isDark ? 'rgba(255,255,255,0.9)' : 'rgba(18,49,77,0.9)')
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(18,49,77,0.45)'
  const hoverBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(18,49,77,0.05)'

  const availableCurrencies = LANGUAGE_CURRENCIES[selectedLang]
  const pendingTargetLocale = resolveLocale(
    selectedLang,
    selectedCurrency,
    getCookie('nb1_country'),
  ) as AppLocale
  const pendingLocaleAvailable = !pageSlugs || typeof pageSlugs[pendingTargetLocale] === 'string'

  return (
    <div className="nb1-lang" ref={ref}>
      <style jsx>{`
        .nb1-lang {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .nb1-lang-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: ${textColor};
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.4rem 0.55rem;
          border-radius: 6px;
          transition:
            background 0.2s,
            color 0.2s;
          font-family: inherit;
        }
        .nb1-lang-trigger:hover {
          background: ${hoverBg};
        }
        .nb1-lang-chevron {
          transition: transform 0.2s;
          color: ${mutedColor};
          display: flex;
          align-items: center;
        }
        .nb1-lang-chevron.open {
          transform: rotate(180deg);
          color: ${textColor};
        }
        .nb1-lang-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: #ffffff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 10px;
          padding: 0.75rem;
          box-shadow:
            0 14px 36px rgba(18, 49, 77, 0.12),
            0 0 0 1px rgba(18, 49, 77, 0.06);
          z-index: 50;
          animation: nb1-fadedown 0.15s ease;
        }
        @keyframes nb1-fadedown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nb1-section-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          padding: 0 0.4rem 0.35rem;
        }
        .nb1-options {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 0.6rem;
        }
        .nb1-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem 0.7rem;
          border-radius: 6px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          color: #12314d;
          transition: background 0.15s;
        }
        .nb1-option:hover {
          background: rgba(10, 143, 176, 0.07);
        }
        .nb1-option.active {
          color: #008498;
          background: rgba(10, 143, 176, 0.07);
        }
        .nb1-divider {
          height: 1px;
          background: rgba(18, 49, 77, 0.08);
          margin: 0.5rem 0;
        }
        .nb1-apply {
          width: 100%;
          padding: 0.55rem;
          border-radius: 6px;
          background: #12314d;
          color: #fff;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          transition: background 0.15s;
          margin-top: 0.25rem;
        }
        .nb1-apply:hover {
          background: #0e2740;
        }
        .nb1-apply:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
      `}</style>

      <button
        type="button"
        className="nb1-lang-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Language and currency: ${currentLanguage.toUpperCase()} / ${getCookie('nb1_currency') || 'EUR'}`}
      >
        <span>
          {currentLanguage.toUpperCase()} / {getCookie('nb1_currency') || 'EUR'}
        </span>
        <span className={`nb1-lang-chevron${open ? ' open' : ''}`}>
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
            <path
              d="M1 1l3.5 3.5L8 1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div className="nb1-lang-menu" role="dialog">
          <div className="nb1-section-label">Language</div>
          <div className="nb1-options">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                className={`nb1-option${selectedLang === lang ? ' active' : ''}`}
                onClick={() => handleLangChange(lang)}
              >
                <span>{LANGUAGE_LABELS[lang]}</span>
                {selectedLang === lang && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path
                      d="M2 6.5L5 9.5L11 3"
                      stroke="#008498"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {availableCurrencies.length > 1 && (
            <>
              <div className="nb1-divider" />
              <div className="nb1-section-label">Currency</div>
              <div className="nb1-options">
                {availableCurrencies.map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    className={`nb1-option${selectedCurrency === cur ? ' active' : ''}`}
                    onClick={() => setSelectedCurrency(cur)}
                  >
                    <span>{cur}</span>
                    {selectedCurrency === cur && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6.5L5 9.5L11 3"
                          stroke="#008498"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="nb1-divider" />
          <button
            type="button"
            className="nb1-apply"
            disabled={!pendingLocaleAvailable}
            onClick={handleApply}
            title={
              pendingLocaleAvailable
                ? undefined
                : 'This page is not available in the selected market.'
            }
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
