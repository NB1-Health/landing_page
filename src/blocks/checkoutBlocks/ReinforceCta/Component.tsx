'use client'

import React from 'react'
import { usePlanCtaTracking } from '@/lib/usePlanCtaTracking'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type AthleteImage = {
  image?: { url?: string | null } | string | null
  alt?: string | null
}

type Seal = {
  boldText?: string | null
  regularText?: string | null
}

type Props = {
  athleteText?: string | null
  athleteImages?: AthleteImage[] | null
  ctaText?: string | null
  ctaHref?: string | null
  ctaText2?: string | null
  ctaHref2?: string | null
  seals?: Seal[] | null
  locale?: string
}

export const ReinforceCtaComponent: React.FC<Props> = ({
  athleteText,
  athleteImages,
  ctaText,
  ctaHref,
  ctaText2,
  ctaHref2,
  seals,
  locale = 'en',
}) => {
  const twoBtn = !!(ctaText && ctaText2)
  const trackPlanCta = usePlanCtaTracking(locale)

  return (
    <section className="nb1-rc-sec">
      <style jsx>{`
        .nb1-rc-sec {
          padding: 56px 0;
        }
        .nb1-rc-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        /* Athlete reminder */
        .nb1-rc-ath {
          display: flex;
          align-items: center;
          gap: 13px;
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          text-align: center;
        }
        .nb1-rc-faces {
          display: inline-flex;
        }
        .nb1-rc-faces img {
          width: 38px;
          height: 38px;
          min-width: 38px;
          min-height: 38px;
          flex-shrink: 0;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 2px solid #fff;
          margin-left: -11px;
          box-shadow: 0 1px 4px rgba(18, 49, 77, 0.2);
        }
        .nb1-rc-faces img:first-child { margin-left: 0; }

        /* CTA grid */
        .nb1-rc-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
        }
        .nb1-rc-grid.single {
          grid-template-columns: 1fr;
        }
        .nb1-rc-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          border-radius: 14px;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 17px;
          text-decoration: none;
          transition: transform 0.18s;
        }
        .nb1-rc-btn:hover { transform: translateY(-2px); }
        .nb1-rc-btn.primary {
          background: #c6ff5b;
          color: #0e2740;
        }
        .nb1-rc-btn.secondary {
          background: #f1f4f7;
          border: 1px solid rgba(18, 49, 77, 0.1);
          color: #12314d;
        }

        /* Trust seals */
        .nb1-rc-seals {
          display: flex;
          gap: 24px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 18px;
        }
        .nb1-rc-seal {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.7);
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 100px;
          padding: 8px 14px;
        }
        .nb1-rc-seal strong {
          font-weight: 600;
          color: #12314d;
        }

        @media (max-width: 600px) {
          .nb1-rc-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="nb1-rc-con">
        {athleteText && (
          <div className="nb1-rc-ath">
            {athleteImages && athleteImages.length > 0 && (
              <span className="nb1-rc-faces">
                {athleteImages.map((a, i) => {
                  const url = typeof a.image === 'object' && a.image?.url ? getMediaUrl(a.image.url) : null
                  return url ? <img key={i} src={url} alt={a.alt || ''} /> : null
                })}
              </span>
            )}
            <span>{athleteText}</span>
          </div>
        )}

        {(ctaText || ctaText2) && (
          <div className={`nb1-rc-grid${twoBtn ? '' : ' single'}`}>
            {ctaText && ctaHref && (
              <a
                href={ctaHref}
                className={`nb1-rc-btn ${twoBtn ? 'secondary' : 'primary'}`}
                onClick={(event) => trackPlanCta(event, ctaHref)}
              >
                {ctaText}
              </a>
            )}
            {ctaText2 && ctaHref2 && (
              <a
                href={ctaHref2}
                className="nb1-rc-btn primary"
                onClick={(event) => trackPlanCta(event, ctaHref2)}
              >
                {ctaText2}
              </a>
            )}
          </div>
        )}

        {seals && seals.length > 0 && (
          <div className="nb1-rc-seals">
            {seals.map((s, i) => (
              <span key={i} className="nb1-rc-seal">
                {s.boldText && <strong>{s.boldText}</strong>}
                {s.regularText && <>{s.regularText}</>}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
