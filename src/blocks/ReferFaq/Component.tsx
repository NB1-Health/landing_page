'use client'

import React, { useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'

type Item = {
  question?: string | null
  answer?: DefaultTypedEditorState | null
}

export type ReferFaqBlockType = {
  blockType?: 'referFaq'
  title?: string | null
  items?: Item[] | null
}

export const ReferFaqComponent: React.FC<ReferFaqBlockType> = ({ title, items }) => {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, '[data-rv]')

  // Open state + answer refs are kept here so every styled element is rendered by
  // THIS component — styled-jsx only scopes styles to elements in the same
  // component, so the rows must not live in a separate child component.
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const ansRefs = useRef<Array<HTMLDivElement | null>>([])

  if (!items?.length) return null

  const toggle = (i: number) => setOpen((o) => ({ ...o, [i]: !o[i] }))

  return (
    <section ref={ref} className="rf-sec" data-screen-label="FAQ">
      <style jsx>{`
        .rf-sec {
          padding: clamp(56px, 7vw, 92px) 0;
          background: #fff;
        }
        .rfw {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 32px);
        }
        .rf-faq {
          display: grid;
          grid-template-columns: 0.42fr 1fr;
          gap: clamp(24px, 4vw, 56px);
          align-items: start;
        }
        @media (max-width: 820px) {
          .rf-faq {
            grid-template-columns: 1fr;
          }
        }
        .rf-h2 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(26px, 3.4vw, 40px);
          line-height: 1.08;
          letter-spacing: -0.026em;
          color: #12314d;
          margin: 0;
          max-width: 22ch;
          text-wrap: balance;
        }
        .rf-faq-list {
          border-top: 1px dashed rgba(18, 49, 77, 0.1);
        }
        .rf-fq {
          border-bottom: 1px dashed rgba(18, 49, 77, 0.1);
        }
        .rf-fq button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          padding: 20px 0;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16.5px;
          letter-spacing: -0.01em;
          color: #12314d;
        }
        .rf-fq .pm {
          flex: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #0a8fb0;
          position: relative;
        }
        .rf-fq .pm::before,
        .rf-fq .pm::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
        }
        .rf-fq .pm::before {
          width: 11px;
          height: 2px;
        }
        .rf-fq .pm::after {
          width: 2px;
          height: 11px;
          transition: transform 0.25s;
        }
        .rf-fq.open .pm::after {
          transform: translate(-50%, -50%) scaleY(0);
        }
        .rf-fq .ans {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rf-fq .ans-body :global(p) {
          font-size: 14.5px;
          line-height: 1.66;
          color: rgba(18, 49, 77, 0.7);
          padding: 0 0 20px;
          margin: 0;
          max-width: 66ch;
        }
        .rf-fq .ans-body :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
        }
      `}</style>

      <div className="rfw">
        <div className="rf-faq">
          <h2 className="rf-h2" data-rv="">
            {title || 'FAQs'}
          </h2>
          <div className="rf-faq-list" data-rv="">
            {items.map((item, i) => {
              const isOpen = !!open[i]
              return (
                <div className={`rf-fq${isOpen ? ' open' : ''}`} key={i}>
                  <button aria-expanded={isOpen} onClick={() => toggle(i)}>
                    {item.question}
                    <span className="pm" aria-hidden="true" />
                  </button>
                  <div
                    className="ans"
                    ref={(el) => {
                      ansRefs.current[i] = el
                    }}
                    style={{ maxHeight: isOpen ? ansRefs.current[i]?.scrollHeight ?? 0 : 0 }}
                  >
                    {item.answer && (
                      <div className="ans-body">
                        <RichText data={item.answer} enableGutter={false} enableProse={false} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
