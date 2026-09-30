'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrJourneyBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-02.json + bindings/RdPrJourney.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Two columns: headline and payment note left, a three-step timeline right. The steps are bound by index because each carries its own icon.


export const RdPrJourney: React.FC<Props> = ({ anchorId, heading, intro, payBody, payFooter, payLabel, payLead, steps }) => {
  return (
    <section style={{
      background: "var(--tint)",
      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
    }} className="rd-pr rd-prjourney" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "38px",
          alignItems: "stretch"
        }} data-m="jside" data-d="side">
          <div style={{
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 5cqi, 50px)",
              lineHeight: "1",
              letterSpacing: "-0.025em",
              maxWidth: "18ch"
            }} data-d="bigh">
              {(heading)?.root ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "18px",
              maxWidth: "44ch"
            }}>{intro}</p>
            <div style={{
              marginTop: "auto",
              background: "var(--nb1-cool-grey)",
              borderRadius: "20px",
              padding: "26px 24px",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline),0 22px 44px -34px rgba(81,71,69,.45)"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>{payLabel}</div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(24px, 4cqi, 30px)",
                lineHeight: "1.15",
                marginTop: "12px",
                maxWidth: "22ch"
              }}>
                {payLead}
                <span style={{
                  display: "inline-block",
                  width: "13px",
                  height: "13px",
                  borderRadius: "50%",
                  background: "var(--nb1-lime)",
                  marginLeft: "8px"
                }} aria-hidden="true" />
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.55",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "14px",
                maxWidth: "44ch"
              }}>
                {(payBody)?.root ? (
                  <RichText data={payBody} enableGutter={false} enableProse={false} />
                ) : null}
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "18px",
                paddingTop: "14px",
                borderTop: "1px solid var(--nb1-hairline)"
              }}>{payFooter}</div>
            </div>
          </div>
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "34px"
            }}>
              <span style={{
                display: "block",
                position: "absolute",
                left: "27.5px",
                top: "56px",
                bottom: "0px",
                width: "1px",
                background: "rgba(81, 71, 69, 0.28)"
              }} />
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--nb1-cool-grey)",
                border: "1.5px solid rgba(81, 71, 69, 0.28)",
                boxShadow: "none",
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }} data-m="jmark">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3.4c3 3.7 5 6.6 5 9.3a5 5 0 0 1-10 0c0-2.7 2-5.6 5-9.3z" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  flexWrap: "wrap"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "11px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>
                    {steps?.[0]?.meta}
                  </span>
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>
                  {steps?.[0]?.title}
                </div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>
                  {steps?.[0]?.body}
                </p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "34px"
            }}>
              <span style={{
                display: "block",
                position: "absolute",
                left: "27.5px",
                top: "56px",
                bottom: "0px",
                width: "1px",
                background: "rgba(81, 71, 69, 0.28)"
              }} />
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--nb1-cool-grey)",
                border: "1.5px solid rgba(81, 71, 69, 0.28)",
                boxShadow: "none",
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }} data-m="jmark">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="3.4" width="14" height="17.2" rx="2" />
                  <path d="M8.6 9h6.8M8.6 13h6.8M8.6 17h4" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  flexWrap: "wrap"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "11px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>
                    {steps?.[1]?.meta}
                  </span>
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>
                  {steps?.[1]?.title}
                </div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>
                  {steps?.[1]?.body}
                </p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "34px"
            }}>
              <span style={{
                display: "none",
                position: "absolute",
                left: "27.5px",
                top: "56px",
                bottom: "0px",
                width: "1px",
                background: "rgba(81, 71, 69, 0.28)"
              }} />
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--nb1-cool-grey)",
                border: "1.5px solid var(--nb1-lime)",
                boxShadow: "0 0 0 6px color-mix(in oklab,var(--nb1-lime) 34%,transparent)",
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }} data-m="jmark">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4.2 7.8 12 4.2l7.8 3.6v8.4L12 19.8 4.2 16.2Z" />
                  <path d="M4.2 7.8 12 11.4l7.8-3.6M12 11.4v8.4" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  flexWrap: "wrap"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "11px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>
                    {steps?.[2]?.meta}
                  </span>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--nb1-lime)",
                    display: "block"
                  }} aria-hidden="true" />
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>
                  {steps?.[2]?.title}
                </div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>
                  {steps?.[2]?.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrJourneyComponent = RdPrJourney

export default RdPrJourney
