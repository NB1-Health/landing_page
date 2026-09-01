'use client'

import React, { useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Card = {
  category?: string | null
  image?: { url?: string | null; width?: number | null; height?: number | null } | null
  frontTitle?: string | null
  deltaChip?: string | null
  valueBefore?: string | null
  valueAfter?: string | null
  valueUnit?: string | null
  trackSegLeft?: string | null
  trackSegRight?: string | null
  trackDotBefore?: string | null
  trackDotAfter?: string | null
  trackFootnote?: string | null
  backEyebrow?: string | null
  backBody?: string | null
  flipAriaLabel?: string | null
}

type Props = {
  heading?: any
  subheading?: string | null
  gaugeScore?: string | null
  gaugeMax?: string | null
  gaugeLabel?: string | null
  deltaLabel?: string | null
  deltaFrom?: string | null
  builtInText?: any
  feltText?: any
  cards?: Card[] | null
  footnote?: string | null
}

export const OutcomesComponent: React.FC<Props> = ({
  heading,
  subheading,
  gaugeScore,
  gaugeMax,
  gaugeLabel,
  deltaLabel,
  deltaFrom,
  builtInText,
  feltText,
  cards,
  footnote,
}) => {
  const secRef = useRef<HTMLElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [flippedIdx, setFlippedIdx] = useState<Set<number>>(new Set())
  const [showPrev, setShowPrev] = useState(false)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Carousel scroll arrows
  const syncArrows = () => {
    const row = rowRef.current
    if (!row) return
    const DEAD = 48
    const max = row.scrollWidth - row.clientWidth
    if (max <= DEAD) {
      setShowPrev(false)
      setShowNext(false)
      return
    }
    setShowPrev(row.scrollLeft > DEAD)
    setShowNext(row.scrollLeft < max - DEAD)
  }

  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    row.scrollLeft = 0
    syncArrows()
    row.addEventListener('scroll', syncArrows, { passive: true })
    window.addEventListener('resize', syncArrows)
    return () => {
      row.removeEventListener('scroll', syncArrows)
      window.removeEventListener('resize', syncArrows)
    }
  }, [cards])

  const scrollBy = (dir: 1 | -1) => {
    const row = rowRef.current
    if (!row) return
    const card = row.querySelector('.rto-card') as HTMLElement
    if (!card) return
    row.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: 'smooth' })
  }

  const toggleFlip = (i: number) => {
    setFlippedIdx((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.('.rto-card')) return
      setFlippedIdx(new Set())
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [])

  // Gauge SVG: semicircle from left to right, score segment drawn from a % of arc
  // Track: M30,170 A140,140 0 0 1 310,170 — full arc
  // Val arc in mockup: M246.1,52.5 A140,140 0 0 1 283.8,88.4 (top-right section = ~80%)
  const scoreNum = parseFloat(gaugeScore || '0')
  const maxNum = parseFloat(gaugeMax || '100')
  const pct = Math.min(Math.max(scoreNum / maxNum, 0), 1)
  // Semicircle from (30,170) to (310,170), center (170,170), r=140
  // Angle 0 = leftmost (180° in standard), angle π = rightmost
  // point at angle θ from left: x = 170 + 140*cos(π - θ*π), y = 170 - 140*sin(θ*π) ... no
  // The arc goes from 180° to 0° (standard math). At fraction t:
  // angle = π - t*π  (so t=0 → leftmost, t=1 → rightmost)
  // x = 170 + 140*cos(angle), y = 170 + 140*sin(angle)  (SVG y-down)
  // Actually: y = 170 - 140*sin(angle) since above center
  // At t=0: angle=π → x=170-140=30, y=170 → (30,170) ✓
  // At t=1: angle=0 → x=170+140=310, y=170 → (310,170) ✓
  const getPoint = (t: number) => {
    const angle = Math.PI - t * Math.PI
    return {
      x: 170 + 140 * Math.cos(angle),
      y: 170 - 140 * Math.sin(angle),
    }
  }
  const start = getPoint(0.55) // segment starts ~55% for visual match
  const end = getPoint(pct)

  return (
    <>
      <style jsx>{`
        .rto-sec {
          background: #faf8f2;
          padding: 104px 0;
          font-family:
            'Hanken Grotesk',
            'Inter',
            -apple-system,
            sans-serif;
          color: #11293b;
        }
        @media (max-width: 760px) {
          .rto-sec {
            padding: 72px 0;
          }
        }

        .rto-wrap {
          max-width: 1200px;
          margin: 0 auto;
        }
        .rto-pad {
          padding: 0 48px;
        }
        @media (max-width: 640px) {
          .rto-pad {
            padding: 0 24px;
          }
        }

        /* ── Head ── */
        .rto-head {
          text-align: center;
          max-width: 680px;
          margin: 0 auto;
        }
        .rto-head :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: #11293b;
          margin: 0;
        }
        .rto-head :global(h2 em) {
          font-style: normal;
          color: #0a8fb0;
        }
        .rto-sub {
          margin: 18px auto 0;
          font-size: 16.5px;
          font-weight: 300;
          line-height: 1.55;
          color: #6c7d88;
          max-width: 540px;
        }

        /* ── Gauge ── */
        .rto-gauge {
          position: relative;
          width: 360px;
          max-width: 100%;
          margin: 34px auto 0;
        }
        .rto-gauge svg {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }
        .rto-gauge .track {
          fill: none;
          stroke: #c9d2d4;
          stroke-width: 22;
          stroke-linecap: round;
        }
        .rto-gauge .val {
          fill: none;
          stroke: #0a8fb0;
          stroke-width: 22;
          stroke-linecap: round;
        }
        .rto-gauge-center {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 8px;
          text-align: center;
        }
        .rto-gscore {
          font-size: 62px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1;
          color: #11293b;
        }
        .rto-gscore .gu {
          font-size: 26px;
          font-weight: 600;
          color: #9aa7ad;
          letter-spacing: 0;
        }
        .rto-glabel {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9aa7ad;
        }

        /* ── Delta ── */
        .rto-delta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }
        .rto-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          font-size: 15px;
          font-weight: 600;
          color: #3f9a82;
          background: rgba(63, 154, 130, 0.1);
          border: 1px solid rgba(63, 154, 130, 0.34);
          border-radius: 10px;
          padding: 7px 14px;
        }
        .rto-from {
          font-size: 14px;
          font-weight: 400;
          color: #6c7d88;
        }

        /* ── Built-in / felt text ── */
        .rto-builtin {
          text-align: center;
          margin: 18px auto 0;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: #9aa7ad;
        }
        .rto-builtin :global(strong) {
          color: #11293b;
          font-weight: 600;
        }
        .rto-builtin :global(p) {
          margin: 0;
        }
        .rto-felt {
          text-align: center;
          max-width: 600px;
          margin: 50px auto 0;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          color: #6c7d88;
        }
        .rto-felt :global(strong) {
          color: #11293b;
          font-weight: 600;
        }
        .rto-felt :global(p) {
          margin: 0;
        }

        /* ── Carousel ── */
        .rto-carousel {
          position: relative;
          margin-top: 30px;
        }
        .rto-row {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          padding: 6px 48px 26px;
          scrollbar-width: none;
        }
        .rto-row::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 900px) {
          .rto-row {
            padding: 6px 24px 24px;
          }
        }
        @media (max-width: 640px) {
          .rto-row {
            padding: 6px 24px 24px;
          }
        }

        /* ── Card ── */
        .rto-card {
          position: relative;
          flex: 0 0 calc((100% - 30px) / 2.5);
          scroll-snap-align: start;
          aspect-ratio: 4 / 5;
          border-radius: 18px;
          background: #142028;
          box-shadow: 0 20px 44px -28px rgba(17, 41, 59, 0.42);
          cursor: pointer;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .rto-card {
            flex-basis: calc((100% - 20px) / 2 - 14px);
          }
        }
        @media (max-width: 640px) {
          .rto-card {
            flex-basis: 80vw;
          }
        }

        .rto-inner {
          position: absolute;
          inset: 0;
        }
        .rto-face {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          overflow: hidden;
          transition: opacity 0.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .rto-face {
            transition: none;
          }
        }
        .rto-front {
          z-index: 2;
          opacity: 1;
        }
        .rto-back {
          z-index: 1;
          opacity: 0;
          pointer-events: none;
        }
        .rto-card.flipped .rto-front {
          opacity: 0;
          pointer-events: none;
        }
        .rto-card.flipped .rto-back {
          opacity: 1;
          pointer-events: auto;
          z-index: 4;
        }

        /* Front */
        .cphoto {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          z-index: 0;
        }
        .rto-scrim-bot {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(to top, rgba(8, 16, 22, 0.85) 0%, rgba(8, 16, 22, 0) 46%);
        }
        .rto-scrim-top {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(to bottom, rgba(8, 16, 22, 0.35) 0%, rgba(8, 16, 22, 0) 25%);
        }
        .rto-ctop {
          position: absolute;
          top: 16px;
          left: 18px;
          z-index: 3;
          pointer-events: none;
        }
        .rto-cat {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
        }
        .rto-cat.back {
          text-shadow: none;
          color: rgba(255, 255, 255, 0.62);
        }

        /* Flip button */
        .rto-flip {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 6;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(12, 24, 34, 0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition:
            background 0.2s ease,
            transform 0.45s cubic-bezier(0.4, 0.05, 0.2, 1);
        }
        .rto-flip:hover {
          background: rgba(12, 24, 34, 0.78);
        }
        .rto-card.flipped .rto-flip {
          transform: rotate(135deg);
        }
        .rto-flip .ic {
          display: block;
          font-size: 21px;
          font-weight: 300;
          line-height: 1;
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .rto-flip {
            transition: background 0.2s ease;
          }
        }

        /* Glass panel */
        .rto-glass {
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 14px;
          z-index: 3;
          background: rgba(12, 24, 34, 0.42);
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 14px 15px;
        }
        .rto-grow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }
        .rto-t {
          color: #fff;
          font-size: 16.5px;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.12;
        }
        .rto-chip2 {
          font-size: 10.5px;
          font-weight: 600;
          color: #0e2433;
          background: #7fe0c4;
          border-radius: 6px;
          padding: 3px 7px;
          white-space: nowrap;
          flex: none;
        }
        .rto-nums {
          display: flex;
          align-items: baseline;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
        }
        .rto-nums .b {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
        }
        .rto-nums .ar {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        .rto-nums .n {
          font-size: 22px;
          font-weight: 600;
          color: #fff;
        }
        .rto-nums .u {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
        }

        /* Track bar */
        .rto-trk {
          position: relative;
          height: 4px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.18);
          margin-top: 12px;
        }
        .rto-trk .seg {
          position: absolute;
          top: 0;
          height: 4px;
          border-radius: 3px;
          background: #13a6cc;
          opacity: 0.92;
        }
        .rto-trk .dot {
          position: absolute;
          top: 50%;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .rto-trk .dot.b {
          background: rgba(255, 255, 255, 0.55);
          width: 7px;
          height: 7px;
        }
        .rto-trk .dot.n {
          background: #fff;
          box-shadow: 0 0 0 2px #13a6cc;
        }
        .rto-gfoot {
          margin-top: 9px;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Back */
        .rto-back-face {
          background: linear-gradient(158deg, #16323f 0%, #0c1820 78%);
          display: flex;
          flex-direction: column;
          padding: 22px;
          cursor: pointer;
          position: absolute;
          inset: 0;
          border-radius: 18px;
        }
        .rto-back-body-wrap {
          margin: auto 0;
        }
        .rto-back-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #13a6cc;
          margin-bottom: 12px;
        }
        .rto-back-body {
          margin: 0;
          color: rgba(255, 255, 255, 0.84);
          font-size: 14px;
          line-height: 1.55;
          font-weight: 300;
        }

        /* Arrows */
        .rto-arrow {
          position: absolute;
          top: 42%;
          z-index: 8;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid #e9ebec;
          background: #fff;
          color: #11293b;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px -10px rgba(17, 41, 59, 0.3);
        }
        .rto-arrow.prev {
          left: 10px;
        }
        .rto-arrow.next {
          right: 10px;
        }
        @media (max-width: 640px) {
          .rto-arrow {
            display: none;
          }
        }

        /* Footnote */
        .rto-foot {
          text-align: center;
          margin-top: 24px;
        }
        .rto-note {
          font-size: 13px;
          font-weight: 300;
          color: #9aa7ad;
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Scroll-in */
        .r-up {
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1),
            transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .r-up.in {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .r-up {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <section ref={secRef} className="rto-sec" data-screen-label="Outcomes">
        <div className="rto-wrap">
          <div className={`rto-head rto-pad r-up${visible ? ' in' : ''}`}>
            {heading && <RichText data={heading} enableGutter={false} enableProse={false} />}
            {subheading && <p className="rto-sub">{subheading}</p>}
          </div>

          {/* Gauge */}
          <div
            className={`rto-gauge r-up${visible ? ' in' : ''}`}
            style={{ transitionDelay: '0.08s' }}
          >
            <svg
              viewBox="0 0 340 196"
              role="img"
              aria-label={`Score ${gaugeScore} out of ${gaugeMax}`}
            >
              <path className="track" d="M30,170 A140,140 0 0 1 310,170" />
              <path
                className="val"
                d={`M${start.x.toFixed(1)},${start.y.toFixed(1)} A140,140 0 0 1 ${end.x.toFixed(1)},${end.y.toFixed(1)}`}
              />
            </svg>
            <div className="rto-gauge-center">
              <div className="rto-gscore">
                {gaugeScore}
                <span className="gu">/{gaugeMax}</span>
              </div>
              {gaugeLabel && <div className="rto-glabel">{gaugeLabel}</div>}
            </div>
          </div>

          {/* Delta */}
          {(deltaLabel || deltaFrom) && (
            <div
              className={`rto-delta r-up${visible ? ' in' : ''}`}
              style={{ transitionDelay: '0.12s' }}
            >
              {deltaLabel && <span className="rto-chip">{deltaLabel}</span>}
              {deltaFrom && <span className="rto-from">{deltaFrom}</span>}
            </div>
          )}

          {/* Built-in */}
          {builtInText && (
            <div
              className={`rto-builtin rto-pad r-up${visible ? ' in' : ''}`}
              style={{ transitionDelay: '0.16s' }}
            >
              <RichText data={builtInText} enableGutter={false} enableProse={false} />
            </div>
          )}

          {/* Felt */}
          {feltText && (
            <div
              className={`rto-felt rto-pad r-up${visible ? ' in' : ''}`}
              style={{ transitionDelay: '0.2s' }}
            >
              <RichText data={feltText} enableGutter={false} enableProse={false} />
            </div>
          )}

          {/* Carousel */}
          {cards && cards.length > 0 && (
            <div className="rto-carousel">
              {showPrev && (
                <button
                  className="rto-arrow prev"
                  aria-label="Previous"
                  onClick={() => scrollBy(-1)}
                >
                  ‹
                </button>
              )}
              {showNext && (
                <button className="rto-arrow next" aria-label="Next" onClick={() => scrollBy(1)}>
                  ›
                </button>
              )}
              <div ref={rowRef} className="rto-row">
                {cards.map((card, i) => {
                  const imgUrl = card.image?.url ? getMediaUrl(card.image.url) : null
                  const isFlipped = flippedIdx.has(i)
                  return (
                    <article
                      key={i}
                      className={`rto-card${isFlipped ? ' flipped' : ''}`}
                      onClick={() => toggleFlip(i)}
                    >
                      <button
                        className="rto-flip"
                        type="button"
                        aria-label={
                          card.flipAriaLabel || `See what's behind the ${card.category} number`
                        }
                        aria-expanded={isFlipped ? 'true' : 'false'}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFlip(i)
                        }}
                      >
                        <span className="ic">+</span>
                      </button>

                      <div className="rto-inner">
                        {/* Front */}
                        <div className="rto-face rto-front">
                          {imgUrl ? (
                            <img
                              className="cphoto"
                              src={imgUrl}
                              alt={card.category || ''}
                              width={card.image?.width ?? undefined}
                              height={card.image?.height ?? undefined}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div
                              style={{ position: 'absolute', inset: 0, background: '#1a3040' }}
                            />
                          )}
                          <div className="rto-scrim-top" />
                          <div className="rto-scrim-bot" />
                          <div className="rto-ctop">
                            <span className="rto-cat">{card.category}</span>
                          </div>
                          <div className="rto-glass">
                            <div className="rto-grow">
                              <span className="rto-t">{card.frontTitle}</span>
                              {card.deltaChip && (
                                <span className="rto-chip2">{card.deltaChip}</span>
                              )}
                            </div>
                            <div className="rto-nums">
                              <span className="b">{card.valueBefore}</span>
                              <span className="ar">→</span>
                              <span className="n">{card.valueAfter}</span>
                              {card.valueUnit && <span className="u">{card.valueUnit}</span>}
                            </div>
                            <div className="rto-trk">
                              {card.trackSegLeft && card.trackSegRight && (
                                <span
                                  className="seg"
                                  style={{ left: card.trackSegLeft, right: card.trackSegRight }}
                                />
                              )}
                              {card.trackDotBefore && (
                                <span className="dot b" style={{ left: card.trackDotBefore }} />
                              )}
                              {card.trackDotAfter && (
                                <span className="dot n" style={{ left: card.trackDotAfter }} />
                              )}
                            </div>
                            {card.trackFootnote && (
                              <div className="rto-gfoot">{card.trackFootnote}</div>
                            )}
                          </div>
                        </div>

                        {/* Back */}
                        <div className="rto-face rto-back">
                          <div className="rto-back-face">
                            <span className="rto-cat back">{card.category}</span>
                            <div className="rto-back-body-wrap">
                              {card.backEyebrow && (
                                <div className="rto-back-eyebrow">{card.backEyebrow}</div>
                              )}
                              {card.backBody && <p className="rto-back-body">{card.backBody}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {footnote && (
            <div className="rto-foot rto-pad">
              <p className="rto-note">{footnote}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
