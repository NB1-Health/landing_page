import React from 'react'
import RichText from '@/components/RichText'
import type { RdProtocolBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-02.json + bindings/RdProtocol.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// No state, so no 'use client' here — but note every block in this repo is in
// the client graph regardless, because RenderBlocks.client.tsx imports them.
// That is why this component is a plain function and never async.
//
// The four steps are bound per index rather than repeated: the first three carry
// a connector rail and the last does not.

export const RdProtocol: React.FC<Props> = (props) => {
  const { anchorId, heading, intro, callout } = props
  const steps = props.steps ?? []
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-block rd-protocol" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad" data-m="stack">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "40px",
          alignItems: "start"
        }} data-d="side">
          <div>
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 5.2cqi, 50px)",
              lineHeight: "0.98",
              letterSpacing: "-0.02em",
              maxWidth: "520px"
            }}>{heading}</h2>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.5",
              opacity: "0.78",
              marginTop: "18px",
              maxWidth: "46ch"
            }}>{intro}</p>
            <div style={{
              marginTop: "28px",
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
                opacity: "0.8"
              }}>{callout?.label}</div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "52px",
                lineHeight: "1",
                marginTop: "8px"
              }}>
                {callout?.marker}
                <span style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "var(--nb1-lime)",
                  verticalAlign: "super",
                  marginLeft: "4px"
                }} aria-hidden="true" />
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.55",
                opacity: "0.82",
                marginTop: "12px",
                maxWidth: "44ch"
              }}>
                {(callout?.body)?.root ? (
                  <RichText data={callout?.body} enableGutter={false} enableProse={false} />
                ) : null}
              </div>
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
              <div style={{
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
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3.4c3 3.7 5 6.6 5 9.3a5 5 0 0 1-10 0c0-2.7 2-5.6 5-9.3z" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "11px",
                  color: "rgba(81, 71, 69, 0.82)"
                }}>
                  {(steps?.[0]?.week)?.root ? (
                    <RichText data={steps?.[0]?.week} enableGutter={false} enableProse={false} />
                  ) : null}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>{steps?.[0]?.title}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  opacity: "0.75",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>{steps?.[0]?.body}</p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "34px"
            }}>
              <div style={{
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
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6" />
                  <path d="M15.6 15.6 20 20" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "11px",
                  color: "rgba(81, 71, 69, 0.82)"
                }}>
                  {(steps?.[1]?.week)?.root ? (
                    <RichText data={steps?.[1]?.week} enableGutter={false} enableProse={false} />
                  ) : null}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>{steps?.[1]?.title}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  opacity: "0.75",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>{steps?.[1]?.body}</p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "34px"
            }}>
              <div style={{
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
                boxShadow: "rgba(217, 255, 101, 0.4) 0px 0px 0px 5px, rgba(217, 255, 101, 0.3) 0px 0px 22px 7px",
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 3h5M11 3v5l-4.3 8.2A2 2 0 0 0 8.5 19h7a2 2 0 0 0 1.8-2.8L13 8V3" />
                  <path d="M8.6 14h6.8" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "11px",
                  color: "rgba(81, 71, 69, 0.82)"
                }}>
                  {(steps?.[2]?.week)?.root ? (
                    <RichText data={steps?.[2]?.week} enableGutter={false} enableProse={false} />
                  ) : null}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>{steps?.[2]?.title}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  opacity: "0.75",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>{steps?.[2]?.body}</p>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr",
              gap: "18px",
              position: "relative",
              paddingBottom: "0px"
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--nb1-cool-grey)",
                border: "1.5px solid rgba(81, 71, 69, 0.28)",
                display: "grid",
                placeItems: "center",
                position: "relative",
                zIndex: "1"
              }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.8 20 7v10l-8 4.2L4 17V7z" />
                  <path d="M4 7l8 4.2L20 7M12 11.2V21" />
                </svg>
              </div>
              <div style={{
                paddingTop: "6px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "11px",
                  color: "rgba(81, 71, 69, 0.82)"
                }}>
                  {(steps?.[3]?.week)?.root ? (
                    <RichText data={steps?.[3]?.week} enableGutter={false} enableProse={false} />
                  ) : null}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(24px, 4.4cqi, 32px)",
                  lineHeight: "1",
                  marginTop: "9px"
                }}>{steps?.[3]?.title}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  opacity: "0.75",
                  marginTop: "9px",
                  maxWidth: "38ch"
                }}>{steps?.[3]?.body}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const RdProtocolComponent = RdProtocol

export default RdProtocol
