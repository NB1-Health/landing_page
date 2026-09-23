'use client'

import React from 'react'
import type { RdPgBuyBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-14.json + bindings/RdPgBuy.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The closing buy section: two plan cards, three reassurance blocks and a line of small print.


export const RdPgBuy: React.FC<Props> = ({ anchorId, heading, intro, plans, seals, smallPrint, variant }) => {
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className={variant === 'protocol' ? 'rd-pr rd-prbuy' : 'rd-pg rd-pgbuy'} id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "72px 20px"
      }} data-d="pad bigpad">
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(32px, 5.6cqi, 56px)",
          lineHeight: "1",
          letterSpacing: "-0.025em",
          maxWidth: "20ch"
        }} data-d="bigh">{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.2cqi, 18px)",
          lineHeight: "1.55",
          opacity: "0.84",
          marginTop: "18px",
          maxWidth: "50ch"
        }}>{intro}</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "18px",
          marginTop: "36px"
        }} data-m="plans2">
          {(plans || []).map((plan, planIdx) => (
            <div key={planIdx} style={!!plan.badge ? {
              position: "relative",
              border: "1.5px solid var(--cta)",
              borderRadius: "22px",
              padding: "32px 30px",
              display: "flex",
              flexDirection: "column",
              background: "rgba(217, 255, 101, 0.06)"
            } : {
              border: "1.5px solid rgba(240, 245, 255, 0.2)",
              borderRadius: "22px",
              padding: "32px 30px",
              display: "flex",
              flexDirection: "column"
            }}>
              {(!!plan.badge) ? (
                <span style={{
                  position: "absolute",
                  top: "-13px",
                  left: "30px",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "12px",
                  background: "var(--cta)",
                  color: "var(--nb1-black)",
                  padding: "0.6em 1em",
                  borderRadius: "var(--nb1-radius-pill)"
                }}>{plan.badge}</span>
              ) : null}
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "13px"
              }}>{plan.name}</div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.45",
                opacity: "0.82",
                marginTop: "12px"
              }}>{plan.summary}</p>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginTop: "18px"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(34px, 6cqi, 44px)",
                  lineHeight: "1"
                }}>{plan.price}</span>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "17px",
                  opacity: "0.6"
                }}>{plan.priceSuffix}</span>
              </div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "13.5px",
                lineHeight: "1.5",
                opacity: "0.66",
                marginTop: "10px"
              }}>{plan.note}</p>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "10.5px",
                opacity: "0.78",
                marginTop: "22px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(240, 245, 255, 0.2)"
              }}>{plan.featuresLabel}</div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "14px",
                flex: "1 1 0%"
              }}>
                {(plan.features || []).map((feature, featureIdx) => (
                  <div key={featureIdx} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "11px",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15px",
                    lineHeight: "1.45"
                  }}>
                    <span style={!!plan.badge ? {
                      color: "var(--cta)",
                      flex: "0 0 auto"
                    } : {
                      color: "var(--nb1-blue-grey)",
                      flex: "0 0 auto"
                    }}>{"\u2713"}</span>
                    {feature.label}
                  </div>
                ))}
              </div>
              <a style={!!plan.badge ? {
                alignSelf: "flex-start",
                marginTop: "24px",
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                background: "var(--cta)",
                color: "var(--nb1-black)",
                padding: "0.95em 1.4em",
                borderRadius: "var(--nb1-radius-pill)",
                whiteSpace: "nowrap"
              } : {
                alignSelf: "flex-start",
                marginTop: "24px",
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                border: "1.5px solid var(--nb1-cool-grey)",
                color: "var(--nb1-cool-grey)",
                padding: "0.95em 1.4em",
                borderRadius: "var(--nb1-radius-pill)",
                whiteSpace: "nowrap"
              }} href={plan.cta?.url || '#'}>
                <span>{plan.cta?.label}</span>
                <span style={{
                  fontSize: "1.05em",
                  lineHeight: "1"
                }}>{"\u2197"}</span>
              </a>
            </div>
          ))}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "18px",
          marginTop: "34px",
          paddingTop: "28px",
          borderTop: "1px solid rgba(240, 245, 255, 0.2)"
        }} data-m="seals3">
          {(seals || []).map((seal, sealIdx) => (
            <div key={sealIdx}>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(19px, 3.4cqi, 23px)",
                lineHeight: "1.1"
              }}>
                {seal.title}
              </div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.55",
                opacity: "0.8",
                marginTop: "9px",
                maxWidth: "34ch"
              }}>
                {seal.body}
              </p>
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "12.5px",
          lineHeight: "1.55",
          opacity: "0.66",
          marginTop: "28px",
          maxWidth: "70ch"
        }}>{smallPrint}</p>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgBuyComponent = RdPgBuy

export default RdPgBuy
