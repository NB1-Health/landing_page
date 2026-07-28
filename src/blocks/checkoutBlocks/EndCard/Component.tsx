'use client'

import React from 'react'
import { usePlanCtaTracking } from '@/lib/usePlanCtaTracking'
import { useReveal } from '../useReveal'

type Cta = {
  text?: string | null
  href?: string | null
  variant?: 'advanced' | 'core' | 'core-primary' | 'core-alt' | null
}

type Props = {
  label?: string | null
  title?: string | null
  ctas?: Cta[] | null
  locale?: string
}

export const EndCardComponent: React.FC<Props> = ({ label, title, ctas, locale = 'en' }) => {
  const { ref, revealed } = useReveal()
  const trackPlanCta = usePlanCtaTracking(locale)

  return (
    <section ref={ref} className={`nb1-ec-sec${revealed ? ' nb1-in' : ''}`}>
      <style jsx>{`
        .nb1-ec-sec {
          padding: 0 0 56px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .nb1-ec-sec.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-ec-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 28px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .nb1-end-card {
          background: linear-gradient(165deg, #1b3e5c, #0e2740);
          border-radius: 30px;
          padding: 56px 40px;
          text-align: center;
          color: #fff;
        }
        .nb1-ec-label {
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #13a6cc;
          display: block;
          margin-bottom: 14px;
        }
        .nb1-ec-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(26px, 3.2vw, 38px);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 auto 28px;
          max-width: 600px;
          color: #fff;
        }
        .nb1-ec-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .nb1-ec-cta {
          display: inline-block;
          padding: 15px 28px;
          border-radius: 100px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: transform 0.18s, background 0.18s;
          cursor: pointer;
        }
        .nb1-ec-cta:hover {
          transform: translateY(-1px);
        }
        /* advanced — lime fill */
        .nb1-ec-cta.advanced {
          background: #c6ff5b;
          color: #0e2740;
          border: none;
        }
        .nb1-ec-cta.advanced:hover {
          background: #aaea42;
        }
        /* core — ghost white */
        .nb1-ec-cta.core {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #fff;
        }
        .nb1-ec-cta.core:hover {
          background: rgba(255, 255, 255, 0.18);
        }
        /* core-primary — lime fill (same as advanced) */
        .nb1-ec-cta.core-primary {
          background: #c6ff5b;
          color: #0e2740;
          border: none;
        }
        .nb1-ec-cta.core-primary:hover {
          background: #aaea42;
        }
        /* core-alt — ghost white (same as core) */
        .nb1-ec-cta.core-alt {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #fff;
        }
        .nb1-ec-cta.core-alt:hover {
          background: rgba(255, 255, 255, 0.18);
        }
        @media (max-width: 560px) {
          .nb1-end-card {
            padding: 40px 22px;
            border-radius: 18px;
          }
          .nb1-ec-ctas {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          .nb1-ec-cta {
            width: 100%;
            text-align: center;
            padding: 14px 16px;
            font-size: 13.5px;
            white-space: nowrap;
          }
        }
      `}</style>

      <div className="nb1-ec-con">
      <div className="nb1-end-card">
        {label && <span className="nb1-ec-label">{label}</span>}
        {title && <div className="nb1-ec-title">{title}</div>}
        {ctas && ctas.length > 0 && (
          <div className="nb1-ec-ctas">
            {ctas.map((cta, i) => (
              <a
                key={i}
                href={cta.href ?? '#'}
                className={`nb1-ec-cta ${cta.variant ?? 'advanced'}`}
                onClick={(event) => trackPlanCta(event, cta.href ?? '#')}
              >
                {cta.text}
              </a>
            ))}
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
