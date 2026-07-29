'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useRef } from 'react'

import { trackLeadSuccess } from '@/lib/dataLayer'

type Theme = 'light' | 'dark'

type FooterVariant = {
  variantKey: string
  theme: Theme
  linkColor?: string | null
  logo?: { url?: string | null; alt?: string | null } | null
}

type NavLink = { label?: string | null; url?: string | null }
type LegalLink = { label?: string | null; url?: string | null }

type Props = {
  logo?: { url?: string | null; alt?: string | null } | null
  tagline?: string | null
  subnote?: string | null
  disclaimer?: string | null
  copyrightText?: string | null
  instagramUrl?: string | null
  exploreLinks?: NavLink[]
  getStartedLinks?: NavLink[]
  defaultTheme?: Theme
  defaultLinkColor?: string | null
  variants?: FooterVariant[]
  legalLinks?: LegalLink[]
  formID?: string
  confirmationType?: string | null
  redirectUrl?: string | null
}

export function FooterClient({
  logo,
  tagline,
  subnote,
  disclaimer,
  copyrightText,
  instagramUrl,
  exploreLinks = [],
  getStartedLinks = [],
  defaultTheme = 'dark',
  defaultLinkColor,
  variants = [],
  legalLinks = [],
  formID,
  confirmationType,
  redirectUrl,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const variantParam = searchParams.get('v')
  const klaviyoFormId = params?.locale === 'de' ? 'SadZpb' : 'TPTv44'
  const locale = (params?.locale as string) || 'en'
  const localizeHref = (url?: string | null) => {
    if (!url) return '#'
    const isExternal = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('#')
    if (isExternal || url.startsWith(`/${locale}`)) return url
    return `/${locale}${url.startsWith('/') ? url : `/${url}`}`
  }
  const klaviyoContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const div = document.createElement('div')
    div.className = `klaviyo-form-${klaviyoFormId}`
    klaviyoContainerRef.current?.appendChild(div)
    return () => { div.remove() }
  }, [klaviyoFormId])

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = klaviyoContainerRef.current?.querySelector(`.klaviyo-form-${klaviyoFormId}`)
      const hasForm = (container?.childElementCount ?? 0) > 0
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'klaviyo_form_status',
        klaviyo_form_loaded: hasForm,
        klaviyo_script_present: typeof window.klaviyo !== 'undefined',
        klaviyo_location: 'footer',
      })
    }, 3000)
    return () => clearTimeout(timer)
  }, [klaviyoFormId])

  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; formId: string; metaData?: Record<string, string> }>).detail
      if (detail?.type !== 'submit' || detail?.formId !== klaviyoFormId) return

      const email = detail?.metaData?.$email

      await trackLeadSuccess({
        leadType: 'form_submission',
        leadSource: 'footer',
        formId: klaviyoFormId,
        provider: 'klaviyo',
        pageLanguage: locale,
        email,
      })

      if (formID) {
        fetch('/cms/api/form-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            form: formID,
            submissionData: [{ field: 'email', value: email ?? '' }],
          }),
        }).catch(console.warn)
      }

      if (confirmationType === 'redirect' && redirectUrl) {
        router.push(redirectUrl)
      }
    }
    window.addEventListener('klaviyoForms', handler)
    return () => window.removeEventListener('klaviyoForms', handler)
  }, [formID, confirmationType, redirectUrl, router, klaviyoFormId, locale])

  let theme: Theme = defaultTheme
  let resolvedLogo = logo
  if (variantParam) {
    const match = variants.find((v) => v.variantKey === variantParam)
    if (match) {
      theme = match.theme
      if (match.logo) resolvedLogo = match.logo
    }
  }

  const isDark = theme === 'dark'

  return (
    <>
      <style jsx global>{`
        .nbf { background: ${isDark ? '#0B1E33' : '#ffffff'}; color: ${isDark ? '#fff' : '#0B1E33'}; font-family: 'Inter', system-ui, sans-serif; }
        .nbf * { box-sizing: border-box; }
        .nbf-in { max-width: 1200px; margin: 0 auto; padding: 72px 32px 36px; }
        .nbf-top { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 48px; padding-bottom: 42px; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(18,49,77,0.1)'}; }
        .nbf-brand { max-width: 390px; }
        .nbf-logo { height: 30px; width: auto; display: block; }
        .nbf-tag { font-size: 14px; line-height: 1.6; color: ${isDark ? 'rgba(255,255,255,0.62)' : 'rgba(18,49,77,0.62)'}; margin: 18px 0 22px; }
        .nbf-subnote { font-size: 12px; color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(18,49,77,0.4)'}; margin-top: 12px; }
        .nbf-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${isDark ? 'rgba(255,255,255,0.45)' : 'rgba(18,49,77,0.45)'}; margin: 0 0 14px; }
        .nbf-col a { display: block; font-size: 14px; color: ${isDark ? 'rgba(255,255,255,0.74)' : 'rgba(18,49,77,0.74)'}; text-decoration: none; padding: 7px 0; transition: color 0.15s; }
        .nbf-col a:hover { color: ${isDark ? '#fff' : '#0B1E33'}; }
        .nbf-bot { display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap; padding-top: 26px; }
        .nbf-copy { font-size: 13px; color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(18,49,77,0.5)'}; }
        .nbf-legal { display: flex; gap: 22px; }
        .nbf-legal a, .nbf-soc a { font-size: 13px; color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(18,49,77,0.5)'}; text-decoration: none; transition: color 0.15s; }
        .nbf-legal a:hover, .nbf-soc a:hover { color: ${isDark ? '#fff' : '#0B1E33'}; }
        .nbf-disc { font-size: 11.5px; line-height: 1.6; color: ${isDark ? 'rgba(255,255,255,0.34)' : 'rgba(18,49,77,0.34)'}; margin: 24px 0 0; max-width: 820px; }
        @media (max-width: 820px) {
          .nbf-top { grid-template-columns: 1fr 1fr; }
          .nbf-brand { grid-column: 1 / -1; max-width: none; }
        }
        @media (max-width: 560px) {
          .nbf-top { grid-template-columns: 1fr; gap: 34px; }
          .nbf-bot { flex-direction: column; align-items: flex-start; gap: 14px; }
        }
      `}</style>

      <footer className="nbf">
        <div className="nbf-in">
          <div className="nbf-top">
            {/* Brand column */}
            <div className="nbf-brand">
              {resolvedLogo?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="nbf-logo" src={resolvedLogo.url} alt={resolvedLogo.alt || 'NB1'} />
              )}
              {tagline && <p className="nbf-tag">{tagline}</p>}
              <div ref={klaviyoContainerRef} />
              {subnote && <p className="nbf-subnote">{subnote}</p>}
            </div>

            {/* Explore column */}
            {exploreLinks.length > 0 && (
              <nav className="nbf-col">
                <h4>Explore</h4>
                {exploreLinks.map((link, i) => (
                  <a key={i} href={localizeHref(link.url)}>{link.label}</a>
                ))}
              </nav>
            )}

            {/* Get Started column */}
            {getStartedLinks.length > 0 && (
              <nav className="nbf-col">
                <h4>Get started</h4>
                {getStartedLinks.map((link, i) => (
                  <a key={i} href={localizeHref(link.url)}>{link.label}</a>
                ))}
              </nav>
            )}
          </div>

          <div className="nbf-bot">
            {copyrightText && <span className="nbf-copy">{copyrightText}</span>}
            {legalLinks.length > 0 && (
              <div className="nbf-legal">
                {legalLinks.map((link, i) => (
                  <a key={i} href={localizeHref(link.url)}>{link.label}</a>
                ))}
              </div>
            )}
            {instagramUrl && (
              <div className="nbf-soc">
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
              </div>
            )}
          </div>

          {disclaimer && <p className="nbf-disc">{disclaimer}</p>}
        </div>
      </footer>
    </>
  )
}
