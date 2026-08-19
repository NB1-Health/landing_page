'use client'

import React, { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import MentionMeTag from '@/components/MentionMe/MentionMeTag'
import type { AppLocale } from '@/i18n/config'

export type ReferralWidgetBlockType = {
  blockType?: 'referralWidget'
  situation?: string | null
  localeOverride?: string | null
  showPlaceholder?: boolean | null
  locale?: AppLocale
}

// Map site locale → Mention Me locale (lang_REGION). Extend as live MM campaigns
// are added per language.
const MM_LOCALE: Record<string, string> = { en: 'en_GB', de: 'de_DE', fr: 'fr_FR' }

// NEXT_PUBLIC_* is inlined at build time and readable client-side — used only to
// decide whether to show the placeholder (MentionMeTag itself no-ops without it).
const PARTNER_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_MENTION_ME_PARTNER_CODE)

export const ReferralWidgetComponent: React.FC<ReferralWidgetBlockType> = ({
  situation,
  localeOverride,
  showPlaceholder,
  locale,
}) => {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, '[data-rv]')

  const mmLocale = localeOverride || MM_LOCALE[locale ?? 'en'] || 'en_GB'
  const showPh = (showPlaceholder ?? true) && !PARTNER_CONFIGURED

  return (
    <section ref={ref} className="rf-hero" data-screen-label="Hero">
      <style jsx>{`
        .rf-hero {
          padding: clamp(80px, 9vh, 104px) clamp(20px, 4vw, 32px) clamp(40px, 5vw, 60px);
          background: #fff;
        }
        /* Contained to the widget's own card width. The Mention Me demo campaign is
           fixed-size (isResponsive=false), so any width beyond what the live campaign
           actually renders shows up as white gutters either side. */
        .rf-embed {
          position: relative;
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          /* overflow:hidden is what actually clips the mounted iframe to the
             radius — border-radius alone does not clip a replaced element. */
          border-radius: 20px;
          overflow: hidden;
        }
        /* Navy card look is only for the placeholder; the real Mention Me widget
           brings its own styling. Radius/clipping now come from .rf-embed. */
        .rf-embed.ph {
          background: #12314d;
          box-shadow: 0 44px 88px -54px rgba(18, 49, 77, 0.55);
        }
        /* The Mention Me tag mounts its iframe inside #mmWrapper. Let the widget
           size its own height (do NOT force height:100% — that collapses it). */
        .rf-embed :global(#mmWrapper) {
          width: 100%;
        }
        .rf-embed :global(iframe) {
          display: block;
          width: 100%;
          border: 0;
          border-radius: 20px;
        }
        .rf-embed-ph {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: clamp(380px, 44vw, 520px);
          padding: clamp(24px, 3vw, 40px);
          background: linear-gradient(165deg, #154663 0%, #0e2740 62%, #0a1c2e 100%);
        }
        .rf-slot-note {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          min-height: clamp(280px, 30vw, 360px);
          border: 1.5px dashed rgba(255, 255, 255, 0.3);
          border-radius: 14px;
          padding: clamp(22px, 3vw, 34px);
        }
        .rf-slot-k {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5bc0d8;
        }
        .rf-slot-note p {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 12px;
          max-width: 44ch;
        }
      `}</style>

      <div className={`rf-embed${showPh ? ' ph' : ''}`} id="referralWidget" data-rv="">
        {showPh ? (
          <div className="rf-embed-ph">
            <div className="rf-slot-note">
              <span className="rf-slot-k">Mention Me iframe</span>
              <p>
                This whole block is the widget. The Mention Me referral iframe mounts here at full
                width, replacing this placeholder.
              </p>
            </div>
          </div>
        ) : (
          <MentionMeTag
            variant="referrer"
            situation={situation || 'landingpage'}
            locale={mmLocale}
          />
        )}
      </div>
    </section>
  )
}
