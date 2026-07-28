'use client'

import type { Form as FormType } from '@payloadcms/plugin-form-builder/types'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

import RichText from '@/components/RichText'
import { trackLeadSuccess } from '@/lib/dataLayer'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type BgColorPreset = 'light' | 'dark' | 'darkNavy' | 'teal' | 'white' | 'custom'
type BgType = 'color' | 'image'

type MediaRef = { url?: string | null; alt?: string | null } | null

const DARK_BG: Record<'dark' | 'darkNavy' | 'teal', string> = {
  dark: '#0a1e35',
  darkNavy: '#0e2640',
  teal: '#008498',
}

const LIGHT_GRADIENT = 'linear-gradient(180deg,#E2F0F2 0%,#EAF3F4 100%)'

function isDarkPreset(preset?: BgColorPreset | null): boolean {
  return preset === 'dark' || preset === 'darkNavy' || preset === 'teal'
}

function resolveBg(preset?: BgColorPreset | null, custom?: string | null): string {
  if (!preset || preset === 'light') return LIGHT_GRADIENT
  if (preset === 'dark') return DARK_BG.dark
  if (preset === 'darkNavy') return DARK_BG.darkNavy
  if (preset === 'teal') return DARK_BG.teal
  if (preset === 'white') return '#ffffff'
  if (preset === 'custom') return custom || LIGHT_GRADIENT
  return LIGHT_GRADIENT
}

type OutcomeItem = {
  icon?: { url?: string | null; alt?: string | null } | null
  claim?: string | null
  anchor?: string | null
}

type HeroBannerVariant = {
  variantKey: string
  backgroundColor?: BgColorPreset | null
  backgroundColorCustom?: string | null
  backgroundType?: BgType | null
  backgroundImage?: MediaRef
  pillText?: DefaultTypedEditorState | null
  heading?: DefaultTypedEditorState | null
  description?: DefaultTypedEditorState | null
  ctaButtonText?: string | null
}

export type HeroBannerBlockType = {
  blockName?: string
  blockType?: 'heroBanner'
  backgroundColor?: BgColorPreset | null
  backgroundColorCustom?: string | null
  backgroundType?: BgType | null
  backgroundImage?: MediaRef
  pillText?: DefaultTypedEditorState | null
  heading: DefaultTypedEditorState
  pricePrefix?: string | null
  price?: string | null
  priceSuffix?: string | null
  description?: DefaultTypedEditorState | null
  form: FormType
  ctaButtonText?: string | null
  launchDate?: string | null
  formFootNote?: string | null
  successMessage?: string | null
  trustItems?: Array<{ label: string }> | null
  outcomesHeading?: string | null
  outcomes?: OutcomeItem[] | null
  outcomesFooter?: string | null
  variants?: HeroBannerVariant[] | null
}

