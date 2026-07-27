'use client'

import React, { useState, useEffect, useRef } from 'react'
import RichText from '@/components/RichText'
import { getDictionary } from '@/i18n/getDictionary'
import { getClientCurrency, type CurrencyCode } from '@/lib/plans/clientUtils'

type Stat = {
  stat?: string | null
  useCurrency?: boolean | null
  unit?: string | null
  tag?: string | null
  frontBody?: string | null
  backBody?: string | null
  // Per-currency values (statEUR, statGBP, …) when useCurrency is on.
  [key: string]: string | boolean | null | undefined
}

/** Parse "€180B" → { pre:'€', suf:'B', target:180, dec:0, useGrouping:false }. */
function parseStat(raw: string) {
  const m = raw.match(/^(\D*)([\d.,]+)(.*)$/)
  if (!m) return null
  const [, pre, numStr, suf] = m
  const target = parseFloat(numStr.replace(/,/g, ''))
  if (!Number.isFinite(target)) return null
  return {
    pre,
    suf,
    target,
    dec: (numStr.split('.')[1] ?? '').length,
    useGrouping: numStr.indexOf(',') > -1,
  }
}

/**
 * A single stat number that counts up from 0 to its target when scrolled into
 * view. The target is parsed from the `value` prop (NOT read back from the DOM),
 * and the display is React state — so re-renders, card flips and live-preview
 * refreshes never corrupt the target or freeze it mid-animation. Ends exactly
 * on `value`. Re-animates when `value` changes (e.g. currency switch).
 */
