'use client'

import React from 'react'
import { useReveal } from '../useReveal'

type Bullet = { text?: string | null }

type Props = {
  direction?: 'upsell' | 'downsell' | null
  title?: string | null
  subtitle?: string | null
  bullets?: Bullet[] | null
  ctaText?: string | null
  ctaHref?: string | null
}

export const PlanPivotComponent: React.FC<Props> = ({
  direction = 'upsell',
  title,
  subtitle,
  bullets,
  ctaText,
  ctaHref,
}) => {
  const { ref, revealed } = useReveal()

  const isDown = direction === 'downsell'

  return (
    <section className="nb1-pp-sec">
      <style jsx>{`
        .nb1-pp-sec {
          padding: 0 0 56px;
        }
        .nb1-pp-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 28px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .nb1-pp-box {
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(10, 143, 176, 0.2);
          border-radius: 18px;
          padding: 30px 32px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .nb1-pp-box.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-pp-box.nb1-pp-down {
          background: #f1f4f7;
          border-color: rgba(18, 49, 77, 0.2);
        }
        .nb1-pp-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(20px, 2.2vw, 26px);
          letter-spacing: -0.02em;
          color: #12314d;
          margin-bottom: 8px;
        }
        .nb1-pp-sub {
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.55;
          max-width: 560px;
          margin-bottom: 18px;
        }
        .nb1-pp-bullets {
          list-style: none;
          margin: 0 0 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nb1-pp-bullets li {
          position: relative;
          padding-left: 22px;
          font-size: 14px;
          color: #12314d;
        }
        .nb1-pp-bullets li::before {
          content: '+';
          position: absolute;
          left: 0;
          top: -1px;
          color: #0a8fb0;
          font-weight: 700;
          font-size: 16px;
        }
        .nb1-pp-box.nb1-pp-down .nb1-pp-bullets li::before {
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-pp-cta {
          display: inline-flex;
          align-items: center;
          /* Long or translated CTA copy wraps inside the pill, so both lines are
             centred rather than ragged-left. text-wrap: balance evens the two
             lines out where supported and is ignored everywhere else. */
          justify-content: center;
          text-align: center;
          text-wrap: balance;
          gap: 8px;
          padding: 13px 22px;
          background: #fff;
          color: #0a8fb0;
          border: 1px solid #0a8fb0;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.18s;
        }
        /* The arrow is its own flex item, so long or translated copy wraps
           inside the label and the arrow stays put beside it, vertically
           centred, instead of being pushed onto a line of its own. */
        .nb1-pp-cta-label {
          text-align: center;
        }
        .nb1-pp-cta-arrow {
          flex: none;
          line-height: 1;
          transition: transform 0.18s;
        }
        .nb1-pp-cta:hover {
          background: #0a8fb0;
          color: #fff;
        }
        .nb1-pp-cta:hover .nb1-pp-cta-arrow {
          transform: translateX(2px);
        }
        .nb1-pp-box.nb1-pp-down .nb1-pp-cta {
          color: #12314d;
          border-color: rgba(18, 49, 77, 0.2);
        }
        .nb1-pp-box.nb1-pp-down .nb1-pp-cta:hover {
          background: #12314d;
          color: #fff;
          border-color: #12314d;
        }
        @media (max-width: 560px) {
          .nb1-pp-box {
            padding: 26px 22px;
          }
        }
      `}</style>

    <div className="nb1-pp-con">
    <div ref={ref} className={`nb1-pp-box${isDown ? ' nb1-pp-down' : ''}${revealed ? ' nb1-in' : ''}`}>

      {title && <div className="nb1-pp-title">{title}</div>}
      {subtitle && <p className="nb1-pp-sub">{subtitle}</p>}

      {bullets && bullets.length > 0 && (
        <ul className="nb1-pp-bullets">
          {bullets.map((b, i) => b.text && <li key={i}>{b.text}</li>)}
        </ul>
      )}

      {ctaHref && ctaText && (
        <a href={ctaHref} className="nb1-pp-cta">
          <span className="nb1-pp-cta-label">{ctaText}</span>
          <span className="nb1-pp-cta-arrow" aria-hidden="true">
            →
          </span>
        </a>
      )}
    </div>
    </div>
    </section>
  )
}
