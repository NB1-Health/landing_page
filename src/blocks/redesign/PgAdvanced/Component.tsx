'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPgAdvancedBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-03.json + bindings/RdPgAdvanced.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// No state and no effects. The three cards are bound by index rather than repeated: each carries its own drawn icon, and one of them is tinted orange, so there is no single template the three could share.


export const RdPgAdvanced: React.FC<Props> = ({ anchorId, cards, footnote, heading, intro, tagLabel }) => {
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-pg rd-pgadvanced" id={anchorId || undefined} data-m="dark">
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "104px 48px"
      }}>
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(30px, 5cqi, 50px)",
          lineHeight: "1",
          letterSpacing: "-0.025em",
          marginTop: "14px",
          maxWidth: "24ch"
        }} data-d="bigh">{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.2cqi, 18px)",
          lineHeight: "1.55",
          opacity: "0.8",
          marginTop: "16px",
          maxWidth: "58ch"
        }}>{intro}</p>
        <span style={{
          fontSize: "10.5px",
          padding: "0.5em 0.8em",
          background: "var(--nb1-orange)",
          color: "var(--nb1-black)",
          display: "inline-block",
          marginTop: "20px"
        }} className="nb1-tag">{tagLabel}</span>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          alignItems: "stretch",
          marginTop: "34px"
        }} data-m="advgrid">
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            overflow: "hidden",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }} data-m="advcard">
            <div style={{
              padding: "24px 24px 26px",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0%"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px"
              }}>
                <span style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(143, 212, 228, 0.28)"
                }} data-m="advchip">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14.5 4.2 C16.4 4 17.2 5.6 16 7 H8 A1.5 1.5 0 0 0 8 10 H16 A1.5 1.5 0 0 1 16 13 H8 A1.5 1.5 0 0 0 8 16 H16 A1.5 1.5 0 0 1 16 19 H9 C7.6 19 7.3 20.2 8.3 20.9" />
                  </svg>
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  whiteSpace: "nowrap"
                }} data-m="advcad">{cards?.[0]?.chip}</span>
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(22px, 3.8cqi, 28px)",
                lineHeight: "1.08",
                marginTop: "18px"
              }}>{cards?.[0]?.title}</div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.55",
                opacity: "0.8",
                marginTop: "10px"
              }}>{cards?.[0]?.body}</p>
              <div style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--nb1-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                flex: "1 1 0%"
              }}>
                {(cards?.[0]?.points || []).map((pt0, pt0Idx) => (
                  <div key={pt0Idx} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    opacity: "0.82"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "var(--nb1-orange)",
                      flex: "0 0 auto",
                      marginTop: "6px"
                    }} />
                    {pt0.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            overflow: "hidden",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }} data-m="advcard">
            <div style={{
              padding: "24px 24px 26px",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0%"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px"
              }}>
                <span style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(143, 212, 228, 0.28)"
                }} data-m="advchip">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="3.5" width="14" height="17" rx="2" />
                    <path d="M9 3.5 V6 H15 V3.5" />
                    <path d="M8.5 11 L10 12.5 L12.5 9.8" />
                    <path d="M14.5 11 H16" />
                    <path d="M8.5 15.5 H16" />
                  </svg>
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  whiteSpace: "nowrap"
                }} data-m="advcad">{cards?.[1]?.chip}</span>
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(22px, 3.8cqi, 28px)",
                lineHeight: "1.08",
                marginTop: "18px"
              }}>{cards?.[1]?.title}</div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.55",
                opacity: "0.8",
                marginTop: "10px"
              }}>{cards?.[1]?.body}</p>
              <div style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--nb1-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                flex: "1 1 0%"
              }}>
                {(cards?.[1]?.points || []).map((pt1, pt1Idx) => (
                  <div key={pt1Idx} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    opacity: "0.82"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "var(--nb1-orange)",
                      flex: "0 0 auto",
                      marginTop: "6px"
                    }} />
                    {pt1.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            overflow: "hidden",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }} data-m="advcard">
            <div style={{
              padding: "24px 24px 26px",
              display: "flex",
              flexDirection: "column",
              flex: "1 1 0%"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px"
              }}>
                <span style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "12px",
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(255, 139, 62, 0.16)"
                }} data-m="advchip">
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#B5701F" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3 C12 3 6 10.5 6 14.5 A6 6 0 0 0 18 14.5 C18 10.5 12 3 12 3 Z" />
                    <path d="M9.5 14.5 A2.5 2.5 0 0 0 12 17" />
                  </svg>
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  whiteSpace: "nowrap"
                }} data-m="advcad">{cards?.[2]?.chip}</span>
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(22px, 3.8cqi, 28px)",
                lineHeight: "1.08",
                marginTop: "18px"
              }}>{cards?.[2]?.title}</div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.55",
                opacity: "0.8",
                marginTop: "10px"
              }}>{cards?.[2]?.body}</p>
              <div style={{
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--nb1-hairline)",
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                flex: "1 1 0%"
              }}>
                {(cards?.[2]?.points || []).map((pt2, pt2Idx) => (
                  <div key={pt2Idx} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    opacity: "0.82"
                  }}>
                    <span style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "var(--nb1-orange)",
                      flex: "0 0 auto",
                      marginTop: "6px"
                    }} />
                    {pt2.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15px",
          lineHeight: "1.55",
          marginTop: "26px",
          color: "rgba(240, 245, 255, 0.82)",
          maxWidth: "62ch"
        }}>
          {(footnote)?.root ? (
            <RichText data={footnote} enableGutter={false} enableProse={false} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgAdvancedComponent = RdPgAdvanced

export default RdPgAdvanced