const AnimatedStat: React.FC<{ value: string }> = ({ value }) => {
  const ref = useRef<HTMLDivElement>(null)
  const parsed = parseStat(value)
  const canAnimate = !!parsed && parsed.target !== 0
  const fmt = (v: number) => {
    if (!parsed) return value
    let n = v.toFixed(parsed.dec)
    if (parsed.useGrouping) n = Number(n).toLocaleString('en-US')
    return parsed.pre + n + parsed.suf
  }
  // Start at 0 (count-up). Deterministic across SSR + first client render, so
  // no hydration mismatch. Non-animatable values (no number, or 0) show as-is.
  const [display, setDisplay] = useState(() => (canAnimate ? fmt(0) : value))

  useEffect(() => {
    if (!canAnimate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const el = ref.current
    if (!el) {
      setDisplay(value)
      return
    }
    const target = parsed!.target
    let raf = 0
    let started = false
    const dur = 1150
    const run = () => {
      if (started) return
      started = true
      setDisplay(fmt(0))
      let t0: number | null = null
      const step = (ts: number) => {
        if (t0 == null) t0 = ts
        const p = Math.min((ts - t0) / dur, 1)
        const e = 1 - Math.pow(1 - p, 3)
        // Last frame snaps to the exact original string.
        setDisplay(p < 1 ? fmt(target * e) : value)
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }
    // Count up if the card is already on screen now (covers the live-preview
    // iframe, where the observer is unreliable) and/or when it's scrolled into
    // view. The `started` guard keeps it to a single run.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) run()
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            obs.unobserve(entry.target)
          }
        }),
      { threshold: 0, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
    // parsed/fmt/canAnimate all derive from `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="n" ref={ref}>
      {display}
    </div>
  )
}

type Props = {
  heading?: any
  lede?: string | null
  stats?: Stat[] | null
  pivotHtml?: string | null
  locale?: string
}

export const TheCaseComponent: React.FC<Props> = ({ heading, lede, stats, pivotHtml, locale }) => {
  const dict = getDictionary(locale)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const sectionRef = useRef<HTMLDivElement>(null)

  // Visitor's selected currency (nb1_cur cookie), for per-currency stats.
  const [currency, setCurrency] = useState<CurrencyCode>('EUR')
  useEffect(() => {
    setCurrency(getClientCurrency(locale || 'en'))
    const onCur = (e: Event) => setCurrency((e as CustomEvent<CurrencyCode>).detail)
    window.addEventListener('nb1:currencychange', onCur)
    return () => window.removeEventListener('nb1:currencychange', onCur)
  }, [locale])

  // Pick the stat string to show: per-currency value (falling back to EUR, then
  // the single value) when the toggle is on; otherwise the single value.
  const statFor = (item: Stat): string => {
    if (item.useCurrency) {
      const byCur = item[`stat${currency}`]
      const eur = item.statEUR
      return (typeof byCur === 'string' && byCur) || (typeof eur === 'string' && eur) || item.stat || ''
    }
    return item.stat || ''
  }

  const toggle = (i: number) => setFlipped((prev) => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  return (
    <>
      <style jsx>{`
        /* ── section shell ── */
        .case {
          position: relative;
          overflow: hidden;
          background: #F3F6F8;
          isolation: isolate;
        }
        /* macro-blur texture */
        .case::before {
          content: '';
          position: absolute;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(34% 42% at 16% 14%, rgba(20,150,184,.13), transparent 60%),
            radial-gradient(40% 48% at 86% 10%, rgba(150,175,195,.15), transparent 62%),
            radial-gradient(46% 54% at 74% 92%, rgba(20,150,184,.11), transparent 60%),
            radial-gradient(42% 50% at 22% 90%, rgba(150,170,200,.13), transparent 62%),
            radial-gradient(30% 36% at 50% 52%, rgba(200,225,232,.16), transparent 66%);
          filter: blur(90px) saturate(1.05);
          transform: translateZ(0);
        }
        /* noise overlay */
        .case::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.025'/></svg>");
          background-size: 160px 160px;
        }
        .case-in {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 96px 32px;
        }

        /* ── masthead ── */
        .mast {
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 8px;
        }
        .mast :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(40px, 5.4vw, 76px);
          line-height: 0.98;
          letter-spacing: -0.04em;
          color: #12314D;
          text-wrap: balance;
          margin: 0;
        }
        .mast :global(h2 em) {
          font-style: normal;
          color: #0A8FB0;
        }
        .lede {
          font-size: 18px;
          line-height: 1.55;
          color: rgba(18,49,77,.70);
          margin: 28px auto 0;
          max-width: 560px;
          text-align: center;
        }

        /* ── stat cards grid ── */
        .case-stats {
          margin-top: 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        /* flip card container */
        .cstat {
          position: relative;
          height: 256px;
          border: 0;
          background: none;
          padding: 0;
          perspective: 1400px;
          cursor: pointer;
          text-align: left;
          font: inherit;
          -webkit-tap-highlight-color: transparent;
        }
        .cstat:focus-visible {
          outline: 2px solid #0A8FB0;
          outline-offset: 3px;
          border-radius: 16px;
        }
        .cstat-inner {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(.4,0,.2,1);
          will-change: transform;
        }
        .cstat-inner.flipped {
          transform: rotateY(180deg);
        }
        /* The card's "glass" chrome lives on its own flat, non-rotated layer.
           Firefox fails to honor backface-visibility:hidden on an element that
           also carries backdrop-filter, which let the back face's mirrored text
           bleed through the front face (and vice versa) once flipped. Keeping
           backdrop-filter off the rotated faces entirely avoids that bug. */
        .cstat-shell {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: linear-gradient(157deg, rgba(255,255,255,.60) 0%, rgba(234,245,249,.44) 100%);
          border: 1px solid rgba(150,185,205,.32);
          -webkit-backdrop-filter: blur(18px) saturate(1.4);
          backdrop-filter: blur(18px) saturate(1.4);
          box-shadow: 0 28px 56px -30px rgba(18,49,77,.24), inset 0 1px 0 rgba(255,255,255,.7);
          transition: box-shadow 0.25s ease, background 0.25s ease;
          pointer-events: none;
        }
        .cstat-shell::before {
          content: '';
          position: absolute;
          left: 26px;
          top: 0;
          width: 26px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: #0A8FB0;
        }
        .cstat:hover .cstat-shell {
          background: linear-gradient(157deg, rgba(255,255,255,.72) 0%, rgba(232,246,250,.56) 100%);
          box-shadow: 0 36px 68px -32px rgba(18,49,77,.30), inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(255,255,255,.36);
        }
        .cstat-face {
          position: absolute;
          inset: 0;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          padding: 28px 26px;
        }
        /* Firefox can fail to compute backface-visibility correctly for a face
           with no 3D transform of its own — give the front an explicit identity
           rotation so both faces go through the same 3D code path. */
        .cstat-front {
          transform: rotateY(0deg);
        }
        .cstat-back {
          transform: rotateY(180deg);
        }

        /* front face typography — .n lives in the <AnimatedStat> child component,
           so it doesn't get this block's styled-jsx scope hash; target it with
           :global, anchored under the scoped .cstat-front so it can't leak. */
        .cstat-front :global(.n) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4vw, 46px);
          line-height: 1;
          letter-spacing: -0.03em;
          color: #12314D;
        }
        .unit {
          margin-top: 10px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(18,49,77,.40);
        }
        .tag {
          margin-top: 18px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: #0A8FB0;
        }
        .exp {
          margin-top: 9px;
          font-size: 15px;
          line-height: 1.5;
          color: rgba(18,49,77,.70);
          max-width: 30ch;
        }
        .back-body {
          margin-top: 12px;
          font-size: 14px;
          line-height: 1.56;
          color: rgba(18,49,77,.70);
        }
        .cstat-more {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(18,49,77,.40);
          transition: color 0.25s ease;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .cstat:hover .cstat-more {
          color: #0A8FB0;
        }
        .cstat-more-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(18,49,77,.10);
          font-style: normal;
          font-size: 13px;
          line-height: 1;
          color: #0A8FB0;
        }

        /* ── pivot text ── */
        .case-pivot {
          text-align: center;
          max-width: 680px;
          margin: 48px auto 0;
          font-size: clamp(15px, 1.6vw, 16.5px);
          line-height: 1.62;
          color: rgba(18,49,77,.55);
          text-wrap: pretty;
        }
        .case-pivot :global(strong) {
          color: #12314D;
          font-weight: 700;
        }
        .case-pivot :global(em) {
          font-style: normal;
          color: #0A8FB0;
          font-weight: 600;
        }

        /* ── mobile ── */
        @media (max-width: 880px) {
          .case-in {
            padding: 64px 22px;
          }
          .case-stats {
            grid-template-columns: 1fr;
            gap: 14px;
            margin-top: 42px;
          }
          .cstat {
            height: 216px;
          }
        }
      `}</style>

      <section className="case" data-screen-label="The case" ref={sectionRef}>
        <div className="case-in">

          <div className="mast">
            {heading && <RichText data={heading} enableGutter={false} enableProse={false} />}
            {lede && <p className="lede">{lede}</p>}
          </div>

          {stats && stats.length > 0 && (
            <div className="case-stats">
              {stats.map((item, i) => (
                <button
                  key={i}
                  className="cstat"
                  type="button"
                  role="button"
                  aria-expanded={flipped.has(i)}
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }}
                >
                  <div className="cstat-shell" aria-hidden="true" />
                  <div className={`cstat-inner${flipped.has(i) ? ' flipped' : ''}`}>
                    {/* front */}
                    <div className="cstat-face cstat-front">
                      <AnimatedStat value={statFor(item)} />
                      {item.unit && <div className="unit">{item.unit}</div>}
                      {item.tag && <div className="tag">{item.tag}</div>}
                      {item.frontBody && <p className="exp">{item.frontBody}</p>}
                      <span className="cstat-more">
                        {dict.theCase.readMore} <span className="cstat-more-icon">+</span>
                      </span>
                    </div>
                    {/* back */}
                    <div className="cstat-face cstat-back">
                      {item.tag && <div className="tag">{item.tag}</div>}
                      {item.backBody && <p className="back-body">{item.backBody}</p>}
                      <span className="cstat-more">
                        {dict.theCase.back} <span className="cstat-more-icon">×</span>
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {pivotHtml && (
            <p className="case-pivot" dangerouslySetInnerHTML={{ __html: pivotHtml }} />
          )}

        </div>
      </section>
    </>
  )
}
