'use client'

import React from 'react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import RichText from '@/components/RichText'
import TrustpilotWidget from '@/components/Trustpilot/TrustpilotWidget'
import { useReveal } from '../useReveal'

type Seal = {
  type?: 'stars' | 'dot' | null
  rating?: string | null
  label?: string | null
  shortLabel?: string | null
}

type Props = {
  headline?: SerializedEditorState | null
  subtitle?: string | null
  showTrustpilotRating?: boolean | null
  showSeals?: boolean | null
  seals?: Seal[] | null
  locale?: string | null
}

export const OrderStepHeroComponent: React.FC<Props> = ({
  headline,
  subtitle,
  showTrustpilotRating,
  showSeals,
  seals,
  locale,
}) => {
  const { ref, revealed } = useReveal()

  return (
    <header ref={ref} className={`nb1-ok-hero${revealed ? ' nb1-in' : ''}`}>
      <style jsx>{`
        .nb1-ok-hero {
          padding: 18px 0 0;
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .nb1-ok-hero.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-ok-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 28px;
        }
        .nb1-ok-headline,
        .nb1-ok-headline :global(p) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.6vw, 40px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin: 0;
          max-width: 680px;
          color: #12314d;
        }
        .nb1-ok-headline :global(strong) {
          font-weight: inherit;
          color: #0a8fb0;
        }
        .nb1-ok-sub {
          font-size: 16px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.55;
          margin-top: 12px;
          max-width: 540px;
          font-weight: 400;
        }
        .nb1-ok-seals {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 16px;
        }
        .nb1-seal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.7);
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 100px;
          padding: 8px 14px;
        }
        .nb1-seal strong {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-stars { color: #0a8fb0; letter-spacing: 1px; }
        .nb1-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #0a8fb0; flex-shrink: 0;
        }
        /* The TrustBox sits in its own pill so it reads as one of the seals.
           Sizing mirrors the homepage hero: the template reflows on the iframe's
           OWN width (the score stacks under 200px, the logo wraps under 260px)
           and its type is fixed at 18px regardless of data-style-height, so it
           is rendered wide enough to stay on one line and then scaled down as a
           whole to bring that 18px type into line with the 12.5px seal text. */
        .nb1-tp-box { width: 231px; height: 18px; line-height: 0; }
        .nb1-tp-box :global(.trustpilot-widget) {
          width: 320px;
          transform: scale(0.7222); /* 18px template type -> 13px */
          transform-origin: left top;
        }
        .nb1-seal-mini { display: none; }
        @media (max-width: 560px) {
          .nb1-ok-hero { padding: 28px 0 20px; }
          .nb1-ok-con { padding: 0 20px; }
          /* Keep the desktop pill sizing and font size on mobile: each pill
             hugs its own text (never stretched to a column) and the row simply
             wraps — a seal that no longer fits drops one under the other via the
             base flex-wrap, instead of overflowing off-screen on a single line. */
          .nb1-ok-seals { gap: 8px; }
          .nb1-seal { white-space: nowrap; }
          .nb1-seal-full { display: none; }
          .nb1-seal-mini { display: inline; }
        }
      `}</style>

      <div className="nb1-ok-con">
        {headline && (
          <div className="nb1-ok-headline">
            <RichText data={headline} enableGutter={false} enableProse={false} />
          </div>
        )}
        {subtitle && <p className="nb1-ok-sub">{subtitle}</p>}
        {(showTrustpilotRating || (showSeals && seals && seals.length > 0)) && (
          <div className="nb1-ok-seals">
            {showTrustpilotRating && (
              <span className="nb1-seal">
                <span className="nb1-tp-box">
                  <TrustpilotWidget
                    locale={locale}
                    variant="microStar"
                    theme="light"
                    fontFamily="Inter"
                    textColor="#596F82"
                  />
                </span>
              </span>
            )}
            {showSeals && seals && seals.map((seal, i) => (
              <span key={i} className="nb1-seal">
                {seal.type === 'stars' ? (
                  <>
                    <span className="nb1-stars">★★★★★</span>
                    {seal.rating && <strong>{seal.rating}</strong>}
                    {seal.label && <span className="nb1-seal-full"> · {seal.label}</span>}
                    {seal.shortLabel && <span className="nb1-seal-mini"> · {seal.shortLabel}</span>}
                  </>
                ) : (
                  <>
                    <span className="nb1-dot" />
                    {seal.label && <span className="nb1-seal-full">{seal.label}</span>}
                    {seal.shortLabel && <span className="nb1-seal-mini">{seal.shortLabel}</span>}
                  </>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
