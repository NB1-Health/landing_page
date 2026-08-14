'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useBiologyReveal } from '@/hooks/useBiologyReveal'
import type { AppLocale } from '@/i18n/config'
import { formatComponentCount, getReadingToFormulaStrings } from './i18n'

type Output = { name?: string | null; dose?: string | null }
type Signal = {
  kind?: 'gut' | 'blood' | null
  gutName?: string | null
  gutSub?: string | null
  pillLabel?: string | null
  pillVariant?: 'low' | 'ok' | null
  fillPercent?: number | null
  bloodName?: string | null
  outputs?: Output[] | null
  holdLabel?: string | null
  holdText?: string | null
}

export type BiologyReadingToFormulaBlockType = {
  blockType?: 'biologyReadingToFormula'
  heading?: DefaultTypedEditorState | null
  lede?: string | null
  readingTitle?: string | null
  readingSubtitle?: string | null
  bloodTitle?: string | null
  bloodBadge?: string | null
  bloodSubtitle?: string | null
  bloodNotePrefix?: string | null
  bloodNoteBadge?: string | null
  bloodNoteSuffix?: string | null
  bloodMeasuredLabel?: string | null
  signals?: Signal[] | null
  supportDividerLabel?: string | null
  supportItems?: Output[] | null
  moreLabel?: string | null
  moreDetail?: string | null
  formulaTitle?: string | null
  formulaEmptyText?: string | null
  formulaLinkLabel?: string | null
  formulaLinkUrl?: string | null
  captionText?: string | null
}

// A row queued into the "Building your formula" card, in emission order.
type FormulaRow =
  | { type: 'comp'; name: string; dose: string }
  | { type: 'hold'; name: string; dose: string }
  | { type: 'divider'; name: string }
  | { type: 'more'; name: string; dose: string }

export const BiologyReadingToFormulaComponent: React.FC<
  BiologyReadingToFormulaBlockType & { locale?: AppLocale }
