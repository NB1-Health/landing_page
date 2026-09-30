'use client'

import React from 'react'
import type { RdPgTimelineBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-08.json + bindings/RdPgTimeline.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The four-month timeline: a heading, four month columns, and a photo banner holding four figures.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPgTimeline: React.FC<Props> = ({ anchorId, bannerLabel, heading, image, intro, monthLabel, months, stats }) => {
  return (
    <section style={{
      maxWidth: "1240px",
      margin: "0px auto",
      padding: "64px 48px 104px"
    }} className="rd-pg rd-pgtimeline" id={anchorId || undefined}>
      <div style={{
        textAlign: "center",
        maxWidth: "680px",
        margin: "0px auto 56px"
      }}>
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(38px, 4.6vw, 54px)",
          lineHeight: "0.95",
          letterSpacing: "-0.02em"
        }}>{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "18px",
          lineHeight: "1.45",
          opacity: "0.78",
          marginTop: "18px"
        }}>{intro}</p>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "24px"
      }} data-m="tlgrid">
        {(months || []).map((month, monthIdx) => (
          <div key={monthIdx} style={{ ...{
            paddingTop: "22px"
          }, borderTop: monthIdx === 0 ? '2px solid var(--nb1-orange)' : '2px solid rgba(81, 71, 69, 0.2)' }} data-m="tlcell">
            <span style={{ ...{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "block",
              marginBottom: "16px"
            }, background: `radial-gradient(circle closest-side,var(--nb1-orange) 0% ${month.dial ?? 0}%,color-mix(in oklab,var(--nb1-orange) ${(month.dial ?? 0) / 2}%,var(--nb1-cool-grey)) ${(month.dial ?? 0) + 6}% 70%,var(--nb1-cool-grey) 70% 74%,var(--nb1-orange) 74% 88%,color-mix(in oklab,var(--nb1-blue-grey) 80%,var(--nb1-cool-grey)) 88% 100%)` }} data-m="tlorb" />
            <div style={{
              display: "inline-flex",
              alignItems: "stretch",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "11px"
            }} data-m="tlmonth">
              <span style={{
                background: "var(--nb1-blue-grey)",
                color: "var(--nb1-dark-brown)",
                padding: "0.42em 0.6em",
                borderRadius: "6px 0px 0px 6px"
              }}>{monthLabel}</span>
              <span style={{
                background: "color-mix(in oklab,var(--nb1-blue-grey) 74%,var(--nb1-cool-grey))",
                color: "var(--nb1-dark-brown)",
                minWidth: "1.9em",
                display: "grid",
                placeItems: "center",
                borderRadius: "999px",
                marginLeft: "2px"
              }}>{month.number}</span>
              {(!!month.tag) ? (
                <span style={{
                  display: "inline-grid",
                  placeItems: "center",
                  background: "var(--nb1-blue)",
                  color: "var(--nb1-dark-brown)",
                  letterSpacing: "0.08em",
                  padding: "0.42em 0.7em",
                  borderRadius: "999px",
                  marginLeft: "8px"
                }}>{month.tag}</span>
              ) : null}
            </div>
            <h4 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "24px",
              margin: "8px 0px"
            }} data-m="tlh">{month.title}</h4>
            <p style={{
              fontSize: "14px",
              lineHeight: "1.5",
              opacity: "0.72"
            }}>{month.body}</p>
          </div>
        ))}
      </div>
      <div style={{
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
        marginTop: "32px",
        minHeight: "280px",
        display: "flex",
        alignItems: "center"
      }}>
        <img style={{
          position: "absolute",
          inset: "0px",
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }} src={mediaUrl(image)} alt={mediaAlt(image)} />
        <div style={{
          position: "absolute",
          inset: "0px",
          background: "linear-gradient(90deg, rgba(81, 71, 69, 0.9) 0%, rgba(81, 71, 69, 0.55) 60%, rgba(81, 71, 69, 0.2) 100%)"
        }} />
        <div style={{
          position: "relative",
          padding: "40px 48px",
          color: "var(--nb1-cool-grey)",
          width: "100%"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "11px",
            color: "var(--nb1-blue)",
            marginBottom: "22px"
          }}>{bannerLabel}</div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "26px 24px"
          }} data-m="statgrid" data-keepcols="1">
            <div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "40px",
                lineHeight: "1"
              }}>{stats?.[0]?.value}</div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "10.5px",
                opacity: "0.75",
                marginTop: "8px",
                maxWidth: "17ch",
                lineHeight: "1.5"
              }}>
                {stats?.[0]?.caption}
                <span style={{
                  whiteSpace: "nowrap"
                }}>{stats?.[0]?.tail}</span>
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "40px",
                lineHeight: "1"
              }}>{stats?.[1]?.value}</div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "10.5px",
                opacity: "0.75",
                marginTop: "8px",
                maxWidth: "17ch",
                lineHeight: "1.5"
              }}>
                {stats?.[1]?.caption}
                <span style={{
                  whiteSpace: "nowrap"
                }}>{stats?.[1]?.tail}</span>
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "40px",
                lineHeight: "1"
              }}>{stats?.[2]?.value}</div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "10.5px",
                opacity: "0.75",
                marginTop: "8px",
                maxWidth: "17ch",
                lineHeight: "1.5"
              }}>
                {stats?.[2]?.caption}
                <br />
                {stats?.[2]?.tail}
              </div>
            </div>
            <div>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "40px",
                lineHeight: "1"
              }}>{stats?.[3]?.value}</div>
              <div style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "10.5px",
                opacity: "0.75",
                marginTop: "8px",
                maxWidth: "17ch",
                lineHeight: "1.5"
              }}>
                {stats?.[3]?.caption}
                <span style={{
                  whiteSpace: "nowrap"
                }}>{stats?.[3]?.tail}</span>
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
export const RdPgTimelineComponent = RdPgTimeline

export default RdPgTimeline
