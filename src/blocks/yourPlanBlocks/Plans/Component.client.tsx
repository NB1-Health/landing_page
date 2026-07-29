'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import React, { useEffect, useRef, useState } from 'react'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import {
  fetchPlansClient,
  getClientCurrency,
  formatPrice,
  buildRateMap,
  resolveTokens,
  resolveTokensDeep,
  PER_MONTH_DICT,
} from '@/lib/plans/clientUtils'

type BgColorPreset = 'cream' | 'paper' | 'off' | 'navy' | 'navyDeep' | 'teal' | 'custom'
type BgType = 'color' | 'image'
type MediaLike = { url?: string | null; alt?: string | null } | null

function isDarkPreset(preset?: BgColorPreset | null): boolean {
  return preset === 'navy' || preset === 'navyDeep' || preset === 'teal'
}

function resolveBg(preset?: BgColorPreset | null, custom?: string | null): string {
  if (!preset || preset === 'cream') return '#FAF8F2'
  if (preset === 'paper') return '#FFFFFF'
  if (preset === 'off') return '#F1F4F7'
  if (preset === 'navy') return '#12314D'
  if (preset === 'navyDeep') return '#0E2740'
  if (preset === 'teal') return '#0A8FB0'
  if (preset === 'custom') return custom || '#FAF8F2'
  return '#FAF8F2'
}

type PlanCard = {
  featured?: boolean | null
  badge?: string | null
  name?: string | null
  tag?: string | null
  planFamily?: 'core' | 'advanced' | null
  price?: string | null
  pricePeriod?: string | null
  monthly?: string | null
  commit?: string | null
  listLabel?: string | null
  listItems?: { text?: string | null }[] | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  ctaStyle?: 'out' | 'cta' | null
}

type CellValue = boolean | string | { v?: string | null; sub?: string | null }

type CompareRow = {
  id?: string | null
  text?: string | null
  cell?: 'checkbox' | 'oneLine' | 'twoLine' | null
}

type CompareSection = {
  id?: string | null
  title?: string | null
  rows?: CompareRow[] | null
}

type CompareCard = {
  id?: string | null
  label?: string | null
  planFamily?: 'core' | 'advanced' | null
  price?: string | null
  pricePeriod?: string | null
  highlight?: boolean | null
  features?: Record<string, CellValue> | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  ctaStyle?: 'out' | 'lime' | null
}

type Comparison = {
  toggleLabelClosed?: string | null
  toggleLabelOpen?: string | null
  sections?: CompareSection[] | null
  cards?: CompareCard[] | null
}

type GuaranteeItem = {
  icon?: 'clock' | 'cycle' | 'capsule' | 'none' | null
  title?: string | null
  body?: string | null
}

export type YpPlansBlockType = {
  blockType?: 'ypPlans'
  backgroundColor?: BgColorPreset | null
  backgroundColorCustom?: string | null
  backgroundType?: BgType | null
  backgroundImage?: MediaLike
  grain?: boolean | null
  eyebrow?: string | null
  heading?: DefaultTypedEditorState | null
  lede?: DefaultTypedEditorState | null
  planCards?: PlanCard[] | null
  showComparison?: boolean | null
  comparison?: Comparison | null
  guaranteeItems?: GuaranteeItem[] | null
  locale?: string
}

