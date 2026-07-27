'use client'

import React, { useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getDictionary } from '@/i18n/getDictionary'
import { isUnmodifiedPrimaryNavigation } from '@/lib/interactionTracking'
import { trackPlanSelectionAndNavigate } from '@/lib/planTracking'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  resolveTokens,
  resolveTokensDeep,
} from '@/lib/plans/clientUtils'

type FeatureItem = { item?: string | null }
type Guarantee = { iconSvg?: string | null; title?: string | null; description?: string | null }

type CompareRow =
  | { group: string }
  | { feat: [string, boolean | string | { v: string; sub: string }, boolean | string | { v: string; sub: string }] }

type Props = {
  heading?: any
  lede?: string | null
  coreLabel?: string | null
  coreDesc?: string | null
  coreMonthly?: string | null
  coreCommit?: string | null
  coreFeaturesLabel?: string | null
  coreFeatures?: FeatureItem[] | null
  coreCtaLabel?: string | null
  coreCtaHref?: string | null
  advBadge?: string | null
  advLabel?: string | null
  advDesc?: string | null
  advCommit?: string | null
  advFeaturesLabel?: string | null
  advFeatures?: FeatureItem[] | null
  advCtaLabel?: string | null
  advCtaHref?: string | null
  guarantees?: Guarantee[] | null
  compareRowsJson?: string | null
  locale?: string
}

function CheckIcon({ on }: { on: boolean }) {
  return on ? (
    <span className="ck on" aria-label="Included">✓</span>
  ) : (
    <span className="ck off" aria-label="Not included">—</span>
  )
}

function CompareCell({ v, adv }: { v: boolean | string | { v: string; sub: string }; adv: boolean }) {
  let inner: React.ReactNode
  if (v === true) inner = <CheckIcon on={true} />
  else if (v === false) inner = <CheckIcon on={false} />
  else if (v && typeof v === 'object') inner = <><span className="val">{v.v}</span><span className="val-sub">{v.sub}</span></>
  else inner = <span className="val">{v as string}</span>
  return <div className={`ccell center${adv ? ' adv' : ''}`}>{inner}</div>
}

