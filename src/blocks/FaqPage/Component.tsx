'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import { usePriceTokens } from '@/lib/plans/PriceTokensProvider'

type Item = { question?: string | null; answer?: any }
type Group = { label?: string | null; items?: Item[] | null }

type Props = {
  title?: string | null
  subheading?: string | null
  groups?: Group[] | null
  calloutHeading?: string | null
  calloutBody?: string | null
  calloutCtaLabel?: string | null
  calloutCtaHref?: string | null
}

const slug = (s: string, i: number) =>
  `faq-${(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `g${i}`}`

const pad = (n: number) => String(n).padStart(2, '0')

export const FaqPageComponent: React.FC<Props> = (props) => {
  // Resolve {{price:…}} / {{fee:…}} tokens in questions, answers and callout
  // copy against the visitor's selected currency (re-runs when they switch).
  const {
    title,
    subheading,
    groups,
    calloutHeading,
    calloutBody,
    calloutCtaLabel,
    calloutCtaHref,
  } = usePriceTokens(props)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const toggle = (k: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(k) ? next.delete(k) : next.add(k)
      return next
    })

  const grps = groups ?? []

  return (
    <>
      <section className="lg-hero">
        <div className="lg-hero-in">
          <h1>{title}</h1>
          {subheading && <p className="lg-hero-sub">{subheading}</p>}
        </div>
      </section>

      <div className="faqpg-body">
        {grps.length > 1 && (
          <div className="faqpg-cats">
            {grps.map((g, i) => (
              <a key={i} href={`#${slug(g.label || '', i)}`}>
                {g.label}
              </a>
            ))}
          </div>
        )}

        {grps.map((g, gi) => (
          <section className="faqpg-group" id={slug(g.label || '', gi)} key={gi}>
            <h2 className="faqpg-group-h">
              <span className="ix">{pad(gi + 1)}</span>
              {g.label}
            </h2>
            <div className="faq-list">
              {(g.items ?? []).map((it, ii) => {
                const k = `${gi}-${ii}`
                const isOpen = open.has(k)
                return (
                  <div className={`faq-item${isOpen ? ' open' : ''}`} key={ii}>
                    <button
                      className="faq-q"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggle(k)}
                    >
                      <span className="qt">{it.question}</span>
                      <span className="pm" aria-hidden="true" />
                    </button>
                    <div
                      className="faq-a"
                      ref={(el) => {
                        if (el) el.style.maxHeight = isOpen ? `${el.scrollHeight}px` : '0px'
                      }}
                    >
                      <div className="faq-a-in">
                        {it.answer && (
                          <RichText data={it.answer} enableGutter={false} enableProse={false} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {calloutHeading && (
          <div className="lg-callout">
            <div>
              <h3>{calloutHeading}</h3>
              {calloutBody && <p>{calloutBody}</p>}
            </div>
            {calloutCtaLabel && (
              <a className="lg-co-btn" href={calloutCtaHref || '#'}>
                {calloutCtaLabel}
              </a>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .lg-hero {
          position: relative;
          background: #f7fafc;
          overflow: hidden;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(64% 84% at 90% -12%, rgba(10, 143, 176, 0.12) 0%, transparent 56%),
            radial-gradient(56% 74% at -4% 112%, rgba(120, 162, 196, 0.1) 0%, transparent 58%);
        }
        .lg-hero-in {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 62px 40px 52px;
        }
        .lg-hero h1 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4.6vw, 54px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #12314d;
          margin: 0;
        }
        .lg-hero-sub {
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.58;
          color: rgba(18, 49, 77, 0.7);
          margin: 20px 0 0;
          max-width: 600px;
          text-wrap: pretty;
        }

        .faqpg-body {
          max-width: 800px;
          margin: 0 auto;
          padding: 54px 40px 92px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .faqpg-cats {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          margin-bottom: 46px;
        }
        .faqpg-cats a {
          font-size: 13px;
          font-weight: 550;
          color: rgba(18, 49, 77, 0.7);
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 100px;
          padding: 9px 16px;
          text-decoration: none;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .faqpg-cats a:hover {
          border-color: #0a8fb0;
          color: #0a8fb0;
        }
        .faqpg-group {
          margin-bottom: 44px;
          scroll-margin-top: 90px;
        }
        .faqpg-group:last-of-type {
          margin-bottom: 0;
        }
        .faqpg-group-h {
          display: flex;
          align-items: baseline;
          gap: 12px;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.02em;
          color: #12314d;
          margin: 0 0 6px;
        }
        .faqpg-group-h .ix {
          font-size: 12px;
          font-weight: 700;
          color: #0a8fb0;
          font-variant-numeric: tabular-nums;
        }

        .faq-list {
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .faq-item {
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .faq-q {
          display: flex;
          align-items: center;
          gap: 18px;
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          padding: 22px 0;
          cursor: pointer;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .faq-q .qt {
          flex: 1;
          font-size: 16.5px;
          font-weight: 500;
          color: #12314d;
        }
        .faq-q .pm {
          position: relative;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        .faq-q .pm::before,
        .faq-q .pm::after {
          content: '';
          position: absolute;
          background: rgba(18, 49, 77, 0.55);
          transition: transform 0.3s, opacity 0.3s;
        }
        .faq-q .pm::before {
          left: 0;
          top: 8px;
          width: 18px;
          height: 2px;
        }
        .faq-q .pm::after {
          left: 8px;
          top: 0;
          width: 2px;
          height: 18px;
        }
        .faq-item.open .pm::after {
          transform: scaleY(0);
        }
        .faq-item.open .qt {
          color: #0a8fb0;
        }
        .faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 0.84, 0.44, 1);
        }
        .faq-a-in {
          padding: 0 0 24px 38px;
          font-size: 15px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.65;
          max-width: 680px;
        }

        .lg-callout {
          max-width: 800px;
          margin: 56px auto 0;
          background: #0e2740;
          border-radius: 18px;
          padding: 32px 36px;
          color: #fff;
          display: flex;
          flex-wrap: wrap;
          gap: 22px 40px;
          align-items: center;
          justify-content: space-between;
        }
        .lg-callout h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .lg-callout p {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
          max-width: 430px;
        }
        .lg-callout .lg-co-btn {
          flex: none;
          font-size: 14px;
          font-weight: 650;
          color: #12314d;
          background: #fff;
          border-radius: 11px;
          padding: 13px 22px;
          text-decoration: none;
          white-space: nowrap;
        }
        .lg-callout .lg-co-btn:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        @media (max-width: 760px) {
          .lg-hero-in {
            padding: 48px 26px 40px;
          }
          .faqpg-body {
            padding: 38px 26px 70px;
          }
          .lg-callout {
            margin: 48px 26px 0;
          }
        }
      `}</style>
    </>
  )
}
