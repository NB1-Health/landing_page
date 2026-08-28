'use client'

import React, { useEffect, useState } from 'react'
import { useReveal } from '../useReveal'
import { getDictionary } from '@/i18n/getDictionary'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  formatMonthLabel,
  computeSavings,
  getBestValueLabel,
  resolveTokens,
} from '@/lib/plans/clientUtils'

type AthleteImage = {
  image?: { url?: string | null } | string | null
  alt?: string | null
}

type PricingRow = {
  months?: string | null
  rate?: string | null
  isBestValue?: boolean | null
  bestValueLabel?: string | null
}

type Props = {
  sectionTitle?: string | null
  subtitle?: string | null
  planName?: string | null
  monthlyNote?: string | null
  planFamily?: 'core' | 'advanced' | null
  rows?: PricingRow[] | null
  ctaText?: string | null
  ctaHref?: string | null
  showSecondPlan?: boolean | null
  planName2?: string | null
  monthlyNote2?: string | null
  planFamily2?: 'core' | 'advanced' | null
  rows2?: PricingRow[] | null
  ctaText2?: string | null
  ctaHref2?: string | null
  footerNote?: SerializedEditorState | null
  athleteSealText?: string | null
  athleteImages?: AthleteImage[] | null
  locale?: string
}

function imgUrl(img?: AthleteImage['image']): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}

function computeRows(
  family: 'core' | 'advanced',
  plans: Awaited<ReturnType<typeof fetchPlansClient>>,
  rateMap: Record<string, number>,
  currency: ReturnType<typeof getClientCurrency>,
  locale: string,
  bestValueLabel: string,
): PricingRow[] {
  const apiTitle = family === 'advanced' ? 'Advanced' : 'Core'
  // Savings anchor to the 1-month standard rate (the new baseline), matching
  // CycleSelector and BASELINE_MONTH=1 in lib/plans/api.ts — not the old
  // 4-month rate.
  const baselineRate = rateMap[`${family}:1`] ?? 0
  return plans
    .filter((p) => p.title === apiTitle && [1, 4, 12].includes(p.month))
    .sort((a, b) => a.month - b.month)
    .map((p) => {
      const rate = rateMap[`${family}:${p.month}`] ?? 0
      return {
        months: formatMonthLabel(p.month, locale),
        rate: formatPrice(rate, currency, locale),
        isBestValue: p.is_preferred,
        bestValueLabel: p.is_preferred ? bestValueLabel : null,
      }
    })
}

