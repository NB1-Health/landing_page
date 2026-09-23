'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrAdvancedBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-08.json + bindings/RdPrAdvanced.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Core against Advanced. Three cards bound by index because each has its own icon; their bullet rows repeat.


export const RdPrAdvanced: React.FC<Props> = ({ anchorId, cards, footerLink, footerText, heading, intro, tag }) => {
  return (
    <section style={{
      background: "var(--tint)",
      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
    }} className="rd-pr rd-pradvanced" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(30px, 5cqi, 50px)",
          lineHeight: "1",
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
          lineHeight: "1.55",
          color: "rgba(81, 71, 69, 0.86)",
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
        }} className="nb1-tag">{tag}</span>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "18px",
          alignItems: "stretch",
          marginTop: "34px"
        }} data-m="advgrid">
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "24px 24px 26px",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px"
            }}>
              <span style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                background: "color-mix(in oklab,var(--nb1-blue) 22%,var(--nb1-cool-grey))"
              }}>
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.2 12a8.2 8.2 0 1 1-2.4-5.8" />
                  <path d="M20.4 4.4v4.2h-4.2" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                whiteSpace: "nowrap"
              }}>
                {cards?.[0]?.meta}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(22px, 3.8cqi, 28px)",
              lineHeight: "1.08",
              marginTop: "18px"
            }}>
              {cards?.[0]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.84)",
              marginTop: "10px"
            }}>
              {cards?.[0]?.body}
            </p>
            <div style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid var(--nb1-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              flex: "1 1 0%"
            }}>
              {(cards?.[0]?.rows || []).map((rw0, rw0Idx) => (
                <div key={rw0Idx} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.84)"
                }}>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--nb1-orange)",
                    flex: "0 0 auto",
                    marginTop: "6px"
                  }} />
                  {rw0.text}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "24px 24px 26px",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px"
            }}>
              <span style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                background: "color-mix(in oklab,var(--nb1-lime) 22%,var(--nb1-cool-grey))"
              }}>
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3.6 19 7.4v9.2L12 20.4 5 16.6V7.4Z" />
                  <path d="M5 7.4 12 11.2 19 7.4M12 11.2V20.4" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                whiteSpace: "nowrap"
              }}>
                {cards?.[1]?.meta}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(22px, 3.8cqi, 28px)",
              lineHeight: "1.08",
              marginTop: "18px"
            }}>
              {cards?.[1]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.84)",
              marginTop: "10px"
            }}>
              {cards?.[1]?.body}
            </p>
            <div style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid var(--nb1-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              flex: "1 1 0%"
            }}>
              {(cards?.[1]?.rows || []).map((rw1, rw1Idx) => (
                <div key={rw1Idx} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.84)"
                }}>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--nb1-orange)",
                    flex: "0 0 auto",
                    marginTop: "6px"
                  }} />
                  {rw1.text}
                </div>
              ))}
            </div>
          </div>
          <div style={{
            background: "var(--nb1-cool-grey)",
            color: "var(--nb1-dark-brown)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "24px 24px 26px",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px"
            }}>
              <span style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                background: "color-mix(in oklab,var(--nb1-orange) 22%,var(--nb1-cool-grey))"
              }}>
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3.4S6.6 10 6.6 14a5.4 5.4 0 0 0 10.8 0C17.4 10 12 3.4 12 3.4Z" />
                  <path d="M9.6 14.4A2.4 2.4 0 0 0 12 16.8" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                whiteSpace: "nowrap"
              }}>
                {cards?.[2]?.meta}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(22px, 3.8cqi, 28px)",
              lineHeight: "1.08",
              marginTop: "18px"
            }}>
              {cards?.[2]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.84)",
              marginTop: "10px"
            }}>
              {cards?.[2]?.body}
            </p>
            <div style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid var(--nb1-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              flex: "1 1 0%"
            }}>
              {(cards?.[2]?.rows || []).map((rw2, rw2Idx) => (
                <div key={rw2Idx} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "rgba(81, 71, 69, 0.84)"
                }}>
                  <span style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--nb1-orange)",
                    flex: "0 0 auto",
                    marginTop: "6px"
                  }} />
                  {rw2.text}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "20px",
          marginTop: "28px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "15px",
            lineHeight: "1.55",
            color: "rgba(81, 71, 69, 0.86)",
            maxWidth: "56ch"
          }}>
            {(footerText)?.root ? (
              <RichText data={footerText} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <a style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "12px",
            borderBottom: "1.5px solid var(--nb1-dark-brown)",
            paddingBottom: "2px",
            whiteSpace: "nowrap"
          }} href={footerLink?.url || '#'}>{footerLink?.label}</a>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrAdvancedComponent = RdPrAdvanced

export default RdPrAdvanced
