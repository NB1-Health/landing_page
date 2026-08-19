'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import RichText from '@/components/RichText'
import TrustpilotWidget from '@/components/Trustpilot/TrustpilotWidget'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type TrustItem = {
  text: string
  showStars?: boolean | null
}

type Props = {
  heading: any
  subheading?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  backgroundImage?: { url?: string | null } | null
  backgroundImageMobile?: { url?: string | null } | null
  trustItems?: TrustItem[] | null
  showTrustpilotRating?: boolean | null
  locale?: string | null
}

export const HomepageHeroComponent: React.FC<Props> = ({
  heading,
  subheading,
  ctaLabel,
  ctaHref,
  backgroundImage,
  backgroundImageMobile,
  trustItems,
  showTrustpilotRating,
  locale,
}) => {
  const rawHref = ctaHref || ''
  const localizedHref =
    rawHref && locale && !rawHref.startsWith(`/${locale}`)
      ? `/${locale}${rawHref.startsWith('/') ? '' : '/'}${rawHref}`
      : rawHref || '#'
  const bgUrl = backgroundImage?.url ? getMediaUrl(backgroundImage.url) : ''
  const bgMobileUrl = backgroundImageMobile?.url ? getMediaUrl(backgroundImageMobile.url) : bgUrl

  const items = trustItems ?? []
  // Trustpilot leads the strip, taking the position the starred "Loved by early
  // access members" trust item held. Off by default so the widget only appears
  // where an editor has opted in.
  const showTrustpilot = Boolean(showTrustpilotRating)
  const [activeIdx, setActiveIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => setActiveIdx((i) => (i + 1) % items.length), [items.length])
  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + items.length) % items.length),
    [items.length],
  )

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 3200)
  }, [next])

  useEffect(() => {
    if (items.length < 2) return
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [items.length, startTimer])

  const nudge = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    startTimer()
  }, [startTimer])

  // touch swipe
  const x0Ref = useRef<number | null>(null)

  return (
    <>
      <style jsx>{`
        /* ── hero-stack ── */
        .hero-stack {
          position: relative;
          z-index: 0;
        }

        /* ── hero section ── */
        .hero {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background: #0e2740;
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-color: #0b1a2b;
          background-image: ${bgUrl ? `url("${bgUrl}")` : 'none'};
          background-position: center center;
          background-size: cover;
          background-repeat: no-repeat;
        }
        /* subtle grid motif overlay */
        .hero-motif {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.5;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 78px 78px;
          -webkit-mask-image: radial-gradient(120% 95% at 72% 0%, #000 0%, transparent 72%);
          mask-image: radial-gradient(120% 95% at 72% 0%, #000 0%, transparent 72%);
        }
        .hero-in {
          position: relative;
          z-index: 3;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
          min-height: clamp(520px, 52vw, 820px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
        }
        .hero-text {
          max-width: 520px;
          padding: 116px 48px 64px 0;
        }
        /* heading */
        .hero-text :global(h1) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(40px, 5vw, 66px);
          line-height: 1.04;
          letter-spacing: -0.035em;
          color: #fff;
          text-wrap: balance;
          margin: 0;
        }
        .hero-text :global(h1 em) {
          font-style: normal;
          color: #13a6cc;
        }
        .hero-sub {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
          max-width: 460px;
          margin-top: 22px;
        }
        .hero-cta {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 32px;
        }
        .btn-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family:
            'Inter',
            -apple-system,
            sans-serif;
          font-weight: 700;
          font-size: 16px;
          padding: 16px 30px;
          border: none;
          border-radius: 100px;
          background: #c6ff5b;
          color: #0e2740;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
        }
        .btn-pill:hover {
          background: #aaea42;
          transform: translateY(-1px);
        }

        /* ── trust strip ── */
        .hero-trust {
          position: relative;
          z-index: 3;
          background: #0a1a2c;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .hero-trust-in {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          flex-wrap: wrap;
          text-align: center;
        }
        .ht-item {
          display: inline-flex;
          align-items: center;
          gap: 9px;
        }
        .ht-stars {
          color: #e8a93b;
          letter-spacing: 1.5px;
          font-size: 13px;
        }
        .ht-text {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.6);
        }
        .ht-text :global(b) {
          color: #fff;
          font-weight: 600;
        }
        .ht-sep {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          flex-shrink: 0;
        }
        /* The TrustBox template switches layout on the iframe's OWN width: under
           200px the score stacks above the stars, and under 260px the Trustpilot
           logo drops to its own line. Its type is also fixed in the template
           (.tp-widget-trustscore is 18px) and data-style-height does not scale it.
           So it is rendered wide enough to stay on one line -- 320px, which leaves
           room for the longer German/Dutch score words -- then scaled down as a
           whole to bring 18px type into line with the 12.5px seal text. */
        .ht-tp {
          width: 231px; /* 320 * 0.7222 */
          height: 18px; /* 24 * 0.7222, rounded up so nothing clips */
          flex-shrink: 0;
          line-height: 0;
        }
        .ht-tp :global(.trustpilot-widget) {
          width: 320px;
          transform: scale(0.7222); /* 18px template type -> 13px */
          transform-origin: left top;
        }
        /* Mobile-only row; on desktop the widget sits inline in the strip. */
        .hero-trust-tp {
          display: none;
        }
        .ht-nav {
          display: none;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(18, 49, 77, 0.4);
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .ht-nav svg {
          width: 15px;
          height: 15px;
        }

        /* ── tablet: single column ── */
        @media (min-width: 761px) and (max-width: 900px) {
          .hero-in {
            grid-template-columns: 1fr;
            gap: 54px;
            padding-top: 112px;
            min-height: 0;
          }
          .hero-text {
            padding: 0;
            max-width: none;
          }
          .hero-sub {
            max-width: none;
          }
        }

        /* ── mobile: cinematic stacked hero ── */
        @media (max-width: 760px) {
          .hero-stack {
            position: static;
          }
          .hero {
            display: block;
            background: #fff;
            overflow: visible;
            position: relative;
            padding-top: 0;
            padding-bottom: 0;
          }
          /* full-screen pinned image */
          .hero-bg {
            position: sticky;
            inset: auto;
            top: 0;
            width: 100%;
            height: 100svh;
            min-height: 520px;
            z-index: 0;
            background-image: ${bgMobileUrl
              ? `url("${bgMobileUrl}")`
              : bgUrl
                ? `url("${bgUrl}")`
                : 'none'};
            background-position: center center;
            background-size: cover;
            background-repeat: no-repeat;
          }
          .hero-motif {
            display: none;
          }
          /* white sheet pulls up over the pinned image */
          .hero-in {
            position: relative;
            z-index: 2;
            background: #fff;
            min-height: calc(100svh - 54px);
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            margin-top: -26px;
            border-radius: 26px 26px 0 0;
            box-shadow: 0 -16px 38px -18px rgba(0, 0, 0, 0.5);
            grid-template-columns: none;
          }
          .hero-text {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: space-evenly;
            max-width: none;
            padding: 0;
          }
          .hero-text :global(h1) {
            font-size: clamp(34px, 9vw, 46px);
            color: #12314d;
            line-height: 1.02;
            letter-spacing: -0.025em;
            margin: 0;
          }
          .hero-text :global(h1 em) {
            color: #0a8fb0;
          }
          .hero-sub {
            margin: 0;
            padding: 0;
            font-size: 17px;
            line-height: 1.6;
            max-width: 32ch;
            color: rgba(18, 49, 77, 0.7);
          }
          .hero-cta {
            margin: 0;
            gap: 14px;
          }
          /* trust strip: white on mobile */
          .hero-trust {
            background: #fff;
            border-top: 1px solid rgba(18, 49, 77, 0.1);
            border-bottom: none;
          }
          .hero-trust-in {
            position: relative;
            padding: 0 46px;
            height: 54px;
            min-height: 54px;
            gap: 0;
            overflow: hidden;
            touch-action: pan-y;
            flex-wrap: nowrap;
          }
          .ht-item {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 46px;
            right: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: none;
          }
          .ht-item.active {
            opacity: 1;
            pointer-events: auto;
          }
          .ht-text {
            color: rgba(18, 49, 77, 0.55);
            font-size: 13px;
          }
          .ht-text :global(b) {
            color: #12314d;
          }
          .ht-stars {
            color: #e8a93b;
          }
          .ht-sep {
            display: none;
          }
          /* The mobile strip is a fixed-height carousel with absolutely placed
             items, so the widget cannot sit inside it — it gets its own row
             below, on the white background, hence the light TrustBox. */
          .ht-tp {
            display: none;
          }
          .hero-trust-tp {
            display: flex;
            justify-content: center;
            padding: 0 22px 14px;
            background: #fff;
          }
          .ht-tp-m {
            width: 231px;
            height: 18px;
            line-height: 0;
          }
          .ht-tp-m :global(.trustpilot-widget) {
            width: 320px;
            transform: scale(0.7222); /* 18px template type -> 13px */
            transform-origin: left top;
          }
          .ht-nav {
            display: flex;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 2;
            color: rgba(18, 49, 77, 0.4);
          }
          .ht-nav:active {
            color: #0a8fb0;
          }
          .ht-nav.prev {
            left: 4px;
          }
          .ht-nav.next {
            right: 4px;
          }
        }
      `}</style>

      <div className="hero-stack">
        <section className="hero" data-screen-label="Hero">
          <div className="hero-bg" />
          <div className="hero-motif" aria-hidden="true" />
          <div className="hero-in">
            <div className="hero-text">
              {heading && <RichText data={heading} enableGutter={false} enableProse={false} />}
              {subheading && <p className="hero-sub">{subheading}</p>}
              {ctaLabel && (
                <div className="hero-cta">
                  <a className="btn-pill" href={localizedHref}>
                    {ctaLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {(items.length > 0 || showTrustpilot) && (
          <div className="hero-trust">
            <div
              className="hero-trust-in"
              onTouchStart={(e) => {
                x0Ref.current = e.touches[0].clientX
              }}
              onTouchEnd={(e) => {
                if (x0Ref.current === null) return
                const dx = e.changedTouches[0].clientX - x0Ref.current
                if (Math.abs(dx) > 36) {
                  dx < 0 ? next() : prev()
                  nudge()
                }
                x0Ref.current = null
              }}
            >
              <button
                className="ht-nav prev"
                type="button"
                aria-label="Previous"
                onClick={() => {
                  prev()
                  nudge()
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>

              {showTrustpilot && (
                <div className="ht-tp">
                  <TrustpilotWidget locale={locale} theme="dark" />
                </div>
              )}

              {items.map((item, i) => (
                <React.Fragment key={i}>
                  {(i > 0 || showTrustpilot) && <span className="ht-sep" aria-hidden="true" />}
                  <div className={`ht-item${i === activeIdx ? ' active' : ''}`}>
                    {item.showStars && <span className="ht-stars">★★★★★</span>}
                    <span className="ht-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                </React.Fragment>
              ))}

              <button
                className="ht-nav next"
                type="button"
                aria-label="Next"
                onClick={() => {
                  next()
                  nudge()
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {showTrustpilot && (
              <div className="hero-trust-tp">
                <div className="ht-tp-m">
                  <TrustpilotWidget locale={locale} theme="light" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
