'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrAnalyseBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-05.json + bindings/RdPrAnalyse.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The science board roster and the three review steps. Portraits are CSS backgrounds, as in the mockup; the steps are bound by index because each has its own icon.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

export const RdPrAnalyse: React.FC<Props> = ({ anchorId, boardLink, footerText, heading, intro, people, steps }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-pr rd-pranalyse" id={anchorId || undefined}>
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
          maxWidth: "22ch"
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
          marginTop: "16px",
          maxWidth: "58ch"
        }}>{intro}</p>
        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "32px",
          overflow: "auto hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none"
        }} data-m="roster">
          {(people || []).map((pp, ppIdx) => (
            <div key={ppIdx} style={{
              flex: "0 0 64%",
              scrollSnapAlign: "start"
            }} data-m="rostercell">
              <div style={{ ...{
                width: "100%",
                aspectRatio: "4 / 5",
                display: "block",
                borderRadius: "var(--nb1-radius-md)",
                overflow: "hidden",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundColor: "var(--nb1-warm-grey)"
              }, backgroundImage: mediaUrl(pp.photo) ? `url('${mediaUrl(pp.photo)}')` : undefined, backgroundPosition: pp.focal || 'center center' }} role="img" aria-label={pp.name ?? undefined} />
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)",
                marginTop: "14px"
              }}>
                {pp.role}
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "16px",
                lineHeight: "1.3",
                marginTop: "7px"
              }}>
                {pp.name}
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "13.5px",
                lineHeight: "1.4",
                color: "rgba(81, 71, 69, 0.8)",
                marginTop: "5px"
              }}>
                {pp.credentials}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "18px",
          marginTop: "34px"
        }} data-m="steps3">
          <div style={{
            padding: "22px 0px 0px",
            borderTop: "1px solid rgba(81, 71, 69, 0.2)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
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
                  <path d="M6 4c0 5.4 12 10.6 12 16M18 4c0 5.4-12 10.6-12 16" />
                  <path d="M8.2 8h7.6M8.2 16h7.6" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>
                {String(0 + 1).padStart(2, '0')}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(21px, 3.6cqi, 26px)",
              lineHeight: "1.1",
              marginTop: "14px"
            }}>
              {steps?.[0]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "10px",
              maxWidth: "34ch"
            }}>
              {steps?.[0]?.body}
            </p>
          </div>
          <div style={{
            padding: "22px 0px 0px",
            borderTop: "1px solid rgba(81, 71, 69, 0.2)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <span style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                background: "color-mix(in oklab,var(--nb1-blue-grey) 22%,var(--nb1-cool-grey))"
              }}>
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="3.4" width="14" height="17.2" rx="2" />
                  <path d="M9 3.4V6h6V3.4" />
                  <path d="M8.6 11.4 10 12.8l2.6-2.8M14.6 11.4H16M8.6 15.8H16" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>
                {String(1 + 1).padStart(2, '0')}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(21px, 3.6cqi, 26px)",
              lineHeight: "1.1",
              marginTop: "14px"
            }}>
              {steps?.[1]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "10px",
              maxWidth: "34ch"
            }}>
              {steps?.[1]?.body}
            </p>
          </div>
          <div style={{
            padding: "22px 0px 0px",
            borderTop: "1px solid rgba(81, 71, 69, 0.2)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px"
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
                  <path d="M4 17.2c3.2 0 4.4-3.4 6.6-8.1 1.1-2.3 2.6-2.5 3.2-1 .6 1.7-.6 3.5-2 3.1-1.8-.5.4-3.3 3.4-3.3 2.2 0 3.2 1.6 4.8 1.6" />
                  <path d="M4 20.6h16" />
                </svg>
              </span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>
                {String(2 + 1).padStart(2, '0')}
              </span>
            </div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(21px, 3.6cqi, 26px)",
              lineHeight: "1.1",
              marginTop: "14px"
            }}>
              {steps?.[2]?.title}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14.5px",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "10px",
              maxWidth: "34ch"
            }}>
              {steps?.[2]?.body}
            </p>
          </div>
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "18px",
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: "1px solid rgba(81, 71, 69, 0.2)"
        }}>
          <span style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "15.5px",
            color: "rgba(81, 71, 69, 0.86)",
            maxWidth: "46ch"
          }}>{footerText}</span>
          <a style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "12px",
            borderBottom: "1.5px solid var(--nb1-dark-brown)",
            paddingBottom: "2px",
            whiteSpace: "nowrap"
          }} href={boardLink?.url || '#'}>{boardLink?.label}</a>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrAnalyseComponent = RdPrAnalyse

export default RdPrAnalyse
