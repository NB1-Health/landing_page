'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import React, { useEffect, useRef, useState } from 'react'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  resolveTokens,
} from '@/lib/plans/clientUtils'

type BgColorPreset = 'inkDeep' | 'navyDeep' | 'navy' | 'teal' | 'off' | 'paper' | 'cream' | 'custom'
type BgType = 'color' | 'image'
type MediaLike = { url?: string | null; alt?: string | null } | null

function isDarkPreset(p?: BgColorPreset | null) {
  return p === 'inkDeep' || p === 'navyDeep' || p === 'navy' || p === 'teal'
}
function resolveBg(p?: BgColorPreset | null, c?: string | null) {
  if (!p || p === 'inkDeep') return '#0A1B2E'
  if (p === 'navyDeep') return '#0E2740'
  if (p === 'navy') return '#12314D'
  if (p === 'teal') return '#0A8FB0'
  if (p === 'off') return '#F1F4F7'
  if (p === 'paper') return '#FFFFFF'
  if (p === 'cream') return '#FAF8F2'
  if (p === 'custom') return c || '#0A1B2E'
  return '#0A1B2E'
}

type RawOption = {
  name?: string | null
  planFamily?: 'core' | 'advanced' | null
  priceSuffix?: string | null
  altLabel?: string | null
  description?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  recommended?: boolean | null
  recFlagLabel?: string | null
}

type Option = RawOption & { price?: string | null }

export type YpBuyBoxBlockType = {
  blockType?: 'ypBuyBox'
  backgroundColor?: BgColorPreset | null
  backgroundColorCustom?: string | null
  backgroundType?: BgType | null
  backgroundImage?: MediaLike
  grain?: boolean | null
  heading?: DefaultTypedEditorState | null
  sub?: string | null
  options?: RawOption[] | null
  buyNote?: string | null
  trust?: { text?: string | null }[] | null
  locale?: string
}

function imgUrl(img?: MediaLike) {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}

