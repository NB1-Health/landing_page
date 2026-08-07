'use client'

import React, { useEffect, useState } from 'react'
import { useReveal } from '../useReveal'
import { getDictionary } from '@/i18n/getDictionary'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  resolveTokens,
  extractBullets,
} from '@/lib/plans/clientUtils'

type Bullet = { text?: string | null }

type Props = {
  sectionTitle?: string | null
  planVariant?: 'core' | 'advanced' | null
  cycleMonth?: 'monthly' | '1' | '4' | '12' | null
  planName?: string | null
  priceNote?: string | null
  switchLinkText?: string | null
  switchLinkHref?: string | null
  bullets?: Bullet[] | null
  primaryCtaText?: string | null
  primaryCtaHref?: string | null
  secondaryCtaText?: string | null
  secondaryCtaHref?: string | null
  ctaSubText?: string | null
  locale?: string
}

export const PlanSummaryCardClient: React.FC<Props> = ({
  sectionTitle,
  planVariant = 'core',
  cycleMonth,
  planName,
  priceNote,
  switchLinkText,
  switchLinkHref,
  bullets: bulletsProp,
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText: rawSecondaryCtaText,
  secondaryCtaHref,
  ctaSubText,
  locale = 'en',
}) => {
  const { ref, revealed } = useReveal()
  const perMonth = getDictionary(locale).plans.perMonth
  const [price, setPrice] = useState<string | null>(null)
  const [primaryCtaPrice, setPrimaryCtaPrice] = useState<string | null>(null)
  const [secondaryCtaText, setSecondaryCtaText] = useState<string | null | undefined>(rawSecondaryCtaText)
  const [bullets, setBullets] = useState<Bullet[]>(bulletsProp ?? [])

  useEffect(() => {
    const family = planVariant === 'advanced' ? 'advanced' : 'core'
    // 'monthly' is the 1-month standard's cycle key everywhere downstream;
    // map it (and a null/blank config) to the month=1 rate. Never fall back to
    // 4 — that would mislabel/mis-price a flexible order as a 4-month commit.
    const month = cycleMonth === 'monthly' ? 1 : Number(cycleMonth) || 1

    function applyPrices(currency: ReturnType<typeof getClientCurrency>, plans: Awaited<ReturnType<typeof fetchPlansClient>>) {
      const rateMap = buildRateMap(plans, currency)
      const rate = rateMap[`${family}:${month}`]
      if (rate != null) {
        const formatted = formatPrice(rate, currency, locale)
        setPrice(formatted)
        setPrimaryCtaPrice(`${formatted}${perMonth}`)
      }
      setSecondaryCtaText(resolveTokens(rawSecondaryCtaText, rateMap, currency, locale))
      const apiBullets = extractBullets(plans, family, locale)
      if (apiBullets.length > 0) setBullets(apiBullets.map((text) => ({ text })))
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
  }, [planVariant, cycleMonth, locale])

  return (
    <div ref={ref} className={`nb1-psc-sec${revealed ? ' nb1-in' : ''}`}>
      <style jsx>{`
        .nb1-psc-sec {
          padding: 16px 0 0;
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .nb1-psc-sec.nb1-in {
          opacity: 1;
          transform: translateY(0);
        }
        .nb1-psc-con {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 28px;
        }
        .nb1-psc-plan {
          border: 1px solid #0a8fb0;
          border-radius: 18px;
          padding: 30px 32px;
          background: #fff;
          box-shadow: 0 18px 44px -30px rgba(10, 143, 176, 0.4);
          display: flex;
          flex-direction: column;
        }
        .nb1-psc-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .nb1-psc-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
        }
        .nb1-psc-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: 14px;
        }
        .nb1-psc-price {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 44px;
          letter-spacing: -0.03em;
          line-height: 1;
          color: #12314d;
        }
        .nb1-psc-per {
          font-size: 14px;
          color: rgba(18, 49, 77, 0.55);
        }
        .nb1-psc-note {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 8px;
        }
        .nb1-psc-switch {
          flex: none;
          font-size: 13px;
          color: #0a8fb0;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s;
          white-space: nowrap;
          margin-top: 4px;
          text-decoration: none;
        }
        .nb1-psc-switch:hover {
          border-bottom-color: #0a8fb0;
        }
        .nb1-psc-section-title {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.4vw, 30px);
          letter-spacing: -0.02em;
          color: #12314d;
          margin-bottom: 24px;
        }
        .nb1-psc-lower {
          display: grid;
          grid-template-columns: 1fr minmax(280px, 340px);
          gap: 40px;
          align-items: center;
          padding-top: 22px;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          margin-top: 20px;
        }
        .nb1-psc-bullets {
          list-style: none;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }
        .nb1-psc-bullets li {
          position: relative;
          padding-left: 24px;
          font-size: 14px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.45;
        }
        .nb1-psc-bullets li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #0a8fb0;
          font-weight: 700;
        }
        .nb1-psc-ctas {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nb1-psc-primary {
          display: block;
          border-radius: 100px;
          padding: 13px 20px;
          font-weight: 600;
          font-size: 14px;
          background: #c6ff5b;
          color: #0e2740;
          text-decoration: none;
          transition: transform 0.18s, background 0.18s;
        }
        .nb1-psc-primary:hover {
          background: #aaea42;
          transform: translateY(-1px);
        }
        .nb1-psc-cta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .nb1-psc-cta-price {
          opacity: 0.85;
          font-weight: 500;
        }
        .nb1-psc-paylink {
          display: block;
          text-align: center;
          margin-top: 10px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(18, 49, 77, 0.55);
          text-decoration: none;
          transition: color 0.15s;
        }
        .nb1-psc-paylink:hover {
          color: #12314d;
          text-decoration: underline;
        }
        .nb1-psc-sub {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.4);
          text-align: center;
          margin-top: 4px;
        }
        @media (max-width: 720px) {
          .nb1-psc-plan { padding: 26px 22px; }
          /* Stack the plan name/price and the switch link on mobile so
             "Looking at … instead?" drops onto its own line under the plan
             instead of overflowing off the right edge. */
          .nb1-psc-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .nb1-psc-switch { white-space: normal; margin-top: 0; }
          .nb1-psc-lower { grid-template-columns: 1fr; gap: 22px; }
          /* On mobile stack the CTA label above its price, both centered,
             instead of pushing them to opposite ends of the button. */
          .nb1-psc-cta-row {
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
          }
        }
      `}</style>

      <div className="nb1-psc-con">
        {sectionTitle && <div className="nb1-psc-section-title">{sectionTitle}</div>}
        <div className="nb1-psc-plan">
          <div className="nb1-psc-top">
            <div>
              {planName && <div className="nb1-psc-name">{planName}</div>}
              {price && (
                <div className="nb1-psc-price-row">
                  <span className="nb1-psc-price">{price}</span>
                  <span className="nb1-psc-per">{perMonth}</span>
                </div>
              )}
              {priceNote && <div className="nb1-psc-note">{priceNote}</div>}
            </div>
            {switchLinkText && switchLinkHref && (
              <a href={switchLinkHref} className="nb1-psc-switch">{switchLinkText}</a>
            )}
          </div>

          <div className="nb1-psc-lower">
            {bullets && bullets.length > 0 && (
              <ul className="nb1-psc-bullets">
                {bullets.map((b, i) => b.text && <li key={i}>{b.text}</li>)}
              </ul>
            )}
            <div className="nb1-psc-ctas">
              {primaryCtaHref && primaryCtaText && (
                <a href={primaryCtaHref} className="nb1-psc-primary">
                  <span className="nb1-psc-cta-row">
                    <span>{primaryCtaText}</span>
                    {primaryCtaPrice && <span className="nb1-psc-cta-price">{primaryCtaPrice}</span>}
                  </span>
                </a>
              )}
              {secondaryCtaText && secondaryCtaHref && (
                <a href={secondaryCtaHref} className="nb1-psc-paylink">{secondaryCtaText}</a>
              )}
              {ctaSubText && <div className="nb1-psc-sub">{ctaSubText}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
