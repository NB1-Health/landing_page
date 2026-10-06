'use client'

import React, { useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import { getMediaUrl } from '@/utilities/getMediaUrl'

import { referralRedesignEnabled } from '@/utilities/referralRedesign'
import { ReferInfoComponentLegacy } from './Component.legacy'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined

type Step = {
  title?: string | null
  body?: DefaultTypedEditorState | null
}
type Eligibility = {
  type?: 'include' | 'exclude' | null
  text?: DefaultTypedEditorState | null
}

export type ReferInfoBlockType = {
  blockType?: 'referInfo'
  heading?: DefaultTypedEditorState | null
  media?: MediaLike
  steps?: Step[] | null
  eligibilityHeading?: string | null
  eligibility?: Eligibility[] | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

/*
 * The step marker is a four-layer radial gradient, and only ONE of the four
 * layers changes between steps: the cool-grey core grows 3% → 25% → 47% → 69%
 * (its fade-out edge tracking 38 points above it). That 22-point stride is the
 * progress read — step 4's core nearly fills the orange disc.
 *
 * Reading the stride off the mockup rather than hard-coding four gradients means
 * a fifth step an editor adds keeps progressing instead of repeating step four.
 * Past 100% the stops clamp, which degrades to "full", the correct end state.
 */
const CORE_START = 3
const CORE_STRIDE = 22
const CORE_FADE = 38

const ReferInfoComponentRedesign: React.FC<ReferInfoBlockType> = ({
  heading,
  media,
  steps,
  eligibilityHeading,
  eligibility,
}) => {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, '[data-rv]')

  const mediaSrc = imgUrl(media)

  return (
    // See the note in ReferralWidget: `rd-block` is what creates the `nb1page`
    // container and brings in the tokens. Every `cqi` below depends on it.
    <section ref={ref} className="rd-block rfi-sec" data-screen-label="How it works">
      <style jsx>{`
        /*
         * Vertical padding on the SECTION, horizontal on the wrappers — see the
         * long note in ReferralWidget. The two bands split the mockup's rhythm:
         * 88 above, 40+24 between them, 96 below. The outer 88/96 move up to the
         * section so the phone rule in rd-tokens.css can replace them; the 64px
         * gap between the bands is interior and stays where it is.
         */
        .rfi-sec {
          background: var(--nb1-cool-grey);
          padding: 88px 0 96px;
        }
        .rfi-pad {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px 40px;
        }
        .rfi-pad2 {
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px 20px 0;
        }

        /*
         * auto-fit + minmax(min(100%, 420px), 1fr) is the mockup's own
         * one-liner: two columns while each can hold 420px, one below that. It
         * needs no breakpoint, so there is no hook here to forget to port.
         */
        .rfi-two {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 48px 64px;
          align-items: start;
        }
        .rfi-col {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .rfi-h2 :global(h2) {
          font-family: var(--nb1-font-primary);
          font-weight: 400;
          font-size: clamp(30px, 4.4cqi, 46px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
          text-wrap: balance;
          max-width: 14ch;
        }
        /* The old design tinted <em> teal. The new one has no accent colour, so
           italic is all that survives — the tag still means emphasis. */
        .rfi-h2 :global(h2 em) {
          font-style: italic;
          color: inherit;
        }

        .rfi-steps {
          display: flex;
          flex-direction: column;
        }
        .rfi-step {
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 18px;
          padding: 20px 0;
          border-top: 1px solid rgba(81, 71, 69, 0.16);
        }
        .rfi-mark {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .rfi-orb {
          position: relative;
          display: block;
          width: 40px;
          height: 40px;
        }
        /*
         * Four stacked discs, painted back to front by the browser as listed:
         * the blue hairline ring, then the cool-grey progress core, then the
         * orange disc, then the dark-brown field. --c0/--c1 are the only values
         * that differ per step and arrive as inline custom properties.
         */
        .rfi-orb::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle closest-side, transparent 0% 95%, var(--nb1-blue) 95% 100%),
            radial-gradient(
              circle closest-side,
              var(--nb1-cool-grey) 0% var(--c0),
              transparent var(--c1)
            ),
            radial-gradient(circle closest-side, var(--nb1-orange) 0% 57%, transparent 95%),
            radial-gradient(circle closest-side, var(--nb1-dark-brown) 0% 95%, transparent 95%);
        }
        .rfi-num {
          font-family: var(--nb1-font-tertiary);
          font-size: 12px;
          color: var(--nb1-dark-brown);
        }

        .rfi-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rfi-body h3 {
          font-family: var(--nb1-font-primary);
          font-weight: 400;
          font-size: clamp(21px, 2.4cqi, 24px);
          line-height: 1.15;
          margin: 0;
        }
        /*
         * The inherited half of the type style sits on the WRAPPER, not on the
         * <p>. RichText emits whatever the editor built — a paragraph today, a
         * list or a bare run tomorrow — and anything that is not a <p> would
         * otherwise fall back to the block defaults at full opacity. The <p>
         * rule below is then only the things that cannot be inherited.
         */
        .rfi-body .txt {
          font-family: var(--nb1-font-secondary);
          font-size: 16px;
          line-height: 1.65;
          color: rgba(81, 71, 69, 0.88);
        }
        .rfi-body .txt :global(p) {
          margin: 0;
          max-width: 52ch;
        }
        .rfi-body .txt :global(b),
        .rfi-body .txt :global(strong) {
          font-weight: 600;
          color: var(--nb1-dark-brown);
        }

        /*
         * The image is a background, not an <img>, because the mockup crops it
         * at 58% horizontally inside a fixed 4/5 box. object-position on an
         * <img> would do the same, but the alt text then has to live on the
         * element; role="img" + aria-label keeps the announcement identical
         * while the crop stays a paint concern.
         */
        .rfi-media {
          border-radius: 24px;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          background-color: var(--nb1-blue-grey);
          background-position: 58% center;
          background-size: cover;
          background-repeat: no-repeat;
          box-shadow:
            0 2px 4px rgba(81, 71, 69, 0.1),
            0 30px 60px -30px rgba(81, 71, 69, 0.55);
        }

        .rfi-elig {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
          gap: 20px 48px;
          padding: 32px 30px 20px;
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 1px 2px rgba(81, 71, 69, 0.08),
            0 18px 36px -26px rgba(81, 71, 69, 0.45);
        }
        .rfi-elig h3 {
          font-family: var(--nb1-font-primary);
          font-weight: 400;
          font-size: clamp(26px, 3cqi, 32px);
          line-height: 1.1;
          margin: 0;
          max-width: 14ch;
        }
        .rfi-elig ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .rfi-elig li {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
          padding: 14px 0;
          border-top: 1px solid rgba(81, 71, 69, 0.12);
        }
        .rfi-tick {
          display: grid;
          place-items: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: var(--nb1-dark-brown);
          font-size: 13px;
          line-height: 1;
        }
        /* Included reads as a filled lime disc; excluded as an empty outline —
           the shape carries the meaning, so it survives a colour-blind read. */
        .rfi-tick.on {
          background: var(--nb1-lime);
          box-shadow: none;
        }
        .rfi-tick.off {
          background: transparent;
          box-shadow: inset 0 0 0 1.5px rgba(81, 71, 69, 0.5);
        }
        /* Same split as the steps: inherited properties on the wrapper span,
           which is also where the mockup puts them. */
        .rfi-elig li .txt {
          font-family: var(--nb1-font-secondary);
          font-size: 16px;
          line-height: 1.65;
          color: rgba(81, 71, 69, 0.88);
        }
        /* The row is a grid, so the text cell must not open a block of its own
           or the tick and the first line stop sharing a baseline. */
        .rfi-elig li .txt :global(p) {
          margin: 0;
          display: inline;
        }
        .rfi-elig li .txt :global(b),
        .rfi-elig li .txt :global(strong) {
          font-weight: 600;
          color: var(--nb1-dark-brown);
        }

      `}</style>

      <div className="rfi-pad" data-d="pad">
        {/*
          NO data-m="stack" here, deliberately. The mockup's markup carries that
          hook and the mockup's own stylesheet never defines it — but this
          project's rd-tokens.css does:
            @container nb1page (max-width:560px){
              .rd-block [data-m="stack"]{padding-left:16px!important;...} }
          Copying the attribute across therefore imports 16px of side padding
          the design does not have, measured as a 32px-narrow content column on
          a phone. The two-column collapse this hook is named for is already
          handled by the auto-fit grid below, so the attribute buys nothing.
        */}
        <div className="rfi-two">
          <div className="rfi-col" data-rv="">
            {heading && (
              <div className="rfi-h2">
                <RichText data={heading} enableGutter={false} enableProse={false} />
              </div>
            )}

            {steps && steps.length > 0 && (
              <div className="rfi-steps">
                {steps.map((s, i) => (
                  <div className="rfi-step" key={i}>
                    <div className="rfi-mark">
                      <span
                        className="rfi-orb"
                        style={
                          {
                            '--c0': `${CORE_START + CORE_STRIDE * i}%`,
                            '--c1': `${CORE_START + CORE_STRIDE * i + CORE_FADE}%`,
                          } as React.CSSProperties
                        }
                      />
                      <span className="rfi-num">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="rfi-body">
                      <h3>{s.title}</h3>
                      {s.body && (
                        <div className="txt">
                          <RichText data={s.body} enableGutter={false} enableProse={false} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mediaSrc && (
            <div
              className="rfi-media"
              data-rv=""
              // role="img" with an empty label announces an unnamed image, which
              // is worse than nothing; a decorative panel should be skipped.
              {...(imgAlt(media)
                ? { role: 'img', 'aria-label': imgAlt(media) }
                : { role: 'presentation' })}
              style={{ backgroundImage: `url(${JSON.stringify(mediaSrc)})` }}
            />
          )}
        </div>
      </div>

      {eligibility && eligibility.length > 0 && (
        <div className="rfi-pad2" data-d="pad">
          <div className="rfi-elig" data-rv="">
            {eligibilityHeading && <h3>{eligibilityHeading}</h3>}
            <ul>
              {eligibility.map((item, i) => {
                const excluded = item.type === 'exclude'
                return (
                  <li key={i}>
                    <span className={`rfi-tick ${excluded ? 'off' : 'on'}`} aria-hidden="true">
                      {excluded ? '✕' : '✓'}
                    </span>
                    {item.text && (
                      <span className="txt">
                        <RichText data={item.text} enableGutter={false} enableProse={false} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
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
export const ReferInfoComponent: React.FC<ReferInfoBlockType> = (props) =>
  referralRedesignEnabled() ? <ReferInfoComponentRedesign {...props} /> : <ReferInfoComponentLegacy {...props} />
