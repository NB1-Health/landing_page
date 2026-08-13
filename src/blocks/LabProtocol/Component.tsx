'use client'

import React, { useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import type { AppLocale } from '@/i18n/config'
import { getProtocolStrings } from './i18n'

type Chip = { label?: string | null }
type Layer = {
  iconSvg?: string | null
  sourceLabel?: string | null
  name?: string | null
  body?: string | null
  chips?: Chip[] | null
  hasMoreChip?: boolean | null
  badgeLabel?: string | null
  badgeVariant?: 'plan' | 'advanced' | null
  highlighted?: boolean | null
}

export type LabProtocolBlockType = {
  blockType?: 'labProtocol'
  eyebrow?: string | null
  heading?: DefaultTypedEditorState | null
  lede?: string | null
  driverLabel?: string | null
  driverGutLabel?: string | null
  driverGutNote?: string | null
  driverRestLabel?: string | null
  driverIntakeLabel?: string | null
  driverGutPercent?: number | null
  layers?: Layer[] | null
  closingText?: DefaultTypedEditorState | null
}

export const LabProtocolComponent: React.FC<LabProtocolBlockType & { locale?: AppLocale }> = ({
  locale,
  eyebrow,
  heading,
  lede,
  driverLabel,
  driverGutLabel,
  driverGutNote,
  driverRestLabel,
  driverIntakeLabel,
  driverGutPercent,
  layers,
  closingText,
}) => {
  const T = getProtocolStrings(locale)
  const rows = layers ?? []
  const gutPct = driverGutPercent ?? 65
  const sectionRef = useRef<HTMLElement | null>(null)
  useReveal(sectionRef, '.eyebrow, h2, .lede, .driver, .layers')

  return (
    <section
      className="lab-protocol"
      id="protocol"
      style={{ scrollMarginTop: 80 }}
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <style jsx>{`
        .lab-protocol {
          --card: #ffffff;
          --border: rgba(18, 49, 77, 0.1);
          --ink: #12314d;
          --ink-soft: rgba(18, 49, 77, 0.7);
          --ink-faint: rgba(18, 49, 77, 0.48);
          --accent: #0a8fb0;
          --gold-bg: #fbefd2;
          --gold-ink: #a97d14;
          --gold-line: #e8d49a;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          color: var(--ink);
          background: #fff;
          padding: 66px 0;
        }
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .eyebrow::before {
          content: '';
          width: 28px;
          height: 1.5px;
          background: var(--accent);
        }
        .lab-protocol :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.08;
          letter-spacing: -0.015em;
          margin: 0 0 20px;
        }
        .lab-protocol :global(em) {
          font-style: normal;
          color: var(--accent);
        }
        .lede {
          font-size: 17px;
          line-height: 1.62;
          color: var(--ink-soft);
          max-width: 66ch;
        }
        .driver {
          margin-top: 38px;
        }
        .driver-lab {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 11px;
        }
        .driver-key {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 13px;
        }
        .dk {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          min-width: 0;
        }
        .dk b {
          font-weight: 700;
          color: var(--ink);
        }
        .dk small {
          font-size: 14px;
          color: var(--ink-faint);
        }
        .dk i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: none;
          display: inline-block;
        }
        .dot-gut {
          background: #1c4f6b;
        }
        .dot-goals {
          background: #aebdc7;
        }
        .bar {
          display: flex;
          gap: 10px;
          height: 15px;
        }
        .seg {
          border-radius: 999px;
        }
        .seg-gut {
          background: linear-gradient(90deg, #0e2740, #2c7da0);
        }
        .seg-goals {
          flex: 1;
          background: linear-gradient(90deg, #bcc8d1, #a9b8c2);
        }
        .layers {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .layer {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 24px;
          align-items: center;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px 28px;
        }
        .layer.adv {
          border-color: var(--gold-line);
          background: linear-gradient(120deg, #fffdf8, #ffffff);
        }
        .l-ic {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: #e7f1f7;
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex: none;
        }
        .layer.adv .l-ic {
          background: var(--gold-bg);
          color: var(--gold-ink);
        }
        .l-ic :global(svg) {
          width: 25px;
          height: 25px;
        }
        .l-src {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 5px;
        }
        .layer.adv .l-src {
          color: var(--gold-ink);
        }
        .l-name {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 7px;
        }
        .l-body {
          font-size: 14.5px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin-bottom: 13px;
          max-width: 60ch;
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .chip {
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-soft);
          background: #f7fafc;
          border: 1px solid var(--border);
          padding: 5px 11px;
          border-radius: 999px;
        }
        .chip.more {
          background: transparent;
          border: 1px dashed var(--border);
          color: var(--ink-faint);
        }
        .badge {
          align-self: start;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .badge.b-plan {
          background: #edf0f3;
          color: rgba(18, 49, 77, 0.62);
        }
        .badge.b-adv {
          background: var(--gold-bg);
          color: var(--gold-ink);
        }
        .rule2 {
          margin-top: 26px;
          font-size: 16px;
          line-height: 1.55;
          color: var(--ink-soft);
        }
        .rule2 :global(strong) {
          color: var(--ink);
          font-weight: 600;
        }
        @media (max-width: 860px) {
          .wrap {
            padding: 0 20px;
          }
          .layer {
            grid-template-columns: auto 1fr;
          }
          .layer .badge {
            grid-column: 2;
          }
        }
        @media (max-width: 560px) {
          .layer {
            grid-template-columns: auto 1fr auto;
            grid-template-areas: 'ic src badge' 'name name name' 'body body body' 'chips chips chips';
            column-gap: 12px;
            row-gap: 0;
            align-items: center;
            padding: 18px;
          }
          .layer > :global(div) {
            display: contents;
          }
          .l-ic {
            grid-area: ic;
            width: 40px;
            height: 40px;
          }
          .l-ic :global(svg) {
            width: 22px;
            height: 22px;
          }
          .l-src {
            grid-area: src;
            align-self: center;
            margin-bottom: 0;
          }
          .layer .badge {
            grid-area: badge;
            align-self: center;
          }
          .l-name {
            grid-area: name;
            font-size: 18px;
            margin-top: 15px;
            margin-bottom: 7px;
          }
          .l-body {
            grid-area: body;
            margin-bottom: 0;
          }
          .chips {
            grid-area: chips;
            margin-top: 14px;
          }
          .driver {
            display: flex;
            flex-direction: column;
          }
          .driver-lab {
            order: 0;
          }
          .bar {
            order: 1;
          }
          .driver-key {
            order: 2;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            margin-top: 13px;
          }
          .driver-key .dk {
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }
          .driver-key .dk:last-child {
            flex-direction: row-reverse;
          }
        }
      `}</style>

      <div className="wrap">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
        {lede && <p className="lede">{lede}</p>}

        <div className="driver">
          {driverLabel && <div className="driver-lab">{driverLabel}</div>}
          <div className="driver-key">
            <span className="dk">
              <i className="dot-gut" />
              <b>{driverGutLabel}</b>
              <small>{driverGutNote}</small>
            </span>
            <span className="dk">
              <small>{driverRestLabel}</small>
              <b>{driverIntakeLabel}</b>
              <i className="dot-goals" />
            </span>
          </div>
          <div className="bar">
            <div className="seg seg-gut" style={{ flex: `0 0 ${gutPct}%` }} />
            <div className="seg seg-goals" />
          </div>
        </div>

        <div className="layers">
          {rows.map((layer, i) => (
            <div className={['layer', layer.highlighted ? 'adv' : ''].join(' ')} key={i}>
              <span className="l-ic">
                {layer.iconSvg && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: layer.iconSvg }} />
                )}
              </span>
              <div>
                {layer.sourceLabel && <div className="l-src">{layer.sourceLabel}</div>}
                <div className="l-name">{layer.name}</div>
                {layer.body && <div className="l-body">{layer.body}</div>}
                {((layer.chips?.length ?? 0) > 0 || layer.hasMoreChip) && (
                  <div className="chips">
                    {layer.chips?.map((c, ci) => (
                      <span className="chip" key={ci}>
                        {c.label}
                      </span>
                    ))}
                    {layer.hasMoreChip && <span className="chip more">{T.moreChip}</span>}
                  </div>
                )}
              </div>
              {layer.badgeLabel && (
                <span className={['badge', layer.badgeVariant === 'advanced' ? 'b-adv' : 'b-plan'].join(' ')}>
                  {layer.badgeLabel}
                </span>
              )}
            </div>
          ))}
        </div>

        {closingText && (
          <div className="rule2">
            <RichText data={closingText as any} enableGutter={false} enableProse={false} />
          </div>
        )}
      </div>
    </section>
  )
}
