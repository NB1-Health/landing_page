'use client'

import React, { useCallback, useRef, useState } from 'react'
import type { RdReviewsBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-07.json + bindings/RdReviews.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// Three behaviours, each matched to the mockup by driving it rather than by
// reading its source:
//
//   - "See more" swaps the clipped review for the whole one and the label for
//     "See less". CLIP_CHARS below is not a guess: 150 characters backed off to
//     the last word boundary reproduces all four of the mockup's collapsed
//     strings exactly (150 / 146 / 143 / 146).
//   - The arrows scroll the rail by one card plus its gap. The mockup moves
//     301px at 420px wide; that is 287px of card and 14px of gap, so the step is
//     measured from the rail at click time and holds at any width.
//   - The arrows are mobile-only: rd-tokens.css hides [data-m="revnav"] above
//     the rail breakpoint. Nothing here needs to know that.

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

/** The mockup's own clip length, recovered from its four collapsed cards. */
const CLIP_CHARS = 150

const clip = (text: string | null | undefined): string => {
  const t = text ?? ''
  if (t.length <= CLIP_CHARS) return t
  return t.slice(0, CLIP_CHARS).replace(/\s+\S*$/, '') + '\u2026'
}

export const RdReviews: React.FC<Props> = (props) => {
  const {
    anchorId, heading, intro, customerLabel,
    seeMoreLabel, seeLessLabel, prevLabel, nextLabel,
  } = props
  const reviews = props.reviews ?? []
  const railRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState<number[]>([])

  const isOpen = (i: number) => open.includes(i)
  const toggleReview = useCallback(
    (i: number) => setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i])),
    [],
  )

  /** One card plus the gap, measured rather than assumed. */
  const nudgeRail = useCallback((dir: number) => {
    const rail = railRef.current
    const card = rail?.firstElementChild as HTMLElement | null
    if (!rail || !card) return
    const gap = parseFloat(getComputedStyle(rail).columnGap || '0') || 0
    rail.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: 'smooth' })
  }, [])

  return (
    <section style={{
      background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))"
    }} className="rd-block rd-reviews" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad" data-m="stack">
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 5.2cqi, 52px)",
              lineHeight: "0.98",
              letterSpacing: "-0.02em"
            }}>{heading}</h2>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.5",
              opacity: "0.78",
              marginTop: "16px",
              maxWidth: "48ch"
            }}>{intro}</p>
          </div>
          <div style={{
            display: "flex",
            gap: "10px"
          }} data-m="revnav">
            <button style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              flex: "0 0 auto",
              cursor: "pointer",
              background: "var(--nb1-cool-grey)",
              border: "0px",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
              color: "var(--nb1-dark-brown)",
              fontSize: "15px",
              lineHeight: "1"
            }} aria-label={prevLabel || 'Previous reviews'} type={'button'} onClick={() => nudgeRail(-1)}>{"\u2190"}</button>
            <button style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              flex: "0 0 auto",
              cursor: "pointer",
              background: "var(--nb1-cool-grey)",
              border: "0px",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
              color: "var(--nb1-dark-brown)",
              fontSize: "15px",
              lineHeight: "1"
            }} aria-label={nextLabel || 'More reviews'} type={'button'} onClick={() => nudgeRail(1)}>{"\u2192"}</button>
          </div>
        </div>
        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "32px",
          overflow: "auto hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          alignItems: "stretch"
        }} id="revRail" data-m="rail" ref={railRef}>
          {(reviews || []).map((review, reviewIdx) => (
            <article key={reviewIdx} style={{
              flex: "0 0 74%",
              maxWidth: "330px",
              scrollSnapAlign: "start",
              background: "var(--nb1-cool-grey)",
              borderRadius: "var(--nb1-radius-md)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline)"
            }} data-d="rcard">
              <div style={{ ...{
                width: "100%",
                aspectRatio: "1 / 1",
                display: "block",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundColor: "var(--nb1-warm-grey)"
              }, backgroundImage: review.image ? `url(${mediaUrl(review.image)})` : undefined, backgroundPosition: `center ${review.focalY ?? 50}%` }} role="img" aria-label={review.name || ''} data-m="revimg" />
              <div style={{
                padding: "18px 20px 22px",
                display: "flex",
                flexDirection: "column",
                flex: "1 1 0%"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "19px",
                  lineHeight: "1"
                }}>
                  <span>{review.name}</span>
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "10.5px",
                  opacity: "0.7",
                  marginTop: "6px"
                }}>
                  {customerLabel}
                  <span>{review.tenure}</span>
                </div>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "18.5px",
                  lineHeight: "1.18",
                  letterSpacing: "-0.015em",
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  {"\u201c"}
                  <span>{review.quote}</span>
                  {"\u201d"}
                </h3>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.55",
                  opacity: "0.8",
                  marginTop: "12px"
                }}>
                  <span>{isOpen(reviewIdx) ? review.body : clip(review.body)}</span>
                </p>
                <button style={{
                  alignSelf: "flex-start",
                  marginTop: "14px",
                  background: "transparent",
                  borderTop: "0px",
                  borderRight: "0px",
                  borderBottom: "1.5px solid var(--nb1-blue)",
                  borderLeft: "0px",
                  borderImage: "initial",
                  padding: "0px 0px 2px",
                  cursor: "pointer",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  color: "var(--nb1-dark-brown)"
                }} type={'button'} aria-expanded={isOpen(reviewIdx)} onClick={() => toggleReview(reviewIdx)}>
                  <span>{isOpen(reviewIdx) ? (seeLessLabel || 'See less') : (seeMoreLabel || 'See more')}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <div style={{
          position: "relative",
          height: "2px",
          background: "rgba(81, 71, 69, 0.2)",
          marginTop: "26px"
        }}>
          <span style={{
            position: "absolute",
            left: "0px",
            top: "0px",
            height: "2px",
            width: "34%",
            background: "var(--nb1-dark-brown)"
          }} />
        </div>
      </div>
    </section>
  )
}

export const RdReviewsComponent = RdReviews

export default RdReviews
