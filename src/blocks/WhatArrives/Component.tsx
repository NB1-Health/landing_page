'use client'

import React, { useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Card = {
  todColor?: string | null
  todLabel?: string | null
  image?: { url?: string | null; width?: number | null; height?: number | null } | null
  name?: string | null
  timing?: string | null
  description?: string | null
  chipColor?: string | null
  chipLabel?: string | null
}

type Props = {
  heading?: any
  lede?: any
  replacesLabel?: string | null
  replacesItems?: { label?: string | null }[] | null
  cards?: Card[] | null
  closingText?: any
}

export const WhatArrivesComponent: React.FC<Props> = ({
  heading, lede, replacesLabel, replacesItems, cards, closingText,
}) => {
  const secRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style jsx>{`
        .wa-sec {
          background: #fff;
          padding: 104px 32px;
        }
        @media (max-width: 760px) { .wa-sec { padding: 72px 22px; } }

        .wa-in { max-width: 1200px; margin: 0 auto; }

        /* ── Head ── */
        .wa-head {
          text-align: center;
          max-width: 880px;
          margin: 0 auto;
        }
        .wa-head :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.6vw, 50px);
          line-height: 1.07;
          letter-spacing: -0.03em;
          color: #12314D;
          margin: 0;
        }
        .wa-head :global(h2 em) { font-style: normal; color: #0A8FB0; }
        .wa-lede {
          font-size: clamp(16px, 1.4vw, 19px);
          line-height: 1.6;
          color: rgba(18,49,77,.70);
          max-width: 700px;
          margin: 18px auto 0;
        }
        .wa-lede :global(strong) { color: #12314D; font-weight: 600; }
        .wa-lede :global(p) { margin: 0; }

        /* ── Replaces pills ── */
        .wa-replaces {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 22px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 14px;
          color: rgba(18,49,77,.55);
          white-space: nowrap;
        }
        .wa-replaces-label { flex: none; margin-right: 1px; }
        .wa-pill {
          display: inline-block;
          padding: 4px 11px;
          border: 1px solid rgba(18,49,77,.12);
          border-radius: 7px;
          font-size: 13px;
          color: rgba(18,49,77,.60);
          background: #fff;
          white-space: nowrap;
          text-decoration: line-through;
          text-decoration-color: rgba(18,49,77,.35);
        }

        /* ── Cards grid ── */
        .wa-cards {
          position: relative;
          margin-top: 42px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 26px;
        }
        .wa-cards::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 16%;
          right: 16%;
          height: 1px;
          background: rgba(18,49,77,.10);
          z-index: 0;
        }
        @media (max-width: 820px) {
          .wa-cards {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 30px;
          }
          .wa-cards::before { display: none; }
        }

        /* ── Card ── */
        .wa-card {
          position: relative;
          z-index: 1;
          /* Column flow so the chip can sit on a common baseline: grid items
             stretch to the tallest card, and margin-top:auto on the chip
             absorbs whatever slack a shorter description leaves behind. */
          display: flex;
          flex-direction: column;
        }
        .wa-tod {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-bottom: 22px;
        }
        .wa-tod-dot {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          box-shadow: 0 0 0 5px #fff;
          flex: none;
        }
        .wa-tod-label {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(18,49,77,.55);
        }
        .wa-shot {
          flex: none;
          aspect-ratio: 3 / 4;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(18,49,77,.10);
          box-shadow: 0 26px 54px -34px rgba(18,49,77,.42);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .wa-shot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .wa-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 23px;
          letter-spacing: -0.01em;
          color: #12314D;
        }
        .wa-timing {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(18,49,77,.40);
          margin: 4px 0 12px;
        }
        .wa-desc {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(18,49,77,.70);
          margin-bottom: 16px;
        }
        .wa-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: rgba(18,49,77,.70);
          background: #fff;
          border: 1px solid rgba(18,49,77,.10);
          border-radius: 9px;
          padding: 7px 13px;
          margin-top: auto;
          align-self: flex-start;
        }
        .wa-chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex: none;
        }

        /* ── Mobile horizontal card ── */
        @media (max-width: 820px) {
          .wa-card {
            display: grid;
            grid-template-columns: 116px 1fr;
            column-gap: 16px;
            align-items: start;
            text-align: left;
            background: #fff;
            border: 1px solid rgba(18,49,77,.10);
            border-radius: 18px;
            padding: 14px;
            box-shadow: 0 18px 40px -30px rgba(18,49,77,.4);
          }
          .wa-shot {
            grid-column: 1;
            grid-row: 1 / span 5;
            width: 116px;
            height: 155px;
            aspect-ratio: auto;
            align-self: start;
            margin: 0;
            border: none;
            box-shadow: none;
            border-radius: 12px;
          }
          .wa-tod { grid-column: 2; grid-row: 1; justify-content: flex-start; margin: 2px 0 0; }
          .wa-name { grid-column: 2; grid-row: 2; font-size: 20px; margin-top: 5px; }
          .wa-timing { display: none; }
          .wa-desc { grid-column: 2; grid-row: 4; font-size: 13.5px; margin: 9px 0 11px; }
          .wa-chip { grid-column: 2; grid-row: 5; justify-self: start; margin-top: 0; }
        }

        /* ── Closing line ── */
        .wa-close {
          text-align: center;
          margin-top: 48px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 15.5px;
          color: rgba(18,49,77,.55);
        }
        .wa-close :global(strong), .wa-close :global(em) { color: #0A8FB0; font-style: normal; font-weight: 600; }
        .wa-close :global(p) { margin: 0; }

        /* ── Scroll-in ── */
        .r-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .r-up.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .r-up { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <section ref={secRef} className="wa-sec" data-screen-label="What arrives at your door">
        <div className="wa-in">

          <div className={`wa-head r-up${visible ? ' in' : ''}`}>
            {heading && (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            )}
            {lede && (
              <div className="wa-lede">
                <RichText data={lede} enableGutter={false} enableProse={false} />
              </div>
            )}
            {(replacesLabel || (replacesItems && replacesItems.length > 0)) && (
              <div className="wa-replaces">
                {replacesLabel && <span className="wa-replaces-label">{replacesLabel}</span>}
                {replacesItems?.map((item, i) => (
                  item.label && <span key={i} className="wa-pill">{item.label}</span>
                ))}
              </div>
            )}
          </div>

          {cards && cards.length > 0 && (
            <div className={`wa-cards r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.1s' }}>
              {cards.map((card, i) => {
                const imgUrl = card.image?.url ? getMediaUrl(card.image.url) : null
                return (
                  <div key={i} className="wa-card">
                    <div className="wa-tod">
                      {card.todColor && (
                        <span className="wa-tod-dot" style={{ background: card.todColor }} />
                      )}
                      {card.todLabel && <span className="wa-tod-label">{card.todLabel}</span>}
                    </div>
                    <div className="wa-shot">
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={card.name || ''}
                          width={card.image?.width ?? undefined}
                          height={card.image?.height ?? undefined}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </div>
                    {card.name && <div className="wa-name">{card.name}</div>}
                    {card.timing && <div className="wa-timing">{card.timing}</div>}
                    {card.description && <p className="wa-desc">{card.description}</p>}
                    {card.chipLabel && (
                      <span className="wa-chip">
                        {card.chipColor && (
                          <span className="wa-chip-dot" style={{ background: card.chipColor }} />
                        )}
                        {card.chipLabel}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {closingText && (
            <div className={`wa-close r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.2s' }}>
              <RichText data={closingText} enableGutter={false} enableProse={false} />
            </div>
          )}

        </div>
      </section>
    </>
  )
}
