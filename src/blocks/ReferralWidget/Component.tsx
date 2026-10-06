'use client'

import React, { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import MentionMeTag from '@/components/MentionMe/MentionMeTag'
import { toMentionMeLocale } from '@/components/MentionMe/locale'
import type { AppLocale } from '@/i18n/config'

import { referralRedesignEnabled } from '@/utilities/referralRedesign'
import { ReferralWidgetComponentLegacy } from './Component.legacy'

export type ReferralWidgetBlockType = {
  blockType?: 'referralWidget'
  situation?: string | null
  localeOverride?: string | null
  showPlaceholder?: boolean | null
  locale?: AppLocale
}

// NEXT_PUBLIC_* is inlined at build time and readable client-side — used only to
// decide whether to show the placeholder (MentionMeTag itself no-ops without it).
const PARTNER_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_MENTION_ME_PARTNER_CODE)

const ReferralWidgetComponentRedesign: React.FC<ReferralWidgetBlockType> = ({
  situation,
  localeOverride,
  showPlaceholder,
  locale,
}) => {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, '[data-rv]')

  const mmLocale = localeOverride || toMentionMeLocale(locale)
  const showPh = (showPlaceholder ?? true) && !PARTNER_CONFIGURED

  return (
    // `rd-block` is load-bearing, not decoration. rd-tokens.css turns the plain
    // wrapper RenderBlocks puts around every block into the named `nb1page`
    // container (`div:not(.rd-block *):has(> .rd-block)`) and supplies the brand
    // tokens and the reset. Without it `cqi` and every `@container nb1page`
    // query below resolve against nothing and the section renders at its phone
    // values on desktop — which is exactly how the `abgrid` bug looked.
    <section ref={ref} className="rd-block rfw-sec" data-screen-label="Hero">
      <style jsx>{`
        /*
         * The mockup's own page-local token. It is NOT in rd-tokens.css, so it
         * is declared here with the mockup's expression verbatim rather than
         * approximated to a hex — color-mix in oklab is what produces the exact
         * band colour, and an eyedropped hex would drift from the other pages
         * that will eventually use the same tint.
         */
        /*
         * The VERTICAL padding is on the section and the HORIZONTAL on the pad,
         * which is a deliberate split, not the mockup's own arrangement.
         *
         * rd-tokens.css carries this project's phone rhythm:
         *   @container nb1page (max-width:560px){ .rd-block:is(section){
         *     padding-top:44px!important; padding-bottom:44px!important } }
         * It can only do its job if the section is where the vertical padding
         * lives. Keep it all on the inner wrapper, as the mockup does, and the
         * phone gets 44px of section padding ON TOP of a desktop 40/56 — taller
         * on a small screen than on a large one. Splitting it means every other
         * redesign section and this one tighten identically on a phone.
         *
         * data-d="pad" only ever sets padding-left/right, so the ≥900px step to
         * 48px gutters still lands on the wrapper.
         */
        .rfw-sec {
          --tint: color-mix(in oklab, var(--nb1-blue-grey) 34%, var(--nb1-cool-grey));
          background: var(--tint);
          border-bottom: 1px solid rgba(81, 71, 69, 0.16);
          padding: 40px 0 56px;
        }
        .rfw-pad {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /*
         * The card IS the widget frame, in both states. The Mention Me iframe
         * mounts into this same box, so the radius, the inset hairline and the
         * 520px floor apply to the live campaign as well as the placeholder —
         * which is what the mockup shows ("This whole block is the widget").
         */
        .rfw-card {
          /*
           * 960px, restored. The mockup draws this card at the full 1240px pad
           * because its placeholder is a paragraph, which will fill whatever it
           * is given. The live Mention Me campaign will not: it is fixed-size
           * (isResponsive=false), so every pixel of card beyond what the
           * campaign renders comes out as white gutter either side of the dark
           * panel. 960 is the width the block shipped with and the width the
           * campaign was sized against.
           */
          max-width: 960px;
          margin: 0 auto;
          display: grid;
          place-items: center;
          min-height: 520px;
          padding: 32px;
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 1px 2px rgba(81, 71, 69, 0.08),
            0 18px 36px -26px rgba(81, 71, 69, 0.45),
            inset 0 0 0 1.5px rgba(81, 71, 69, 0.18);
        }
        /*
         * The live state drops the padding and stretches.
         *
         * Padding: 32px of it would leave the campaign 896px inside a 960px
         * card — narrower than the 960 it previously had to itself, which for a
         * fixed-size campaign means it either overflows or is scaled down. The
         * widget brings its own dark panel right to its own edge, so the inset
         * is the placeholder's to want, not the campaign's.
         *
         * Stretch: place-items:center shrink-wraps the grid item, which is
         * right for the placeholder note and wrong for the iframe.
         */
        .rfw-card.live {
          justify-items: stretch;
          padding: 0;
        }
        /*
         * overflow:hidden is what actually clips the mounted iframe to the
         * radius — border-radius alone does not clip a replaced element. This
         * is a minimum height, not a maximum, so a campaign taller than 520px
         * grows the card rather than being cut off by it.
         */
        .rfw-card.live {
          overflow: hidden;
        }
        .rfw-card :global(#mmWrapper) {
          width: 100%;
        }
        /* Flush to the card now that the live state has no padding, so the
           iframe takes the card's own radius rather than an inset one. */
        .rfw-card :global(iframe) {
          display: block;
          width: 100%;
          border: 0;
          border-radius: 24px;
        }

        .rfw-note {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          max-width: 44ch;
        }
        .rfw-badge {
          font-family: var(--nb1-font-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 12px;
          padding: 0.45em 0.8em;
          border-radius: 10px;
          background: var(--nb1-cool-grey);
          white-space: nowrap;
        }
        .rfw-note p {
          font-family: var(--nb1-font-secondary);
          font-size: 16px;
          line-height: 1.65;
          color: rgba(81, 71, 69, 0.88);
          margin: 0;
        }

      `}</style>

      <div className="rfw-pad" data-d="pad">
        <div className={`rfw-card${showPh ? '' : ' live'}`} id="referralWidget" data-rv="">
          {showPh ? (
            <div className="rfw-note">
              <span className="rfw-badge">Mention Me iframe</span>
              <p>
                This whole block is the widget. The Mention Me referral iframe mounts here at full
                width, replacing this placeholder.
              </p>
            </div>
          ) : (
            <MentionMeTag
              variant="referrer"
              situation={situation || 'landingpage'}
              locale={mmLocale}
            />
          )}
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
export const ReferralWidgetComponent: React.FC<ReferralWidgetBlockType> = (props) =>
  referralRedesignEnabled() ? <ReferralWidgetComponentRedesign {...props} /> : <ReferralWidgetComponentLegacy {...props} />
