'use client'

import React, { useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'

import { referralRedesignEnabled } from '@/utilities/referralRedesign'
import { ReferFaqComponentLegacy } from './Component.legacy'

type Item = {
  question?: string | null
  answer?: DefaultTypedEditorState | null
}

export type ReferFaqBlockType = {
  blockType?: 'referFaq'
  title?: string | null
  items?: Item[] | null
}

const ReferFaqComponentRedesign: React.FC<ReferFaqBlockType> = ({ title, items }) => {
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
    // See ReferralWidget: `rd-block` creates the `nb1page` container the `cqi`
    // type scale below reads from, and brings the brand tokens with it.
    <section ref={ref} className="rd-block rff-sec" data-screen-label="FAQ">
      <style jsx>{`
        /* Vertical padding on the section, horizontal on the wrapper — see the
           long note in ReferralWidget. */
        .rff-sec {
          background: var(--nb1-dark-brown);
          color: var(--nb1-cool-grey);
          padding: 88px 0 104px;
        }
        .rff-pad {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .rff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
          gap: 32px 64px;
          align-items: start;
        }
        .rff-h2 {
          font-family: var(--nb1-font-primary);
          font-weight: 400;
          font-size: clamp(30px, 4.4cqi, 46px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
          text-wrap: balance;
        }

        .rff-row {
          border-top: 1px solid rgba(240, 245, 255, 0.22);
        }
        /*
         * The LAST hairline is a rule on its own, not a border-bottom on the
         * final row. Giving every row both borders would double them up; the
         * mockup closes the list with one empty bordered div and so does this.
         */
        .rff-end {
          border-top: 1px solid rgba(240, 245, 255, 0.22);
        }

        .rff-row button {
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
          font-family: var(--nb1-font-primary);
          /*
           * 350, not 400. In the mockup the summary is a plain element and
           * inherits the body weight; here it is a <button>, and the UA sheet
           * resets a button's font to 400 Arial before anything inherits. Every
           * value that rule clobbers has to be restated — weight and colour
           * included — or the row renders a notch heavier than the design.
           */
          font-weight: 350;
          font-size: clamp(19px, 2.4cqi, 22px);
          line-height: 1.2;
          color: var(--nb1-cool-grey);
        }
        .rff-row .pm {
          font-family: var(--nb1-font-secondary);
          font-size: 22px;
          line-height: 1;
          flex: 0 0 auto;
        }

        .rff-row .ans {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .rff-row .ans {
            transition: none;
          }
        }
        .rff-row .ans-body :global(p) {
          font-family: var(--nb1-font-secondary);
          font-size: 16px;
          line-height: 1.65;
          color: rgba(240, 245, 255, 0.86);
          margin: 0;
          padding: 0 0 22px;
          max-width: 64ch;
        }
        /*
         * rd-tokens.css strips link underlines site-wide and hovers them to
         * dark brown — which on this dark-brown band would make the link
         * vanish. Both have to be answered here.
         */
        .rff-row .ans-body :global(a) {
          color: var(--nb1-cool-grey);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .rff-row .ans-body :global(a:hover) {
          color: var(--nb1-cool-grey);
          opacity: 0.7;
        }

      `}</style>

      <div className="rff-pad" data-d="pad">
        <div className="rff-grid">
          <h2 className="rff-h2" data-rv="">
            {title || 'FAQs'}
          </h2>
          <div data-rv="">
            {items.map((item, i) => {
              const isOpen = !!open[i]
              return (
                <div className="rff-row" key={i}>
                  <button aria-expanded={isOpen} onClick={() => toggle(i)}>
                    {item.question}
                    <span className="pm" aria-hidden="true">
                      +
                    </span>
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
                        <RichText data={item.answer} enableGutter={false} enableProse={false} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="rff-end" />
          </div>
        </div>
      </div>
    </section>
  )
}

/*
 * WHICH DESIGN RENDERS — the only thing in this file that is not the redesign.
 *
 * One constant decides, the same way the journal and the kit-instruction pages
 * decide, and the sibling Component.legacy.tsx holds what was there before.
 * See src/utilities/referralRedesign.ts for the switch and why it is a constant.
 *
 * Read at RENDER TIME, not at module scope. A module-scope `const Chosen = …`
 * would be evaluated once when the bundle loads, which is the same answer in
 * practice but makes the branch look like configuration rather than a decision
 * the component takes — and it is the shape that quietly breaks if the switch
 * ever becomes anything but a constant.
 */
export const ReferFaqComponent: React.FC<ReferFaqBlockType> = (props) =>
  referralRedesignEnabled() ? <ReferFaqComponentRedesign {...props} /> : <ReferFaqComponentLegacy {...props} />
