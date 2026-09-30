'use client'

import React from 'react'
import { useReveal } from '../useReveal'

type Step = {
  weekLabel?: string | null
  title?: string | null
  description?: string | null
  isPaymentStep?: boolean | null
}

type Props = {
  sectionTitle?: string | null
  subtitle?: string | null
  steps?: Step[] | null
  showAdvancedExtras?: boolean | null
  advancedPillLabel?: string | null
  advancedExtras?: Step[] | null
}

export const OrderTimelineComponent: React.FC<Props> = ({
  sectionTitle,
  subtitle,
  steps,
  showAdvancedExtras,
  advancedPillLabel,
  advancedExtras,
}) => {
  const { ref, revealed } = useReveal()

  if (!steps?.length) return null

  return (
    <section ref={ref} className={`nb1-timeline-sec${revealed ? ' nb1-in' : ''}`}>
      <style jsx>{`
        .nb1-timeline-sec {
          padding: 0 0 56px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .nb1-timeline-sec.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-tl-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 28px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .nb1-tl-head {
          margin-bottom: 24px;
        }
        .nb1-tl-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.4vw, 30px);
          letter-spacing: -0.02em;
          color: #12314d;
          margin-top: 10px;
        }
        .nb1-tl-sub {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.55;
          margin-top: 8px;
          max-width: 560px;
        }

        /* Rail 2 — compact one-line timeline */
        .nb1-rail2 {
          margin-top: 16px;
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 8px 28px;
          box-shadow: 0 20px 44px -30px rgba(18, 49, 77, 0.3);
        }
        .nb1-r {
          display: grid;
          grid-template-columns: 74px 22px 1fr;
          gap: 16px;
          align-items: center;
          padding: 14px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .nb1-r:first-child {
          border-top: none;
        }
        .nb1-wk {
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          text-align: left;
          line-height: 1.3;
          /* Fixed-width column: longer labels ("SEMAINES 1–2") wrap onto a second
             line instead of running into the dot. */
          overflow-wrap: break-word;
        }
        .nb1-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0a8fb0;
          margin: 0 auto;
          flex-shrink: 0;
        }
        .nb1-r.nb1-pay .nb1-dot {
          background: #c2913c;
        }
        .nb1-tx {
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.5;
        }
        .nb1-tx b {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-tx-sep {
          /* comma after title */
        }

        /* Advanced extras box */
        .nb1-rail-adv {
          position: relative;
          margin: 14px -14px 2px;
          padding: 2px 14px;
          border: 1px solid rgba(10, 143, 176, 0.3);
          border-radius: 14px;
          background: rgba(10, 143, 176, 0.045);
        }
        .nb1-rail-adv .nb1-r {
          border-top: none;
        }
        .nb1-rail-adv .nb1-r + .nb1-r {
          border-top: 1px solid rgba(10, 143, 176, 0.16);
        }
        .nb1-rail-adv .nb1-dot {
          background: #fff;
          border: 2px solid #0a8fb0;
          width: 11px;
          height: 11px;
        }
        .nb1-adv-pill {
          position: absolute;
          top: -10px;
          left: 16px;
          background: #0a8fb0;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 3px 11px;
          border-radius: 100px;
          box-shadow: 0 2px 7px rgba(10, 143, 176, 0.32);
        }

        @media (max-width: 600px) {
          .nb1-r {
            grid-template-columns: 64px 14px 1fr;
            gap: 11px;
          }
          .nb1-wk {
            font-size: 10px;
          }
          .nb1-tx-t {
            display: block;
            margin-bottom: 1px;
          }
          .nb1-tx-sep {
            display: none;
          }
          .nb1-tx-d {
            display: block;
          }
          .nb1-tx-d::first-letter {
            text-transform: uppercase;
          }
        }
      `}</style>

      <div className="nb1-tl-con">
      {(sectionTitle || subtitle) && (
        <div className="nb1-tl-head">
          {sectionTitle && <div className="nb1-tl-title">{sectionTitle}</div>}
          {subtitle && <div className="nb1-tl-sub">{subtitle}</div>}
        </div>
      )}

      <div className="nb1-rail2">
        {steps.map((step, i) => (
          <div key={i} className={`nb1-r${step.isPaymentStep ? ' nb1-pay' : ''}`}>
            <div className="nb1-wk">{step.weekLabel}</div>
            <div className="nb1-dot" />
            <div className="nb1-tx">
              <span className="nb1-tx-t"><b>{step.title}</b></span>
              {step.description && (
                <>
                  <span className="nb1-tx-sep">, </span>
                  <span className="nb1-tx-d">{step.description}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {showAdvancedExtras && advancedExtras && advancedExtras.length > 0 && (
          <div className="nb1-rail-adv">
            <span className="nb1-adv-pill">{advancedPillLabel || 'Advanced'}</span>
            {advancedExtras.map((step, i) => (
              <div key={i} className="nb1-r">
                <div className="nb1-wk">{step.weekLabel}</div>
                <div className="nb1-dot" />
                <div className="nb1-tx">
                  <span className="nb1-tx-t"><b>{step.title}</b></span>
                  {step.description && (
                    <>
                      <span className="nb1-tx-sep">, </span>
                      <span className="nb1-tx-d">{step.description}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </section>
  )
}