export const HeroBannerComponent: React.FC<HeroBannerBlockType> = (props) => {
  const {
    backgroundColor,
    backgroundColorCustom,
    backgroundType,
    backgroundImage,
    pillText,
    heading,
    pricePrefix,
    price,
    priceSuffix,
    description,
    form: formFromProps,
    launchDate,
    formFootNote,
    trustItems,
    outcomesHeading,
    outcomes,
    outcomesFooter,
    variants,
  } = props

  const { id: formID, confirmationType, redirect } = (formFromProps ?? {}) as any

  const [variantKey, setVariantKey] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setVariantKey(params.get('v') ?? '')
  }, [])

  const activeVariant = variants?.find((v) => v.variantKey === variantKey) ?? null

  const effectiveBgPreset = activeVariant?.backgroundColor ?? backgroundColor
  const effectiveBgCustom = activeVariant?.backgroundColorCustom ?? backgroundColorCustom
  const effectiveBgType = activeVariant?.backgroundType ?? backgroundType ?? 'color'
  const effectiveBgImage = activeVariant?.backgroundImage ?? backgroundImage

  const isImageMode = effectiveBgType === 'image'
  const isDark = isImageMode || isDarkPreset(effectiveBgPreset)
  const resolvedBg = resolveBg(effectiveBgPreset, effectiveBgCustom)

  const sectionBgStyle =
    isImageMode && effectiveBgImage?.url
      ? {
          background: `linear-gradient(90deg,#0a1e35 0%,rgba(10,30,53,0.72) 50%,transparent 100%), url('${getMediaUrl(effectiveBgImage.url)}')`,
          backgroundSize: 'cover, cover' as const,
          backgroundPosition: 'left center, right center' as const,
          backgroundRepeat: 'no-repeat, no-repeat' as const,
        }
      : undefined

  const resolvedPillText = activeVariant?.pillText ?? pillText
  const resolvedHeading = (activeVariant?.heading ?? heading) as DefaultTypedEditorState
  const resolvedDescription = activeVariant?.description ?? description


  const router = useRouter()
  const params = useParams()
  const klaviyoFormId = params?.locale === 'de' ? 'U3dVTL' : 'VkEfpf'

  useEffect(() => {
    const timer = setTimeout(() => {
      const container = document.querySelector(`.klaviyo-form-${klaviyoFormId}`)
      const hasForm = (container?.childElementCount ?? 0) > 0
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'klaviyo_form_status',
        klaviyo_form_loaded: hasForm,
        klaviyo_script_present: typeof window.klaviyo !== 'undefined',
        klaviyo_location: 'hero_banner',
      })
    }, 3000)
    return () => clearTimeout(timer)
  }, [klaviyoFormId])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ type: string; formId: string; metaData?: Record<string, string> }>).detail
      if (detail?.type !== 'submit' || detail?.formId !== klaviyoFormId) return

      const email = detail?.metaData?.$email

      trackLeadSuccess({
        leadType: 'form_submission',
        leadSource: 'hero_banner',
        formId: klaviyoFormId,
        provider: 'klaviyo',
        pageLanguage: String(params?.locale ?? document.documentElement.lang ?? ''),
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

      if (confirmationType === 'redirect' && redirect?.url) {
        router.push(redirect.url)
      }
    }

    window.addEventListener('klaviyoForms', handler)
    return () => window.removeEventListener('klaviyoForms', handler)
  }, [formID, confirmationType, redirect, router, klaviyoFormId, params?.locale])

  const hasOutcomes = outcomesHeading || (outcomes && outcomes.length > 0) || outcomesFooter

  return (
    <>
      <style jsx>{`
        @keyframes fu {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero {
          padding: calc(60px + 1rem) 0.75rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .hero--light {
          background: #ffffff;
          color: #12314d;
        }

        .hero--dark {
          background:
            linear-gradient(90deg, #0a1e35 0%, rgba(10, 30, 53, 0.72) 50%, transparent 100%),
            url('');
          background-size: cover, cover;
          background-position:
            left center,
            right center;
          background-repeat: no-repeat, no-repeat;
          color: #ffffff;
        }

        .hero-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          box-sizing: border-box;
        }

        .hero--light .hero-inner {
          border-radius: 32px;
        }

        .hero--dark .hero-inner {
          background: transparent;
        }

        .hero-content {
          width: 100%;
          padding: 2.5rem 4rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-sizing: border-box;
        }

        @media (min-width: 1551px) {
          .hero-content {
            width: fit-content;
            margin: 0 auto;
          }
        }

        .hero-left {
          max-width: 760px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
          text-align: left;
        }

        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border-radius: 100px;
          padding: 0.62rem 1.15rem 0.62rem 1.35rem;
          margin-bottom: 1.6rem;
          opacity: 0;
          animation: fu 0.8s 0.2s forwards;
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          transition:
            transform 0.2s,
            box-shadow 0.2s,
            background 0.2s;
        }

        .hero--light .hero-pill {
          color: #12314d;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(18, 49, 77, 0.1);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.6) inset,
            0 4px 16px rgba(18, 49, 77, 0.08);
        }

        .hero--dark .hero-pill {
          display: none;
          color: #12314d;
          background: #faf8f2;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .hero-pill:hover {
          transform: translateY(-1px);
        }

        .hero-pill :global(p) {
          margin: 0;
          letter-spacing: 0.16em;
        }

        .hero-pill-arrow {
          color: #0a8fb0;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .hero-pill:hover .hero-pill-arrow {
          transform: translateX(2px);
        }

        .hero-heading {
          margin-bottom: 1.5rem;
          opacity: 0;
          animation: fu 1.1s 0.4s forwards;
          max-width: 920px;
        }

        .hero-heading :global(h1),
        .hero-heading :global(h2),
        .hero-heading :global(h3),
        .hero-heading :global(h4),
        .hero-heading :global(p) {
          margin: 0;
          font-family:
            'Instrument Sans',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          font-size: clamp(2.6rem, 6vw, 5.4rem);
          font-weight: 600;
          line-height: 1.04;
          letter-spacing: -0.02em;
        }

        .hero--light .hero-heading {
          color: #12314d;
        }

        .hero--dark .hero-heading {
          color: #ffffff;
        }

        .hero-heading :global(.ac),
        .hero-heading :global(span[style*='color']) {
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .hero-price {
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          font-weight: 400;
          line-height: 1.5;
          margin-bottom: 0.5rem;
          opacity: 0;
          animation: fu 0.8s 0.35s forwards;
        }

        .hero--light .hero-price {
          color: #12314d;
        }

        .hero--dark .hero-price {
          color: #ffffff;
        }

        .hero-price-num {
          color: #0a8fb0;
          font-weight: 600;
        }

        .hero-sub {
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: clamp(1rem, 1.5vw, 1.2rem);
          font-weight: 300;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: none;
          opacity: 0;
          animation: fu 1.1s 0.6s forwards;
        }

        .hero-sub :global(p) {
          margin: 0;
        }

        .hero--light .hero-sub {
          color: rgba(18, 49, 77, 0.65);
        }

        .hero--dark .hero-sub {
          color: rgba(255, 255, 255, 0.88);
        }

        .form-wrap {
          margin: 0 0 1rem;
          opacity: 0;
          animation: fu 0.85s 0.6s forwards;
          max-width: 480px;
          width: 100%;
        }

        .form-row {
          display: flex;
          gap: 0.5rem;
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
          border-radius: 12px;
          padding: 6px;
          transition:
            border-color 0.25s,
            background 0.25s,
            box-shadow 0.25s;
        }

        .hero--light .form-row {
          background: #ffffff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 12px 30px -10px rgba(18, 49, 77, 0.15);
        }

        .hero--dark .form-row {
          background: rgba(18, 49, 77, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 12px 30px -10px rgba(18, 49, 77, 0.15);
        }

        .form-row:focus-within {
          border-color: rgba(10, 143, 176, 0.5);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 12px 30px -10px rgba(18, 49, 77, 0.18),
            0 0 0 4px rgba(10, 143, 176, 0.12);
        }

        .form-fields {
          flex: 1;
          min-width: 0;
        }

        .form-fields :global(input) {
          width: 100%;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.95rem;
          padding: 11px 14px;
          font-weight: 400;
          text-align: left;
          box-shadow: none !important;
        }

        .form-fields :global(label) {
          display: none;
        }

        .hero--light .form-fields :global(input) {
          color: #12314d;
        }

        .hero--dark .form-fields :global(input) {
          color: #ffffff;
        }

        .hero--light .form-fields :global(input::placeholder) {
          color: rgba(18, 49, 77, 0.4);
        }

        .hero--dark .form-fields :global(input::placeholder) {
          color: rgba(255, 255, 255, 0.55);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-weight: 600;
          color: #ffffff;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition:
            background 0.2s,
            transform 0.15s,
            opacity 0.15s;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .form-btn {
          font-size: 0.86rem;
          padding: 11px 22px;
          white-space: nowrap;
          border-radius: 8px;
          background: linear-gradient(180deg, #11a2c5 0%, #0a8fb0 100%);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.18) inset,
            0 6px 18px rgba(10, 143, 176, 0.35);
        }

        .form-btn:hover {
          background: linear-gradient(180deg, #13aece 0%, #0d99bd 100%);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.22) inset,
            0 8px 22px rgba(10, 143, 176, 0.45);
        }

        .form-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-foot {
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.8rem;
          font-weight: 300;
          margin-top: 0.95rem;
          line-height: 1.55;
          text-align: left;
        }

        .hero--light .form-foot {
          color: rgba(18, 49, 77, 0.65);
        }

        .hero--dark .form-foot {
          color: rgba(255, 255, 255, 0.7);
        }

        .form-foot .ac {
          font-weight: 500;
          color: #0a8fb0;
          font-style: normal;
        }

        .form-success {
          background: rgba(10, 143, 176, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(10, 143, 176, 0.28);
          border-radius: 12px;
          padding: 18px 20px;
          font-size: 0.9rem;
          line-height: 1.55;
          text-align: left;
          animation: fu 0.4s ease forwards;
        }

        .hero--light .form-success {
          color: #12314d;
        }

        .hero--dark .form-success {
          color: #ffffff;
        }

        .form-success strong {
          color: #0a8fb0;
          font-weight: 600;
        }

        .form-status,
        .form-error {
          margin-bottom: 0.75rem;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.85rem;
        }

        .form-error {
          color: #f87171;
        }

        .hero-trust {
          display: grid;
          grid-template-columns: repeat(2, auto);
          justify-content: center;
          justify-items: start;
          align-items: center;
          gap: 0.65rem 1.5rem;
          margin-top: 1.5rem;
        }

        .hero-trust-cell:last-child:nth-child(odd) {
          grid-column: 1 / -1;
          justify-self: center;
        }

        .hero-trust-cell {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.005em;
        }

        .hero--light .hero-trust-cell {
          color: rgba(18, 49, 77, 0.65);
        }

        .hero--dark .hero-trust-cell {
          color: rgba(255, 255, 255, 0.85);
        }

        .ht-tick {
          color: #0a8fb0;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .hero-outcomes {
          padding: 3.5rem 1.5rem;
          border-top: 1px solid rgba(18, 49, 77, 0.06);
        }

        .hero-outcomes--light {
          background: linear-gradient(180deg, #ffffff 0%, rgba(10, 143, 176, 0.05) 100%);
          color: #12314d;
        }

        .hero-outcomes--dark {
          background: linear-gradient(180deg, #0a1e35 0%, #0e2640 100%);
          color: #ffffff;
          border-top-color: rgba(255, 255, 255, 0.08);
        }

        .hero-outcomes-wrap {
          max-width: 1100px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-outcomes-head {
          font-family:
            'Instrument Sans',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          font-size: clamp(1.1rem, 1.6vw, 1.4rem);
          font-weight: 600;
          letter-spacing: -0.015em;
          line-height: 1.2;
          margin-bottom: 2rem;
        }

        .hero-outcomes-inner {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          max-width: 1000px;
          margin: 0 auto;
        }

        .ho-cell {
          padding: 0.75rem 1.25rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          border-right: 1px solid rgba(18, 49, 77, 0.1);
        }

        .hero-outcomes--dark .ho-cell {
          border-right-color: rgba(255, 255, 255, 0.14);
        }

        .ho-cell:last-child {
          border-right: none;
        }

        .ho-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
          margin-bottom: 1rem;
          display: block;
        }

        .ho-claim {
          font-family:
            'Instrument Sans',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: -0.012em;
          line-height: 1.2;
        }

        .ho-anchor {
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          color: #0a8fb0;
          letter-spacing: 0.005em;
        }

        .hero-outcomes-foot {
          margin-top: 2rem;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 0.78rem;
          font-weight: 400;
          color: rgba(18, 49, 77, 0.65);
          letter-spacing: 0.01em;
          font-style: italic;
        }

        @media (max-width: 880px) {
          .hero-outcomes {
            padding: 2.5rem 1.25rem;
          }

          .hero-outcomes-head {
            font-size: 1.15rem;
            margin-bottom: 1.5rem;
          }

          .hero-outcomes-inner {
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
          }

          .ho-cell {
            padding: 0.75rem 0.5rem;
          }

          .ho-icon {
            width: 36px;
            height: 36px;
            margin-bottom: 0.5rem;
          }

          .ho-claim {
            font-size: 0.85rem;
          }

          .ho-anchor {
            font-size: 0.7rem;
          }

          .hero-outcomes-foot {
            margin-top: 1.25rem;
            font-size: 0.72rem;
          }
        }

        @media (max-width: 880px) {
          .hero-content {
            padding: 1.5rem 1.25rem;
          }

          .hero-left {
            max-width: none;
          }
        }

        @media (max-width: 760px) {
          .hero-heading :global(h1),
          .hero-heading :global(h2),
          .hero-heading :global(h3),
          .hero-heading :global(h4),
          .hero-heading :global(p) {
            font-size: clamp(1.9rem, 9vw, 2.8rem);
          }

          .form-row {
            flex-direction: column;
          }

          .form-btn {
            width: 100%;
          }

          .hero-trust {
            grid-template-columns: 1fr;
            gap: 0.55rem 0;
          }

          .hero-trust-cell:last-child:nth-child(odd) {
            grid-column: auto;
            justify-self: start;
          }
        }
      `}</style>

      <section className={`hero ${isDark ? 'hero--dark' : 'hero--light'}`} style={sectionBgStyle}>
        <div style={!isDark ? { background: resolvedBg } : undefined} className="hero-inner">
          <div className="hero-content">
            <div className="hero-left">
              {resolvedPillText && (
                <div className="hero-pill">
                  <RichText
                    data={resolvedPillText as any}
                    enableGutter={false}
                    enableProse={false}
                  />
                  <svg
                    className="hero-pill-arrow"
                    width="11"
                    height="9"
                    viewBox="0 0 11 9"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 4.5h8m0 0L6 1m3 3.5L6 8"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="hero-heading">
                <RichText data={resolvedHeading as any} enableGutter={false} enableProse={false} />
              </div>

              {price && (
                <p className="hero-price">
                  {pricePrefix && <span>{pricePrefix} </span>}
                  <span className="hero-price-num">{price}</span>
                  {priceSuffix && <span>{priceSuffix}</span>}
                </p>
              )}

              {resolvedDescription && (
                <div className="hero-sub">
                  <RichText
                    data={resolvedDescription as any}
                    enableGutter={false}
                    enableProse={false}
                  />
                </div>
              )}

              <div className="form-wrap">
                <div className={`klaviyo-form-${klaviyoFormId}`} />

                {(launchDate || formFootNote) && (
                  <p className="form-foot">
                    {launchDate && <span className="ac">{launchDate}</span>}
                    {launchDate && formFootNote && ' · '}
                    {formFootNote}
                  </p>
                )}
              </div>

              {trustItems && trustItems.length > 0 && (
                <div className="hero-trust">
                  {trustItems.map((item, i) => (
                    <div key={i} className="hero-trust-cell">
                      <span className="ht-tick">✓</span>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {hasOutcomes && (
        <section
          className={`hero-outcomes ${isDark ? 'hero-outcomes--dark' : 'hero-outcomes--light'}`}
        >
          <div className="hero-outcomes-wrap">
            {outcomesHeading && <div className="hero-outcomes-head">{outcomesHeading}</div>}

            {outcomes && outcomes.length > 0 && (
              <div className="hero-outcomes-inner">
                {outcomes.map((outcome, i) => (
                  <div key={i} className="ho-cell">
                    {outcome.icon?.url && (
                      <img
                        src={getMediaUrl(outcome.icon.url)}
                        alt={outcome.icon.alt || ''}
                        className="ho-icon"
                      />
                    )}

                    {outcome.claim && <span className="ho-claim">{outcome.claim}</span>}
                    {outcome.anchor && <span className="ho-anchor">{outcome.anchor}</span>}
                  </div>
                ))}
              </div>
            )}

            {outcomesFooter && <div className="hero-outcomes-foot">{outcomesFooter}</div>}
          </div>
        </section>
      )}
    </>
  )
}
