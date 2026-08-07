'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getDictionary } from '@/i18n/getDictionary'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { isUnmodifiedPrimaryNavigation } from '@/lib/interactionTracking'
import { resolvePlanSelectionRate, trackPlanSelectionAndNavigate } from '@/lib/planTracking'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  resolveTokens,
  resolveTokensDeep,
  extractBullets,
} from '@/lib/plans/clientUtils'
import { getStoredPlanSelection, storePlanSelection } from '@/lib/plans/selectionStore'

type Plan = {
  planKey?: 'core' | 'advanced' | null
  isRecommended?: boolean | null
  name?: string | null
  price?: string | null
  strikePrice?: string | null
  minNote?: string | null
  monthlyLinkText?: string | null
  monthlyLinkHref?: string | null
  bullets?: { text?: string | null }[] | null
  ctaText?: string | null
  ctaHref?: string | null
}

type ComparisonRow = {
  label?: string | null
  coreValue?: string | null
  advancedValue?: string | null
  corePositive?: boolean | null
  advancedPositive?: boolean | null
}

type ScienceImage = {
  image?: { url?: string | null } | string | null
  alt?: string | null
}

type Props = {
  sectionTitle?: string | null
  guaranteeItems?: { text?: string | null }[] | null
  plans?: Plan[] | null
  scienceBoardLabel?: string | null
  scienceBoardSub?: string | null
  scienceBoardImages?: ScienceImage[] | null
  showComparison?: boolean | null
  comparisonRows?: ComparisonRow[] | null
  locale?: string
}

function parseGuaranteeText(text: string) {
  const match = text.match(/^\*\*(.+?)\*\*(.*)$/)
  if (match) return <><strong>{match[1]}</strong>{match[2]}</>
  return <>{text}</>
}

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="#0a8fb0" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
    <path d="M3 8l3 3 7-7" />
  </svg>
)

