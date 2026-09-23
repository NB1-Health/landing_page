'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrArrivesBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-07.json + bindings/RdPrArrives.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Three product cards with nested bullet rows, a before/after pair, three benefits and a review.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

export const RdPrArrives: React.FC<Props> = ({ anchorId, attribution, benefits, heading, intro, midline, packs, proofAlt, proofImage, quote, shots }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-pr rd-prarrives" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(30px, 5cqi, 50px)",
          lineHeight: "1.02",
          letterSpacing: "-0.025em",
          maxWidth: "24ch"
        }} data-d="bigh">
          {(heading)?.root ? (
            <RichText data={heading} enableGutter={false} enableProse={false} />
          ) : null}
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.2cqi, 18px)",
          lineHeight: "1.6",
          color: "rgba(81, 71, 69, 0.86)",
          marginTop: "18px",
          maxWidth: "56ch"
        }}>{intro}</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0px",
          marginTop: "36px",
          borderTop: "1px solid rgba(81, 71, 69, 0.24)"
        }} data-m="trio">
          {(packs || []).map((pk, pkIdx) => (
            <div key={pkIdx} style={{
              position: "relative",
              padding: "26px 0px 30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }} data-m="triocell">
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <span style={{ ...{
                  '--nb1-bubble-size': "46px",
                  '--nb1-bubble-fill': "52%",
                  '--nb1-bubble-blur': "16%",
                  flex: "0 0 auto"
                } as React.CSSProperties, "--nb1-bubble-halo": pk.accent ? `var(--nb1-${pk.accent})` : undefined } as React.CSSProperties} className="nb1-bubble nb1-bubble--ombre" data-domain={pk.domain || undefined}>
                  <span className="nb1-bubble__orb" />
                </span>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(26px, 4.4cqi, 34px)",
                  lineHeight: "1",
                  marginTop: "18px"
                }}>
                  {pk.name}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "10px"
                }}>
                  {pk.timing}
                  {" \u00b7 "}
                  {pk.form}
                </div>
              </div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.55",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "18px",
                maxWidth: "30ch"
              }}>
                {pk.body}
              </p>
              <div style={{
                marginTop: "18px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(81, 71, 69, 0.14)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                flex: "1 1 0%",
                alignSelf: "stretch",
                textAlign: "left",
                alignItems: "center"
              }}>
                {(pk.items || []).map((it, itIdx) => (
                  <div key={itIdx} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14.5px",
                    lineHeight: "1.5",
                    color: "rgba(81, 71, 69, 0.86)",
                    width: "100%",
                    maxWidth: "30ch"
                  }}>
                    <span style={{ ...{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      marginTop: "6px",
                      display: "block"
                    }, background: pk.accent ? `var(--nb1-${pk.accent})` : undefined }} />
                    {it.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-primary)",
          fontSize: "clamp(21px, 4cqi, 28px)",
          lineHeight: "1.25",
          marginTop: "52px",
          maxWidth: "26ch"
        }}>{midline}</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          marginTop: "20px"
        }}>
          {(shots || []).map((sh, shIdx) => (
            <figure key={shIdx} style={{
              margin: "0px"
            }}>
              <div style={{ ...{
                width: "100%",
                height: "280px",
                borderRadius: "var(--nb1-radius-md)",
                backgroundSize: "cover",
                backgroundPosition: "center center"
              }, backgroundImage: mediaUrl(sh.image) ? `url('${mediaUrl(sh.image)}')` : undefined, backgroundColor: sh.plate === 'tint' ? 'var(--tint)' : 'var(--nb1-cool-grey)' }} data-m="kitshot" role="img" aria-label={sh.alt ?? undefined} />
              <figcaption style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "12px"
              }}>{sh.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "16px",
          marginTop: "24px"
        }} data-m="benefits3">
          {(benefits || []).map((bn, bnIdx) => (
            <div key={bnIdx} style={{
              background: "var(--nb1-cool-grey)",
              borderRadius: "var(--nb1-radius-md)",
              padding: "24px 22px",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline)"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(20px, 3.6cqi, 24px)",
                lineHeight: "1.1"
              }}>
                {bn.title}
              </div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.55",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "10px"
              }}>
                {bn.body}
              </p>
            </div>
          ))}
        </div>
        <figure style={{
          margin: "44px 0px 0px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "22px",
          alignItems: "center",
          paddingTop: "32px",
          borderTop: "1px solid rgba(81, 71, 69, 0.22)"
        }} data-m="proof">
          <div style={{ ...{
            width: "92px",
            height: "92px",
            borderRadius: "50%",
            backgroundSize: "cover",
            backgroundPosition: "center 18%",
            backgroundColor: "var(--nb1-warm-grey)",
            flex: "0 0 auto"
          }, backgroundImage: mediaUrl(proofImage) ? `url('${mediaUrl(proofImage)}')` : undefined }} data-m="proofshot" role="img" aria-label={proofAlt ?? undefined} />
          <div>
            <blockquote style={{
              margin: "0px",
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(20px, 3.4cqi, 27px)",
              lineHeight: "1.25",
              letterSpacing: "-0.015em",
              maxWidth: "44ch"
            }}>{quote}</blockquote>
            <figcaption style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "10.5px",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "16px"
            }}>{attribution}</figcaption>
          </div>
        </figure>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrArrivesComponent = RdPrArrives

export default RdPrArrives
