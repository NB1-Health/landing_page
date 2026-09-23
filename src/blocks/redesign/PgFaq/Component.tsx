'use client'

import React from 'react'
import type { RdPgFaqBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-13.json + bindings/RdPgFaq.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The FAQ: a sticky heading column beside twelve rows that open and close. Native <details>, so no state.


export const RdPgFaq: React.FC<Props> = ({ anchorId, faqs, heading, intro }) => {
  return (
    <section style={{
      maxWidth: "1180px",
      margin: "0px auto",
      padding: "104px 48px",
      display: "grid",
      gridTemplateColumns: "0.82fr 1.18fr",
      gap: "72px",
      alignItems: "start"
    }} className="rd-pg rd-pgfaq" id={anchorId || undefined}>
      <div style={{
        position: "sticky",
        top: "110px"
      }}>
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(38px, 4vw, 52px)",
          lineHeight: "0.95",
          letterSpacing: "-0.02em"
        }}>{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15px",
          lineHeight: "1.5",
          opacity: "0.7",
          marginTop: "20px",
          maxWidth: "28ch"
        }}>{intro}</p>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "column"
      }}>
        {(faqs || []).map((faq, faqIdx) => (
          <details key={faqIdx} style={faqIdx !== (faqs || []).length - 1 ? {
            borderTop: "1px solid rgba(81, 71, 69, 0.16)"
          } : {
            borderTop: "1px solid rgba(81, 71, 69, 0.16)",
            borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
          }}>
            <summary style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "22px 0px"
            }}>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "12px",
                opacity: "0.5"
              }}>{faq.number}</span>
              <span style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "18px",
                flex: "1 1 0%"
              }}>{faq.question}</span>
              <span style={{
                width: "24px",
                height: "24px",
                flex: "0 0 auto",
                borderRadius: "50%",
                border: "1.5px solid var(--nb1-dark-brown)",
                display: "grid",
                placeItems: "center",
                fontSize: "13px"
              }}>{"+"}</span>
            </summary>
            <p style={{
              fontSize: "15px",
              lineHeight: "1.55",
              opacity: "0.76",
              padding: "0px 0px 22px 42px",
              maxWidth: "64ch"
            }}>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgFaqComponent = RdPgFaq

export default RdPgFaq