export const PlansClient: React.FC<Props> = (props) => {
  const {
    heading, lede,
    coreLabel, coreDesc, coreMonthly: rawCoreMonthly, coreCommit: rawCoreCommit,
    coreFeaturesLabel, coreFeatures, coreCtaLabel, coreCtaHref,
    advBadge, advLabel, advDesc, advCommit: rawAdvCommit,
    advFeaturesLabel, advFeatures, advCtaLabel, advCtaHref,
    guarantees, compareRowsJson: rawCompareRowsJson,
    locale = 'en',
  } = props

  const dict = getDictionary(locale)

  function localize(href: string | null | undefined): string {
    const raw = href || ''
    if (!raw || raw.startsWith('#') || raw.startsWith('http')) return raw || '#'
    if (raw.startsWith(`/${locale}`)) return raw
    return `/${locale}${raw.startsWith('/') ? '' : '/'}${raw}`
  }

  const coreHref = localize(coreCtaHref)
  const advHref = localize(advCtaHref)

  const secRef = useRef<HTMLElement>(null)
  const collapseRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)
  const [visible, setVisible] = useState(false)
  const [corePrice, setCorePrice] = useState<string | null>(null)
  const [advPrice, setAdvPrice] = useState<string | null>(null)
  const coreRateRef = useRef<number | null>(null)
  const advRateRef = useRef<number | null>(null)
  const currencyRef = useRef<string>('EUR')
  const planTitlesRef = useRef<{ core: string; advanced: string }>({ core: 'Core', advanced: 'Advanced' })
  const [coreMonthly, setCoreMonthly] = useState<string | null | undefined>(rawCoreMonthly)
  const [coreCommit, setCoreCommit] = useState<string | null | undefined>(rawCoreCommit)
  const [advCommit, setAdvCommit] = useState<string | null | undefined>(rawAdvCommit)
  const [compareRowsJson, setCompareRowsJson] = useState<string | null | undefined>(rawCompareRowsJson)

  function applyPlans(currency: ReturnType<typeof getClientCurrency>, plans: Awaited<ReturnType<typeof fetchPlansClient>>) {
    const rateMap = buildRateMap(plans, currency)
    const coreRate = rateMap['core:4']
    const advRate = rateMap['advanced:4']
    if (coreRate != null) { setCorePrice(formatPrice(coreRate, currency, locale)); coreRateRef.current = coreRate }
    if (advRate != null) { setAdvPrice(formatPrice(advRate, currency, locale)); advRateRef.current = advRate }
    const coreTitle = plans.find(p => p.title.toLowerCase() === 'core')?.title ?? 'Core'
    const advTitle = plans.find(p => p.title.toLowerCase() === 'advanced')?.title ?? 'Advanced'
    planTitlesRef.current = { core: coreTitle, advanced: advTitle }
    setCoreMonthly(resolveTokens(rawCoreMonthly, rateMap, currency, locale))
    setCoreCommit(resolveTokens(rawCoreCommit, rateMap, currency, locale))
    setAdvCommit(resolveTokens(rawAdvCommit, rateMap, currency, locale))
    setCompareRowsJson(resolveTokensDeep(rawCompareRowsJson, rateMap, currency, locale))
  }

  useEffect(() => {
    const currency = getClientCurrency(locale)
    currencyRef.current = currency
    fetchPlansClient()
      .then((plans) => applyPlans(currency, plans))
      .catch(() => {})

    const onCurrencyChange = (e: Event) => {
      const cur = (e as CustomEvent<string>).detail as ReturnType<typeof getClientCurrency>
      currencyRef.current = cur
      fetchPlansClient()
        .then((plans) => applyPlans(cur, plans))
        .catch(() => {})
    }
    window.addEventListener('nb1:currencychange', onCurrencyChange)
    return () => window.removeEventListener('nb1:currencychange', onCurrencyChange)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const el = collapseRef.current
    if (!el) return
    el.style.maxHeight = compareOpen ? el.scrollHeight + 'px' : '0px'
  }, [compareOpen])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const onScroll = () => {
      const idx = Math.round(grid.scrollLeft / grid.offsetWidth)
      setActiveDot(idx)
    }
    grid.addEventListener('scroll', onScroll, { passive: true })
    return () => grid.removeEventListener('scroll', onScroll)
  }, [])

  let rows: CompareRow[] = []
  if (compareRowsJson) {
    try { rows = JSON.parse(compareRowsJson) } catch (_) {}
  }

  const CHECK_SVG = `<svg viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l3 3 7-8"/></svg>`

  return (
    <>
      <style jsx>{`
        .pl-wrap {
          background: #FAF8F2;
          padding: 96px 30px 80px;
        }
        @media (max-width: 760px) { .pl-wrap { padding: 64px 20px 56px; } }

        .pl-in { max-width: 920px; margin: 0 auto; }

        /* ── Header ── */
        .pl-head {
          text-align: center;
          margin-bottom: 48px;
        }
        .pl-head-title :global(p) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.06;
          letter-spacing: -0.025em;
          color: #12314D;
          margin: 0;
        }
        .pl-head-title :global(em) { font-style: normal; color: #0A8FB0; }
        .pl-lede {
          margin: 14px auto 0;
          font-size: 16px;
          line-height: 1.6;
          color: rgba(18,49,77,.70);
        }

        /* ── Plan cards grid ── */
        .pl-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          align-items: stretch;
        }
        @media (max-width: 860px) {
          .pl-grid {
            display: flex; gap: 14px; overflow-x: auto; overflow-y: hidden;
            scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; margin: 0 -20px; padding: 16px 20px 8px;
            align-items: stretch;
          }
          .pl-grid::-webkit-scrollbar { display: none; }
          .pl-card { flex: 0 0 86%; scroll-snap-align: center; }
        }

        /* ── Card base ── */
        .pl-card {
          position: relative;
          border-radius: 20px;
          padding: 28px;
          transition: transform .25s ease, box-shadow .25s ease;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }
        .pl-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 50px -28px rgba(18,49,77,.34);
        }
        @media (max-width: 860px) { .pl-card:hover { transform: none; } }

        /* Core */
        .pl-card.core {
          background: #fff;
          border: 1px solid rgba(18,49,77,.10);
        }
        /* Advanced */
        .pl-card.adv {
          background: linear-gradient(160deg, #1A3A5C 0%, #0E2740 55%, #081A2B 100%);
          border: 1px solid rgba(255,255,255,.10);
          color: #fff;
        }

        /* Badge */
        .pl-badge {
          position: absolute;
          top: -11px; left: 28px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: #12314D;
          background: #C6FF5B;
          border-radius: 100px;
          padding: 5px 11px;
          white-space: nowrap;
        }

        /* Plan key */
        .pl-key {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 15px; font-weight: 700;
          letter-spacing: .10em; text-transform: uppercase;
          color: #0A8FB0;
        }
        .adv .pl-key { color: #13A6CC; }

        .pl-desc {
          font-size: 14.5px; line-height: 1.5;
          color: rgba(18,49,77,.70);
          margin-top: 10px; min-height: 44px;
        }
        .adv .pl-desc { color: rgba(255,255,255,.62); }

        .pl-price {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 52px; letter-spacing: -0.03em;
          color: #12314D;
          margin: 22px 0 0; line-height: 1;
        }
        .adv .pl-price { color: #fff; }
        .pl-price small {
          font-size: 15px; font-weight: 500;
          color: rgba(18,49,77,.55); letter-spacing: 0;
        }
        .adv .pl-price small { color: rgba(255,255,255,.55); }

        .pl-monthly {
          display: inline-block; align-self: flex-start;
          font-size: 12px; font-weight: 600;
          color: #0A8FB0;
          background: rgba(10,143,176,.08);
          border-radius: 100px;
          padding: 5px 12px; margin-top: 12px;
        }
        .adv .pl-monthly { color: #13A6CC; background: rgba(10,143,176,.16); }

        .pl-commit {
          font-size: 13px; line-height: 1.5;
          color: rgba(18,49,77,.55);
          margin: 10px 0 0; min-height: 38px;
        }
        .adv .pl-commit { color: rgba(255,255,255,.55); }

        .pl-flbl {
          font-size: 11px; font-weight: 700;
          letter-spacing: .10em; text-transform: uppercase;
          color: #0A8FB0;
          margin: 24px 0 0; padding-top: 22px;
          border-top: 1px solid rgba(18,49,77,.10);
        }
        .adv .pl-flbl { color: #13A6CC; border-color: rgba(255,255,255,.14); }

        .pl-list {
          list-style: none; padding: 0; margin: 14px 0 20px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .pl-list li {
          display: flex; align-items: center; gap: 9px;
          font-size: 14px; line-height: 1.4;
          color: rgba(18,49,77,.80);
        }
        .adv .pl-list li { color: rgba(255,255,255,.85); }
        .pl-list li :global(svg) {
          width: 17px; height: 17px; flex-shrink: 0;
          stroke: #0A8FB0;
        }
        .adv .pl-list li :global(svg) { stroke: #13A6CC; }

        .pl-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; margin-top: auto; padding: 14px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 15px; font-weight: 700;
          border-radius: 100px;
          text-decoration: none; cursor: pointer; border: none;
          transition: background .15s ease, border-color .15s ease, transform .15s ease;
        }
        .core .pl-btn {
          background: transparent;
          color: #12314D;
          border: 1px solid rgba(18,49,77,.20);
        }
        .core .pl-btn:hover { border-color: #12314D; }
        .adv .pl-btn {
          background: #C6FF5B;
          color: #12314D;
          border: none;
        }
        .adv .pl-btn:hover { background: #b8f04e; }

        /* ── Mobile dots ── */
        .pl-dots {
          display: none;
          justify-content: center; gap: 8px; margin-top: 20px;
        }
        @media (max-width: 860px) { .pl-dots { display: flex; } }
        .pl-dots span {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(18,49,77,.15);
          display: inline-block;
        }
        .pl-dots span.on { background: #0A8FB0; transform: scale(1.3); }

        /* ── Compare toggle ── */
        .cmp-wrap { max-width: 920px; margin: 34px auto 0; text-align: center; }
        .cmp-toggle {
          display: inline-flex; align-items: center; justify-content: center; gap: 12px;
          margin: 0 auto;
          background: linear-gradient(180deg, rgba(10,143,176,.10) 0%, rgba(10,143,176,.035) 100%);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          border: 1.5px solid rgba(10,143,176,.20);
          border-radius: 14px; padding: 15px 26px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 700; font-size: 15px; color: #0A8FB0;
          cursor: pointer;
          transition: background .18s, border-color .15s;
        }
        .cmp-toggle:hover {
          background: linear-gradient(180deg, rgba(10,143,176,.16) 0%, rgba(10,143,176,.07) 100%);
          border-color: rgba(10,143,176,.42);
        }
        .cmp-arr {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 50%;
          background: #0A8FB0; color: #fff;
          flex-shrink: 0;
          transition: transform .25s;
        }
        .cmp-arr.open { transform: rotate(180deg); }
        .cmp-arr svg { width: 13px; height: 13px; position: relative; top: 1px; }

        .cmp-collapse {
          overflow: hidden; max-height: 0;
          transition: max-height .5s cubic-bezier(.4,0,.2,1);
          text-align: left;
        }
        .cmp-inner { padding-top: 28px; }

        /* ── Table ── */
        .ctable {
          background: #fff;
          border: 1px solid rgba(18,49,77,.10);
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 24px 48px -24px rgba(18,49,77,.14);
        }
        :global(.crow) {
          display: grid;
          grid-template-columns: 1.7fr 1fr 1fr;
          border-bottom: 1px solid rgba(18,49,77,.07);
        }
        :global(.crow:last-child) { border-bottom: none; }
        :global(.ccell) {
          display: flex; align-items: center;
          padding: 15px 22px;
          font-size: 14.5px; color: rgba(18,49,77,.70);
        }
        :global(.ccell.center) {
          justify-content: center; text-align: center;
          flex-direction: column; gap: 3px;
        }
        :global(.ccell.adv) { background: rgba(10,143,176,.05); }

        :global(.crow.chead) { background: #13314c; }
        :global(.crow.chead .ccell) { padding: 22px; }
        :global(.crow.chead .cn) {
          font-size: 12px; text-transform: uppercase;
          letter-spacing: .14em; color: rgba(255,255,255,.55); font-weight: 600;
        }
        :global(.crow.chead .cp) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 24px; font-weight: 600; color: #fff; letter-spacing: -0.02em;
        }
        :global(.crow.chead .cp .sm) { font-size: 13px; color: rgba(255,255,255,.55); font-weight: 500; }
        :global(.crow.chead .ccell.adv) { background: rgba(10,143,176,.28); }
        :global(.crow.chead .ccell.adv .cn) { color: #13A6CC; }

        :global(.crow.grp) { background: #F5F3EE; }
        :global(.crow.grp .ccell) {
          font-size: 11px; text-transform: uppercase;
          letter-spacing: .14em; color: #0A8FB0; font-weight: 700;
          padding: 13px 22px;
        }

        :global(.val) { font-weight: 600; color: #12314D; font-size: 13.5px; }
        :global(.val-sub) { display: block; font-size: 11px; color: #0A8FB0; font-weight: 600; margin-top: 3px; }

        :global(.ck) {
          width: 22px; height: 22px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
        }
        :global(.ck.on) { background: rgba(10,143,176,.12); color: #0A8FB0; }
        :global(.ck.off) { color: rgba(18,49,77,.30); font-size: 14px; }

        :global(.crow.cta .ccell) { padding: 24px 22px; }
        :global(.cbtn) {
          width: 100%; display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 700; font-size: 15px;
          border-radius: 100px; padding: 14px;
          text-decoration: none; border: none; cursor: pointer;
        }
        :global(.cbtn.out) {
          background: transparent; color: #12314D;
          border: 1px solid rgba(18,49,77,.20);
        }
        :global(.cbtn.out:hover) { border-color: #12314D; }
        :global(.cbtn.lime) { background: #C6FF5B; color: #12314D; }
        :global(.cbtn.lime:hover) { background: #b8f04e; }

        @media (max-width: 760px) {
          .cmp-toggle { min-width: 0; }
          :global(.crow) { grid-template-columns: minmax(0,1.5fr) minmax(0,.75fr) minmax(0,.75fr); }
          :global(.ccell) { padding: 13px 12px; font-size: 12.5px; }
          :global(.crow.chead .cp) { font-size: 19px; }
        }
        @media (max-width: 640px) {
          :global(.crow) { grid-template-columns: minmax(0,1.4fr) minmax(0,.8fr) minmax(0,.8fr); }
          :global(.ccell) { padding: 12px 10px; font-size: 12px; }
          :global(.crow.chead .cp) { font-size: 17px; }
          :global(.crow.cta) { display: flex; flex-direction: column; gap: 10px; padding: 16px 14px; }
          :global(.crow.cta .ccell) { padding: 0; }
          :global(.crow.cta .ccell.adv) { background: none; }
          :global(.crow.cta .cbtn) { width: 100%; padding: 14px; font-size: 14px; }
        }

        /* ── Guarantee strip ── */
        .gs-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0; margin: 26px auto 0;
          background: linear-gradient(168deg, rgba(255,255,255,.72), rgba(244,249,251,.62));
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(18,49,77,.10);
          border-radius: 16px; overflow: hidden;
        }
        @media (max-width: 860px) {
          .gs-strip { grid-template-columns: 1fr; }
          .gs-item { border-left: none !important; border-top: 1px solid rgba(18,49,77,.07); }
          .gs-item:first-child { border-top: none; }
        }
        .gs-item {
          display: flex; gap: 13px; align-items: flex-start;
          padding: 22px;
          border-left: 1px solid rgba(18,49,77,.07);
        }
        .gs-item:first-child { border-left: none; }
        .gs-ico {
          width: 34px; height: 34px; flex-shrink: 0;
          border-radius: 9px;
          background: rgba(10,143,176,.10); color: #0A8FB0;
          display: flex; align-items: center; justify-content: center;
        }
        .gs-ico :global(svg) { width: 18px; height: 18px; stroke: #0A8FB0; fill: none; stroke-width: 1.7; }
        .gs-title { font-size: 14px; font-weight: 600; margin: 0; color: #12314D; }
        .gs-desc { font-size: 12.5px; color: rgba(18,49,77,.55); margin-top: 3px; line-height: 1.5; }

        /* ── Scroll-in ── */
        .r-up {
          opacity: 0; transform: translateY(20px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .r-up.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .r-up { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <section ref={secRef} className="pl-wrap" data-screen-label="Plans" id="plans">
        <div className="pl-in">

          {/* Header */}
          <div className={`pl-head r-up${visible ? ' in' : ''}`}>
            {heading && (
              <div className="pl-head-title">
                <RichText data={heading} enableGutter={false} enableProse={false} />
              </div>
            )}
            {lede && <p className="pl-lede">{lede}</p>}
          </div>

          {/* Plan cards */}
          <div ref={gridRef} className={`pl-grid r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.1s' }}>
            {/* Core */}
            <div className="pl-card core">
              <div className="pl-key">{coreLabel || 'Core'}</div>
              {coreDesc && <p className="pl-desc">{coreDesc}</p>}
              {corePrice && (
                <div className="pl-price" dangerouslySetInnerHTML={{ __html: corePrice + '<small> /mo</small>' }} />
              )}
              {coreMonthly && <span className="pl-monthly">{coreMonthly}</span>}
              {coreCommit && <p className="pl-commit">{coreCommit}</p>}
              {coreFeaturesLabel && <div className="pl-flbl">{coreFeaturesLabel}</div>}
              {coreFeatures && coreFeatures.length > 0 && (
                <ul className="pl-list">
                  {coreFeatures.map((f, i) => (
                    <li key={i}>
                      <span dangerouslySetInnerHTML={{ __html: CHECK_SVG }} />
                      {f.item}
                    </li>
                  ))}
                </ul>
              )}
              {coreCtaLabel && (
                <a href={coreHref} className="pl-btn" onClick={(event) => {
                  if (!isUnmodifiedPrimaryNavigation(event)) return
                  if (coreRateRef.current != null) {
                    event.preventDefault()
                    trackPlanSelectionAndNavigate({ href: coreHref, planKey: 'core', rate: coreRateRef.current, currency: currencyRef.current, planTitle: planTitlesRef.current.core })
                  }
                }}>{coreCtaLabel}</a>
              )}
            </div>

            {/* Advanced */}
            <div className="pl-card adv">
              {advBadge && <span className="pl-badge">{advBadge}</span>}
              <div className="pl-key">{advLabel || 'Advanced'}</div>
              {advDesc && <p className="pl-desc">{advDesc}</p>}
              {advPrice && (
                <div className="pl-price" dangerouslySetInnerHTML={{ __html: advPrice + '<small> /mo</small>' }} />
              )}
              <div className="pl-monthly" style={{ visibility: 'hidden' }}>&nbsp;</div>
              {advCommit && <p className="pl-commit">{advCommit}</p>}
              {advFeaturesLabel && <div className="pl-flbl">{advFeaturesLabel}</div>}
              {advFeatures && advFeatures.length > 0 && (
                <ul className="pl-list">
                  {advFeatures.map((f, i) => (
                    <li key={i}>
                      <span dangerouslySetInnerHTML={{ __html: CHECK_SVG }} />
                      {f.item}
                    </li>
                  ))}
                </ul>
              )}
              {advCtaLabel && (
                <a href={advHref} className="pl-btn" onClick={(event) => {
                  if (!isUnmodifiedPrimaryNavigation(event)) return
                  if (advRateRef.current != null) {
                    event.preventDefault()
                    trackPlanSelectionAndNavigate({ href: advHref, planKey: 'advanced', rate: advRateRef.current, currency: currencyRef.current, planTitle: planTitlesRef.current.advanced })
                  }
                }}>{advCtaLabel}</a>
              )}
            </div>
          </div>

          {/* Mobile dots */}
          <div className="pl-dots" aria-hidden="true">
            <span className={activeDot === 0 ? 'on' : ''} /><span className={activeDot === 1 ? 'on' : ''} />
          </div>

          {/* Compare toggle + table */}
          {rows.length > 0 && (
            <div className={`cmp-wrap r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.2s' }}>
              <button
                className="cmp-toggle"
                type="button"
                aria-expanded={compareOpen}
                onClick={() => setCompareOpen(o => !o)}
              >
                <span>{compareOpen ? dict.plans.compareHide : dict.plans.compareShow}</span>
                <span className={`cmp-arr${compareOpen ? ' open' : ''}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>

              <div className="cmp-collapse" ref={collapseRef}>
                <div className="cmp-inner">
                  <div className="ctable">
                    {/* Header row */}
                    <div className="crow chead">
                      <div className="ccell" />
                      <div className="ccell center">
                        <span className="cn">Core</span>
                        <span className="cp">{corePrice || '€99'}<span className="sm"> /mo</span></span>
                      </div>
                      <div className="ccell center adv">
                        <span className="cn">Advanced</span>
                        <span className="cp">{advPrice || '€149'}<span className="sm"> /mo</span></span>
                      </div>
                    </div>

                    {/* Data rows */}
                    {rows.map((r, i) => {
                      if ('group' in r) {
                        return (
                          <div key={i} className="crow grp">
                            <div className="ccell">{r.group}</div>
                            <div className="ccell center" />
                            <div className="ccell center adv" />
                          </div>
                        )
                      }
                      const [label, coreVal, advVal] = r.feat
                      return (
                        <div key={i} className="crow">
                          <div className="ccell">{label}</div>
                          <CompareCell v={coreVal} adv={false} />
                          <CompareCell v={advVal} adv={true} />
                        </div>
                      )
                    })}

                    {/* CTA row */}
                    <div className="crow cta">
                      <div className="ccell" />
                      <div className="ccell center">
                        <a href={coreHref} className="cbtn out" onClick={(event) => {
                          if (!isUnmodifiedPrimaryNavigation(event)) return
                          if (coreRateRef.current != null) {
                            event.preventDefault()
                            trackPlanSelectionAndNavigate({ href: coreHref, planKey: 'core', rate: coreRateRef.current, currency: currencyRef.current, planTitle: planTitlesRef.current.core })
                          }
                        }}>{coreCtaLabel || 'Start with Core'}</a>
                      </div>
                      <div className="ccell center adv">
                        <a href={advHref} className="cbtn lime" onClick={(event) => {
                          if (!isUnmodifiedPrimaryNavigation(event)) return
                          if (advRateRef.current != null) {
                            event.preventDefault()
                            trackPlanSelectionAndNavigate({ href: advHref, planKey: 'advanced', rate: advRateRef.current, currency: currencyRef.current, planTitle: planTitlesRef.current.advanced })
                          }
                        }}>{advCtaLabel || 'Start with Advanced'}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Guarantee strip */}
          {guarantees && guarantees.length > 0 && (
            <div className={`gs-strip r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.3s' }}>
              {guarantees.map((g, i) => (
                <div key={i} className="gs-item">
                  {g.iconSvg && (
                    <div className="gs-ico" dangerouslySetInnerHTML={{ __html: g.iconSvg }} />
                  )}
                  <div>
                    {g.title && <h5 className="gs-title">{g.title}</h5>}
                    {g.description && <p className="gs-desc">{g.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </>
  )
}
