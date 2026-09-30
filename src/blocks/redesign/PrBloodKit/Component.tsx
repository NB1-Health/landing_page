'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrBloodKitBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-04.json + bindings/RdPrBloodKit.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The Advanced-only blood kit. The right column is the mockup's own placeholder, reproduced rather than replaced with an upload.


export const RdPrBloodKit: React.FC<Props> = ({ anchorId, detail, facts, guideLink, heading, intro, placeholderAria, placeholderLabel, tag }) => {
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-pr rd-prbloodkit" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "38px",
          alignItems: "center"
        }} data-d="side" data-m="bloodgrid">
          <div>
            <span style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "10.5px",
              background: "var(--nb1-lime)",
              color: "var(--nb1-black)",
              padding: "0.5em 0.8em",
              borderRadius: "10px",
              display: "inline-block"
            }} className="nb1-tag">{tag}</span>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 5cqi, 50px)",
              lineHeight: "1.02",
              letterSpacing: "-0.025em",
              marginTop: "18px",
              maxWidth: "22ch"
            }} data-d="bigh">
              {(heading)?.root ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.6",
              opacity: "0.86",
              marginTop: "18px",
              maxWidth: "50ch"
            }}>{intro}</p>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "15.5px",
              lineHeight: "1.6",
              opacity: "0.86",
              marginTop: "14px",
              maxWidth: "50ch"
            }}>{detail}</p>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0px",
              marginTop: "26px",
              maxWidth: "46ch"
            }}>
              {(facts || []).map((ft, ftIdx) => (
                <div key={ftIdx} style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: "18px",
                  padding: "14px 0px",
                  borderTop: "1px solid rgba(240, 245, 255, 0.22)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15px"
                  }}>
                    {ft.label}
                  </span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "10.5px",
                    opacity: "0.8",
                    whiteSpace: "nowrap"
                  }}>
                    {ft.value}
                  </span>
                </div>
              ))}
            </div>
            <a style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.7em",
              marginTop: "22px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "12px",
              color: "var(--nb1-cool-grey)",
              borderBottom: "1.5px solid var(--nb1-lime)",
              paddingBottom: "2px",
              whiteSpace: "nowrap"
            }} href={guideLink?.url || '#'}>{guideLink?.label}</a>
          </div>
          <div style={{
            width: "100%",
            aspectRatio: "4 / 5",
            borderRadius: "20px",
            background: "rgba(240, 245, 255, 0.06)",
            boxShadow: "rgba(240, 245, 255, 0.2) 0px 0px 0px 1px inset",
            display: "grid",
            placeItems: "center"
          }} data-m="bloodshot" role="img" aria-label={placeholderAria ?? undefined}>
            <span style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "10.5px",
              opacity: "0.6"
            }}>{placeholderLabel}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrBloodKitComponent = RdPrBloodKit

export default RdPrBloodKit
