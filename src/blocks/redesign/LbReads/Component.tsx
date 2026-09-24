'use client'

import React from 'react'
import type { RdLbReadsBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-03.json + bindings/RdLbReads.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbreads` and NOT `rd-block`.
//
// Three input cards bound by index, not repeated: each carries its own icon, its own plan-pill colour and its own dimming, all drawn into the markup.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdLbReads: React.FC<Props> = ({ anchorId, authorName, authorRole, cards, conclusion, deepTag, eyebrow, formulaLabel, quote, quoteImage }) => {
  return (
    <section style={{
      background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
    }} className="rd-lb rd-lbreads" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad">
        <div style={{
          fontFamily: "var(--nb1-font-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontSize: "10.5px",
          color: "rgba(81, 71, 69, 0.88)"
        }}>{eyebrow}</div>
        <figure style={{
          margin: "26px 0px 0px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0px",
          background: "var(--nb1-cool-grey)",
          borderRadius: "var(--nb1-radius-md)",
          overflow: "hidden",
          boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.36) 0px 26px 52px -30px"
        }} data-d="quoteband">
          <div style={{ ...{
            width: "100%",
            height: "260px",
            backgroundSize: "cover",
            backgroundPosition: "62% center",
            backgroundColor: "var(--nb1-warm-grey)"
          }, backgroundImage: 'linear-gradient(rgba(179, 231, 243, 0.12), rgba(179, 231, 243, 0.12))' + (mediaUrl(quoteImage) ? ', url("' + mediaUrl(quoteImage) + '")' : '') }} data-m="quoteshot" role="img" aria-label={mediaAlt(quoteImage)} />
          <div style={{
            padding: "30px 28px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            <blockquote style={{
              margin: "0px",
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(21px, 3.6cqi, 30px)",
              lineHeight: "1.22",
              letterSpacing: "-0.018em",
              maxWidth: "34ch"
            }}>{quote}</blockquote>
            <figcaption style={{
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--nb1-hairline)"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "16px"
              }}>{authorName}</div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "7px"
              }}>{authorRole}</div>
            </figcaption>
          </div>
        </figure>
        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "34px",
          overflow: "auto hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          alignItems: "stretch"
        }} data-m="rail readsrail" data-d="g3">
          <div style={{
            position: "relative",
            background: "var(--nb1-cool-grey)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "26px 24px",
            boxShadow: "inset 0 0 0 1px var(--nb1-hairline)"
          }} data-m="readcard">
            <span style={{
              display: "block",
              color: "var(--nb1-blue)"
            }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="var(--nb1-blue)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.5 4.2 C16.4 4 17.2 5.6 16 7 H8 A1.5 1.5 0 0 0 8 10 H16 A1.5 1.5 0 0 1 16 13 H8 A1.5 1.5 0 0 0 8 16 H16 A1.5 1.5 0 0 1 16 19 H9 C7.6 19 7.3 20.2 8.3 20.9" />
              </svg>
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px"
            }}>
              <span style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(21px, 3.6cqi, 26px)",
                lineHeight: "1.1"
              }}>
                {cards?.[0]?.name}
              </span>
              {(deepTag) ? (
                <span style={{
                  fontSize: "10.5px",
                  padding: "0.55em 0.8em"
                }} className="nb1-tag nb1-tag--info">{deepTag}</span>
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              opacity: "0.8",
              marginTop: "10px"
            }}>
              {cards?.[0]?.body}
            </p>
            <span style={{
              display: "inline-block",
              marginTop: "16px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "10.5px",
              background: "var(--nb1-blue-grey)",
              color: "var(--nb1-dark-brown)",
              borderRadius: "var(--nb1-radius-control)",
              padding: "0.55em 0.85em"
            }}>
              {cards?.[0]?.planLabel}
            </span>
          </div>
          <div style={{
            position: "relative",
            background: "var(--nb1-cool-grey)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "26px 24px",
            boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
            opacity: "0.82"
          }} data-m="readcard">
            <span style={{
              display: "block",
              color: "rgba(81, 71, 69, 0.7)"
            }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="rgba(81,71,69,.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="3.5" width="14" height="17" rx="2" />
                <path d="M9 3.5 V6 H15 V3.5" />
                <path d="M8.5 11 L10 12.5 L12.5 9.8" />
                <path d="M14.5 11 H16" />
                <path d="M8.5 15.5 H16" />
              </svg>
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px"
            }}>
              <span style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(21px, 3.6cqi, 26px)",
                lineHeight: "1.1"
              }}>
                {cards?.[1]?.name}
              </span>
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              opacity: "0.8",
              marginTop: "10px"
            }}>
              {cards?.[1]?.body}
            </p>
            <span style={{
              display: "inline-block",
              marginTop: "16px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "10.5px",
              background: "rgba(81, 71, 69, 0.12)",
              color: "var(--nb1-dark-brown)",
              borderRadius: "var(--nb1-radius-control)",
              padding: "0.55em 0.85em"
            }}>
              {cards?.[1]?.planLabel}
            </span>
          </div>
          <div style={{
            position: "relative",
            background: "var(--nb1-cool-grey)",
            borderRadius: "var(--nb1-radius-md)",
            padding: "26px 24px",
            boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
            opacity: "0.82"
          }} data-m="readcard">
            <span style={{
              display: "block",
              color: "rgba(81, 71, 69, 0.7)"
            }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="rgba(81,71,69,.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 C12 3 6 10.5 6 14.5 A6 6 0 0 0 18 14.5 C18 10.5 12 3 12 3 Z" />
                <path d="M9.5 14.5 A2.5 2.5 0 0 0 12 17" />
              </svg>
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "18px"
            }}>
              <span style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(21px, 3.6cqi, 26px)",
                lineHeight: "1.1"
              }}>
                {cards?.[2]?.name}
              </span>
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              opacity: "0.8",
              marginTop: "10px"
            }}>
              {cards?.[2]?.body}
            </p>
            <span style={{
              display: "inline-block",
              marginTop: "16px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "10.5px",
              background: "var(--nb1-orange)",
              color: "var(--nb1-black)",
              borderRadius: "var(--nb1-radius-control)",
              padding: "0.55em 0.85em"
            }}>
              {cards?.[2]?.planLabel}
            </span>
          </div>
        </div>
        <div style={{
          position: "relative",
          marginTop: "8px"
        }}>
          <svg style={{
            width: "100%",
            height: "96px",
            display: "block"
          }} viewBox="0 0 900 120" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <path d="M150 6 C150 70 450 52 450 112" stroke="var(--nb1-dark-brown)" strokeWidth="1.4" />
            <path d="M450 6 C450 60 450 60 450 112" stroke="rgba(81,71,69,.4)" strokeWidth="1.2" />
            <path d="M750 6 C750 70 450 52 450 112" stroke="rgba(81,71,69,.4)" strokeWidth="1.2" />
            <circle cx="150" cy="6" r="5" fill="var(--nb1-dark-brown)" />
            <circle cx="450" cy="6" r="4" fill="rgba(81,71,69,.5)" />
            <circle cx="750" cy="6" r="4" fill="rgba(81,71,69,.5)" />
          </svg>
          <div style={{
            display: "none",
            width: "1.5px",
            height: "44px",
            margin: "0px auto",
            background: "linear-gradient(180deg,var(--nb1-blue-grey),rgba(179,231,243,.35))",
            position: "relative"
          }} data-m="joinline">
            <span style={{
              position: "absolute",
              top: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "var(--nb1-cool-grey)",
              boxShadow: "inset 0 0 0 1.5px var(--nb1-blue-grey)"
            }} />
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "-10px"
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--nb1-cool-grey)",
              boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
              borderRadius: "var(--nb1-radius-pill)",
              padding: "0.85em 1.4em",
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "15px"
            }}>
              <span style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--nb1-dark-brown)"
              }} />
              {formulaLabel}
            </span>
          </div>
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-primary)",
          fontSize: "clamp(22px, 4.4cqi, 32px)",
          lineHeight: "1.2",
          letterSpacing: "-0.02em",
          marginTop: "34px",
          textAlign: "center",
          maxWidth: "24ch",
          marginLeft: "auto",
          marginRight: "auto"
        }}>{conclusion}</p>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbReadsComponent = RdLbReads

export default RdLbReads
