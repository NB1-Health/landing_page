'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import {
  COMPARISON_16S_INNER_SVG,
  COMPARISON_16S_VIEWBOX,
  COMPARISON_US_INNER_SVG,
  COMPARISON_US_VIEWBOX,
} from './art'
import { STATUS_LABELS, enumLabel } from '@/blocks/_shared/enumLabels'
import type { AppLocale } from '@/i18n/config'
import { getComparisonStrings } from './i18n'

type LegendItem = { label?: string | null; color?: string | null; dashed?: boolean | null }
type ComparisonNode = {
  name?: string | null
  job?: string | null
  status?: 'Active' | 'Low' | 'Missing' | null
}

export type LabComparisonBlockType = {
  blockType?: 'labComparison'
  heading?: DefaultTypedEditorState | null
  intro?: string | null
  hintText?: string | null
  leftTag?: string | null
  leftName?: string | null
  leftMethod?: string | null
  leftCaption?: string | null
  rightTag?: string | null
  rightName?: string | null
  rightMethod?: string | null
  legend?: LegendItem[] | null
  nodes?: ComparisonNode[] | null
  knowLeftLabel?: string | null
  knowLeftValue?: string | null
  knowRightLabel?: string | null
  knowRightValue?: string | null
  closingLeadIn?: string | null
  closingEmphasis?: string | null
  closingTail?: string | null
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function injectNodeData(svg: string, nodes: ComparisonNode[]): string {
  let i = 0
  return svg.replace(/data-n="[^"]*" data-j="[^"]*" data-s="[^"]*"/g, () => {
    const n = nodes[i]
    i += 1
    if (!n) return 'data-n="" data-j="" data-s="Missing"'
    return `data-n="${escapeAttr(n.name || '')}" data-j="${escapeAttr(n.job || '')}" data-s="${escapeAttr(n.status || 'Missing')}"`
  })
}

