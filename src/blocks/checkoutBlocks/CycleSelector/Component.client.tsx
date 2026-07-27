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
const IDX_TO_CYCLE = ['4', '8', '12'] as const

type Tier = {
  months?: string | null
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
  showMonthlyOption?: boolean | null
  monthlyRate?: string | null
  monthlyCheckoutHref?: string | null
  yourPlanLabel?: string | null
  bestValueLabel?: string | null
  preferFlexibleLabel?: string | null
  chooseFlexiblePrefix?: string | null
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
  showMonthlyOption,
  monthlyRate,
  monthlyCheckoutHref,
  yourPlanLabel,
  bestValueLabel,
  preferFlexibleLabel,
  chooseFlexiblePrefix,
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
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [monthlySelected, setMonthlySelected] = useState(false)
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
    if (idx >= 0 && idx < (tiersProp?.length ?? IDX_TO_CYCLE.length)) setSelectedIdx(idx)
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
        .filter((p) => p.title === family && [4, 8, 12].includes(p.month))
        .sort((a, b) => a.month - b.month)
      const baselineRate = rateMap[`${planKey}:4`] ?? 0
      setTiers(
        familyPlans.map((p) => {
          const rate = rateMap[`${planKey}:${p.month}`] ?? 0
          const savings = computeSavings(rate, baselineRate, p.month)
          return {
            months: formatMonthLabel(p.month, locale),
            monthlyRate: formatPrice(rate, currency, locale),
            saveLabel: formatSavingsLabel(savings, currency, locale),
            isBestValue: p.is_preferred,
            checkoutHref: `${checkoutBasePath ?? `/${locale}/order-details`}?plan=${planKey}&cycle=${p.month}`,
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

  const activeTier = monthlySelected ? null : activeTiers?.[selectedIdx]
  const activeRate = monthlySelected ? monthlyRate : activeTier?.monthlyRate
  const activeHref = monthlySelected
    ? (monthlyCheckoutHref ?? '#')
    : (activeTier?.checkoutHref ?? '#')
  const activeLabel = monthlySelected
    ? (preferFlexibleLabel ?? 'Flexible monthly')
    : (activeTier?.months ?? '')

  const selectTier = (idx: number) => {
    setSelectedIdx(idx)
    setMonthlySelected(false)
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

        /* Tier cards */
        .nb1-cs-boxes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .nb1-cs-box {
          position: relative;
          background: #fff;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          border-radius: 14px;
          padding: 24px 20px 20px;
          text-align: left;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 5px;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        .nb1-cs-box:hover {
          border-color: rgba(10, 143, 176, 0.22);
        }
        .nb1-cs-box.on {
          border-color: #0a8fb0;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .nb1-cs-tag {
          position: absolute;
          top: -9px;
          left: 18px;
          white-space: nowrap;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0e2740;
          background: #c6ff5b;
          border-radius: 100px;
          padding: 3px 9px;
        }
        .nb1-cs-dur {
          font-size: 13px;
          font-weight: 600;
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-cs-rate {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 32px;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #12314d;
        }
        .nb1-cs-rate i {
          font-style: normal;
          font-size: 13px;
          color: rgba(18, 49, 77, 0.4);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
        }
        .nb1-cs-save {
          font-size: 12px;
          font-weight: 600;
          color: rgba(18, 49, 77, 0.4);
          min-height: 16px;
        }
        .nb1-cs-save.has-save {
          color: #0a8fb0;
        }

        /* Monthly option */
        .nb1-cs-monthly {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: none;
          border: none;
          padding: 8px 2px;
          margin-top: 16px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          text-align: left;
          transition: color 0.15s;
        }
        .nb1-cs-monthly:hover {
          color: #0a8fb0;
        }
        .nb1-cs-monthly.on {
          color: #0a8fb0;
          font-weight: 600;
        }
        .nb1-cs-ml {
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(18, 49, 77, 0.1);
        }
        .nb1-cs-monthly:hover .nb1-cs-ml,
        .nb1-cs-monthly.on .nb1-cs-ml {
          text-decoration-color: #0a8fb0;
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
          .nb1-cs-boxes {
            grid-template-columns: 1fr;
          }
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

        {/* Tier boxes */}
        {activeTiers && activeTiers.length > 0 && (
          <div className="nb1-cs-boxes">
            {activeTiers.map((tier, i) => (
              <button
                key={i}
                type="button"
                className={`nb1-cs-box${!monthlySelected && selectedIdx === i ? ' on' : ''}`}
                onClick={() => selectTier(i)}
              >
                {tier.isBestValue && (
                  <span className="nb1-cs-tag">{bestValueLabel ?? 'Best value'}</span>
                )}
                <span className="nb1-cs-dur">{tier.months}</span>
                <span className="nb1-cs-rate">
                  {tier.monthlyRate}
                  <i>{perMonth}</i>
                </span>
                <span className={`nb1-cs-save${tier.saveLabel ? ' has-save' : ''}`}>
                  {tier.saveLabel ?? ' '}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Monthly flexible option */}
        {showMonthlyOption && monthlyRate && (
          <button
            type="button"
            className={`nb1-cs-monthly${monthlySelected ? ' on' : ''}`}
            onClick={() => {
              setMonthlySelected(true)
              storePlanSelection({ plan: planFamily ?? undefined, cycle: 'monthly' })
              if (monthlyCheckoutHref) window.location.href = monthlyCheckoutHref
            }}
          >
            {preferFlexibleLabel ?? 'Prefer to stay flexible?'}{' '}
            <span className="nb1-cs-ml">
              {chooseFlexiblePrefix ?? 'Choose Flexible monthly ·'} {monthlyRate}
              {perMonth}
            </span>
          </button>
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
            {monthlySelected
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
              const rate = rateMapRef.current[`${planKey}:${cycleKey}`]
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