> = ({
  locale,
  heading,
  lede,
  readingTitle,
  readingSubtitle,
  bloodTitle,
  bloodBadge,
  bloodSubtitle,
  bloodNotePrefix,
  bloodNoteBadge,
  bloodNoteSuffix,
  bloodMeasuredLabel,
  signals,
  supportDividerLabel,
  supportItems,
  moreLabel,
  moreDetail,
  formulaTitle,
  formulaEmptyText,
  formulaLinkLabel,
  formulaLinkUrl,
  captionText,
}) => {
  const T = getReadingToFormulaStrings(locale)
  const allSignals = useMemo(() => signals ?? [], [signals])
  const gutSignals = useMemo(() => allSignals.filter((s) => s.kind !== 'blood'), [allSignals])
  const bloodSignals = useMemo(() => allSignals.filter((s) => s.kind === 'blood'), [allSignals])
  const support = useMemo(() => supportItems ?? [], [supportItems])

  // Flatten into the exact emission order the mockup's script produces:
  // per-signal outputs (+ optional hold row), then a divider, then support
  // items, then the trailing "+ tuned across..." row.
  const formulaRows = useMemo<FormulaRow[]>(() => {
    const rows: FormulaRow[] = []
    allSignals.forEach((s) => {
      ;(s.outputs ?? []).forEach((o) => {
        if (o.name && o.dose) rows.push({ type: 'comp', name: o.name, dose: o.dose })
      })
      if (s.holdLabel && s.holdText) rows.push({ type: 'hold', name: s.holdLabel, dose: s.holdText })
    })
    rows.push({ type: 'divider', name: supportDividerLabel || '' })
    support.forEach((o) => {
      if (o.name && o.dose) rows.push({ type: 'comp', name: o.name, dose: o.dose })
    })
    rows.push({ type: 'more', name: moreLabel || '', dose: moreDetail || '' })
    return rows
  }, [allSignals, support, supportDividerLabel, moreLabel, moreDetail])

  const sectionRef = useRef<HTMLElement | null>(null)
  useBiologyReveal(sectionRef, '.brf-bhd')
  const demoRef = useRef<HTMLDivElement | null>(null)
  const bloodCardRef = useRef<HTMLDivElement | null>(null)
  const formulaCardRef = useRef<HTMLDivElement | null>(null)
  const gutRowRefs = useRef<(HTMLDivElement | null)[]>([])
  const gutFillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const bloodRowRefs = useRef<(HTMLDivElement | null)[]>([])
  const formulaRowRefs = useRef<(HTMLDivElement | null)[]>([])
  const formulaCountRef = useRef<HTMLSpanElement | null>(null)
  const placedRef = useRef(0)

  const [anyFormulaRowShown, setAnyFormulaRowShown] = useState(false)

  // Ported verbatim (timing included) from the mockup's "05 build — reading →
  // formula (autoplay on scroll)" script. Two things this page's actual DOM
  // silently drops that the CSS still defines: there is no #fmStatus element,
  // so the "Reading/Matching/Complete" status text never renders (setStatus
  // is a no-op) — only the .formula building/done classes (and their pulsing
  // background) actually fire. And the formula rows never get "tag" chips
  // (Nourish/Activate/Restore) — addComp() only ever writes name+dose.
  useEffect(() => {
    const section = sectionRef.current
    const demo = demoRef.current
    const formulaCard = formulaCardRef.current
    if (!section || !demo || !formulaCard) return

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers: ReturnType<typeof setTimeout>[] = []
    const schedule = (delay: number, fn: () => void) => {
      timers.push(setTimeout(fn, delay))
    }

    function revealGut(i: number) {
      const row = gutRowRefs.current[i]
      const fill = gutFillRefs.current[i]
      const pct = gutSignals[i]?.fillPercent
      if (row) row.classList.add('in')
      if (fill && pct != null) {
        schedule(reduce ? 0 : 70, () => {
          fill.style.width = `${pct}%`
        })
      }
    }
    function revealBlood(i: number) {
      bloodRowRefs.current[i]?.classList.add('in')
    }
    function updateCount() {
      if (formulaCountRef.current) {
        formulaCountRef.current.textContent = formatComponentCount(placedRef.current, T)
      }
    }
    function revealFormula(i: number) {
      const row = formulaRowRefs.current[i]
      if (!row) return
      row.classList.add('in', 'glow')
      setAnyFormulaRowShown(true)
      // Only "comp" rows count — matches the mockup's addComp() incrementing
      // `placed`; addHold()/addDivider()/addMore() never touch the counter.
      if (formulaRows[i]?.type === 'comp') {
        placedRef.current += 1
        updateCount()
      }
    }
    function finish() {
      formulaCard!.classList.remove('building')
      formulaCard!.classList.add('done')
      const lastIdx = formulaRows.length - 1
      formulaRowRefs.current[lastIdx]?.classList.add('in')
    }

    if (reduce) {
      formulaCard.classList.add('done')
      bloodCardRef.current?.classList.add('in')
      gutRowRefs.current.forEach((row, i) => {
        row?.classList.add('in')
        const fill = gutFillRefs.current[i]
        const pct = gutSignals[i]?.fillPercent
        if (fill && pct != null) {
          fill.style.transition = 'none'
          fill.style.width = `${pct}%`
        }
      })
      bloodRowRefs.current.forEach((row) => row?.classList.add('in'))
      formulaRowRefs.current.forEach((row) => row?.classList.add('in'))
      placedRef.current = formulaRows.filter((r) => r.type === 'comp').length
      updateCount()
      setAnyFormulaRowShown(true)
      return
    }

    function run() {
      const K = window.matchMedia('(max-width:900px)').matches ? 0.5 : 1
      formulaCard!.classList.add('building')

      let t = 400 * K
      let bloodShown = false
      let gutIdx = 0
      let bloodIdx = 0
      let formulaIdx = 0

      allSignals.forEach((s) => {
        if (s.kind === 'blood') {
          if (!bloodShown) {
            bloodShown = true
            schedule(t - 120 * K, () => bloodCardRef.current?.classList.add('in'))
            t += 380 * K
          }
          const idx = bloodIdx
          bloodIdx += 1
          schedule(t, () => revealBlood(idx))
        } else {
          const idx = gutIdx
          gutIdx += 1
          schedule(t, () => revealGut(idx))
        }

        const emitAt = t + 760 * K
        const outputs = s.outputs ?? []
        outputs.forEach((o, j) => {
          if (!o.name || !o.dose) return
          const idx = formulaIdx
          formulaIdx += 1
          schedule(emitAt + j * 220 * K, () => revealFormula(idx))
        })
        if (s.holdLabel && s.holdText) {
          const idx = formulaIdx
          formulaIdx += 1
          schedule(emitAt, () => revealFormula(idx))
        }
        t += 760 * K + outputs.length * 220 * K + 300 * K
      })

      // divider
      const dividerIdx = formulaIdx
      formulaIdx += 1
      schedule(t, () => revealFormula(dividerIdx))
      t += 360 * K

      support.forEach((o, i) => {
        if (!o.name || !o.dose) return
        const idx = formulaIdx
        formulaIdx += 1
        schedule(t + i * 240 * K, () => revealFormula(idx))
      })
      t += support.length * 240 * K + 220 * K

      schedule(t + 150 * K, finish)
    }

    let ran = false
    function go() {
      if (ran) return
      ran = true
      run()
    }

    let io: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      const isMobile = window.matchMedia('(max-width:900px)').matches
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              go()
              io?.disconnect()
            }
          })
        },
        { threshold: isMobile ? 0.01 : 0.3, rootMargin: isMobile ? '0px 0px 14% 0px' : '0px' },
      )
      io.observe(demo)
    } else {
      go()
    }

    return () => {
      io?.disconnect()
      timers.forEach((t) => clearTimeout(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSignals, support, formulaRows.length, T])

  let gutRowCounter = -1
  let bloodRowCounter = -1
  let formulaRowCounter = -1

  return (
    <section className="brf" ref={sectionRef as React.RefObject<HTMLElement>}>
      <style jsx>{`
        .brf {
          background: linear-gradient(180deg, #f3efe6 0%, #f0ebe0 100%);
          padding-block: clamp(72px, 10vw, 124px);
          /* Base body font is Inter (app global is Geist, which otherwise leaks
             into the lede/gut names/subs). Headings set Instrument Sans and the
             mono captions set JetBrains Mono explicitly. */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .brf-wrap {
          max-width: 1160px;
          margin-inline: auto;
          padding-inline: clamp(20px, 5vw, 72px);
        }
        .brf-bhd :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1.04;
          font-size: clamp(2rem, 4.4vw, 3.2rem);
          max-width: 20ch;
          color: #12314d;
          margin: 0;
        }
        .brf-lede {
          color: rgba(18, 49, 77, 0.55);
          font-size: clamp(1.08rem, 1.5vw, 1.28rem);
          margin-top: 20px;
          max-width: 54ch;
          line-height: 1.5;
        }
        .brf-demo {
          margin-top: clamp(40px, 5vw, 60px);
          display: grid;
          grid-template-columns: 1fr 0.94fr;
          gap: 26px;
          align-items: start;
        }
        .brf-read-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .brf-reading {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 20px;
          background: #fff;
          padding: clamp(22px, 2.6vw, 32px);
          box-shadow:
            0 1px 2px rgba(18, 49, 77, 0.04),
            0 30px 66px -50px rgba(18, 49, 77, 0.28);
        }
        .brf-rd-h {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(1.35rem, 2.4vw, 1.7rem);
          letter-spacing: -0.02em;
          color: #12314d;
          margin: 0;
        }
        .brf-rd-cs {
          color: rgba(18, 49, 77, 0.4);
          font-size: 14px;
          margin-top: 6px;
        }
        .brf-rd-list {
          margin-top: 18px;
        }
        .brf-rd-row {
          padding: 18px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          opacity: 0;
          transform: translateY(8px);
          transition:
            opacity 0.5s ease,
            transform 0.5s ease;
        }
        .brf-rd-row:first-child {
          border-top: none;
          padding-top: 6px;
        }
        .brf-rd-row.in {
          opacity: 1;
          transform: none;
        }
        .brf-gut-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .brf-gut-name {
          font-weight: 600;
          color: #12314d;
          font-size: 1.08rem;
          letter-spacing: -0.01em;
        }
        .brf-gut-pill {
          font-size: 12.5px;
          font-weight: 500;
          padding: 4px 13px;
          border-radius: 100px;
          white-space: nowrap;
          flex: none;
          line-height: 1.4;
        }
        .brf-gut-pill.low {
          background: rgba(176, 131, 43, 0.14);
          color: #8a6a24;
        }
        .brf-gut-pill.ok {
          background: rgba(10, 143, 176, 0.12);
          color: #0a8fb0;
        }
        .brf-gut-sub {
          color: rgba(18, 49, 77, 0.4);
          font-size: 13px;
          margin-top: 5px;
          max-width: 44ch;
        }
        .brf-gut-bar {
          position: relative;
          height: 8px;
          border-radius: 6px;
          background: #e5ecf0;
          margin-top: 14px;
          overflow: hidden;
        }
        .brf-gut-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          border-radius: 6px;
          transition: width 0.9s cubic-bezier(0.5, 0, 0.15, 1);
          display: block;
        }
        .brf-gut-fill.low {
          background: #b0832b;
        }
        .brf-gut-fill.ok {
          background: #0a8fb0;
        }
        .brf-blood {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 20px;
          background: linear-gradient(180deg, #f5f9fb, #eef4f7);
          padding: clamp(22px, 2.6vw, 30px);
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.6s ease,
            transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .brf-blood.in {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .brf-blood,
          .brf-rd-row,
          .brf-blood-row,
          .brf-fm-row {
            transition: none;
          }
        }
        .brf-blood-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .brf-blood-h {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(1.2rem, 2vw, 1.45rem);
          letter-spacing: -0.02em;
          color: #12314d;
          margin: 0;
        }
        .brf-blood-badge {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0e2740;
          border: 1px solid #aaea42;
          background: #c6ff5b;
          padding: 4px 9px;
          border-radius: 6px;
          white-space: nowrap;
          flex: none;
        }
        .brf-blood-cs {
          color: rgba(18, 49, 77, 0.4);
          font-size: 13.5px;
          margin-top: 6px;
        }
        .brf-blood-list {
          margin-top: 14px;
        }
        .brf-blood-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
          opacity: 0;
          transform: translateY(8px);
          transition:
            opacity 0.5s ease,
            transform 0.5s ease;
        }
        .brf-blood-row:first-child {
          border-top: none;
        }
        .brf-blood-row.in {
          opacity: 1;
          transform: none;
        }
        .brf-blood-name {
          font-weight: 500;
          color: #12314d;
          font-size: 1.02rem;
        }
        .brf-blood-meas {
          color: rgba(18, 49, 77, 0.4);
          font-size: 14px;
        }
        .brf-blood-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding-top: 15px;
          border-top: 1px solid rgba(18, 49, 77, 0.07);
        }
        .brf-blood-note {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          flex-wrap: wrap;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          letter-spacing: 0.02em;
        }
        .brf-blood-note b {
          font-weight: 700;
          color: #0e2740;
          background: #c6ff5b;
          padding: 2px 7px;
          border-radius: 5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 9px;
          font-family: 'Inter', sans-serif;
        }
        .brf-formula {
          position: sticky;
          top: 24px;
          border-radius: 20px;
          background: #0e2740;
          color: #fff;
          padding: clamp(20px, 2.4vw, 28px);
          overflow: hidden;
          isolation: isolate;
          box-shadow: 0 44px 84px -48px rgba(18, 49, 77, 0.7);
        }
        .brf-formula::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background: radial-gradient(78% 58% at 74% 6%, rgba(10, 143, 176, 0.3), transparent 62%);
          opacity: 0.35;
          transition: opacity 0.6s;
        }
        .brf-formula.building::before {
          animation: brf-fmpulse 2.6s ease-in-out infinite;
        }
        .brf-formula.done::before {
          opacity: 0.5;
        }
        @keyframes brf-fmpulse {
          0%,
          100% {
            opacity: 0.32;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes brf-fmglow {
          0% {
            filter: drop-shadow(0 0 0 rgba(91, 192, 216, 0));
          }
          30% {
            filter: drop-shadow(0 0 7px rgba(91, 192, 216, 0.7));
          }
          100% {
            filter: drop-shadow(0 0 0 rgba(91, 192, 216, 0));
          }
        }
        .brf-fm-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .brf-fm-head .brf-t {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 1.14rem;
          color: #fff;
        }
        .brf-fm-rows {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 96px;
        }
        .brf-fm-empty {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
          padding: 8px 0;
        }
        .brf-fm-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          opacity: 0;
          transform: translateY(9px);
          transition:
            opacity 0.5s ease,
            transform 0.5s ease;
        }
        .brf-fm-row.in {
          opacity: 1;
          transform: none;
        }
        .brf-fm-row.glow {
          animation: brf-fmglow 1s ease;
        }
        .brf-fm-row .brf-n {
          font-size: 13.5px;
          color: #dce6f2;
        }
        .brf-fm-row .brf-d {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.55);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
        .brf-fm-row.hold .brf-n {
          color: rgba(255, 255, 255, 0.55);
        }
        .brf-fm-row.hold .brf-d {
          font-style: italic;
        }
        .brf-fm-row.brf-div {
          margin-top: 5px;
          padding-top: 9px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .brf-fm-row.brf-div .brf-n {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .brf-fm-row.brf-more {
          margin-top: 2px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .brf-fm-row.brf-more .brf-n {
          color: #b7c6da;
          font-size: 12.5px;
        }
        .brf-fm-row.brf-more .brf-d {
          font-size: 10.5px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }
        .brf-fm-foot {
          margin-top: 18px;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .brf-fm-count {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
          font-variant-numeric: tabular-nums;
        }
        .brf-fm-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4em;
          font-weight: 500;
          font-size: 13px;
          color: #5bc0d8;
          text-decoration: none;
          border-bottom: 1px solid rgba(91, 192, 216, 0.5);
          padding-bottom: 2px;
          transition: gap 0.16s ease;
        }
        .brf-fm-link:hover {
          gap: 0.7em;
        }
        .brf-cap {
          margin-top: 22px;
          font-size: 12px;
          color: rgba(18, 49, 77, 0.4);
          /* Mono caption in the mockup (.cap uses --mono). */
          font-family: 'JetBrains Mono', ui-monospace, monospace;
        }
        @media (max-width: 900px) {
          .brf-demo {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .brf-formula {
            position: static;
          }
        }
      `}</style>

      <div className="brf-wrap">
        <div className="brf-bhd">
          {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
          {lede && <p className="brf-lede">{lede}</p>}
        </div>

        <div className="brf-demo" ref={demoRef}>
          <div className="brf-read-col">
            <div className="brf-reading">
              <div>
                <h3 className="brf-rd-h">{readingTitle}</h3>
                <p className="brf-rd-cs">{readingSubtitle}</p>
              </div>
              <div className="brf-rd-list">
                {gutSignals.map((s, i) => {
                  gutRowCounter += 1
                  const idx = gutRowCounter
                  return (
                    <div
                      className="brf-rd-row"
                      key={i}
                      ref={(el) => {
                        gutRowRefs.current[idx] = el
                      }}
                    >
                      <div className="brf-gut-top">
                        <span className="brf-gut-name">{s.gutName}</span>
                        {s.pillLabel && <span className={`brf-gut-pill ${s.pillVariant || 'low'}`}>{s.pillLabel}</span>}
                      </div>
                      {s.gutSub && <p className="brf-gut-sub">{s.gutSub}</p>}
                      <div className="brf-gut-bar">
                        <span
                          className={`brf-gut-fill ${s.pillVariant || 'low'}`}
                          ref={(el) => {
                            gutFillRefs.current[idx] = el
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {bloodSignals.length > 0 && (
              <div className="brf-blood" ref={bloodCardRef}>
                <div className="brf-blood-head">
                  <h3 className="brf-blood-h">{bloodTitle}</h3>
                  {bloodBadge && <span className="brf-blood-badge">{bloodBadge}</span>}
                </div>
                {bloodSubtitle && <p className="brf-blood-cs">{bloodSubtitle}</p>}
                <div className="brf-blood-list">
                  {bloodSignals.map((s, i) => {
                    bloodRowCounter += 1
                    const idx = bloodRowCounter
                    return (
                      <div
                        className="brf-blood-row"
                        key={i}
                        ref={(el) => {
                          bloodRowRefs.current[idx] = el
                        }}
                      >
                        <span className="brf-blood-name">{s.bloodName}</span>
                        <span className="brf-blood-meas">{bloodMeasuredLabel}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="brf-blood-foot">
                  <span className="brf-blood-note">
                    {bloodNotePrefix} <b>{bloodNoteBadge}</b> · {bloodNoteSuffix}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="brf-formula" ref={formulaCardRef}>
            <div className="brf-fm-head">
              <span className="brf-t">{formulaTitle}</span>
            </div>
            <div className="brf-fm-rows">
              {!anyFormulaRowShown && formulaEmptyText && <span className="brf-fm-empty">{formulaEmptyText}</span>}
              {formulaRows.map((row, i) => {
                formulaRowCounter += 1
                const idx = formulaRowCounter
                const cls = ['brf-fm-row']
                if (row.type === 'hold') cls.push('hold')
                if (row.type === 'divider') cls.push('brf-div')
                if (row.type === 'more') cls.push('brf-more')
                return (
                  <div
                    className={cls.join(' ')}
                    key={i}
                    ref={(el) => {
                      formulaRowRefs.current[idx] = el
                    }}
                  >
                    <span className="brf-n">{row.name}</span>
                    {row.type !== 'divider' && <span className="brf-d">{row.dose}</span>}
                  </div>
                )
              })}
            </div>
            <div className="brf-fm-foot">
              <span className="brf-fm-count" ref={formulaCountRef}>
                {formatComponentCount(0, T)}
              </span>
              {formulaLinkLabel && (
                <a className="brf-fm-link" href={formulaLinkUrl || '#'}>
                  {formulaLinkLabel}
                </a>
              )}
            </div>
          </div>
        </div>

        {captionText && <p className="brf-cap">{captionText}</p>}
      </div>
    </section>
  )
}
