'use client'

import React, { useState } from 'react'
import type { RdPgWordsBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-04.json + bindings/RdPgWords.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Each card clips its review until its own See more is pressed; `open` holds the indexes that are expanded.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

// The card shows a fixed-length excerpt ending in an ellipsis, and the mockup
// clips by CHARACTERS rather than by line count — the same 150 regardless of how
// the text wraps. Measured on this mockup's four cards: 150, 146, 143, 146, each
// cut at the last space before the limit.
const CLIP_CHARS = 150

const clip = (text: string | null | undefined): string => {
  const t = text ?? ''
  if (t.length <= CLIP_CHARS) return t
  const cut = t.slice(0, CLIP_CHARS)
  return cut.slice(0, cut.lastIndexOf(' ')) + '…'
}

export const RdPgWords: React.FC<Props> = ({ anchorId, customerLabel, heading, intro, reviews, seeLessLabel, seeMoreLabel }) => {
  const [open, setOpen] = useState([] as number[])

  // A review is clipped until its own "See more" is pressed. The clip is by
  // CHARACTERS rather than by line count, because the mockup's own card shows a
  // fixed-length excerpt ending in an ellipsis regardless of how the text wraps.
  const isOpen = (i: number) => open.includes(i)
  const toggleReview = (i: number) =>
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))

  return (
      <section style={{
        background: "var(--nb1-blue-grey)"
      }} className="rd-pg rd-pgwords" id={anchorId || undefined}>
        <div style={{
          maxWidth: "1240px",
          margin: "0px auto",
          padding: "104px 48px"
        }}>
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
          </div>
          <div style={{
            display: "flex",
            gap: "14px",
            marginTop: "32px",
            overflow: "auto hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            alignItems: "stretch"
          }} id="revRail" data-m="rail">
            {(reviews || []).map((review, reviewIdx) => (
              <article key={reviewIdx} style={{
                flex: "1 1 0px",
                minWidth: "0px",
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
                  }}>{review.name}</div>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: "9.5px",
                    opacity: "0.7",
                    marginTop: "6px"
                  }}>
                    {customerLabel}
                    {review.tenure}
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
                    {review.quote}
                    {"\u201d"}
                  </h3>
                  <p style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.55",
                    opacity: "0.8",
                    marginTop: "12px"
                  }}>{isOpen(reviewIdx) ? review.body : clip(review.body)}</p>
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
                  }} type={'button'} aria-expanded={isOpen(reviewIdx)} onClick={() => toggleReview(reviewIdx)}>{isOpen(reviewIdx) ? (seeLessLabel || 'See less') : (seeMoreLabel || 'See more')}</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgWordsComponent = RdPgWords

export default RdPgWords