export const YpBuyBoxClient: React.FC<YpBuyBoxBlockType> = ({
  backgroundColor,
  backgroundColorCustom,
  backgroundType,
  backgroundImage,
  grain,
  heading,
  sub: rawSub,
  options: optionsProp,
  buyNote: rawBuyNote,
  trust,
  locale = 'en',
}) => {
  const [revealed, setRevealed] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const [options, setOptions] = useState<Option[]>(optionsProp ?? [])
  const [sub, setSub] = useState<string | null | undefined>(rawSub)
  const [buyNote, setBuyNote] = useState<string | null | undefined>(rawBuyNote)

  useEffect(() => {
    function applyPrices(currency: ReturnType<typeof getClientCurrency>, plans: Awaited<ReturnType<typeof fetchPlansClient>>) {
      const rateMap = buildRateMap(plans, currency)
      setOptions(
        (optionsProp ?? []).map((opt) => {
          const family = opt.planFamily === 'advanced' ? 'advanced' : 'core'
          const rate = opt.planFamily ? rateMap[`${family}:1`] : undefined
          return {
            ...opt,
            price: rate != null ? formatPrice(rate, currency, locale) : undefined,
            altLabel: resolveTokens(opt.altLabel, rateMap, currency, locale) ?? opt.altLabel,
            description: resolveTokens(opt.description, rateMap, currency, locale) ?? opt.description,
          }
        }),
      )
      setSub(resolveTokens(rawSub, rateMap, currency, locale))
      setBuyNote(resolveTokens(rawBuyNote, rateMap, currency, locale))
    }

    const currency = getClientCurrency(locale)
    fetchPlansClient().then((plans) => applyPrices(currency, plans)).catch(() => {})

    const onCurrencyChange = (e: Event) => {
      const cur = (e as CustomEvent<string>).detail as ReturnType<typeof getClientCurrency>
      fetchPlansClient().then((plans) => applyPrices(cur, plans)).catch(() => {})
    }
    window.addEventListener('nb1:currencychange', onCurrencyChange)
    return () => window.removeEventListener('nb1:currencychange', onCurrencyChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const isImageMode = backgroundType === 'image'
  const bgImg = imgUrl(backgroundImage)
  const hasImage = isImageMode && !!bgImg
  const isDark = hasImage || isDarkPreset(backgroundColor)
  const resolvedBg = resolveBg(backgroundColor, backgroundColorCustom)

  const opts = options ?? []
  const trustItems = trust ?? []

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setRevealed(true), {
      threshold: 0.1,
    })
    o.observe(el)
    return () => o.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{ background: resolvedBg }}
      className={['buy-close', grain ? 'grain' : '', hasImage ? 'has-img' : '', isDark ? 'is-dark' : 'is-light'].join(' ')}
    >
      <style jsx>{`
        .buy-close {
          /* Mockup body font is --font (Inter); app global is Geist. Headings
             override to Instrument Sans below. Shared block — also used on
             the-lab-debug and our-plans. */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 84px 0;
          color: #fff;
          text-align: center;
        }
        .buy-close.is-light {
          color: #12314d;
        }
        .buy-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.7;
        }
        .buy-close.has-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10, 27, 46, 0.5), rgba(10, 27, 46, 0.82));
        }
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .buy-close-in {
          position: relative;
          z-index: 1;
          max-width: 780px;
          margin: 0 auto;
        }
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition:
            opacity 0.7s cubic-bezier(0.16, 0.84, 0.44, 1),
            transform 0.7s cubic-bezier(0.16, 0.84, 0.44, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }
        .buy-close :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.02;
          font-size: clamp(32px, 4vw, 52px);
          color: #fff;
          margin: 0;
        }
        .buy-close.is-light :global(h2) {
          color: #12314d;
        }
        .buy-close :global(.teal) {
          color: #0a8fb0;
        }
        .sub {
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          margin: 14px auto 0;
          max-width: 520px;
          line-height: 1.6;
        }
        .buy-close.is-light .sub {
          color: rgba(18, 49, 77, 0.7);
        }

        .buy-choice {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 38px 0 26px;
          text-align: left;
        }
        .bc-opt {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 26px 24px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #fff;
          text-decoration: none;
          transition:
            transform 0.2s,
            border-color 0.2s,
            background 0.2s;
        }
        .buy-close.is-light .bc-opt {
          background: rgba(18, 49, 77, 0.04);
          border-color: rgba(18, 49, 77, 0.12);
          color: #12314d;
        }
        .bc-opt:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.32);
        }
        .bc-opt.rec {
          border-color: rgba(166, 217, 63, 0.4);
          background: rgba(166, 217, 63, 0.06);
        }
        .rec-flag {
          position: absolute;
          top: -10px;
          left: 24px;
          display: inline-block;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0e2740;
          background: #c6ff5b;
          padding: 5px 11px;
          border-radius: 100px;
        }
        .bc-opt .bn {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .bc-opt .bp {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 42px;
          letter-spacing: -0.03em;
          margin-top: 8px;
          line-height: 1;
        }
        .bc-opt .bp small {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
        }
        .buy-close.is-light .bc-opt .bp small {
          color: rgba(18, 49, 77, 0.5);
        }
        .bc-alt {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #13a6cc;
          background: rgba(10, 143, 176, 0.14);
          border: 1px solid rgba(10, 143, 176, 0.32);
          border-radius: 100px;
          padding: 4px 11px;
          margin-top: 8px;
        }
        .bc-opt .bd {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 10px;
          flex: 1;
          line-height: 1.5;
        }
        .buy-close.is-light .bc-opt .bd {
          color: rgba(18, 49, 77, 0.7);
        }
        .bc-go {
          margin-top: 20px;
          font-weight: 600;
          font-size: 14px;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }
        .buy-close.is-light .bc-opt:not(.rec) .bc-go {
          color: #12314d;
        }
        .bc-opt.rec .bc-go {
          color: #c6ff5b;
        }
        .buy-close.is-light .bc-opt.rec .bc-go {
          color: #6f9e1f;
        }

        .buy-note {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.7);
          max-width: 540px;
          margin: 0 auto 18px;
          line-height: 1.55;
        }
        .buy-close.is-light .buy-note {
          color: rgba(18, 49, 77, 0.7);
        }
        .buy-trust {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px 24px;
          margin-top: 30px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
        }
        .buy-close.is-light .buy-trust {
          border-top-color: rgba(18, 49, 77, 0.12);
          color: rgba(18, 49, 77, 0.5);
        }
        .buy-trust span {
          display: inline-flex;
          align-items: center;
        }
        .buy-trust span::before {
          content: '✓';
          color: #13a6cc;
          margin-right: 8px;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .buy-close {
            padding: 56px 0;
          }
          .wrap {
            padding: 0 20px;
          }
          .buy-choice {
            grid-template-columns: 1fr;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            transition: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      {hasImage && <img className="buy-bg" src={bgImg} alt="" />}

      <div className="wrap">
        <div className={['buy-close-in reveal', revealed ? 'in' : ''].join(' ')}>
          {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
          {sub && <p className="sub">{sub}</p>}

          {opts.length > 0 && (
            <div className="buy-choice">
              {opts.map((o, i) => (
                <a
                  key={i}
                  className={['bc-opt', o.recommended ? 'rec' : ''].join(' ')}
                  href={o.ctaHref || '#'}
                >
                  {o.recommended && <span className="rec-flag">{o.recFlagLabel || 'Recommended'}</span>}
                  {o.name && <div className="bn">{o.name}</div>}
                  {o.price && (
                    <div className="bp">
                      {o.price}
                      {o.priceSuffix && <small> {o.priceSuffix}</small>}
                    </div>
                  )}
                  {/* Retired with the 1-month-standard model (the "€109/mo monthly" pill). */}
                  {/* {o.altLabel && <div className="bc-alt">{o.altLabel}</div>} */}
                  {o.description && <div className="bd">{o.description}</div>}
                  {o.ctaLabel && (
                    <span className="bc-go">
                      {o.ctaLabel}
                      <span aria-hidden="true">→</span>
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          {buyNote && <p className="buy-note">{buyNote}</p>}

          {trustItems.length > 0 && (
            <div className="buy-trust">
              {trustItems.map((t, i) => (
                <span key={i}>{t.text}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
