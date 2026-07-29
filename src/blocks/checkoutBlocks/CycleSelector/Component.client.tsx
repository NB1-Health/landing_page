'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getDictionary } from '@/i18n/getDictionary'
import { useReveal } from '../useReveal'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  formatMonthLabel,
  formatSavingsLabel,
  computeSavings,
} from '@/lib/plans/clientUtils'
import {
  buildNb1Item,
  getOrCreateCheckoutId,
  mintEventId,
  pushEventAndNavigate,
} from '@/lib/dataLayer'
import { isUnmodifiedPrimaryNavigation } from '@/lib/interactionTracking'
import { sendMetaCapiEvent } from '@/lib/meta/browser'
import { getStoredPlanSelection, storePlanSelection } from '@/lib/plans/selectionStore'

// Tiers are always rendered in ascending 4/8/12 order (CMS seed and the API
// path both sort that way), so tier index ↔ cycle key maps 1:1.
// The 1-month tier is keyed as the literal string 'monthly' everywhere
// downstream (selectionStore's VALID_CYCLES allowlist, CheckoutForm's price/
// label lookups) — never the numeric '1'. Keep that convention here too.
const IDX_TO_CYCLE = ['monthly', '4', '12'] as const

type Tier = {
  months?: string | null
  /** Raw month number (1, 4, 12) — used to build tab-subtitle text like "4 or 12 months". */
  month?: number
  monthlyRate?: string | null
  saveLabel?: string | null
  isBestValue?: boolean | null
  checkoutHref?: string | null
}

type FaqItem = {
  question?: string | null
  answer?: string | null
}

type Props = {
  planName?: string | null
  switchLinkLabel?: string | null
  switchLinkHref?: string | null
  planFamily?: 'core' | 'advanced' | null
  tiers?: Tier[] | null
  yourPlanLabel?: string | null
  bestValueLabel?: string | null
  /** "Flexible" tab label (1-month, the new standard/default tab). */
  flexTabLabel?: string | null
  /** "Commit & save" tab label (4/12-month discount tiers). */
  commitTabLabel?: string | null
  /** Note under the flexible-tab price, e.g. "Standard · cancel anytime, no minimum". */
  flexNoteLabel?: string | null
  continuePrefix?: string | null
  cancelAnytimeLabel?: string | null
  billedMonthlyShortLabel?: string | null
  guaranteeItems?: { text?: string | null }[] | null
  faqTitle?: string | null
  faqItems?: FaqItem[] | null
  locale?: string
  /** Locale-correct path of the order-details page, e.g. /de/bestellen-details */
  checkoutBasePath?: string | null
}

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    width={15}
    height={15}
    fill="none"
    stroke="#0a8fb0"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ flexShrink: 0 }}
  >
    <path d="M3 8l3 3 7-7" />
  </svg>
)