export const LabComparisonComponent: React.FC<LabComparisonBlockType & { locale?: AppLocale }> = ({
  locale,
  heading,
  intro,
  hintText,
  leftTag,
  leftName,
  leftMethod,
  leftCaption,
  rightTag,
  rightName,
  rightMethod,
  legend,
  nodes,
  knowLeftLabel,
  knowLeftValue,
  knowRightLabel,
  knowRightValue,
  closingLeadIn,
  closingEmphasis,
  closingTail,
}) => {
  const nodeRows = useMemo(() => nodes ?? [], [nodes])
  const usSvg = useMemo(() => injectNodeData(COMPARISON_US_INNER_SVG, nodeRows), [nodeRows])
  const T = useMemo(() => getComparisonStrings(locale), [locale])

  const figRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  useReveal(sectionRef, 'h2, .cmp2-set, .cmp2-fig, .cmp2-pay')
  const [popover, setPopover] = useState<{
    x: number
    y: number
    name: string
    job: string
    status: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'16s' | 'us'>('16s')

  const handleFigClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement
    const node = target.closest('.node.hero') as SVGCircleElement | null
    if (!node || !figRef.current) return
    e.stopPropagation()
    const fr = figRef.current.getBoundingClientRect()
    const nr = node.getBoundingClientRect()
    setPopover({
      x: nr.left + nr.width / 2 - fr.left,
      y: nr.top - fr.top,
      name: node.getAttribute('data-n') || '',
      job: node.getAttribute('data-j') || '',
      status: node.getAttribute('data-s') || '',
    })
  }, [])

  useEffect(() => {
    const hide = () => setPopover(null)
    document.addEventListener('click', hide)
    return () => document.removeEventListener('click', hide)
  }, [])

  return (
    <section
      className="lab-cmp"
      id="method"
      data-screen-label="Comparison"
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <style jsx>{`
        .lab-cmp {
          padding: 94px 0;
          background: #fff;
          scroll-margin-top: 84px;
          /* Base is --font (Inter); the labels/tags/legend inherit it. Display
             elements (h2, .cmp2-set, .cmp2-name, .cmp2-know .v) set Instrument
             Sans explicitly below. */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 32px;
          text-align: center;
        }
        .lab-cmp :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(32px, 4.4vw, 52px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          color: #12314d;
          text-align: left;
          text-wrap: balance;
        }
        .cmp2-set {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(19px, 2.3vw, 25px);
          line-height: 1.35;
          letter-spacing: -0.015em;
          color: #12314d;
          margin: 34px 0 0;
          text-align: left;
          text-wrap: balance;
        }
        .cmp2-tabs {
          display: none;
        }
        .cmp2-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 30px;
        }
        .cmp2-fig {
          margin: 0;
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 18px;
          padding: 22px 22px 18px;
          text-align: center;
        }
        .cmp2-fig.us {
          position: relative;
          border-color: rgba(10, 143, 176, 0.4);
          box-shadow: 0 22px 48px -32px rgba(10, 143, 176, 0.4);
        }
        .cmp2-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #12314d;
        }
        .cmp2-fig.us .cmp2-tag {
          color: #0a8fb0;
        }
        .cmp2-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: #12314d;
          margin: 4px 0 1px;
        }
        .cmp2-method {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          /* No text-transform: the values are fixed technical terms already
             cased for display ("16S rRNA", "SHOTGUN SEQUENCING"). Uppercasing
             would wrongly render "16S RRNA" — the mockup keeps "rRNA" lower. */
          color: #12314d;
        }
        .cmp2-svg {
          max-width: 250px;
          margin: 8px auto 0;
        }
        .cmp2-cap {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 12px;
          min-height: 40px;
        }
        .cmp2-svg :global(svg) {
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }
        .cmp2-svg :global(.halo) {
          transform-box: fill-box;
          transform-origin: center;
          opacity: 0.6;
          animation: cmpPulse 2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes cmpPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
          60% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
        .cmp2-svg :global(.node.hero) {
          cursor: pointer;
        }
        .cmp2-fig.us .cmp2-svg :global(.node.hero) {
          filter: drop-shadow(0 0 5px rgba(10, 143, 176, 0.95));
        }
        .cmp2-fig.us .cmp2-svg :global(.node.hero:hover) {
          stroke: #0e2740;
          stroke-width: 2.4;
        }
        @media (prefers-reduced-motion: reduce) {
          .cmp2-svg :global(.halo) {
            animation: none;
            opacity: 0.6;
          }
        }
        .cmp2-hint {
          font-size: 11.5px;
          font-weight: 700;
          color: #12314d;
          background: #c6ff5b;
          border-radius: 999px;
          padding: 5px 12px;
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .cmp2-pop {
          position: absolute;
          z-index: 6;
          width: 206px;
          background: #0e2740;
          color: #fff;
          border-radius: 11px;
          padding: 11px 13px;
          box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.55);
          text-align: left;
          transform: translate(-50%, -118%);
          pointer-events: none;
        }
        .cmp2-pop::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          border: 7px solid transparent;
          border-top-color: #0e2740;
        }
        .pp-n {
          font-weight: 600;
          font-style: italic;
          font-size: 14px;
        }
        .pp-j {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.82);
          margin-top: 3px;
          line-height: 1.4;
        }
        .pp-s {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-top: 7px;
        }
        .pp-s.s-active {
          color: #5bc0d8;
        }
        .pp-s.s-low {
          color: #e8b53a;
        }
        .pp-s.s-missing {
          color: #aeb9c2;
        }
        .cmp2-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 7px 14px;
          margin-top: 12px;
        }
        .cmp2-legend span {
          font-size: 11px;
          color: rgba(18, 49, 77, 0.55);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .cmp2-legend i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }
        .cmp2-know {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 24px;
        }
        .cmp2-know div {
          text-align: center;
        }
        .cmp2-know .k {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #12314d;
        }
        .cmp2-know .v {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #12314d;
          margin-top: 5px;
          line-height: 1.4;
        }
        .cmp2-know .us .v {
          color: #0a8fb0;
        }
        .cmp2-pay {
          font-size: clamp(16px, 1.9vw, 19px);
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          max-width: 60ch;
          margin: 56px 0 0;
          text-align: left;
          text-wrap: pretty;
        }
        .cmp2-pay :global(strong) {
          font-weight: 600;
          color: #12314d;
        }
        @media (max-width: 720px) {
          .cmp2-cols {
            grid-template-columns: 1fr;
          }
          .cmp2-know {
            gap: 18px;
            grid-template-columns: 1fr;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
          }
          .cmp2-tabs {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: 1fr;
            gap: 4px;
            background: #eaf0f4;
            padding: 4px;
            border-radius: 12px;
            max-width: 420px;
            margin: 26px auto 0;
          }
          .cmp2-tab {
            padding: 11px 6px;
            border: none;
            background: transparent;
            border-radius: 9px;
            font: inherit;
            font-size: 13.5px;
            font-weight: 600;
            color: rgba(18, 49, 77, 0.55);
            cursor: pointer;
            transition: 0.15s;
            -webkit-tap-highlight-color: transparent;
          }
          .cmp2-tab.active {
            background: #fff;
            color: #12314d;
            box-shadow: 0 1px 3px rgba(14, 39, 56, 0.13);
          }
          .cmp2-root[data-cmp='16s'] .cmp2-fig.us {
            display: none;
          }
          .cmp2-root[data-cmp='us'] .cmp2-fig:not(.us) {
            display: none;
          }
          .cmp2-root[data-cmp='16s'] .cmp2-know > div.us {
            display: none;
          }
          .cmp2-root[data-cmp='us'] .cmp2-know > div:not(.us) {
            display: none;
          }
          .cmp2-legend {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 14px;
            justify-content: start;
            max-width: 360px;
            margin-left: auto;
            margin-right: auto;
          }
        }
      `}</style>

      <div className="wrap cmp2-root" data-cmp={activeTab}>
        {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
        {intro && <p className="cmp2-set">{intro}</p>}

        <div className="cmp2-tabs" role="tablist">
          <button
            type="button"
            className={['cmp2-tab', activeTab === '16s' ? 'active' : ''].join(' ')}
            onClick={() => setActiveTab('16s')}
          >
            {T.tab16s}
          </button>
          <button
            type="button"
            className={['cmp2-tab', activeTab === 'us' ? 'active' : ''].join(' ')}
            onClick={() => setActiveTab('us')}
          >
            {T.tabUs}
          </button>
        </div>

        <div className="cmp2-cols">
          <figure className="cmp2-fig">
            {leftTag && <div className="cmp2-tag">{leftTag}</div>}
            {leftName && <div className="cmp2-name">{leftName}</div>}
            {leftMethod && <div className="cmp2-method">{leftMethod}</div>}
            <div className="cmp2-svg">
              <svg
                viewBox={COMPARISON_16S_VIEWBOX}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Every microbe as an identical grey dot"
                dangerouslySetInnerHTML={{ __html: COMPARISON_16S_INNER_SVG }}
              />
            </div>
            {/* Caption under the 16S figure. Hardcoded fallback for now — the
               CMS field (leftCaption) needs a DB migration that's currently
               blocked by unrelated local schema drift; once migrated, the CMS
               value overrides this. */}
            <div className="cmp2-cap">
              {leftCaption || T.caption}
            </div>
          </figure>

          <figure className="cmp2-fig us">
            {rightTag && <div className="cmp2-tag">{rightTag}</div>}
            {rightName && <div className="cmp2-name">{rightName}</div>}
            {rightMethod && <div className="cmp2-method">{rightMethod}</div>}
            <div className="cmp2-svg" ref={figRef} onClick={handleFigClick}>
              <svg
                viewBox={COMPARISON_US_VIEWBOX}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="The same microbes; the glowing ones are tappable"
                dangerouslySetInnerHTML={{ __html: usSvg }}
              />
            </div>
            {hintText && <div className="cmp2-hint">{hintText}</div>}
            <div className="cmp2-legend">
              {(legend ?? []).map((item, i) => (
                <span key={i}>
                  <i
                    style={
                      item.dashed
                        ? { background: 'transparent', border: '1.4px dashed #c2ccd3' }
                        : { background: item.color || '#000' }
                    }
                  />
                  {item.label}
                </span>
              ))}
            </div>
            {popover && (
              <div className="cmp2-pop" style={{ left: popover.x, top: popover.y }}>
                <div className="pp-n">{popover.name}</div>
                <div className="pp-j">{popover.job}</div>
                <div className={`pp-s s-${popover.status.toLowerCase()}`}>{enumLabel(STATUS_LABELS, popover.status, locale)}</div>
              </div>
            )}
          </figure>
        </div>

        <div className="cmp2-know">
          <div>
            {knowLeftLabel && <div className="k">{knowLeftLabel}</div>}
            {knowLeftValue && <div className="v">{knowLeftValue}</div>}
          </div>
          <div className="us">
            {knowRightLabel && <div className="k">{knowRightLabel}</div>}
            {knowRightValue && <div className="v">{knowRightValue}</div>}
          </div>
        </div>

        {(closingLeadIn || closingEmphasis || closingTail) && (
          <p className="cmp2-pay">
            {closingLeadIn} <strong>{closingEmphasis}</strong> {closingTail}
          </p>
        )}
      </div>
    </section>
  )
}