const GUARANTEE_ICONS: Record<string, React.ReactNode> = {
  clock: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  cycle: (
    <svg viewBox="0 0 24 24">
      <path d="M3 12A9 9 0 0121 12" />
      <polyline points="18 8 21 12 18 16" />
    </svg>
  ),
  capsule: (
    <svg viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="18" rx="3" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
}

export const YpPlansClient: React.FC<YpPlansBlockType> = ({
  backgroundColor,
  backgroundColorCustom,
  backgroundType,
  backgroundImage,
  grain,
  eyebrow,
  heading,
  lede,
  planCards: planCardsProp,
  showComparison,
  comparison: comparisonProp,
  guaranteeItems,
  locale = 'en',
}) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const collapseRef = useRef<HTMLDivElement | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const [compareOpen, setCompareOpen] = useState(false)
  const [planCards, setPlanCards] = useState<PlanCard[]>(planCardsProp ?? [])
  const [comparison, setComparison] = useState<Comparison | null | undefined>(comparisonProp)

  useEffect(() => {
    function applyPrices(
      currency: ReturnType<typeof getClientCurrency>,
      plans: Awaited<ReturnType<typeof fetchPlansClient>>,
    ) {
      const perMonth = PER_MONTH_DICT[locale] ?? PER_MONTH_DICT.en
      const rateMap = buildRateMap(plans, currency)
      setPlanCards(
        (planCardsProp ?? []).map((card) => {
          const family = card.planFamily === 'advanced' ? 'advanced' : 'core'
          const rate = card.planFamily ? rateMap[`${family}:1`] : undefined
          return {
            ...card,
            price: rate != null ? formatPrice(rate, currency, locale) : card.price,
            pricePeriod: rate != null ? perMonth : card.pricePeriod,
            monthly: resolveTokens(card.monthly, rateMap, currency, locale) ?? card.monthly,
            commit: resolveTokens(card.commit, rateMap, currency, locale) ?? card.commit,
          }
        }),
      )
      const resolvedComparison = resolveTokensDeep(comparisonProp, rateMap, currency, locale)
      if (resolvedComparison) {
        const resolvedCards = resolvedComparison.cards?.map((card: CompareCard) => {
          const family = card.planFamily === 'advanced' ? 'advanced' : 'core'
          const rate = card.planFamily ? rateMap[`${family}:1`] : undefined
          return {
            ...card,
            price: rate != null ? formatPrice(rate, currency, locale) : card.price,
            pricePeriod: rate != null ? perMonth : card.pricePeriod,
          }
        })
        setComparison({ ...resolvedComparison, cards: resolvedCards })
      } else {
        setComparison(resolvedComparison)
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  const isImageMode = backgroundType === 'image'
  const isDark = isImageMode || isDarkPreset(backgroundColor)
  const resolvedBg = resolveBg(backgroundColor, backgroundColorCustom)
  const bgImageUrl =
    backgroundImage && typeof backgroundImage === 'object' && backgroundImage.url
      ? getMediaUrl(backgroundImage.url)
      : ''

  const sectionStyle: React.CSSProperties =
    isImageMode && bgImageUrl
      ? {
          background: `linear-gradient(180deg, rgba(10,27,46,.55) 0%, rgba(10,27,46,.35) 100%), url('${bgImageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      : { background: resolvedBg }

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true)
      },
      { threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // mobile carousel dot tracking
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    let raf = 0
    const update = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.plan-card'))
      const gr = grid.getBoundingClientRect()
      const mid = gr.left + gr.width / 2
      let best = 0
      let bd = Infinity
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect()
        const cc = r.left + r.width / 2
        const dd = Math.abs(cc - mid)
        if (dd < bd) {
          bd = dd
          best = i
        }
      })
      setActiveDot(best)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    grid.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      grid.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
      cancelAnimationFrame(raf)
    }
  }, [planCards])

  // compare collapse animation
  useEffect(() => {
    const c = collapseRef.current
    if (!c) return
    c.style.maxHeight = compareOpen ? `${c.scrollHeight}px` : '0px'
  }, [compareOpen, comparison])

  const scrollToCard = (i: number) => {
    const grid = gridRef.current
    if (!grid) return
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.plan-card'))
    const c = cards[i]
    if (!c) return
    const gr = grid.getBoundingClientRect()
    const r = c.getBoundingClientRect()
    grid.scrollTo({
      left: grid.scrollLeft + (r.left - gr.left) - (gr.width - r.width) / 2,
      behavior: 'smooth',
    })
  }

  const cards = planCards ?? []
  const cmp = comparison ?? {}
  const cmpSections = cmp.sections ?? []
  const cmpCards = cmp.cards ?? []
  const guarantees = guaranteeItems ?? []
  const showCmp = showComparison !== false

  return (
    <section
      id="plans"
      ref={sectionRef}
      style={sectionStyle}
      className={['yp-plans', grain !== false ? 'grain' : '', isDark ? 'is-dark' : ''].join(' ')}
    >
      <style jsx>{`
        .yp-plans {
          /* v2 mockup .order → padding-block: clamp(80px, 11vw, 140px) */
          padding: clamp(80px, 11vw, 140px) 0;
          position: relative;
          color: #12314d;
          /* Base body font is Inter (app global is Geist, which otherwise leaks
             into the lede/card copy). Headings/names/prices set Instrument Sans
             explicitly below. */
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
        }
        .yp-plans.is-dark {
          color: #ffffff;
        }

        /* grain */
        .grain {
          position: relative;
        }
        .grain::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        }
        .grain > :global(*) {
          position: relative;
          z-index: 1;
        }

        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* reveal */
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition:
            opacity 0.7s cubic-bezier(0.16, 0.84, 0.44, 1),
            transform 0.7s cubic-bezier(0.16, 0.84, 0.44, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }
        .reveal.d1 {
          transition-delay: 0.08s;
        }
        .reveal.d2 {
          transition-delay: 0.16s;
        }
        .reveal.d3 {
          transition-delay: 0.24s;
        }

        /* section head */
        .section-head {
          /* v2 mockup .order h2 caps at 22ch (~760px); widened from 680px */
          max-width: 760px;
        }
        .section-head.center {
          margin: 0 auto;
          text-align: center;
        }
        .eyebrow {
          /* Hidden per design direction — headlines lead the section heads.
             Field stays editable in Payload; it simply never renders. */
          display: none !important;
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0a8fb0;
        }
        .eyebrow::before {
          content: '';
          width: 28px;
          height: 1px;
          background: #0a8fb0;
        }
        .eyebrow.center::after {
          content: '';
          width: 28px;
          height: 1px;
          background: #0a8fb0;
        }
        .section-head :global(h2),
        .section-head :global(h3),
        .section-head :global(p.head-h) {
          margin-top: 18px;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          /* Mockup design system sets h1/h2/h3 to 500 (only the shipped
             Instrument Sans weight for headings); 600 read too bold vs mockup. */
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1.02;
          font-size: clamp(32px, 4vw, 52px);
        }
        .yp-plans.is-dark .section-head :global(h2),
        .yp-plans.is-dark .section-head :global(h3) {
          color: #ffffff;
        }
        .section-head :global(.teal) {
          color: #0a8fb0;
        }
        .yp-plans.is-dark .section-head :global(.teal) {
          color: #13a6cc;
        }
        .head-lede {
          margin-top: 18px;
          font-size: clamp(16px, 1.4vw, 19px);
          font-weight: 400;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.6;
        }
        .yp-plans.is-dark .head-lede {
          color: rgba(255, 255, 255, 0.7);
        }
        .head-lede :global(p) {
          margin: 0;
        }

        /* plan cards */
        .plans-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 48px;
          max-width: 880px;
          margin-left: auto;
          margin-right: auto;
        }
        .plan-card {
          background:
            radial-gradient(120% 100% at 100% 0%, rgba(10, 143, 176, 0.07) 0%, transparent 52%),
            linear-gradient(168deg, #ffffff 0%, #f1f6f9 100%);
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 34px 32px;
          position: relative;
          display: flex;
          flex-direction: column;
          transition:
            transform 0.25s,
            box-shadow 0.25s;
        }
        .plan-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 50px -28px rgba(18, 49, 77, 0.34);
        }
        .plan-card.featured {
          background:
            radial-gradient(130% 110% at 100% 0%, rgba(10, 143, 176, 0.16), transparent 55%),
            linear-gradient(168deg, rgba(27, 62, 92, 0.92) 0%, rgba(10, 27, 46, 0.92) 80%);
          border-color: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .plan-badge {
          position: absolute;
          top: -11px;
          left: 32px;
        }
        .rec-flag {
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
        .pc-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .plan-card.featured .pc-name {
          color: #fff;
        }
        .pc-tag {
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
          margin-top: 10px;
          line-height: 1.5;
          min-height: 44px;
        }
        .plan-card.featured .pc-tag {
          color: rgba(255, 255, 255, 0.7);
        }
        .pc-price {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 52px;
          letter-spacing: -0.03em;
          margin-top: 22px;
          line-height: 1;
        }
        .pc-price span {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 500;
        }
        .plan-card.featured .pc-price span {
          color: rgba(255, 255, 255, 0.55);
        }
        .pc-monthly {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #0a8fb0;
          background: rgba(10, 143, 176, 0.08);
          border-radius: 100px;
          padding: 5px 12px;
          margin-top: 12px;
        }
        .plan-card.featured .pc-monthly {
          color: #13a6cc;
          background: rgba(10, 143, 176, 0.16);
        }
        .pc-ghost {
          visibility: hidden;
        }
        .pc-commit {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 10px;
          line-height: 1.5;
          min-height: 38px;
        }
        .plan-card.featured .pc-commit {
          color: rgba(255, 255, 255, 0.55);
        }
        .pc-lbl {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a8fb0;
          margin: 24px 0 14px;
          padding-top: 22px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .plan-card.featured .pc-lbl {
          color: #13a6cc;
          border-color: rgba(255, 255, 255, 0.14);
        }
        .pc-list {
          list-style: none;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 11px;
          padding: 0;
          margin: 0;
        }
        .pc-list li {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          font-size: 14px;
          color: rgba(18, 49, 77, 0.7);
        }
        .plan-card.featured .pc-list li {
          color: rgba(255, 255, 255, 0.9);
        }
        .pc-list li .ck {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: #0a8fb0;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .plan-card.featured .pc-list li .ck {
          color: #13a6cc;
        }

        /* buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-size: 15px;
          font-weight: 600;
          padding: 15px 28px;
          border-radius: 100px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s;
          white-space: nowrap;
          text-decoration: none;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .btn-cta {
          background: #c6ff5b;
          color: #0e2740 !important;
          font-weight: 700;
        }
        .btn-cta:hover {
          background: #aaea42;
        }
        .btn-out {
          background: transparent;
          color: #12314d;
          border-color: rgba(18, 49, 77, 0.1);
        }
        .btn-out:hover {
          border-color: #12314d;
          background: transparent;
        }
        .plan-card.featured .btn-out {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.14);
        }
        .plan-card.featured .btn-out:hover {
          border-color: #fff;
        }
        .btn-block {
          width: 100%;
        }
        .plan-card .btn {
          margin-top: 26px;
        }

        /* plans dots / mobile carousel */
        .plans-dots {
          display: none;
        }
        @media (max-width: 860px) {
          .plans-grid {
            display: flex;
            gap: 14px;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            margin: 30px -32px 0;
            padding: 16px 32px 8px;
          }
          .plans-grid::-webkit-scrollbar {
            display: none;
          }
          .plans-grid > .plan-card {
            flex: 0 0 86%;
            max-width: none;
            scroll-snap-align: center;
          }
          .plan-card:hover {
            transform: none;
            box-shadow: 0 18px 40px -26px rgba(18, 49, 77, 0.3);
          }
          .plans-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 18px;
          }
          .plans-dots i {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: rgba(18, 49, 77, 0.1);
            transition:
              background 0.2s,
              transform 0.2s;
            cursor: pointer;
          }
          .plans-dots i.on {
            background: #0a8fb0;
            transform: scale(1.3);
          }
        }
        @media (max-width: 640px) {
          .yp-plans {
            padding: 56px 0;
          }
          .wrap {
            padding: 0 20px;
          }
          .plans-grid {
            margin: 28px -20px 0;
            padding: 16px 20px 8px;
          }
          .plans-grid > .plan-card {
            flex: 0 0 84%;
            padding: 22px 20px;
          }
          .plans-grid .pc-tag {
            min-height: 0;
            margin-top: 7px;
            font-size: 13.5px;
            line-height: 1.45;
          }
          .plans-grid .pc-price {
            font-size: 40px;
            margin-top: 14px;
          }
          .plans-grid .pc-monthly {
            margin-top: 9px;
            padding: 4px 10px;
            font-size: 11.5px;
          }
          .plans-grid .pc-commit {
            min-height: 0;
            margin-top: 8px;
            font-size: 12.5px;
          }
          .plans-grid .pc-lbl {
            margin: 15px 0 10px;
            padding-top: 15px;
          }
          .plans-grid .pc-list {
            gap: 9px;
          }
          .plans-grid .pc-list li {
            font-size: 13.5px;
          }
          .plans-grid .plan-card .btn {
            margin-top: 18px;
          }
        }

        /* compare table */
        .cmp-wrap {
          max-width: 880px;
          margin: 30px auto 0;
        }
        .cmp-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 0 auto;
          min-width: 330px;
          background: linear-gradient(
            180deg,
            rgba(10, 143, 176, 0.1) 0%,
            rgba(10, 143, 176, 0.035) 100%
          );
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
          border: 1.5px solid rgba(10, 143, 176, 0.2);
          border-radius: 14px;
          padding: 15px 26px;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #0a8fb0;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transition:
            background 0.18s,
            border-color 0.15s;
        }
        .cmp-toggle:hover {
          background: linear-gradient(
            180deg,
            rgba(10, 143, 176, 0.16) 0%,
            rgba(10, 143, 176, 0.07) 100%
          );
          border-color: rgba(10, 143, 176, 0.42);
        }
        .cmp-toggle .arr {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0a8fb0;
          color: #fff;
          transition: transform 0.25s;
        }
        .cmp-toggle .arr :global(svg) {
          width: 13px;
          height: 13px;
          display: block;
          position: relative;
          top: 1px;
        }
        .cmp-toggle.open .arr {
          transform: rotate(180deg);
        }
        .cmp-collapse {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cmp-inner {
          padding-top: 28px;
        }
        .ctable {
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 24px 48px -24px rgba(18, 49, 77, 0.14);
        }
        .ctable .crow {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) repeat(var(--cols, 2), minmax(0, 1fr));
          border-bottom: 1px solid rgba(18, 49, 77, 0.07);
        }
        .ctable .crow:last-child {
          border-bottom: none;
        }
        .ctable .ccell {
          display: flex;
          align-items: center;
          padding: 15px 22px;
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
        }
        .ctable .ccell.center {
          justify-content: center;
          text-align: center;
          flex-direction: column;
          gap: 3px;
        }
        .ctable .ccell.adv {
          background: rgba(10, 143, 176, 0.05);
        }
        .ctable .crow.chead {
          background: #13314c;
        }
        .ctable .crow.chead .ccell {
          padding: 22px;
        }
        .ctable .crow.chead .cn {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 600;
        }
        .ctable .crow.chead .cp {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .ctable .crow.chead .cp .sm {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
        }
        .ctable .crow.chead .ccell.adv {
          background: rgba(10, 143, 176, 0.28);
        }
        .ctable .crow.chead .ccell.adv .cn {
          color: #13a6cc;
        }
        .ctable .crow.group {
          background: #f5f3ee;
        }
        .ctable .crow.group .ccell {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #0a8fb0;
          font-weight: 700;
          padding: 13px 22px;
        }
        .ctable .ccell .val {
          font-weight: 600;
          color: #12314d;
          font-size: 13.5px;
        }
        .ctable .ccell .val-sub {
          display: block;
          font-size: 11px;
          color: #0a8fb0;
          font-weight: 600;
          margin-top: 3px;
        }
        .ctable .ck {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .ctable .ck.on {
          background: rgba(10, 143, 176, 0.12);
          color: #0a8fb0;
        }
        .ctable .ck.on::after {
          content: '✓';
        }
        .ctable .ck.off::after {
          content: '—';
          color: rgba(18, 49, 77, 0.4);
        }
        .ctable .crow.cta .ccell {
          padding: 24px 22px;
        }
        .ctable .cbtn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          font-weight: 700;
          font-size: 15px;
          border-radius: 100px;
          padding: 14px;
          text-decoration: none;
        }
        .ctable .cbtn.out {
          background: transparent;
          color: #12314d;
          border: 1px solid rgba(18, 49, 77, 0.1);
        }
        .ctable .cbtn.out:hover {
          border-color: #12314d;
        }
        .ctable .cbtn.lime {
          background: #c6ff5b;
          color: #0e2740;
        }
        .ctable .cbtn.lime:hover {
          background: #aaea42;
        }
        @media (max-width: 760px) {
          .cmp-toggle {
            min-width: 0;
            width: 100%;
          }
          .ctable .crow {
            grid-template-columns: minmax(0, 1.5fr) repeat(var(--cols, 2), minmax(0, 0.75fr));
          }
          .ctable .ccell {
            padding: 13px 12px;
            font-size: 12.5px;
          }
          .ctable .crow.chead .cp {
            font-size: 19px;
          }
        }
        @media (max-width: 640px) {
          .ctable .crow {
            grid-template-columns: minmax(0, 1.4fr) repeat(var(--cols, 2), minmax(0, 0.8fr));
          }
          .ctable .ccell {
            padding: 12px 10px;
            font-size: 12px;
          }
          .ctable .crow.chead .cp {
            font-size: 17px;
          }
          .ctable .crow.cta {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 16px 14px;
          }
          .ctable .crow.cta .ccell {
            padding: 0;
          }
          .ctable .crow.cta .ccell:empty {
            display: none;
          }
          .ctable .crow.cta .ccell.adv {
            background: none;
          }
          .ctable .crow.cta .cbtn {
            width: 100%;
            padding: 14px;
            font-size: 14px;
          }
        }
        @media (max-width: 380px) {
          .ctable .crow {
            grid-template-columns: minmax(0, 1.3fr) repeat(var(--cols, 2), minmax(0, 0.85fr));
          }
        }

        /* guarantee strip */
        .guarantee-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 26px;
          max-width: 880px;
          margin-left: auto;
          margin-right: auto;
          background: linear-gradient(168deg, rgba(255, 255, 255, 0.72), rgba(244, 249, 251, 0.62));
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          overflow: hidden;
        }
        .gs-item {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          padding: 22px 22px;
          border-left: 1px solid rgba(18, 49, 77, 0.07);
        }
        .gs-item:first-child {
          border-left: none;
        }
        .gs-item .gs-ico {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border-radius: 9px;
          background: rgba(10, 143, 176, 0.08);
          color: #0a8fb0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gs-item .gs-ico :global(svg) {
          width: 18px;
          height: 18px;
          stroke: #0a8fb0;
          fill: none;
          stroke-width: 1.7;
        }
        .gs-item h5 {
          font-size: 14px;
          font-weight: 600;
          color: #12314d;
          margin: 0;
        }
        .gs-item p {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 3px;
          line-height: 1.5;
        }
        @media (max-width: 860px) {
          .plans-grid {
            grid-template-columns: 1fr;
          }
          .guarantee-strip {
            grid-template-columns: 1fr;
          }
          .gs-item {
            border-left: none;
            border-top: 1px solid rgba(18, 49, 77, 0.07);
          }
          .gs-item:first-child {
            border-top: none;
          }
        }
      `}</style>

      <div className="wrap">
        {(eyebrow || heading || lede) && (
          <div className={['section-head center reveal', revealed ? 'in' : ''].join(' ')}>
            {eyebrow && <span className="eyebrow center">{eyebrow}</span>}
            {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
            {lede && (
              <div className="head-lede">
                <RichText data={lede as any} enableGutter={false} enableProse={false} />
              </div>
            )}
          </div>
        )}

        {cards.length > 0 && (
          <>
            <div className="plans-grid" ref={gridRef}>
              {cards.map((card, i) => (
                <article
                  key={i}
                  className={[
                    'plan-card reveal',
                    card.featured ? 'featured' : '',
                    revealed ? 'in' : '',
                    i === 0 ? 'd1' : i === 1 ? 'd2' : 'd3',
                  ].join(' ')}
                >
                  {card.badge && <span className="rec-flag plan-badge">{card.badge}</span>}
                  {card.name && <div className="pc-name">{card.name}</div>}
                  {card.tag && <p className="pc-tag">{card.tag}</p>}
                  {card.price && (
                    <div className="pc-price">
                      {card.price}
                      {card.pricePeriod && <span> {card.pricePeriod}</span>}
                    </div>
                  )}
                  {/* {card.monthly ? (
                    <div className="pc-monthly">{card.monthly}</div>
                  ) : (
                    <div className="pc-monthly pc-ghost" aria-hidden="true">
                      &nbsp;
                    </div>
                  )} */}
                  {card.commit && <p className="pc-commit">{card.commit}</p>}
                  {card.listLabel && <div className="pc-lbl">{card.listLabel}</div>}
                  {card.listItems && card.listItems.length > 0 && (
                    <ul className="pc-list">
                      {card.listItems.map((item, j) => (
                        <li key={j}>
                          <span className="ck">✓</span>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {card.ctaLabel && (
                    <a
                      href={card.ctaUrl || '#'}
                      className={[
                        'btn',
                        card.ctaStyle === 'cta' ? 'btn-cta' : 'btn-out',
                        'btn-block',
                      ].join(' ')}
                      style={
                        card.ctaStyle === 'cta'
                          ? { backgroundColor: 'rgb(198, 255, 91)' }
                          : undefined
                      }
                    >
                      {card.ctaLabel}
                    </a>
                  )}
                </article>
              ))}
            </div>

            {cards.length > 1 && (
              <div className="plans-dots" aria-hidden="true">
                {cards.map((_, i) => (
                  <i
                    key={i}
                    className={i === activeDot ? 'on' : ''}
                    onClick={() => scrollToCard(i)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {showCmp && (
          <div className={['cmp-wrap reveal', revealed ? 'in d2' : 'd2'].join(' ')}>
            <button
              type="button"
              className={['cmp-toggle', compareOpen ? 'open' : ''].join(' ')}
              aria-expanded={compareOpen}
              onClick={() => setCompareOpen((v) => !v)}
            >
              <span className="cmp-toggle-lbl">
                {compareOpen ? cmp.toggleLabelOpen : cmp.toggleLabelClosed}
              </span>
              <span className="arr" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            <div className="cmp-collapse" ref={collapseRef}>
              <div className="cmp-inner">
                <div className="ctable" style={{ ['--cols' as any]: cmpCards.length || 1 }}>
                  <div className="crow chead">
                    <div className="ccell" />
                    {cmpCards.map((card, ci) => (
                      <div
                        key={ci}
                        className={['ccell center', card.highlight ? 'adv' : ''].join(' ')}
                      >
                        <span className="cn">{card.label}</span>
                        <span className="cp">
                          {card.price}
                          {card.pricePeriod && <span className="sm"> {card.pricePeriod}</span>}
                        </span>
                      </div>
                    ))}
                  </div>

                  {cmpSections.map((section, si) => (
                    <React.Fragment key={si}>
                      <div className="crow group">
                        <div className="ccell">{section.title}</div>
                        {cmpCards.map((card, ci) => (
                          <div
                            key={ci}
                            className={['ccell center', card.highlight ? 'adv' : ''].join(' ')}
                          />
                        ))}
                      </div>
                      {(section.rows ?? []).map((row, ri) => {
                        const cell = row.cell || 'checkbox'
                        return (
                          <div className="crow" key={ri}>
                            <div className="ccell">{row.text}</div>
                            {cmpCards.map((card, ci) => {
                              const feats = card.features ?? {}
                              // Locale-specific value takes priority over the base value.
                              // Stored as `rowId__locale` (e.g. "abc123__de") so different
                              // languages can have different text without making the whole
                              // features JSON field localized (Payload can't do that).
                              const localeKey = row.id && locale ? `${row.id}__${locale}` : null
                              const raw =
                                localeKey && feats[localeKey] !== undefined
                                  ? feats[localeKey]
                                  : row.id
                                    ? feats[row.id]
                                    : undefined
                              const two =
                                raw && typeof raw === 'object'
                                  ? (raw as { v?: string | null; sub?: string | null })
                                  : null
                              return (
                                <div
                                  key={ci}
                                  className={['ccell center', card.highlight ? 'adv' : ''].join(
                                    ' ',
                                  )}
                                >
                                  {cell === 'checkbox' ? (
                                    <span className={raw === true ? 'ck on' : 'ck off'} />
                                  ) : cell === 'oneLine' ? (
                                    <span className="val">
                                      {typeof raw === 'string' ? raw : ''}
                                    </span>
                                  ) : (
                                    <>
                                      <span className="val">{two?.v}</span>
                                      {two?.sub && <span className="val-sub">{two.sub}</span>}
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  ))}

                  <div className="crow cta">
                    <div className="ccell" />
                    {cmpCards.map((card, ci) => (
                      <div
                        key={ci}
                        className={['ccell center', card.highlight ? 'adv' : ''].join(' ')}
                      >
                        {card.ctaLabel && (
                          <a
                            href={card.ctaUrl || '#'}
                            className={['cbtn', card.ctaStyle === 'lime' ? 'lime' : 'out'].join(
                              ' ',
                            )}
                            style={
                              card.ctaStyle === 'lime'
                                ? { backgroundColor: 'rgb(198, 255, 91)' }
                                : undefined
                            }
                          >
                            {card.ctaLabel}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {guarantees.length > 0 && (
          <div className="guarantee-strip">
            {guarantees.map((g, i) => (
              <div
                key={i}
                className={[
                  'gs-item reveal',
                  revealed ? 'in' : '',
                  i === 0 ? 'd1' : i === 1 ? 'd2' : 'd3',
                ].join(' ')}
              >
                {g.icon && g.icon !== 'none' && GUARANTEE_ICONS[g.icon] && (
                  <div className="gs-ico">{GUARANTEE_ICONS[g.icon]}</div>
                )}
                <div>
                  {g.title && <h5>{g.title}</h5>}
                  {g.body && <p>{g.body}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
