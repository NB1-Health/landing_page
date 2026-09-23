'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import type { RdPrFormulaBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-06.json + bindings/RdPrFormula.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The ingredient rails and the category accordion. The rails hold one cycle of eight each and are tiled three times by the component.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

export const RdPrFormula: React.FC<Props> = ({ anchorId, footerText, groups, heading, intro, libraryLink, railBottom, railTop }) => {
  const [open, setOpen] = useState(null as number | null)

  // The rail drifts sideways for ever, so each row is drawn THREE times end to
  // end — that is what makes the loop seamless, and it is the mockup's own
  // construction, not a choice made here. The CMS holds ONE copy of each row:
  // eight ingredients, not twenty-four. An editor keeping three identical
  // copies in step by hand is a bug waiting to happen, and the tiling is
  // presentation the same way the 01/02/03 on the analyse steps are.
  const tile = <T,>(xs: T[] | null | undefined): T[] => [...(xs ?? []), ...(xs ?? []), ...(xs ?? [])]

  return (
      <section style={{
        background: "var(--tint)",
        borderTop: "1px solid rgba(81, 71, 69, 0.16)",
        borderBottom: "1px solid rgba(81, 71, 69, 0.16)",
        overflow: "hidden"
      }} className="rd-pr rd-prformula" id={anchorId || undefined}>
        <div style={{
          maxWidth: "1240px",
          margin: "0px auto",
          padding: "64px 20px 0px",
          textAlign: "center"
        }} data-d="pad">
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(30px, 5cqi, 50px)",
            lineHeight: "1.02",
            letterSpacing: "-0.025em",
            maxWidth: "26ch",
            margin: "0px auto"
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
            margin: "16px auto 0px",
            maxWidth: "62ch"
          }}>{intro}</p>
        </div>
        <div style={{
          marginTop: "44px",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }} data-m="ingrail">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            width: "max-content",
            animation: "82s linear 0s infinite normal none running nb1drift"
          }} data-m="ingrow">
            {(tile(railTop) || []).map((ing, ingIdx) => (
              <span key={ingIdx} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "22px",
                flex: "0 0 auto"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "15px",
                  color: "rgba(81, 71, 69, 0.32)"
                }} aria-hidden="true">{"+"}</span>
                <span style={{
                  width: "116px",
                  height: "116px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  flex: "0 0 auto",
                  display: "block",
                  background: "color-mix(in oklab,var(--nb1-blue-grey) 16%,var(--nb1-cool-grey))",
                  boxShadow: "rgba(81, 71, 69, 0.12) 0px 0px 0px 1px inset"
                }} data-m="plate">
                  <span style={{ ...{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "multiply"
                  }, backgroundImage: mediaUrl(ing.photo) ? `url('${mediaUrl(ing.photo)}')` : undefined }} role="img" aria-label={ing.name ?? undefined} />
                </span>
              </span>
            ))}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            width: "max-content",
            marginLeft: "-58px",
            animation: "98s linear 0s infinite reverse none running nb1drift"
          }} data-m="ingrow">
            {(tile(railBottom) || []).map((ing2, ing2Idx) => (
              <span key={ing2Idx} style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "22px",
                flex: "0 0 auto"
              }}>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "15px",
                  color: "rgba(81, 71, 69, 0.32)"
                }} aria-hidden="true">{"+"}</span>
                <span style={{
                  width: "116px",
                  height: "116px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  flex: "0 0 auto",
                  display: "block",
                  background: "color-mix(in oklab,var(--nb1-blue-grey) 16%,var(--nb1-cool-grey))",
                  boxShadow: "rgba(81, 71, 69, 0.12) 0px 0px 0px 1px inset"
                }} data-m="plate">
                  <span style={{ ...{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    backgroundSize: "cover",
                    backgroundPosition: "center center",
                    backgroundRepeat: "no-repeat",
                    mixBlendMode: "multiply"
                  }, backgroundImage: mediaUrl(ing2.photo) ? `url('${mediaUrl(ing2.photo)}')` : undefined }} role="img" aria-label={ing2.name ?? undefined} />
                </span>
              </span>
            ))}
          </div>
        </div>
        <div style={{
          maxWidth: "1240px",
          margin: "0px auto",
          padding: "52px 20px 64px"
        }} data-d="pad bigpad">
          <div style={{
            maxWidth: "820px",
            margin: "0px auto"
          }}>
            <div style={{
              borderTop: "1px solid rgba(81, 71, 69, 0.2)"
            }}>
              <button style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "20px 0px",
                border: "0px",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--nb1-dark-brown)"
              }} type={'button'} onClick={() => setOpen(open === 0 ? null : 0)} aria-expanded={open === 0}>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "clamp(16px, 4cqi, 18px)"
                }}>
                  {groups?.[0]?.label}
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "19px",
                  lineHeight: "1",
                  color: "rgba(81, 71, 69, 0.7)",
                  flex: "0 0 auto"
                }}>
                  {open === 0 ? '–' : '+'}
                </span>
              </button>
              <div style={{ display: (open === 0) ? "block" : 'none' }}>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "rgba(81, 71, 69, 0.86)",
                  padding: "0px 0px 22px",
                  maxWidth: "66ch"
                }}>
                  {groups?.[0]?.body}
                </p>
              </div>
            </div>
            <div style={{
              borderTop: "1px solid rgba(81, 71, 69, 0.2)"
            }}>
              <button style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "20px 0px",
                border: "0px",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--nb1-dark-brown)"
              }} type={'button'} onClick={() => setOpen(open === 1 ? null : 1)} aria-expanded={open === 1}>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "clamp(16px, 4cqi, 18px)"
                }}>
                  {groups?.[1]?.label}
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "19px",
                  lineHeight: "1",
                  color: "rgba(81, 71, 69, 0.7)",
                  flex: "0 0 auto"
                }}>
                  {open === 1 ? '–' : '+'}
                </span>
              </button>
              <div style={{ display: (open === 1) ? "block" : 'none' }}>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "rgba(81, 71, 69, 0.86)",
                  padding: "0px 0px 22px",
                  maxWidth: "66ch"
                }}>
                  {groups?.[1]?.body}
                </p>
              </div>
            </div>
            <div style={{
              borderTop: "1px solid rgba(81, 71, 69, 0.2)"
            }}>
              <button style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "20px 0px",
                border: "0px",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--nb1-dark-brown)"
              }} type={'button'} onClick={() => setOpen(open === 2 ? null : 2)} aria-expanded={open === 2}>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "clamp(16px, 4cqi, 18px)"
                }}>
                  {groups?.[2]?.label}
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "19px",
                  lineHeight: "1",
                  color: "rgba(81, 71, 69, 0.7)",
                  flex: "0 0 auto"
                }}>
                  {open === 2 ? '–' : '+'}
                </span>
              </button>
              <div style={{ display: (open === 2) ? "block" : 'none' }}>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "rgba(81, 71, 69, 0.86)",
                  padding: "0px 0px 22px",
                  maxWidth: "66ch"
                }}>
                  {groups?.[2]?.body}
                </p>
              </div>
            </div>
            <div style={{
              borderTop: "1px solid rgba(81, 71, 69, 0.2)"
            }}>
              <button style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "20px 0px",
                border: "0px",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--nb1-dark-brown)"
              }} type={'button'} onClick={() => setOpen(open === 3 ? null : 3)} aria-expanded={open === 3}>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "clamp(16px, 4cqi, 18px)"
                }}>
                  {groups?.[3]?.label}
                </span>
                <span style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  fontSize: "19px",
                  lineHeight: "1",
                  color: "rgba(81, 71, 69, 0.7)",
                  flex: "0 0 auto"
                }}>
                  {open === 3 ? '–' : '+'}
                </span>
              </button>
              <div style={{ display: (open === 3) ? "block" : 'none' }}>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  color: "rgba(81, 71, 69, 0.86)",
                  padding: "0px 0px 22px",
                  maxWidth: "66ch"
                }}>
                  {groups?.[3]?.body}
                </p>
              </div>
            </div>
            <div style={{
              borderTop: "1px solid rgba(81, 71, 69, 0.2)",
              paddingTop: "22px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px"
            }}>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>{footerText}</span>
              <a style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "12px",
                borderBottom: "1.5px solid var(--nb1-dark-brown)",
                paddingBottom: "2px",
                whiteSpace: "nowrap"
              }} href={libraryLink?.url || '#'}>{libraryLink?.label}</a>
            </div>
          </div>
        </div>
      </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrFormulaComponent = RdPrFormula

export default RdPrFormula
