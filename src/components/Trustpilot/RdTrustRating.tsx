'use client'

import React from 'react'
import TrustpilotWidget from './TrustpilotWidget'

/**
 * The redesign's Trustpilot lockup: the REAL TrustBox, followed by the "★ Trustpilot"
 * wordmark the mockup draws.
 *
 * NEW COMPONENT, deliberately. `TrustpilotWidget` is untouched and every page
 * already using it renders exactly as before — this only composes it.
 *
 * WHY THE WORDMARK IS DRAWN HERE. The TrustBox renders inside a Trustpilot
 * iframe, so nothing on this page can reach its type, its star tiles or its
 * layout; the only levers are the handful of `data-` attributes the bootstrap
 * reads. Its own wordmark also comes and goes with the width it is given, which
 * is why the strip shows "Excellent ★★★★★" and nothing else at some sizes. So
 * the rating stays the live widget — real data, Trustpilot's own stars — and the
 * wordmark beside it is the mockup's, reproduced from the manifest.
 *
 * WHY THE WIDGET IS CLIPPED. Because the TrustBox sometimes draws a wordmark of
 * its own, and two of them side by side is worse than none. `--rd-tp-slice` is
 * the visible width, and anything the iframe puts to the right of the stars is
 * cut. The order inside the TrustBox is Excellent → stars → wordmark, so the
 * clip can only ever remove the part we are replacing.
 *
 * WHERE THE NUMBERS COME FROM. Not guessed — derived from the two type sizes:
 *
 *   Micro Star renders at 18px type in a 24px box.
 *   The mockup's strip is 14.5px type with 19px star tiles.
 *   scale  = 14.5 / 18            = 0.8056
 *   height = 24 * 0.8056          = 19.3px  ≈ the mockup's 19px tiles
 *   slice  = "Excellent" (~63px) + 10px gap + 5×19px tiles + 4×2px gaps = 176px
 *   layout = 176 / 0.8056         = 219px
 *
 * The old `.ht-tp` sizing scaled by 0.7222, which is where the strip's 13px type
 * came from — visibly smaller than the 14.5px everything beside it uses.
 *
 * `--rd-tp-slice` is a custom property rather than a hard-coded width because
 * "Excellent" is a different length in every locale, and because the TrustBox's
 * own metrics are Trustpilot's to change. `docs/rd-trustpilot-preview.html`
 * renders the real widget at a range of slice widths next to the mockup's target
 * so the number can be checked by eye in one pass.
 */
export type RdTrustRatingProps = {
  /** App locale — picks the localized TrustBox source. */
  locale?: string | null
  /**
   * The wordmark text. Trustpilot is a brand name and is NOT translated in any
   * locale, so it is not a CMS field; it is a prop only so a caller can drop it
   * for a TrustBox template that draws its own.
   */
  label?: string
  /** Set false to render the TrustBox alone, with no wordmark beside it. */
  showWordmark?: boolean
  className?: string
}

/** Trustpilot's own green. Their asset guidelines fix it; it is not a brand token. */
const TRUSTPILOT_GREEN = 'rgb(0, 182, 122)'

export const RdTrustRating: React.FC<RdTrustRatingProps> = ({
  locale,
  label = 'Trustpilot',
  showWordmark = true,
  className,
}) => (
  <>
    <span className={['rd-tp__box', className].filter(Boolean).join(' ')}>
      <TrustpilotWidget locale={locale} variant="microStar" theme="light" height="24px" />
    </span>
    {showWordmark ? (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flex: '0 0 auto' }}
        className="rd-tp__mark"
      >
        <span style={{ color: TRUSTPILOT_GREEN, fontSize: '15px', lineHeight: '1' }} aria-hidden="true">
          {'★'}
        </span>
        <span
          style={{
            fontFamily: 'var(--nb1-font-secondary)',
            fontSize: '14.5px',
            fontWeight: '500',
            color: 'var(--nb1-dark-brown)',
          }}
        >
          {label}
        </span>
      </span>
    ) : null}
  </>
)

export default RdTrustRating
