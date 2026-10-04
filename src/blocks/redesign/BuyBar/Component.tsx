'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { RdBarBlock as Props } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'
import { useAmountTokens } from '@/blocks/redesign/_shared/amountTokens'

// ASSEMBLED by tools/bar_assemble.py from out/bar/{desktop,mobile}.jsx, which
// tools/bar_from_spec.py converts from the navigation spec's own markup. The
// two drawings' inline styles are copied, never retyped.
//
// THE STICKY BUY BAR, as a content block.
//
// The spec gives it one job and two rules:
//
//   "One bar for every marketing page: Home, Your Biology, The Lab, The
//    Protocol, Our Plans, the ingredient library, the science board, Our
//    standards. Not on About nb1, FAQ, Contact, Log in, the legal pages, the
//    order funnel, or the Core PDP, which keeps its own buy bar."
//
//   Appears: "When the first section has fully scrolled out of view. Rises
//             from the bottom, 260ms."
//   Hides:   "When the final CTA section or the footer enters view, so there
//             is only one buy button on screen."
//
// WHICH PAGES is answered by the block existing on them: adding it is the
// opt-in, so the "not on" list needs no code and cannot drift out of step with
// a page that gets renamed.
//
// WHEN is answered by where the block sits in the page's blocks list. There
// are only two anchors to find and neither is nameable from inside a block —
// "the first section" and "the final CTA" are facts about the page, not about
// the bar. So:
//
//   appears  the page's FIRST block, found through the wrapper RenderBlocks
//            puts around every block. Nothing to configure: every page has a
//            first block, and it is the one the spec means.
//
//   hides    THIS BLOCK'S OWN POSITION. The component drops a zero-height
//            marker where the block sits in the flow and hides the bar when
//            that marker comes into view. Put the block immediately before the
//            final CTA and you get the spec's rule exactly; put it last and
//            the bar clears the footer instead.
//
// The alternative was two selector fields per page, which is two more things
// to leave blank or let go stale, with nothing to catch it when they do. Here
// the rule is the block's position in the admin's own list — visible, and
// impossible to set to a selector that matches nothing.
//
// ONE EDGE: a bar placed as the FIRST block has no first section to wait for,
// so it shows from the start and only the hide rule applies. That is the
// honest reading of the spec rather than a bar that never appears.

/** A destination. The field holds a SLUG and the locale is added here, so one
 * stored value is right in all nine. Anything already absolute (a url, mailto,
 * tel, #anchor, or a /path) passes straight through, because an editor who
 * typed one meant it. Same helper, same reasoning, as every other redesign
 * block's `*Path`. */
const barPath = (s?: string | null, locale?: string | null) => {
  const v = (s || '').trim()
  if (!v) return '#'
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(v)) return v
  return `/${locale || 'en'}/${v}`
}

