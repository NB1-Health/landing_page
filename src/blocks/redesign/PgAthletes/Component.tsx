'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPgAthletesBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-10.json + bindings/RdPgAthletes.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The athletes band: a heading over two photographic quote cards, with a record strip underneath.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPgAthletes: React.FC<Props> = ({ anchorId, athletes, heading, intro, recordLabel, recordPlace, recordValue }) => {
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-pg rd-pgathletes" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "104px 48px 72px"
      }}>
        <div style={{
          maxWidth: "640px",
          marginBottom: "44px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(40px, 5vw, 58px)",
            lineHeight: "0.95",
            letterSpacing: "-0.02em"
          }}>
            {(heading)?.root ? (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "18px",
            lineHeight: "1.45",
            opacity: "0.8",
            marginTop: "18px"
          }}>{intro}</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.18fr 1fr",
          gap: "20px",
          alignItems: "stretch"
        }} data-m="athgrid">
          {(athletes || []).map((ath, athIdx) => (
            <div key={athIdx} style={{
              position: "relative",
              borderRadius: "22px",
              overflow: "hidden",
              minHeight: "560px",
              display: "flex",
              alignItems: "flex-end"
            }}>
              <img style={{
                position: "absolute",
                inset: "0px",
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }} src={mediaUrl(ath.photo)} alt={mediaAlt(ath.photo) || ''} />
              <div style={{
                position: "absolute",
                inset: "0px",
                background: "linear-gradient(0deg, rgba(58, 50, 49, 0.94) 0%, rgba(58, 50, 49, 0.12) 62%)"
              }} />
              <div style={{
                position: "relative",
                padding: "40px"
              }}>
                <div style={athIdx === 0 ? {
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(26px, 2.3vw, 34px)",
                  lineHeight: "1.14",
                  letterSpacing: "-0.01em",
                  maxWidth: "24ch"
                } : {
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(24px, 2.1vw, 30px)",
                  lineHeight: "1.16",
                  letterSpacing: "-0.01em",
                  maxWidth: "22ch"
                }}>{ath.quote}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px",
                  opacity: "0.8",
                  marginTop: "22px",
                  lineHeight: "1.5"
                }}>{ath.attribution}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: "34px",
          alignItems: "center",
          marginTop: "20px",
          border: "1px solid rgba(240, 245, 255, 0.18)",
          borderRadius: "22px",
          padding: "28px 40px"
        }} data-m="athrec">
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "11px",
            opacity: "0.62",
            lineHeight: "1.6",
            maxWidth: "24ch"
          }}>{recordLabel}</div>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontSize: "clamp(44px, 5.4vw, 66px)",
            lineHeight: "1",
            letterSpacing: "-0.02em",
            color: "var(--nb1-blue-grey)"
          }}>{recordValue}</div>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "11px",
            opacity: "0.62",
            textAlign: "right"
          }}>{recordPlace}</div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgAthletesComponent = RdPgAthletes

export default RdPgAthletes