export const CyclesPricingGridClient: React.FC<Props> = ({
  sectionTitle,
  subtitle,
  planName,
  monthlyNote: rawMonthlyNote,
  planFamily,
  rows: rowsProp,
  ctaText,
  ctaHref,
  showSecondPlan,
  planName2,
  monthlyNote2: rawMonthlyNote2,
  planFamily2,
  rows2: rows2Prop,
  ctaText2,
  ctaHref2,
  footerNote,
  athleteSealText,
  athleteImages,
  locale = 'en',
}) => {
  const { ref, revealed } = useReveal()
  const perMonth = getDictionary(locale).plans.perMonth
  const twoCol = Boolean(showSecondPlan && planName2)
  const [rows, setRows] = useState<PricingRow[]>(rowsProp ?? [])
  const [rows2, setRows2] = useState<PricingRow[]>(rows2Prop ?? [])
  const [monthlyNote, setMonthlyNote] = useState<string | null | undefined>(rawMonthlyNote)
  const [monthlyNote2, setMonthlyNote2] = useState<string | null | undefined>(rawMonthlyNote2)

  useEffect(() => {
    if (!planFamily) return
    const bestValueLabel = getBestValueLabel(locale)

    function applyPrices(currency: ReturnType<typeof getClientCurrency>, plans: Awaited<ReturnType<typeof fetchPlansClient>>) {
      const rateMap = buildRateMap(plans, currency)
      setRows(computeRows(planFamily!, plans, rateMap, currency, locale, bestValueLabel))
      if (showSecondPlan && planFamily2) {
        setRows2(computeRows(planFamily2, plans, rateMap, currency, locale, bestValueLabel))
      }
      setMonthlyNote(resolveTokens(rawMonthlyNote, rateMap, currency, locale))
      setMonthlyNote2(resolveTokens(rawMonthlyNote2, rateMap, currency, locale))
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
  }, [planFamily, planFamily2, locale])

  return (
    <section ref={ref} className={`nb1-cpg-sec${revealed ? ' nb1-in' : ''}`}>
      <style jsx>{`
        .nb1-cpg-sec {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .nb1-cpg-sec.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        /* cream band — covers title + grid + footer note only */
        .nb1-cpg-band {
          position: relative;
          padding: 0 0 56px;
        }
        .nb1-cpg-band::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100vw;
          background: #faf8f2;
          z-index: 0;
        }
        .nb1-cpg-inner {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 28px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        /* white area — athlete seal + CTAs */
        .nb1-cpg-below {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 28px 56px;
        }
        .nb1-cpg-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }
        .nb1-cpg-head-text {
          flex: 1;
          min-width: 0;
        }
        /* Athlete seal inline in header */
        .nb1-cpg-head-ath {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.65);
          white-space: nowrap;
          flex-shrink: 0;
          padding-top: 4px;
        }
        .nb1-cpg-head-faces {
          display: inline-flex;
        }
        .nb1-cpg-head-faces img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 2px solid #f1f4f7;
          margin-left: -8px;
          box-shadow: 0 1px 3px rgba(18, 49, 77, 0.2);
        }
        .nb1-cpg-head-faces img:first-child { margin-left: 0; }
        .nb1-cpg-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.4vw, 30px);
          letter-spacing: -0.02em;
          color: #12314d;
        }
        .nb1-cpg-sub {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.55;
          margin-top: 8px;
          max-width: 560px;
        }

        /* Grid: 1-col or 2-col */
        .nb1-cpg-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 8px;
        }
        .nb1-cpg-grid.two-col {
          grid-template-columns: 1fr 1fr;
        }

        /* Plan card */
        .nb1-cpg-col {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 22px 26px;
          background: #fff;
        }
        .nb1-cpg-col-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
          margin-bottom: 4px;
        }
        .nb1-cpg-monthly-note {
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 500;
          font-size: 11.5px;
          letter-spacing: 0;
          text-transform: none;
          color: #0a8fb0;
          margin-left: 8px;
        }
        .nb1-cpg-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          font-size: 14px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-cpg-len {
          display: inline-flex;
          align-items: center;
        }
        .nb1-cpg-row.best .nb1-cpg-len {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-cpg-rate {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 21px;
          letter-spacing: -0.02em;
          color: #12314d;
        }
        .nb1-cpg-rate small {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 500;
        }
        .nb1-cpg-best-tag {
          display: inline-block;
          margin-left: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0e2740;
          background: #c6ff5b;
          padding: 3px 9px;
          border-radius: 100px;
        }

        /* Combined Term | Core | Advanced table (two-plan mode) */
        .nb1-cpg-table {
          margin-top: 8px;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          background: #fff;
          overflow: hidden;
        }
        .nb1-cpg-thead,
        .nb1-cpg-trow {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          align-items: center;
          gap: 12px;
          padding: 16px 26px;
        }
        .nb1-cpg-thead {
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-cpg-th {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
          text-align: right;
        }
        .nb1-cpg-trow + .nb1-cpg-trow {
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .nb1-cpg-term {
          display: inline-flex;
          align-items: center;
          flex-wrap: wrap;
          font-size: 14px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-cpg-trow.best .nb1-cpg-term {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-cpg-cell {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 21px;
          letter-spacing: -0.02em;
          color: #12314d;
          text-align: right;
        }
        .nb1-cpg-cell small {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 500;
        }
        @media (max-width: 600px) {
          .nb1-cpg-thead,
          .nb1-cpg-trow {
            padding: 13px 16px;
            grid-template-columns: 1.3fr 1fr 1fr;
            gap: 8px;
          }
          .nb1-cpg-th {
            font-size: 11px;
          }
          .nb1-cpg-cell {
            font-size: 17px;
          }
        }

        /* Footer note */
        .nb1-cpg-foot {
          margin-top: 18px;
          padding: 16px 20px;
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(10, 143, 176, 0.2);
          border-radius: 12px;
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.5;
        }
        .nb1-cpg-foot :global(strong) {
          color: #aaea42;
          font-weight: 700;
        }

        /* CTA row */
        .nb1-cpg-ctas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }
        .nb1-cpg-cta {
          display: block;
          text-align: center;
          padding: 16px 20px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
        }
        .nb1-cpg-cta.primary {
          background: #c6ff5b;
          color: #0e2740;
        }
        .nb1-cpg-cta.primary:hover { background: #aaea42; }
        .nb1-cpg-cta.secondary {
          background: rgba(18, 49, 77, 0.06);
          color: #12314d;
          border: none;
        }
        .nb1-cpg-cta.secondary:hover { background: rgba(18, 49, 77, 0.1); }

        @media (max-width: 600px) {
          .nb1-cpg-grid.two-col { grid-template-columns: 1fr; }
          .nb1-cpg-ctas { grid-template-columns: 1fr; }
          /* Stack the header on mobile so the title/subtitle and the athlete
             seal fall one under the other instead of sharing a cramped row. */
          .nb1-cpg-head {
            flex-direction: column;
            gap: 14px;
          }
          .nb1-cpg-head-ath {
            padding-top: 0;
            white-space: normal;
          }
        }
      `}</style>

      <div className="nb1-cpg-band">
      <div className="nb1-cpg-inner">
        {(sectionTitle || subtitle || athleteSealText) && (
          <div className="nb1-cpg-head">
            <div className="nb1-cpg-head-text">
              {sectionTitle && <div className="nb1-cpg-title">{sectionTitle}</div>}
              {subtitle && <p className="nb1-cpg-sub">{subtitle}</p>}
            </div>
            {athleteSealText && (
              <div className="nb1-cpg-head-ath">
                {athleteImages && athleteImages.length > 0 && (
                  <span className="nb1-cpg-head-faces">
                    {athleteImages.map((a, i) => {
                      const url = imgUrl(a.image)
                      return url ? <img key={i} src={url} alt={a.alt || ''} /> : null
                    })}
                  </span>
                )}
                {athleteSealText}
              </div>
            )}
          </div>
        )}

        {twoCol ? (
          /* Combined Term | Core | Advanced table. rows/rows2 are both sorted
             ascending (1/4/12) by computeRows, so index i aligns the same term
             across both plans. */
          <div className="nb1-cpg-table">
            <div className="nb1-cpg-thead">
              <span />
              <span className="nb1-cpg-th">
                {planName}
                {monthlyNote && <span className="nb1-cpg-monthly-note">{monthlyNote}</span>}
              </span>
              <span className="nb1-cpg-th">
                {planName2}
                {monthlyNote2 && <span className="nb1-cpg-monthly-note">{monthlyNote2}</span>}
              </span>
            </div>
            {rows?.map((row, i) => (
              <div key={i} className={`nb1-cpg-trow${row.isBestValue ? ' best' : ''}`}>
                <span className="nb1-cpg-term">
                  {row.months}
                  {row.isBestValue && row.bestValueLabel && (
                    <span className="nb1-cpg-best-tag">{row.bestValueLabel}</span>
                  )}
                </span>
                <span className="nb1-cpg-cell">
                  {row.rate}
                  <small> {perMonth}</small>
                </span>
                <span className="nb1-cpg-cell">
                  {rows2?.[i]?.rate}
                  <small> {perMonth}</small>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="nb1-cpg-grid">
            <div className="nb1-cpg-col">
              {planName && (
                <div className="nb1-cpg-col-name">
                  {planName}
                  {monthlyNote && <span className="nb1-cpg-monthly-note">{monthlyNote}</span>}
                </div>
              )}
              {rows?.map((row, i) => (
                <div key={i} className={`nb1-cpg-row${row.isBestValue ? ' best' : ''}`}>
                  <span className="nb1-cpg-len">
                    {row.months}
                    {row.isBestValue && row.bestValueLabel && (
                      <span className="nb1-cpg-best-tag">{row.bestValueLabel}</span>
                    )}
                  </span>
                  <span className="nb1-cpg-rate">{row.rate}<small> {perMonth}</small></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {footerNote && (
          <div className="nb1-cpg-foot">
            <RichText data={footerNote} enableGutter={false} enableProse={false} />
          </div>
        )}
      </div>
      </div>

      {twoCol && (ctaText || ctaText2) && (
        <div className="nb1-cpg-below">
          <div className="nb1-cpg-ctas">
            {ctaText && ctaHref && (
              <a href={ctaHref} className="nb1-cpg-cta secondary">{ctaText}</a>
            )}
            {ctaText2 && ctaHref2 && (
              <a href={ctaHref2} className="nb1-cpg-cta primary">{ctaText2}</a>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