export const CycleSelectorClient: React.FC<Props> = ({
  planName,
  switchLinkLabel,
  switchLinkHref,
  planFamily,
  tiers: tiersProp,
  yourPlanLabel,
  bestValueLabel,
  flexTabLabel,
  commitTabLabel,
  flexNoteLabel,
  continuePrefix,
  cancelAnytimeLabel,
  billedMonthlyShortLabel,
  guaranteeItems,
  faqTitle,
  faqItems,
  locale = 'en',
  checkoutBasePath,
}) => {
  const { ref, revealed } = useReveal()
  const dict = getDictionary(locale)
  const perMonth = dict.plans.perMonth
  // Tiers are sorted ascending by month (1, 4, 12), so index 0 is always the
  // 1-month "Flexible" tier (the new standard/default) and indices 1-2 are
  // the "Commit & save" discount tiers. commitIdx remembers which commit row
  // was last chosen so switching tabs back and forth doesn't lose it.
  const [activeTab, setActiveTab] = useState<'flex' | 'commit'>('flex')
  const [commitIdx, setCommitIdx] = useState(1)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [tiers, setTiers] = useState<Tier[]>(tiersProp ?? [])
  const currencyRef = useRef<string>('EUR')
  const rateMapRef = useRef<Record<string, number>>({})
  const planTitleRef = useRef<string>('Core')

  // Being on this family's cycle page IS selecting that family (pages are
  // per-family); also restore the previously chosen duration so coming back
  // from checkout doesn't silently reset to 4 months. Post-mount to keep SSR
  // markup and hydration identical.
  useEffect(() => {
    storePlanSelection({ plan: planFamily ?? undefined })
    const storedCycle = getStoredPlanSelection().cycle
    const idx = storedCycle ? IDX_TO_CYCLE.indexOf(storedCycle as (typeof IDX_TO_CYCLE)[number]) : -1
    // idx 0 ('monthly') keeps the default flex tab; only a stored 4/12 pulls
    // the visitor back into the commit tab on that specific tier.
    if (idx === 1 || idx === 2) {
      setActiveTab('commit')
      setCommitIdx(idx)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!planFamily) return
    const family = planFamily === 'advanced' ? 'Advanced' : 'Core'
    const planKey = planFamily

    function applyPrices(
      currency: ReturnType<typeof getClientCurrency>,
      plans: Awaited<ReturnType<typeof fetchPlansClient>>,
    ) {
      const rateMap = buildRateMap(plans, currency)
      rateMapRef.current = rateMap
      currencyRef.current = currency
      planTitleRef.current =
        plans.find((p) => p.title.toLowerCase() === planFamily)?.title ?? family
      const familyPlans = plans
        .filter((p) => p.title === family && [1, 4, 12].includes(p.month))
        .sort((a, b) => a.month - b.month)
      // Savings anchor to the 1-month standard rate (the new baseline), so the
      // commit tiers read "save €20 / €120 per cycle" vs month-to-month — not
      // vs the old 4-month rate. Mirrors BASELINE_MONTH=1 in lib/plans/api.ts.
      const baselineRate = rateMap[`${planKey}:1`] ?? 0
      setTiers(
        familyPlans.map((p) => {
          const rate = rateMap[`${planKey}:${p.month}`] ?? 0
          const savings = computeSavings(rate, baselineRate, p.month)
          return {
            months: formatMonthLabel(p.month, locale),
            month: p.month,
            monthlyRate: formatPrice(rate, currency, locale),
            saveLabel: formatSavingsLabel(savings, currency, locale),
            isBestValue: p.is_preferred,
            checkoutHref: `${checkoutBasePath ?? `/${locale}/order-details`}?plan=${planKey}&cycle=${p.month === 1 ? 'monthly' : p.month}`,
          }
        }),
      )
    }

    const currency = getClientCurrency(locale)
    fetchPlansClient()
      .then((plans) => applyPrices(currency, plans))
      .catch(() => {})

    const onCurrencyChange = (e: Event) => {
      const cur = (e as CustomEvent<string>).detail as ReturnType<typeof getClientCurrency>
      fetchPlansClient()
        .then((plans) => applyPrices(cur, plans))
        .catch(() => {})
    }
    window.addEventListener('nb1:currencychange', onCurrencyChange)
    return () => window.removeEventListener('nb1:currencychange', onCurrencyChange)
  }, [planFamily, locale, checkoutBasePath])

  const activeTiers = tiers.length > 0 ? tiers : (tiersProp ?? [])
  const faqAnswerRefs = React.useRef<(HTMLDivElement | null)[]>([])

  const flexTier = activeTiers[0]
  const commitTiers = activeTiers.slice(1)
  const commitSubLabel =
    commitTiers.length === 2
      ? `${commitTiers[0].month} or ${commitTiers[1].month} months`
      : (commitTiers.map((t) => t.months).filter(Boolean).join(', ') || undefined)

  const selectedIdx = activeTab === 'flex' ? 0 : commitIdx
  const activeTier = activeTiers[selectedIdx]
  const activeRate = activeTier?.monthlyRate
  const activeHref = activeTier?.checkoutHref ?? '#'
  const activeLabel = activeTier?.months ?? ''

  const selectFlex = () => {
    setActiveTab('flex')
    storePlanSelection({ plan: planFamily ?? undefined, cycle: 'monthly' })
  }
  const selectCommit = (idx: number = commitIdx) => {
    setActiveTab('commit')
    setCommitIdx(idx)
    storePlanSelection({ plan: planFamily ?? undefined, cycle: IDX_TO_CYCLE[idx] })
  }

  const toggleFaq = (i: number) => {
    const next = openFaq === i ? null : i
    setOpenFaq(next)
    faqAnswerRefs.current.forEach((el, n) => {
      if (!el) return
      el.style.maxHeight = next === n ? `${el.scrollHeight}px` : '0px'
    })
  }

  return (
    <section className="nb1-cs-sec">
      <style jsx>{`
        .nb1-cs-sec {
          padding: 40px 0 40px;
        }
        .nb1-cs-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 28px;
        }

        /* Section header */
        .nb1-cs-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .nb1-cs-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(20px, 2.2vw, 26px);
          letter-spacing: -0.02em;
          color: #12314d;
        }
        .nb1-cs-switch {
          font-size: 13px;
          font-weight: 600;
          color: #0a8fb0;
          text-decoration: none;
          border-bottom: 1px solid rgba(10, 143, 176, 0.25);
          padding-bottom: 2px;
          transition: border-color 0.15s;
        }
        .nb1-cs-switch:hover {
          border-bottom-color: #0a8fb0;
        }

        /* Flexible vs Commit & save tabs — 1 month is the default/standard tab;
           4 & 12 months live as discount rows inside the Commit & save tab. */
        .nb1-cs-tabs {
          display: flex;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        .nb1-cs-tab {
          flex: 1;
          display: flex;
          flex-direction: row;
          align-items: baseline;
          justify-content: center;
          flex-wrap: nowrap;
          gap: 6px;
          border: none;
          border-right: 1px solid rgba(18, 49, 77, 0.1);
          background: #fff;
          cursor: pointer;
          padding: 14px;
          font-family: inherit;
          transition: background 0.18s;
        }
        .nb1-cs-tab:last-child {
          border-right: none;
        }
        .nb1-cs-tab:not(.on):hover {
          background: rgba(18, 49, 77, 0.03);
        }
        .nb1-cs-tab.on {
          background: #12314d;
        }
        .nb1-cs-tab-m {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: #12314d;
          white-space: nowrap;
        }
        .nb1-cs-tab.on .nb1-cs-tab-m {
          color: #fff;
        }
        .nb1-cs-tab-s {
          font-size: 11px;
          color: rgba(18, 49, 77, 0.4);
          white-space: nowrap;
        }
        .nb1-cs-tab.on .nb1-cs-tab-s {
          color: rgba(255, 255, 255, 0.6);
        }

        /* Flexible panel — big standard price, no minimum */
        .nb1-cs-flex {
          text-align: center;
          padding: 22px 0 6px;
        }
        .nb1-cs-flex-big {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 44px;
          letter-spacing: -0.03em;
          color: #12314d;
          line-height: 1;
        }
        .nb1-cs-flex-big i {
          font-style: normal;
          font-size: 16px;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }
        .nb1-cs-flex-note {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 8px;
        }

        /* Commit & save panel — 4/12-month discount rows */
        .nb1-cs-commit {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 16px;
        }
        .nb1-cs-crow {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          background: #fff;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          border-radius: 13px;
          padding: 14px 18px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-cs-crow:hover {
          border-color: rgba(10, 143, 176, 0.22);
        }
        .nb1-cs-crow.on {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .nb1-cs-crow-tl {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .nb1-cs-crow-tl b {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #12314d;
        }
        .nb1-cs-crow-tl span {
          font-size: 11.5px;
          font-weight: 600;
          color: #0a8fb0;
        }
        .nb1-cs-crow-p {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.02em;
          color: #12314d;
        }
        .nb1-cs-crow-p i {
          font-style: normal;
          font-size: 11px;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }
        .nb1-cs-crow-tag {
          position: absolute;
          top: -9px;
          right: 16px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #0e2740;
          background: #c6ff5b;
          border-radius: 100px;
          padding: 3px 9px;
        }

        /* Guarantee strip */
        .nb1-cs-guarantee {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 14px 20px;
          background: rgba(10, 143, 176, 0.08);
          border-radius: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .nb1-cs-gi {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-cs-gi strong {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-cs-gdiv {
          width: 1px;
          height: 22px;
          background: rgba(18, 49, 77, 0.1);
          flex-shrink: 0;
        }

        /* Footer bar */
        .nb1-cs-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-cs-sel {
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
        }
        .nb1-cs-sel b {
          color: #12314d;
          font-weight: 600;
        }
        .nb1-cs-go {
          background: #c6ff5b;
          color: #0e2740;
          border-radius: 100px;
          padding: 14px 28px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.18s;
        }
        .nb1-cs-go:hover {
          background: #aaea42;
        }

        /* FAQ */
        .nb1-cs-faq-wrap {
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          margin-top: 46px;
          padding-top: 46px;
        }
        .nb1-cs-faq {
          max-width: 680px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(20px);
          transition:
            opacity 0.6s ease,
            transform 0.6s ease;
        }
        .nb1-cs-faq.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-cs-faq-h {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 17px;
          letter-spacing: -0.01em;
          color: #12314d;
          margin-bottom: 6px;
          text-align: center;
        }
        .nb1-cs-faq-list {
          margin-top: 14px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-cs-faq-item {
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .nb1-cs-faq-q {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          text-align: left;
          padding: 17px 2px;
          font-size: 14.5px;
          font-weight: 600;
          color: #12314d;
          transition: color 0.15s;
        }
        .nb1-cs-faq-q:hover {
          color: #0a8fb0;
        }
        .nb1-cs-faq-item.open .nb1-cs-faq-q {
          color: #0a8fb0;
        }
        .nb1-cs-faq-ic {
          flex: none;
          width: 18px;
          height: 18px;
          position: relative;
        }
        .nb1-cs-faq-ic::before,
        .nb1-cs-faq-ic::after {
          content: '';
          position: absolute;
          background: rgba(18, 49, 77, 0.4);
          border-radius: 2px;
          transition:
            transform 0.2s,
            opacity 0.2s;
        }
        .nb1-cs-faq-ic::before {
          top: 8px;
          left: 2px;
          right: 2px;
          height: 2px;
        }
        .nb1-cs-faq-ic::after {
          left: 8px;
          top: 2px;
          bottom: 2px;
          width: 2px;
        }
        .nb1-cs-faq-item.open .nb1-cs-faq-ic::after {
          transform: scaleY(0);
          opacity: 0;
        }
        .nb1-cs-faq-item.open .nb1-cs-faq-ic::before {
          background: #0a8fb0;
        }
        .nb1-cs-faq-a {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.25s ease;
        }
        .nb1-cs-faq-a p {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          padding: 0 2px 18px;
          max-width: 600px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .nb1-cs-foot {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }
          .nb1-cs-go {
            text-align: center;
          }
          .nb1-cs-gdiv {
            display: none;
          }
          .nb1-cs-guarantee {
            gap: 12px 16px;
            padding: 14px 16px;
          }
        }
      `}</style>

      <div className="nb1-cs-con">
        {/* Section head */}
        <div className="nb1-cs-head">
          <div className="nb1-cs-title">
            {yourPlanLabel ?? 'Your plan'} · <span>{planName}</span>
          </div>
          {switchLinkLabel && switchLinkHref && (
            <a href={switchLinkHref} className="nb1-cs-switch">
              {switchLinkLabel}
            </a>
          )}
        </div>

        {/* Flexible (1-month, standard) vs Commit & save (4/12-month discounts) */}
        {activeTiers && activeTiers.length > 0 && (
          <>
            <div className="nb1-cs-tabs">
              <button
                type="button"
                className={`nb1-cs-tab${activeTab === 'flex' ? ' on' : ''}`}
                onClick={selectFlex}
              >
                <span className="nb1-cs-tab-m">{flexTabLabel}</span>
                <span className="nb1-cs-tab-s">{flexTier?.months ?? '1 month'}</span>
              </button>
              <button
                type="button"
                className={`nb1-cs-tab${activeTab === 'commit' ? ' on' : ''}`}
                onClick={() => selectCommit()}
              >
                <span className="nb1-cs-tab-m">{commitTabLabel}</span>
                {commitSubLabel && <span className="nb1-cs-tab-s">{commitSubLabel}</span>}
              </button>
            </div>

            {activeTab === 'flex' && flexTier && (
              <div className="nb1-cs-flex">
                <div className="nb1-cs-flex-big">
                  {flexTier.monthlyRate}
                  <i>{perMonth}</i>
                </div>
                <div className="nb1-cs-flex-note">{flexNoteLabel}</div>
              </div>
            )}

            {activeTab === 'commit' && (
              <div className="nb1-cs-commit">
                {commitTiers.map((tier, i) => {
                  const idx = i + 1
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`nb1-cs-crow${commitIdx === idx ? ' on' : ''}`}
                      onClick={() => selectCommit(idx)}
                    >
                      {tier.isBestValue && (
                        <span className="nb1-cs-crow-tag">{bestValueLabel ?? 'Best value'}</span>
                      )}
                      <span className="nb1-cs-crow-tl">
                        <b>{tier.months}</b>
                        {tier.saveLabel && <span>{tier.saveLabel}</span>}
                      </span>
                      <span className="nb1-cs-crow-p">
                        {tier.monthlyRate}
                        <i>{perMonth}</i>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Guarantee strip */}
        <div className="nb1-cs-guarantee">
          {guaranteeItems &&
            guaranteeItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="nb1-cs-gdiv" />}
                {item.text && (
                  <div className="nb1-cs-gi">
                    <CheckIcon />
                    <strong>{item.text}</strong>
                  </div>
                )}
              </React.Fragment>
            ))}
        </div>

        {/* Footer */}
        <div className="nb1-cs-foot">
          <div className="nb1-cs-sel">
            {activeLabel} ·{' '}
            <b>
              {activeRate}
              {perMonth}
            </b>{' '}
            ·{' '}
            {activeTab === 'flex'
              ? (cancelAnytimeLabel ?? 'cancel anytime')
              : (billedMonthlyShortLabel ?? 'billed monthly')}
          </div>
          <a
            href={activeHref}
            className="nb1-cs-go"
            onClick={(event) => {
              if (!isUnmodifiedPrimaryNavigation(event)) return
              const params = new URL(activeHref, window.location.href).searchParams
              const cycleKey = params.get('cycle') ?? '4'
              const planKey = params.get('plan') ?? planFamily ?? 'core'
              // rateMapRef is keyed by the raw month number (see buildRateMap), while
              // the 1-month tier's cycle param/storage key is the string 'monthly'.
              const rateMonthKey = cycleKey === 'monthly' ? '1' : cycleKey
              const rate = rateMapRef.current[`${planKey}:${rateMonthKey}`]
              if (rate != null) {
                event.preventDefault()
                const atcId = mintEventId()
                const atcItem = buildNb1Item(planKey, cycleKey, rate, {
                  planTitle: planTitleRef.current,
                })
                const eventPayload = {
                  event_id: atcId,
                  checkout_id: getOrCreateCheckoutId(),
                  ecommerce: { currency: currencyRef.current, value: rate, items: [atcItem] },
                }
                sendMetaCapiEvent('add_to_cart', atcId, {
                  ecommerce: {
                    currency: currencyRef.current,
                    value: rate,
                    items: [
                      {
                        item_id: atcItem.item_id,
                        item_name: atcItem.item_name,
                        price: atcItem.price,
                        quantity: 1,
                      },
                    ],
                  },
                })
                pushEventAndNavigate('add_to_cart', eventPayload, () =>
                  window.location.assign(activeHref),
                )
              }
            }}
          >
            {continuePrefix ?? 'Continue'} · {activeRate}
            {perMonth} →
          </a>
        </div>

        {/* FAQ */}
        {faqItems && faqItems.length > 0 && (
          <div className="nb1-cs-faq-wrap">
            <div ref={ref} className={`nb1-cs-faq${revealed ? ' nb1-in' : ''}`}>
              {faqTitle && <div className="nb1-cs-faq-h">{faqTitle}</div>}
              <div className="nb1-cs-faq-list">
                {faqItems.map((item, i) => (
                  <div key={i} className={`nb1-cs-faq-item${openFaq === i ? ' open' : ''}`}>
                    <button
                      type="button"
                      className="nb1-cs-faq-q"
                      onClick={() => toggleFaq(i)}
                      aria-expanded={openFaq === i}
                    >
                      <span>{item.question}</span>
                      <span className="nb1-cs-faq-ic" aria-hidden="true" />
                    </button>
                    <div
                      className="nb1-cs-faq-a"
                      ref={(el) => {
                        faqAnswerRefs.current[i] = el
                      }}
                    >
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