const RdBarInner: React.FC<Props & { locale?: AppLocale }> = ({
  productName,
  note,
  price,
  priceSuffix,
  mobileNote,
  ctaLabel,
  ctaHref,
  locale,
}) => {
  const [passed, setPassed] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const stop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = stop.current
    if (!el) return

    // RenderBlocks wraps every block in `<div className="p-0">`, so the
    // block's own wrapper and all its siblings are one level up. This reads
    // that structure rather than the page's markup, which differs per page.
    const mine = el.closest('.p-0')
    const firstWrap = mine?.parentElement?.firstElementChild ?? null

    // THE FIRST SECTION, NOT THE FIRST BLOCK — and on half these pages they
    // are not the same thing.
    //
    // Our Standards, the ingredient library, the science board and Your
    // Biology are ONE block each: the mockup's whole page is a single
    // `rdSt` / `rdLi` / `rdSb` / `rdYbPage`, with its sections rendered as
    // siblings inside that one wrapper. Waiting for "the first block" to
    // scroll out there means waiting for the entire page to scroll out, and
    // the bar would never appear at all.
    //
    // The first element INSIDE the first wrapper is the hero on every one of
    // the eight pages, one-block and many-block alike, which is what the spec
    // means by "the first section".
    const first = firstWrap?.firstElementChild ?? firstWrap

    let io: IntersectionObserver | undefined
    if (first && first !== mine && !mine?.contains(first)) {
      // "Fully scrolled out of view" is `bottom <= 0`, not merely
      // `!isIntersecting` — a first section taller than the viewport is not
      // intersecting at its own top either, and the bar would appear while the
      // hero was still on screen.
      io = new IntersectionObserver(
        ([e]) => setPassed(e.boundingClientRect.bottom <= 0),
        { threshold: 0 },
      )
      io.observe(first)
    } else {
      setPassed(true)
    }

    const end = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting), {
      threshold: 0,
    })
    end.observe(el)

    return () => {
      io?.disconnect()
      end.disconnect()
    }
  }, [])

  const on = passed && !atEnd
  const href = barPath(ctaHref, locale)

  return (
    <>
      {/* The stop line. Zero height, so it changes no layout, and it sits
          exactly where the block sits — which is what makes "where you drop
          this block" the rule for when the bar goes away. */}
      <div ref={stop} aria-hidden="true" style={{ height: 0 }} />

      {/* NOT THE SPEC'S. Both frames are drawn inside a bordered demo box, so
          nothing in the markup fixes the bar to the viewport — this wrapper
          does, and it carries the 260ms rise the spec asks for.

          z-index 55 is below the header's 60 on purpose: they never meet (one
          is pinned to the top, the other to the bottom) but a header dropdown
          can reach down the page, and the header should win.

          `visibility` rides along so a hidden bar is out of the tab order as
          well as off the screen — transitioned at 0s on the way in and after
          the 260ms on the way out, which is what keeps the slide visible. */}
      <div
        className="rd-bar"
        data-on={on ? '1' : '0'}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 55,
          transform: on ? 'translateY(0)' : 'translateY(100%)',
          visibility: on ? 'visible' : 'hidden',
          transition: `transform 260ms ease, visibility 0s linear ${on ? '0s' : '260ms'}`,
        }}
      >
        <div
          className="rd-bar__d"
          style={{
                background: "rgba(240,245,255,.96)",
                WebkitBackdropFilter: "blur(12px)",
                backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(81,71,69,.12)",
                boxShadow: "0 -14px 30px -22px rgba(81,71,69,.45)"
              }}
        >
          <div
            style={{
                  maxWidth: "1184px",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "24px",
                  padding: "14px 48px"
                }}
          >
            <div
              style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    minWidth: "0"
                  }}
            >
              <span
                style={{
                       fontFamily: "var(--nb1-font-secondary)",
                       fontSize: "16.5px",
                       color: "var(--nb1-dark-brown)",
                       whiteSpace: "nowrap"
                     }}
              >
                {productName}
              </span>
              <span
                aria-hidden="true"
                style={{
                       width: "1px",
                       height: "16px",
                       background: "rgba(81,71,69,.24)"
                     }}
              >
              </span>
              <span
                style={{
                       display: "inline-flex",
                       alignItems: "center",
                       gap: "8px",
                       fontFamily: "var(--nb1-font-tertiary)",
                       textTransform: "uppercase",
                       letterSpacing: ".08em",
                       fontSize: "12px",
                       color: "rgba(81,71,69,.86)",
                       whiteSpace: "nowrap"
                     }}
              >
                <span
                  aria-hidden="true"
                  style={{
                         width: "5px",
                         height: "5px",
                         borderRadius: "50%",
                         background: "var(--nb1-dark-brown)"
                       }}
                >
                </span>
                {note}
              </span>
            </div>
            <div
              style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "22px",
                    flexShrink: "0"
                  }}
            >
              <span
                style={{
                       fontFamily: "var(--nb1-font-primary)",
                       fontSize: "22px",
                       lineHeight: "1",
                       color: "var(--nb1-dark-brown)",
                       whiteSpace: "nowrap"
                     }}
              >
                {price}
                <span
                  style={{
                         fontFamily: "var(--nb1-font-secondary)",
                         fontSize: "14.5px"
                       }}
                >
                  {priceSuffix}
                </span>
              </span>
              <a
                href={href}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "1.1em",
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontSize: "13px",
                    background: "var(--nb1-lime)",
                    color: "var(--nb1-black)",
                    padding: ".95em 1.4em",
                    borderRadius: "999px",
                    whiteSpace: "nowrap"
                  }}
              >
                <span>
                  {ctaLabel}
                </span>
                <span
                  style={{
                         fontSize: "1.05em",
                         lineHeight: "1"
                       }}
                >
                  {"↗"}
                </span>
              </a>
            </div>
          </div>
        </div>
        <div
          className="rd-bar__m"
          style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
                background: "rgba(240,245,255,.96)",
                WebkitBackdropFilter: "blur(12px)",
                backdropFilter: "blur(12px)",
                borderTop: "1px solid rgba(81,71,69,.12)",
                boxShadow: "0 -14px 30px -22px rgba(81,71,69,.45)"
              }}
        >
          <div
            style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  minWidth: "0"
                }}
          >
            <span
              style={{
                     fontFamily: "var(--nb1-font-primary)",
                     fontSize: "20px",
                     lineHeight: "1",
                     color: "var(--nb1-dark-brown)",
                     whiteSpace: "nowrap"
                   }}
            >
              {price}
              <span
                style={{
                       fontFamily: "var(--nb1-font-secondary)",
                       fontSize: "14px"
                     }}
              >
                {priceSuffix}
              </span>
            </span>
            <span
              style={{
                     fontFamily: "var(--nb1-font-tertiary)",
                     textTransform: "uppercase",
                     letterSpacing: ".08em",
                     fontSize: "11px",
                     color: "rgba(81,71,69,.84)",
                     whiteSpace: "nowrap"
                   }}
            >
              {mobileNote}
            </span>
          </div>
          <a
            href={href}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                flexShrink: "0",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                fontSize: "13px",
                background: "var(--nb1-lime)",
                color: "var(--nb1-black)",
                padding: ".95em 1.4em",
                borderRadius: "999px",
                whiteSpace: "nowrap"
              }}
          >
            <span>
              {ctaLabel}
            </span>
            <span
              style={{
                     fontSize: "1.05em",
                     lineHeight: "1"
                   }}
            >
              {"↗"}
            </span>
          </a>
        </div>
      </div>
    </>
  )
}

/* ── Exported wrapper (amount tokens) ─────────────────────────────────
 *
 * `{{463}}` reached the page LITERALLY — "ANALYSIS WORTH {{463}} INCLUDED" —
 * and this is why.
 *
 * RenderBlocks runs `usePriceTokens` over every block's props before the
 * component sees them, but it resolves only REFS: `hasToken()` tests for
 * `price:` and `fee:`, and `replaceTokens()` walks TOKEN_RE. So
 * `{{price:core:1}}` in the price was already resolved by the time this
 * rendered, and `{{463}}` in the note matched neither test and passed
 * straight through.
 *
 * A plain amount is resolved per-block, by the same wrapper rdOrder uses. See
 * _shared/amountTokens.ts for why that is a wrapper rather than one line in
 * usePriceTokens: that function runs for every block on the site, redesign and
 * otherwise, and the standing rule is that the current versions are not put at
 * risk to make a new one easier.
 *
 * It also re-resolves on `nb1:currencychange`, so the note follows the
 * currency picker in the header exactly as the price does.
 */
export const RdBar: React.FC<Props & { locale?: AppLocale }> = (props) => (
  <RdBarInner {...useAmountTokens(props, props.locale)} />
)

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdBarComponent = RdBar

export default RdBar
