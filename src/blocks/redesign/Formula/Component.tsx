'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import type { RdFormulaBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-03.json + bindings/RdFormula.json
// Styles copied verbatim from the mockup; bindings replace content only.
//
// Three tabs, one panel each — observed by clicking them in the mockup, not
// assumed. The panels have genuinely different shapes, so they are three named
// groups rather than three rows of one array.
//
// The active tab's button carries the mockup's own active styling and the other
// two carry its inactive styling; both came from the mockup's rendered output
// via `styleToggle`, so neither was retyped.

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdFormula: React.FC<Props> = (props) => {
  const {
    anchorId, heading, intro, replacesLabel, kitImage, imageCaption,
    morning, evening, living,
  } = props
  const replaces = props.replaces ?? []
  const [activeTab, setActiveTab] = useState(0)
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-block rd-formula" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          textAlign: "center",
          maxWidth: "720px",
          margin: "0px auto 40px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(30px, 5.2cqi, 52px)",
            lineHeight: "0.95",
            letterSpacing: "-0.02em"
          }}>
            {(heading)?.root ? (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <div style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "clamp(16px, 4.2cqi, 18px)",
            lineHeight: "1.5",
            opacity: "0.8",
            marginTop: "18px"
          }}>
            {(intro)?.root ? (
              <RichText data={intro} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "22px",
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "11px"
          }}>
            <span style={{
              opacity: "0.55"
            }}>{replacesLabel}</span>
            {(replaces || []).map((rep, repIdx) => (
              <span key={repIdx} style={{
                border: "1px solid rgba(240, 245, 255, 0.28)",
                borderRadius: "999px",
                padding: "0.4em 0.9em",
                opacity: "0.8"
              }}>{rep.label}</span>
            ))}
          </div>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "32px",
          alignItems: "start"
        }} data-d="side">
          <div style={{
            position: "relative",
            borderRadius: "22px",
            overflow: "hidden",
            boxShadow: "rgba(0, 0, 0, 0.55) 0px 40px 80px -40px"
          }}>
            <img style={{
              display: "block",
              width: "100%",
              height: "auto"
            }} src={mediaUrl(kitImage)} alt={mediaAlt(kitImage)} />
            <div style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "11px",
              color: "var(--nb1-dark-brown)",
              background: "var(--nb1-cool-grey)",
              padding: "0.6em 1em",
              borderRadius: "999px"
            }}>
              <span style={{
                width: "0.6em",
                height: "0.6em",
                borderRadius: "50%",
                background: "var(--nb1-blue)"
              }} />
              {imageCaption}
            </div>
          </div>
          <div>
            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px"
            }}>
              <button style={activeTab === 0 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-blue)",
                color: "var(--nb1-black)"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "rgba(240, 245, 255, 0.08)",
                color: "var(--nb1-cool-grey)"
              }} type={'button'} onClick={() => setActiveTab(0)} aria-pressed={activeTab === 0}>{morning?.tabLabel}</button>
              <button style={activeTab !== 1 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "rgba(240, 245, 255, 0.08)",
                color: "var(--nb1-cool-grey)"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-blue)",
                color: "var(--nb1-black)"
              }} type={'button'} onClick={() => setActiveTab(1)} aria-pressed={activeTab === 1}>{evening?.tabLabel}</button>
              <button style={activeTab !== 2 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "rgba(240, 245, 255, 0.08)",
                color: "var(--nb1-cool-grey)"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "13px",
                padding: "0.7em 1.3em",
                borderRadius: "var(--nb1-radius-pill)",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-blue)",
                color: "var(--nb1-black)"
              }} type={'button'} onClick={() => setActiveTab(2)} aria-pressed={activeTab === 2}>{living?.tabLabel}</button>
            </div>
            <div style={{
              minHeight: "0px"
            }} data-m="fpanel">
              <div style={{ display: (activeTab === 0) ? '' : 'none' }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px",
                  color: "var(--nb1-blue)",
                  marginBottom: "14px"
                }}>{morning?.heading}</div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "26px"
                  }}>{morning?.itemName}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "11px",
                    opacity: "0.6"
                  }}>{morning?.itemMeta}</span>
                </div>
                <div style={{
                  background: "rgba(240, 245, 255, 0.06)",
                  border: "1px solid rgba(240, 245, 255, 0.14)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  marginTop: "14px"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "10.5px",
                    color: "var(--nb1-blue)",
                    marginBottom: "6px"
                  }}>{morning?.whyLabel}</div>
                  <div style={{
                    fontSize: "14.5px",
                    lineHeight: "1.45",
                    opacity: "0.85"
                  }}>
                    {(morning?.whyBody)?.root ? (
                      <RichText data={morning?.whyBody} enableGutter={false} enableProse={false} />
                    ) : null}
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "14px",
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "11px",
                  letterSpacing: "0.04em"
                }}>
                  {(morning?.strains || []).map((strain, strainIdx) => (
                    <span key={strainIdx} style={{
                      border: "1px solid rgba(240, 245, 255, 0.24)",
                      borderRadius: "999px",
                      padding: "0.45em 0.8em"
                    }}>{strain.label}</span>
                  ))}
                </div>
                <div style={{
                  marginTop: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px"
                }}>
                  {(morning?.extras || []).map((extra, extraIdx) => (
                    <div key={extraIdx} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 0px",
                      borderTop: "1px solid rgba(240, 245, 255, 0.14)"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{extra.name}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "11px",
                        opacity: "0.6",
                        letterSpacing: "0.06em"
                      }}>{extra.meta}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...{
                display: "none"
              }, display: (activeTab === 1) ? '' : 'none' }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px",
                  color: "var(--nb1-blue)",
                  marginBottom: "14px"
                }}>{evening?.heading}</div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px"
                }}>
                  {(evening?.items || []).map((item, itemIdx) => (
                    <div key={itemIdx} style={!item.leftOut ? {
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px 0px",
                      borderTop: "1px solid rgba(240, 245, 255, 0.14)"
                    } : {
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "14px 0px",
                      borderTop: "1px solid rgba(240, 245, 255, 0.14)",
                      opacity: "0.45"
                    }}>
                      <span style={!item.leftOut ? {
                        fontSize: "15px"
                      } : {
                        fontSize: "15px",
                        textDecoration: "line-through"
                      }}>{item.name}</span>
                      <span style={!item.leftOut ? {
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "11px",
                        opacity: "0.6",
                        letterSpacing: "0.06em"
                      } : {
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "11px",
                        letterSpacing: "0.06em"
                      }}>{item.meta}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  fontSize: "14px",
                  lineHeight: "1.5",
                  opacity: "0.75",
                  marginTop: "16px",
                  display: "flex",
                  gap: "8px"
                }}>
                  {(evening?.note)?.root ? (
                    <RichText data={evening?.note} enableGutter={false} enableProse={false} />
                  ) : null}
                </div>
              </div>
              <div style={{ ...{
                display: "none"
              }, display: (activeTab === 2) ? '' : 'none' }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px",
                  color: "var(--nb1-blue)",
                  marginBottom: "14px"
                }}>{living?.heading}</div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "26px"
                  }}>{living?.itemName}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "11px",
                    opacity: "0.6"
                  }}>{living?.itemMeta}</span>
                </div>
                <div style={{
                  background: "rgba(240, 245, 255, 0.06)",
                  border: "1px solid rgba(240, 245, 255, 0.14)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  marginTop: "14px"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "10.5px",
                    color: "var(--nb1-blue)",
                    marginBottom: "6px"
                  }}>{living?.whyLabel}</div>
                  <div style={{
                    fontSize: "14.5px",
                    lineHeight: "1.45",
                    opacity: "0.85"
                  }}>
                    {(living?.whyBody)?.root ? (
                      <RichText data={living?.whyBody} enableGutter={false} enableProse={false} />
                    ) : null}
                  </div>
                </div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "14px",
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "11px",
                  letterSpacing: "0.04em"
                }}>
                  {(living?.chips || []).map((chip, chipIdx) => (
                    <span key={chipIdx} style={{
                      border: "1px solid rgba(240, 245, 255, 0.24)",
                      borderRadius: "999px",
                      padding: "0.45em 0.8em"
                    }}>{chip.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const RdFormulaComponent = RdFormula

export default RdFormula
