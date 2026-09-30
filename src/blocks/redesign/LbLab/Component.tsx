'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdLbLabBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-05.json + bindings/RdLbLab.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lblab` and NOT `rd-block`.
//
// Five key/value rows that genuinely repeat, a closing serif line, and a square photograph drawn as a CSS background.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdLbLab: React.FC<Props> = ({ anchorId, closing, facts, heading, image, intro }) => {
  return (
    <section style={{
      background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
    }} className="rd-lb rd-lblab" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "52px 20px",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "32px",
        alignItems: "center"
      }} data-d="pad labband">
        <div>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(28px, 5cqi, 46px)",
            lineHeight: "1.04",
            letterSpacing: "-0.025em",
            maxWidth: "24ch"
          }}>
            {(heading)?.root ? (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "15px",
            lineHeight: "1.6",
            opacity: "0.82",
            marginTop: "14px",
            maxWidth: "48ch"
          }}>{intro}</p>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
            marginTop: "24px",
            maxWidth: "46ch"
          }}>
            {(facts || []).map((fact, factIdx) => (
              <div key={factIdx} style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "20px",
                padding: "14px 0px",
                borderTop: "1px solid rgba(81, 71, 69, 0.2)"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px"
                }}>
                  {fact.label}
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px",
                  color: "rgba(81, 71, 69, 0.88)",
                  whiteSpace: "nowrap"
                }}>
                  {fact.value}
                </span>
              </div>
            ))}
          </div>
          <p style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "clamp(19px, 3.4cqi, 26px)",
            lineHeight: "1.28",
            marginTop: "26px",
            maxWidth: "34ch"
          }}>{closing}</p>
        </div>
        <div style={{ ...{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "var(--nb1-radius-md)",
          backgroundSize: "cover",
          backgroundPosition: "50% 0%",
          backgroundColor: "var(--nb1-warm-grey)"
        }, backgroundImage: mediaUrl(image) ? `url('${mediaUrl(image)}')` : undefined }} data-m="labshot" role="img" aria-label={mediaAlt(image)} />
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbLabComponent = RdLbLab

export default RdLbLab