export const PlanSelectorClient: React.FC<Props> = ({
  sectionTitle,
  guaranteeItems,
  plans: plansProp,
  scienceBoardLabel,
  scienceBoardSub,
  scienceBoardImages,
  showComparison,
  comparisonRows: comparisonRowsProp,
  locale = 'en',
}) => {
  const dict = getDictionary(locale)
  const rateMapRef = useRef<Record<string, number>>({})
  const currencyRef = useRef<string>('EUR')
  const planTitlesRef = useRef<Record<string, string>>({})
  const [plans, setPlans] = useState<Plan[]>(plansProp ?? [])
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[] | null | undefined>(comparisonRowsProp)
  const [selectedKey, setSelectedKey] = useState<string>(
    plansProp?.find(p => p.isRecommended)?.planKey ?? plansProp?.[1]?.planKey ?? 'advanced'
  )
  const [cmpOpen, setCmpOpen] = useState(false)

  // Captured during the first render, BEFORE the effect below writes the
  // default to storage — otherwise the visitor's earlier selection is lost.
  const [storedPlanAtMount] = useState(() => getStoredPlanSelection().plan)

  // Restore the funnel selection (e.g. coming back from checkout via "Edit
  // plan"); post-mount so SSR markup and hydration stay identical.
  useEffect(() => {
    if (storedPlanAtMount && plansProp?.some((p) => p.planKey === storedPlanAtMount)) {
      setSelectedKey(storedPlanAtMount)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nb1:planselected', { detail: { key: selectedKey } }))
    storePlanSelection({ plan: selectedKey })
  }, [selectedKey])

  useEffect(() => {
    const onSelectPlan = (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail?.key
      if (key) setSelectedKey(key)
    }
    window.addEventListener('nb1:selectplan', onSelectPlan)
    return () => window.removeEventListener('nb1:selectplan', onSelectPlan)
  }, [])

  useEffect(() => {
    if (!plansProp?.length) return

    function applyPrices(currency: ReturnType<typeof getClientCurrency>, apiPlans: Awaited<ReturnType<typeof fetchPlansClient>>) {
      const rateMap = buildRateMap(apiPlans, currency)
      rateMapRef.current = rateMap
      currencyRef.current = currency
      apiPlans.forEach(p => { planTitlesRef.current[p.title.toLowerCase()] = p.title })
      setPlans(
        plansProp!.map((plan) => {
          const family = plan.planKey === 'advanced' ? 'advanced' : 'core'
          // Headline shows the 1-month standard price (€99 / €149), not the 4-month
          // discount rate — longer-term discounts live at the cycle step.
          const rate = rateMap[`${family}:1`]
          const apiBullets = extractBullets(apiPlans, family, locale)
          return {
            ...plan,
            price: rate != null ? formatPrice(rate, currency, locale) : plan.price,
            strikePrice: resolveTokens(plan.strikePrice, rateMap, currency, locale) ?? plan.strikePrice,
            minNote: resolveTokens(plan.minNote, rateMap, currency, locale) ?? plan.minNote,
            monthlyLinkText: resolveTokens(plan.monthlyLinkText, rateMap, currency, locale) ?? plan.monthlyLinkText,
            bullets: apiBullets.length > 0
              ? apiBullets.map((text) => ({ text }))
              : plan.bullets,
          }
        }),
      )
      setComparisonRows(resolveTokensDeep(comparisonRowsProp, rateMap, currency, locale))
    }

    const currency = getClientCurrency(locale)
    fetchPlansClient().then((apiPlans) => applyPrices(currency, apiPlans)).catch(() => {})

    const onCurrencyChange = (e: Event) => {
      const cur = (e as CustomEvent<string>).detail as ReturnType<typeof getClientCurrency>
      fetchPlansClient().then((apiPlans) => applyPrices(cur, apiPlans)).catch(() => {})
    }
    window.addEventListener('nb1:currencychange', onCurrencyChange)
    return () => window.removeEventListener('nb1:currencychange', onCurrencyChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  if (!plans?.length) return null

  return (
    <section className="nb1-ps-sec">
      <style jsx>{`
        .nb1-ps-sec {
          padding: 0 0 40px;
        }
        .nb1-ps-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 28px 0;
        }
        .nb1-ps-head {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.4vw, 30px);
          letter-spacing: -0.02em;
          color: #12314d;
          margin-bottom: 20px;
        }
        .nb1-ps-guarantee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 16px 20px;
          margin-bottom: 22px;
          flex-wrap: wrap;
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 12px;
        }
        .nb1-ps-gi {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-ps-gi :global(strong) { color: #0e2740; font-weight: 600; }
        .nb1-ps-gdiv {
          width: 1px;
          height: 22px;
          background: rgba(18, 49, 77, 0.1);
          flex-shrink: 0;
        }
        .nb1-ps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: stretch;
        }
        .nb1-ps-card {
          position: relative;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 28px 26px;
          background: #fff;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .nb1-ps-card:hover {
          transform: translateY(-2px);
        }
        .nb1-ps-card.recommended {
          border-color: rgba(10, 143, 176, 0.4);
          box-shadow: 0 18px 44px -28px rgba(10, 143, 176, 0.4);
        }
        .nb1-ps-card.selected {
          border-color: #12314d;
        }
        .nb1-ps-badge {
          position: absolute;
          top: -10px;
          left: 26px;
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0e2740;
          background: #c6ff5b;
          padding: 5px 11px;
          border-radius: 100px;
        }
        .nb1-ps-radio {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid rgba(18, 49, 77, 0.1);
          background: #fff;
          transition: all 0.18s;
          pointer-events: none;
        }
        .nb1-ps-card.selected .nb1-ps-radio {
          border-color: #c6ff5b;
          background: #c6ff5b;
        }
        .nb1-ps-card.selected .nb1-ps-radio::after {
          content: '✓';
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #0e2740;
        }
        .nb1-ps-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
        }
        .nb1-ps-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 14px;
        }
        .nb1-ps-price {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 44px;
          letter-spacing: -0.03em;
          line-height: 1;
          color: #12314d;
        }
        .nb1-ps-strike {
          font-size: 18px;
          color: rgba(18, 49, 77, 0.4);
          text-decoration: line-through;
        }
        .nb1-ps-per {
          font-size: 14px;
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-ps-min {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 8px;
        }
        .nb1-ps-monthly {
          display: inline-flex;
          align-items: center;
          font-size: 13px;
          font-weight: 400;
          color: #0a8fb0;
          margin-top: 10px;
          text-decoration: none;
          cursor: default;
        }
        .nb1-ps-monthly-ghost { visibility: hidden; }
        .nb1-ps-bullets {
          list-style: none;
          margin: 18px 0 22px;
          padding-top: 18px;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .nb1-ps-bullets li {
          position: relative;
          padding-left: 24px;
          font-size: 14px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.45;
        }
        .nb1-ps-bullets li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #0a8fb0;
          font-weight: 700;
        }
        .nb1-ps-cta {
          display: block;
          border-radius: 100px;
          padding: 13px 20px;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          text-decoration: none;
          transition: transform 0.18s, background 0.18s, border-color 0.18s;
        }
        .nb1-ps-cta:hover { transform: translateY(-1px); }
        .nb1-ps-cta.advanced {
          background: #c6ff5b;
          color: #0e2740;
        }
        .nb1-ps-cta.advanced:hover { background: #aaea42; }
        .nb1-ps-cta.core {
          background: transparent;
          color: #12314d;
          border: 1.5px solid rgba(18, 49, 77, 0.2);
        }
        .nb1-ps-cta.core:hover { border-color: #12314d; }

        /* Comparison toggle */
        .nb1-cmp-wrap {
          max-width: 760px;
          margin: 30px auto 0;
        }
        .nb1-cmp-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 0 auto;
          min-width: 330px;
          background: linear-gradient(180deg, rgba(10,143,176,0.10) 0%, rgba(10,143,176,0.035) 100%);
          border: 1.5px solid rgba(10, 143, 176, 0.2);
          border-radius: 14px;
          padding: 15px 26px;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #0a8fb0;
          cursor: pointer;
          transition: background 0.18s, border-color 0.15s;
        }
        .nb1-cmp-toggle:hover {
          background: linear-gradient(180deg, rgba(10,143,176,0.16) 0%, rgba(10,143,176,0.07) 100%);
          border-color: rgba(10, 143, 176, 0.42);
        }
        .nb1-cmp-arr {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0a8fb0;
          color: #fff;
          flex-shrink: 0;
          transition: transform 0.25s;
        }
        .nb1-cmp-arr.open { transform: rotate(180deg); }
        .nb1-cmp-body {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nb1-cmp-body.open { max-height: 1200px; }
        .nb1-cmp-inner { padding-top: 28px; }
        .nb1-comp {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        .nb1-comp th,
        .nb1-comp td {
          text-align: left;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(18, 49, 77, 0.07);
          font-size: 14px;
          color: #12314d;
        }
        .nb1-comp thead th {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #12314d;
          color: #12314d;
        }
        .nb1-comp .col-plan {
          text-align: center;
          width: 150px;
        }
        .nb1-comp .col-adv {
          background: rgba(10, 143, 176, 0.08);
        }
        .nb1-comp thead .col-adv {
          color: #0a8fb0;
          border-radius: 10px 10px 0 0;
        }
        .nb1-comp .row-section td {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a8fb0;
          padding-top: 22px;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-comp .val-yes {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-comp .val-no { color: rgba(18, 49, 77, 0.4); }

        /* Science board badge */
        .nb1-sb-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          max-width: 540px;
          margin: 0 auto 22px;
          padding-top: 26px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-sb-faces {
          display: inline-flex;
          flex-shrink: 0;
        }
        .nb1-sb-faces img {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 2px solid #fff;
          margin-left: -12px;
          box-shadow: 0 2px 8px rgba(18, 49, 77, 0.18);
        }
        .nb1-sb-faces img:first-child { margin-left: 0; }
        .nb1-sb-text {}
        .nb1-sb-label {
          font-size: 14px;
          font-weight: 600;
          color: #12314d;
        }
        .nb1-sb-sub {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 2px;
        }

        @media (max-width: 720px) {
          .nb1-ps-grid { grid-template-columns: 1fr; }
          .nb1-ps-gdiv { display: none; }
        }
        @media (max-width: 560px) {
          .nb1-ps-guarantee { gap: 12px 16px; padding: 14px 16px; justify-content: flex-start; }
          .nb1-ps-card { padding: 26px 22px; }
          .nb1-comp th, .nb1-comp td { padding: 11px 8px; font-size: 12.5px; }
          .nb1-comp .col-plan { width: 72px; }
        }
      `}</style>

      <div className="nb1-ps-con">
        {sectionTitle && <div className="nb1-ps-head">{sectionTitle}</div>}

        {guaranteeItems && guaranteeItems.length > 0 && (
          <div className="nb1-ps-guarantee">
            {guaranteeItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="nb1-ps-gdiv" />}
                <div className="nb1-ps-gi">
                  <CheckIcon />
                  <div>{item.text ? parseGuaranteeText(item.text) : null}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="nb1-ps-grid">
          {plans.map((plan, i) => {
            const key = plan.planKey ?? 'core'
            const isSelected = selectedKey === key
            const isRec = !!plan.isRecommended
            return (
              <div
                key={i}
                className={`nb1-ps-card${isRec ? ' recommended' : ''}${isSelected ? ' selected' : ''}`}
                onClick={() => setSelectedKey(key)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedKey(key) }}
              >
                <span className="nb1-ps-radio" aria-hidden="true" />
                {isRec && <span className="nb1-ps-badge">Most informed</span>}

                <div className="nb1-ps-name">{plan.name}</div>

                <div className="nb1-ps-price-row">
                  <span className="nb1-ps-price">{plan.price}</span>
                  {plan.strikePrice && <span className="nb1-ps-strike">{plan.strikePrice}</span>}
                  <span className="nb1-ps-per">{dict.plans.perMonth}</span>
                </div>

                {plan.minNote && <div className="nb1-ps-min">{plan.minNote}</div>}

                {/* Monthly option hidden with the 1-month-standard model — 1 month is
                    now the €99 standard, so the "pay monthly €109" upsell has no job.
                    The ghost spacer is dropped too (both cards lose the line equally). */}

                {plan.bullets && plan.bullets.length > 0 && (
                  <ul className="nb1-ps-bullets">
                    {plan.bullets.map((b, j) => b.text && <li key={j}>{b.text}</li>)}
                  </ul>
                )}

                <a
                  href={plan.ctaHref ?? '#'}
                  className={`nb1-ps-cta ${key}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isUnmodifiedPrimaryNavigation(e)) return
                    const href = plan.ctaHref ?? ''
                    const { rate } = resolvePlanSelectionRate(
                      rateMapRef.current,
                      key,
                      href,
                      window.location.href,
                    )
                    if (!href || rate <= 0) return
                    e.preventDefault()
                    trackPlanSelectionAndNavigate({
                      href,
                      planKey: key,
                      rate,
                      currency: currencyRef.current,
                      planTitle: planTitlesRef.current[key],
                    })
                  }}
                >
                  {plan.ctaText}
                </a>
              </div>
            )
          })}
        </div>

        {showComparison && comparisonRows && comparisonRows.length > 0 && (
          <div className="nb1-cmp-wrap">
            <button
              type="button"
              className="nb1-cmp-toggle"
              onClick={() => setCmpOpen(o => !o)}
              aria-expanded={cmpOpen}
            >
              <span>{cmpOpen ? dict.plans.compareHide : dict.plans.compareShow}</span>
              <span className={`nb1-cmp-arr${cmpOpen ? ' open' : ''}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            <div className={`nb1-cmp-body${cmpOpen ? ' open' : ''}`}>
              <div className="nb1-cmp-inner">
                {scienceBoardLabel && (
                  <div className="nb1-sb-badge">
                    {scienceBoardImages && scienceBoardImages.length > 0 && (
                      <span className="nb1-sb-faces">
                        {scienceBoardImages.map((item, i) => {
                          const src = typeof item.image === 'object' && item.image?.url
                            ? getMediaUrl(item.image.url)
                            : null
                          return src ? <img key={i} src={src} alt={item.alt || ''} /> : null
                        })}
                      </span>
                    )}
                    <div className="nb1-sb-text">
                      <div className="nb1-sb-label">{scienceBoardLabel}</div>
                      {scienceBoardSub && <div className="nb1-sb-sub">{scienceBoardSub}</div>}
                    </div>
                  </div>
                )}
                <table className="nb1-comp">
                  <thead>
                    <tr>
                      <th></th>
                      <th className="col-plan">Core</th>
                      <th className="col-plan col-adv">Advanced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => {
                      const isSection = !row.coreValue && !row.advancedValue
                      if (isSection) {
                        return (
                          <tr key={i} className="row-section">
                            <td colSpan={3}>{row.label}</td>
                          </tr>
                        )
                      }
                      return (
                        <tr key={i}>
                          <td>{row.label}</td>
                          <td className={`col-plan${row.corePositive ? ' val-yes' : row.coreValue === '—' ? ' val-no' : ''}`}>
                            {row.coreValue}
                          </td>
                          <td className={`col-plan col-adv${row.advancedPositive ? ' val-yes' : row.advancedValue === '—' ? ' val-no' : ''}`}>
                            {row.advancedValue}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
