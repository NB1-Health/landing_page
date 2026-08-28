'use client'

import React, { useEffect, useState } from 'react'
import RichText from '@/components/RichText'
import { getDictionary } from '@/i18n/getDictionary'

type ContentBlock = {
  type?: string
  // clause
  body?: any
  // card
  title?: string | null
  tableCaption?: string | null
  columns?: { heading?: string | null }[] | null
  rows?: { cells?: { value?: string | null }[] | null }[] | null
  footnote?: string | null
  // key/value card + definition list
  pairRows?: { left?: string | null; right?: any }[] | null
}
type Section = {
  title?: string | null
  tocLabel?: string | null
  numberLabel?: string | null
  content?: ContentBlock[] | null
}

type Props = {
  title?: string | null
  subheading?: string | null
  showSummary?: boolean | null
  summaryHeading?: string | null
  summaryNote?: string | null
  summaryItems?: { text?: any }[] | null
  sections?: Section[] | null
  calloutHeading?: string | null
  calloutBody?: string | null
  calloutRows?: { label?: string | null; value?: string | null; href?: string | null }[] | null
  locale?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export const LegalDocComponent: React.FC<Props> = ({
  title,
  subheading,
  showSummary,
  summaryHeading,
  summaryNote,
  summaryItems,
  sections,
  calloutHeading,
  calloutBody,
  calloutRows,
  locale,
}) => {
  const dict = getDictionary(locale)
  const secs = sections ?? []
  const [active, setActive] = useState<string>('')

  // Assign automatic numbers. A section with a `numberLabel` override (e.g.
  // "6 — Annex") is not counted, stays out of the table of contents, and its
  // clauses render "—" instead of a number.
  let autoCounter = 0
  const computed = secs.map((s, si) => {
    if (s.numberLabel) {
      return { s, si, id: `annex-${si}`, badge: s.numberLabel, num: null as number | null, inToc: false }
    }
    autoCounter += 1
    return { s, si, id: `s${autoCounter}`, badge: String(autoCounter), num: autoCounter as number | null, inToc: true }
  })
  const tocEntries = computed.filter((c) => c.inToc)

  // Scroll-spy: the active entry is the LAST section whose top has passed the
  // header line (~100px). (Picking the "topmost intersecting" was off by one —
  // a tall section scrolled above still intersected and won.)
  useEffect(() => {
    const ids = tocEntries.map((c) => c.id)
    if (!ids.length) return
    const offset = 100
    let raf = 0
    const update = () => {
      raf = 0
      let current = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top - offset <= 1) current = id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs.length])

  const toc = tocEntries.map((c) => ({
    id: c.id,
    n: pad(c.num as number),
    label: c.s.tocLabel || c.s.title || '',
  }))

  return (
    <>
      <section className="lg-hero">
        <div className="lg-hero-in">
          <h1>{title}</h1>
          {subheading && <p className="lg-hero-sub">{subheading}</p>}
        </div>
      </section>

      <div className="lg-body">
        {/* sticky TOC (desktop) */}
        <aside className="lg-toc" aria-label={dict.header.onThisPage}>
          <div className="lg-toc-label">{dict.header.onThisPage}</div>
          <nav>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`} className={active === t.id ? 'active' : ''}>
                <span className="n">{t.n}</span> {t.label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="lg-content">
          {/* mobile TOC */}
          <details className="lg-toc-m">
            <summary>
              {dict.header.onThisPage}
              <svg
                className="chev"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <nav>
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`}>
                  <span className="n">{t.n}</span> {t.label}
                </a>
              ))}
            </nav>
          </details>

          {showSummary && (summaryHeading || (summaryItems && summaryItems.length > 0)) && (
            <div className="lg-summary">
              {summaryHeading && <h2>{summaryHeading}</h2>}
              {summaryNote && <p className="lg-sum-note">{summaryNote}</p>}
              {summaryItems && summaryItems.length > 0 && (
                <ul className="lg-sum-list">
                  {summaryItems.map((it, i) => (
                    <li key={i}>
                      {it.text && (
                        <RichText data={it.text} enableGutter={false} enableProse={false} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {computed.map(({ s, si, id, badge, num }) => {
            let cn = 0
            return (
              <section className="lg-sec" id={id} key={si}>
                <h2 className="lg-h2">
                  <span className={`lg-h2-num${num === null ? ' is-label' : ''}`}>{badge}</span>
                  {s.title}
                </h2>
                <div className="lg-sec-content">
                  {(s.content ?? []).map((blk, ci) => {
                    if (blk.type === 'card') {
                      const cols = blk.columns ?? []
                      const rows = blk.rows ?? []
                      const showTable = cols.length > 0 || rows.length > 0
                      // First column aligns left, last right, the rest centered.
                      const colCount = Math.max(
                        cols.length,
                        ...rows.map((r) => (r.cells ?? []).length),
                        0,
                      )
                      // 1 col → left; 2 cols → [left, center] (centre-right, like the
                      // design); 3+ cols → first left, last right, the rest centred.
                      const align = (i: number): 'left' | 'right' | 'center' => {
                        if (i === 0) return 'left'
                        if (colCount === 2) return 'center'
                        if (i === colCount - 1) return 'right'
                        return 'center'
                      }
                      return (
                        <div className="lg-ctype" key={ci}>
                          {blk.title && <h4>{blk.title}</h4>}
                          {blk.body && (
                            <div className="lg-ctype-body">
                              <RichText data={blk.body} enableGutter={false} enableProse={false} />
                            </div>
                          )}
                          {showTable && (
                            <table className="lg-ctable">
                              {blk.tableCaption && <caption>{blk.tableCaption}</caption>}
                              {cols.length > 0 && (
                                <thead>
                                  <tr>
                                    {cols.map((c, i) => (
                                      <th key={i} style={{ textAlign: align(i) }}>
                                        {c.heading}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                              )}
                              <tbody>
                                {rows.map((r, ri) => (
                                  <tr key={ri}>
                                    {(r.cells ?? []).map((cell, i) => (
                                      <td key={i} style={{ textAlign: align(i) }}>
                                        {cell.value}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {blk.footnote && <p className="lg-cnote">{blk.footnote}</p>}
                        </div>
                      )
                    }
                    if (blk.type === 'form') {
                      return (
                        <div className="lg-form" key={ci}>
                          {blk.title && <p className="lg-form-title">{blk.title}</p>}
                          {blk.body && (
                            <div className="lg-form-body">
                              <RichText data={blk.body} enableGutter={false} enableProse={false} />
                            </div>
                          )}
                          {blk.footnote && <p className="lg-form-note">{blk.footnote}</p>}
                        </div>
                      )
                    }
                    if (blk.type === 'keyvalue') {
                      return (
                        <div className="lg-dcard" key={ci}>
                          {blk.title && <h4>{blk.title}</h4>}
                          {(blk.pairRows ?? []).map((r, i) => (
                            <div className="lg-drow" key={i}>
                              <div className="k">{r.left}</div>
                              <div className="v">
                                {r.right && (
                                  <RichText
                                    data={r.right}
                                    enableGutter={false}
                                    enableProse={false}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    if (blk.type === 'definitions') {
                      return (
                        <div className="lg-rights" key={ci}>
                          {(blk.pairRows ?? []).map((r, i) => (
                            <div className="lg-right" key={i}>
                              <div className="rt">{r.left}</div>
                              <div className="rd">
                                {r.right && (
                                  <RichText
                                    data={r.right}
                                    enableGutter={false}
                                    enableProse={false}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    // default: numbered clause
                    cn += 1
                    return (
                      <div className="lg-clause" key={ci}>
                        <span className="lg-cn">{num === null ? '—' : `${num}.${cn}`}</span>
                        <div className="lg-clause-body">
                          {blk.body && (
                            <RichText data={blk.body} enableGutter={false} enableProse={false} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {calloutHeading && (
            <div className="lg-callout">
              <h3>{calloutHeading}</h3>
              {calloutBody && <p>{calloutBody}</p>}
              {calloutRows && calloutRows.length > 0 && (
                <div className="lg-co-rows">
                  {calloutRows.map((r, i) => (
                    <div className="lg-co-row" key={i}>
                      <b>{r.label}</b>
                      <span>
                        {r.href ? <a href={r.href}>{r.value}</a> : r.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .lg-hero {
          position: relative;
          background: #f7fafc;
          overflow: hidden;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(64% 84% at 90% -12%, rgba(10, 143, 176, 0.12) 0%, transparent 56%),
            radial-gradient(56% 74% at -4% 112%, rgba(120, 162, 196, 0.1) 0%, transparent 58%);
        }
        .lg-hero-in {
          position: relative;
          z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
          padding: 62px 40px 52px;
        }
        .lg-hero h1 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4.6vw, 54px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #12314d;
          margin: 0;
        }
        .lg-hero-sub {
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.58;
          color: rgba(18, 49, 77, 0.7);
          margin: 20px 0 0;
          max-width: 600px;
          text-wrap: pretty;
        }

        .lg-body {
          max-width: 1180px;
          margin: 0 auto;
          padding: 64px 40px 96px;
          display: grid;
          grid-template-columns: 248px 1fr;
          gap: 64px;
          align-items: start;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .lg-toc {
          position: sticky;
          top: 92px;
        }
        .lg-toc-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          margin-bottom: 16px;
          padding-left: 14px;
        }
        .lg-toc nav {
          display: flex;
          flex-direction: column;
        }
        .lg-toc a {
          display: flex;
          gap: 11px;
          align-items: baseline;
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.4;
          color: rgba(18, 49, 77, 0.55);
          text-decoration: none;
          padding: 8px 14px;
          border-left: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          border-radius: 0 8px 8px 0;
        }
        .lg-toc a .n {
          font-size: 11px;
          font-weight: 700;
          color: rgba(18, 49, 77, 0.4);
          flex: none;
          width: 18px;
          font-variant-numeric: tabular-nums;
          transition: color 0.15s;
        }
        .lg-toc a:hover {
          color: #12314d;
          background: rgba(18, 49, 77, 0.035);
        }
        .lg-toc a.active {
          color: #0a8fb0;
          border-left-color: #0a8fb0;
          font-weight: 600;
        }
        .lg-toc a.active .n {
          color: #0a8fb0;
        }
        .lg-content {
          min-width: 0;
          max-width: 760px;
        }

        .lg-summary {
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(10, 143, 176, 0.22);
          border-radius: 16px;
          padding: 24px 26px;
          margin-bottom: 48px;
        }
        .lg-summary h2 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: #12314d;
          margin: 0 0 6px;
        }
        .lg-summary .lg-sum-note {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin: 0 0 16px;
        }
        .lg-sum-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 11px;
        }
        .lg-sum-list li {
          position: relative;
          padding-left: 24px;
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.7);
          text-wrap: pretty;
        }
        .lg-sum-list li::before {
          content: '';
          position: absolute;
          left: 2px;
          top: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0a8fb0;
        }
        .lg-sum-list li :global(p) {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.7);
        }
        .lg-sum-list li :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .lg-sum-list li :global(a) {
          color: inherit;
          text-decoration: none;
        }

        .lg-sec {
          padding-top: 14px;
          margin-top: 42px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          scroll-margin-top: 92px;
        }
        .lg-sec:first-of-type {
          border-top: none;
          margin-top: 0;
        }
        .lg-h2 {
          display: flex;
          align-items: baseline;
          gap: 14px;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.7vw, 28px);
          line-height: 1.12;
          letter-spacing: -0.025em;
          color: #12314d;
          margin: 0 0 22px;
        }
        .lg-h2 .lg-h2-num {
          flex: none;
          font-size: 14px;
          font-weight: 700;
          color: #0a8fb0;
          background: rgba(10, 143, 176, 0.08);
          border-radius: 9px;
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform: translateY(-2px);
          font-variant-numeric: tabular-nums;
        }
        .lg-h2 .lg-h2-num.is-label {
          width: auto;
          height: auto;
          padding: 4px 10px;
          font-size: 12px;
          line-height: 1.15;
          text-align: center;
        }
        .lg-sec-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lg-clause {
          display: grid;
          grid-template-columns: 46px 1fr;
          gap: 6px;
        }
        .lg-cn {
          font-size: 13px;
          font-weight: 700;
          color: #0a8fb0;
          font-variant-numeric: tabular-nums;
          padding-top: 1px;
          letter-spacing: 0.01em;
        }
        .lg-clause-body :global(p) {
          font-size: 15.5px;
          line-height: 1.68;
          color: rgba(18, 49, 77, 0.7);
          margin: 0;
          text-wrap: pretty;
        }
        .lg-clause-body :global(p + p) {
          margin-top: 11px;
        }
        .lg-clause-body :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .lg-clause-body :global(a) {
          color: inherit;
          text-decoration: none;
        }

        /* bordered card (no number) */
        .lg-ctype {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 14px;
          padding: 20px 24px;
          background: #fff;
          box-shadow: 0 16px 34px -30px rgba(18, 49, 77, 0.55);
        }
        .lg-ctype h4 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #12314d;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .lg-ctype-body :global(p) {
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.7);
          margin: 0;
          text-wrap: pretty;
        }
        .lg-ctype-body :global(p + p) {
          margin-top: 10px;
        }
        .lg-ctype-body :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .lg-ctype-body :global(a) {
          color: inherit;
          text-decoration: none;
        }
        .lg-ctable {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          table-layout: fixed;
        }
        .lg-ctable th,
        .lg-ctable td {
          overflow-wrap: anywhere;
        }
        .lg-ctable caption {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a8fb0;
          margin-bottom: 10px;
        }
        .lg-ctable th {
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          padding: 0 0 10px;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-ctable td {
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
          padding: 13px 0;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-ctable td:first-child {
          font-weight: 600;
          color: #12314d;
          font-variant-numeric: tabular-nums;
        }
        .lg-ctable tr:last-child td {
          border-bottom: none;
        }
        .lg-cnote {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          margin: 12px 0 0;
        }

        /* form / annex box */
        .lg-form {
          border: 1.5px solid rgba(18, 49, 77, 0.14);
          border-radius: 14px;
          padding: 28px 30px;
          font-size: 14px;
          line-height: 1.75;
          color: #12314d;
        }
        .lg-form-title {
          font-weight: 700;
          margin: 0 0 16px;
        }
        .lg-form-body :global(p) {
          margin: 0 0 8px;
          font-size: 14px;
          line-height: 1.75;
          color: #12314d;
          text-wrap: pretty;
        }
        .lg-form-body :global(b) {
          font-weight: 700;
        }
        .lg-form-body :global(a) {
          color: inherit;
          text-decoration: none;
        }
        .lg-form-note {
          margin: 16px 0 0;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
        }

        /* key/value card (Data / Purpose / Legal basis) */
        .lg-dcard {
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 14px;
          padding: 22px 24px;
          background: #fff;
          box-shadow: 0 16px 34px -30px rgba(18, 49, 77, 0.55);
        }
        .lg-dcard h4 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #12314d;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .lg-drow {
          display: grid;
          grid-template-columns: 132px 1fr;
          gap: 6px 20px;
          padding: 14px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-drow:first-of-type {
          border-top: none;
          padding-top: 8px;
        }
        .lg-drow .k {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a8fb0;
          padding-top: 3px;
        }
        .lg-drow .v {
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.7);
          text-wrap: pretty;
        }
        .lg-drow .v :global(p) {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.7);
        }
        .lg-drow .v :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .lg-drow .v :global(a) {
          color: inherit;
          text-decoration: none;
        }

        /* definition list (Right to information …) */
        .lg-rights {
          display: grid;
          gap: 12px;
          margin-top: 4px;
        }
        .lg-right {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 6px 20px;
          padding: 15px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
        }
        .lg-right:first-child {
          border-top: none;
        }
        .lg-right .rt {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #12314d;
          letter-spacing: -0.01em;
        }
        .lg-right .rd {
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.7);
          text-wrap: pretty;
        }
        .lg-right .rd :global(p) {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.7);
        }
        .lg-right .rd :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .lg-right .rd :global(a) {
          color: inherit;
          text-decoration: none;
        }

        /* closing contact callout (dark box) */
        .lg-callout {
          margin-top: 48px;
          background: #0e2740;
          border-radius: 18px;
          padding: 34px 36px;
          color: #fff;
        }
        .lg-callout h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }
        .lg-callout p {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
          margin: 0 0 18px;
          max-width: 520px;
        }
        /* Grid: etiket sütunu en geniş etikete göre büyür ama 140px'i geçmez
           (fit-content); aşan etiketler alt satıra sarar. Değerler tek ortak x'te
           hizalanır. display:contents ile her satırın b/span'i grid hücresi olur. */
        .lg-co-rows {
          display: grid;
          grid-template-columns: fit-content(140px) 1fr;
          column-gap: 20px;
          align-items: start;
        }
        .lg-co-row {
          display: contents;
        }
        .lg-co-row b {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #13a6cc;
          padding: 12px 0 11px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .lg-co-row span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.86);
          padding: 11px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          min-width: 0;
        }
        .lg-co-row:first-child b,
        .lg-co-row:first-child span {
          border-top: none;
        }
        .lg-callout a {
          color: #fff;
          text-decoration: none;
        }
        .lg-callout a:hover {
          color: #fff;
        }

        .lg-toc-m {
          display: none;
        }

        @media (max-width: 760px) {
          .lg-hero-in {
            padding: 48px 26px 40px;
          }
          .lg-body {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 36px 26px 80px;
            display: block;
          }
          .lg-toc {
            display: none;
          }
          .lg-content {
            max-width: none;
          }
          .lg-toc-m {
            display: block;
            margin-bottom: 36px;
            border: 1px solid rgba(18, 49, 77, 0.1);
            border-radius: 14px;
            overflow: hidden;
            background: #fff;
          }
          .lg-clause {
            grid-template-columns: 1fr;
            gap: 3px;
          }
          .lg-cn {
            padding-top: 0;
          }
          .lg-drow,
          .lg-right {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }

        .lg-toc-m summary {
          list-style: none;
          cursor: pointer;
          padding: 16px 18px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lg-toc-m summary::-webkit-details-marker {
          display: none;
        }
        .lg-toc-m summary .chev {
          transition: transform 0.2s;
          color: rgba(18, 49, 77, 0.4);
        }
        .lg-toc-m[open] summary .chev {
          transform: rotate(180deg);
        }
        .lg-toc-m nav {
          display: flex;
          flex-direction: column;
          padding: 4px 0 10px;
        }
        .lg-toc-m a {
          display: flex;
          gap: 11px;
          font-size: 14.5px;
          color: rgba(18, 49, 77, 0.7);
          text-decoration: none;
          padding: 11px 18px;
        }
        .lg-toc-m a .n {
          font-size: 12px;
          font-weight: 700;
          color: #0a8fb0;
          width: 20px;
          flex: none;
        }
      `}</style>
    </>
  )
}
