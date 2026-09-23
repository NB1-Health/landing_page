'use client'

import React from 'react'
import type { RdPgGuaranteeBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-12.json + bindings/RdPgGuarantee.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The guarantee section: a sticky heading column beside two numbered points, each with a row of chips.


export const RdPgGuarantee: React.FC<Props> = ({ anchorId, heading, intro, points }) => {
  return (
    <section style={{
      background: "var(--nb1-blue-grey)"
    }} className="rd-pg rd-pgguarantee" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1180px",
        margin: "0px auto",
        padding: "104px 48px",
        display: "grid",
        gridTemplateColumns: "0.85fr 1.15fr",
        gap: "72px",
        alignItems: "start"
      }}>
        <div style={{
          position: "sticky",
          top: "110px"
        }}>
          <h2 style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(40px, 4.6vw, 56px)",
            lineHeight: "0.95",
            letterSpacing: "-0.02em"
          }}>{heading}</h2>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "18px",
            lineHeight: "1.45",
            opacity: "0.78",
            marginTop: "20px",
            maxWidth: "34ch"
          }}>{intro}</p>
        </div>
        <div>
          {(points || []).map((pt, ptIdx) => (
            <div key={ptIdx} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0px 28px",
              borderTop: "1.5px solid rgba(81, 71, 69, 0.28)",
              padding: "32px 0px"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "38px",
                lineHeight: "1",
                opacity: "0.35"
              }}>{pt.number}</div>
              <div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "11px",
                  opacity: "0.6",
                  marginBottom: "10px"
                }}>{pt.eyebrow}</div>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "29px",
                  lineHeight: "1.05"
                }}>{pt.title}</h3>
                <p style={{
                  fontSize: "15.5px",
                  lineHeight: "1.55",
                  opacity: "0.78",
                  marginTop: "12px",
                  maxWidth: "52ch"
                }}>{pt.body}</p>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "18px"
                }}>
                  {(pt.chips || []).map((chip, chipIdx) => (
                    <span key={chipIdx} style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontSize: "11px",
                      background: "var(--nb1-cool-grey)",
                      padding: "0.55em 1em",
                      borderRadius: "999px"
                    }}>{chip.label}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgGuaranteeComponent = RdPgGuarantee

export default RdPgGuarantee
