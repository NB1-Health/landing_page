'use client'

import React, { useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

import { helpAnchor } from '../_shared/utils'

type Item = {
  question?: string | null
  answer?: DefaultTypedEditorState | null
}

export type HelpFaqBlockType = {
  blockType?: 'helpFaq'
  reserveTocSpace?: boolean | null
  title?: string | null
  anchor?: string | null
  items?: Item[] | null
  locale?: string | null
}

/**
 * "Common questions" — the plain divider accordion from the help template.
 *
 * Its heading carries `data-help-heading` so it joins the on-page nav rail
 * alongside the steps, exactly as in the mockup. Open state lives here rather
 * than in a child row component: styled-jsx only scopes styles to elements
 * rendered by the same component, so the rows must not be extracted.
 */
export const HelpFaqComponent: React.FC<HelpFaqBlockType> = ({
  reserveTocSpace,
  title,
  anchor,
  items,
  locale,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const ansRefs = useRef<Array<HTMLDivElement | null>>([])

  if (!items?.length) return null

  const heading = title || 'Common questions'
  const id = helpAnchor(anchor, heading, 0) || 'faq'
  const withRail = reserveTocSpace !== false
  const richLocale = locale || undefined

  return (
    <section className="hf" data-help-article="" data-screen-label="Common questions">
      <style jsx>{`
        .hf {
          background: #fff;
        }
        /* Must match HelpSteps' .hs-wrap — see _shared/layout.ts. */
        .hf-wrap {
          max-width: 820px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        @media (min-width: 1000px) {
          .hf-wrap {
            padding-left: 0;
            padding-right: 0;
          }
          .hf-wrap.with-rail {
            padding-left: 238px;
          }
        }

        .hf-h2 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: #12314d;
          margin: 48px 0 4px;
          padding-top: 28px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          scroll-margin-top: 96px;
        }

        .hf-list {
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          margin-top: 8px;
        }
        .hf-item {
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .hf-item button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          padding: 18px 0;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          color: #12314d;
        }
        .hf-item .x {
          flex: none;
          width: 18px;
          height: 18px;
          position: relative;
        }
        .hf-item .x::before,
        .hf-item .x::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #0a8fb0;
        }
        .hf-item .x::before {
          width: 12px;
          height: 1.5px;
        }
        .hf-item .x::after {
          width: 1.5px;
          height: 12px;
          transition: transform 0.2s;
        }
        .hf-item.open .x::after {
          transform: translate(-50%, -50%) scaleY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .hf-item .x::after,
          .hf-item .ans {
            transition: none;
          }
        }

        .hf-item .ans {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.28s ease;
        }
        .hf-item .ans-body :global(p) {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          padding: 0 0 18px;
          margin: 0;
          max-width: 60ch;
        }
        .hf-item .ans-body :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      <div className={`hf-wrap${withRail ? ' with-rail' : ''}`}>
        <h2 className="hf-h2" id={id} data-help-heading="">
          {heading}
        </h2>

        <div className="hf-list">
          {items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div className={`hf-item${isOpen ? ' open' : ''}`} key={i}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span>{item.question}</span>
                  <span className="x" aria-hidden="true" />
                </button>
                <div
                  className="ans"
                  ref={(el) => {
                    ansRefs.current[i] = el
                  }}
                  style={{ maxHeight: isOpen ? (ansRefs.current[i]?.scrollHeight ?? 0) : 0 }}
                >
                  {item.answer && (
                    <div className="ans-body">
                      <RichText
                        data={item.answer}
                        locale={richLocale}
                        enableGutter={false}
                        enableProse={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
