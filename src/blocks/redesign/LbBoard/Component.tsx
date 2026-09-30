'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdLbBoardBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-09.json + bindings/RdLbBoard.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbboard` and NOT `rd-block`.
//
// Everything here repeats — stats, the team rail, the validators and both pill lists. The lead scientist is a group of its own because the mockup gives that one person a wider treatment.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdLbBoard: React.FC<Props> = ({ anchorId, checked, heading, intro, lead, leadPhoto, stats, team, teamIntro, teamLabel, validators }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-lb rd-lbboard" id={anchorId || undefined}>
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
          letterSpacing: "-0.025em"
        }} data-d="bigh">
          {(heading)?.root ? (
            <RichText data={heading} enableGutter={false} enableProse={false} />
          ) : null}
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.2cqi, 18px)",
          lineHeight: "1.5",
          opacity: "0.8",
          marginTop: "16px",
          maxWidth: "62ch"
        }}>{intro}</p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginTop: "34px"
        }} data-m="statgrid">
          {(stats || []).map((st, stIdx) => (
            <div key={stIdx} style={{
              background: "var(--nb1-cool-grey)",
              borderRadius: "var(--nb1-radius-md)",
              padding: "26px 24px 24px",
              boxShadow: "0 1px 2px rgba(81,71,69,.05),0 18px 36px -26px rgba(81,71,69,.3),inset 0 0 0 1px var(--nb1-hairline)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "132px"
            }}>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(34px, 5.4cqi, 44px)",
                lineHeight: "1",
                letterSpacing: "-0.02em"
              }}>
                {st.number}
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
              }}>{st.label}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: "52px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "10.5px",
            color: "rgba(81, 71, 69, 0.86)"
          }}>{teamLabel}</div>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "15.5px",
            lineHeight: "1.6",
            opacity: "0.8",
            marginTop: "12px",
            maxWidth: "58ch"
          }}>{teamIntro}</p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "26px",
            alignItems: "start",
            marginTop: "26px"
          }} data-m="leadrow">
            <div style={{ ...{
              width: "100%",
              maxWidth: "300px",
              aspectRatio: "3 / 4",
              borderRadius: "10px",
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundColor: "var(--nb1-warm-grey)"
            }, backgroundImage: mediaUrl(leadPhoto) ? `url('${mediaUrl(leadPhoto)}')` : undefined }} data-m="leadshot" role="img" aria-label={mediaAlt(leadPhoto)} />
            <div>
              <span style={{
                fontSize: "10.5px",
                padding: "0.5em 0.8em",
                background: "var(--nb1-dark-brown)",
                color: "var(--nb1-cool-grey)"
              }} className="nb1-tag">{lead?.role}</span>
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(23px, 4cqi, 30px)",
                lineHeight: "1.1",
                marginTop: "14px"
              }}>{lead?.name}</div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15px",
                lineHeight: "1.55",
                opacity: "0.82",
                marginTop: "10px",
                maxWidth: "48ch"
              }}>{lead?.cred}</p>
              <blockquote style={{
                margin: "18px 0px 0px",
                paddingLeft: "16px",
                borderLeft: "2px solid var(--nb1-blue)",
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15px",
                lineHeight: "1.55",
                maxWidth: "52ch"
              }}>{lead?.quote}</blockquote>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "18px"
              }}>
                {(lead?.pills || []).map((lp, lpIdx) => (
                  <span key={lpIdx} style={{
                    fontSize: "10.5px",
                    padding: "0.5em 0.8em",
                    boxShadow: "inset 0 0 0 1px var(--nb1-hairline)"
                  }} className="nb1-tag">{lp.label}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            display: "flex",
            gap: "24px",
            marginTop: "40px",
            overflow: "auto hidden",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none"
          }} data-m="rail teamrail">
            {(team || []).map((tm, tmIdx) => (
              <div key={tmIdx} style={{
                flex: "0 0 72%",
                scrollSnapAlign: "start"
              }} data-m="teamcell" data-d="mcard2">
                <div style={{ ...{
                  width: "100%",
                  aspectRatio: "3 / 4",
                  borderRadius: "10px",
                  display: "block",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "var(--nb1-warm-grey)"
                }, backgroundImage: mediaUrl(tm.photo) ? `url('${mediaUrl(tm.photo)}')` : undefined }} data-m="teamshot" role="img" aria-label={mediaAlt(tm.photo)} />
                <div data-m="teamtext">
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "10.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    marginTop: "16px"
                  }}>
                    {tm.field}
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "17px",
                    marginTop: "8px"
                  }}>
                    {tm.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.45",
                    opacity: "0.75",
                    marginTop: "6px"
                  }}>
                    {tm.cred}
                  </div>
                </div>
                <blockquote style={{
                  margin: "14px 0px 0px",
                  paddingLeft: "14px",
                  borderLeft: "2px solid var(--nb1-blue-grey)",
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  opacity: "0.9"
                }} data-m="teamquote">
                  {tm.quote}
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{
        background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
        borderTop: "1px solid rgba(81, 71, 69, 0.16)"
      }}>
        <div style={{
          maxWidth: "1240px",
          margin: "0px auto",
          padding: "64px 20px"
        }} data-d="pad bigpad">
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "10.5px",
            color: "rgba(81, 71, 69, 0.86)"
          }}>{checked?.label}</div>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(26px, 4.6cqi, 40px)",
            lineHeight: "1.04",
            letterSpacing: "-0.025em",
            marginTop: "14px",
            maxWidth: "26ch"
          }} data-d="bigh">
            {(checked?.title)?.root ? (
              <RichText data={checked?.title} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "15.5px",
            lineHeight: "1.6",
            opacity: "0.82",
            marginTop: "14px",
            maxWidth: "58ch"
          }}>{checked?.intro}</p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "18px",
            marginTop: "32px"
          }} data-d="g2">
            {(validators || []).map((vl, vlIdx) => (
              <div key={vlIdx} style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "20px",
                alignItems: "start"
              }} data-m="valrow">
                <div style={{ ...{
                  width: "100%",
                  maxWidth: "140px",
                  aspectRatio: "3 / 4",
                  borderRadius: "10px",
                  display: "block",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "var(--nb1-warm-grey)"
                }, backgroundImage: mediaUrl(vl.photo) ? `url('${mediaUrl(vl.photo)}')` : undefined }} data-m="valshot" role="img" aria-label={mediaAlt(vl.photo)} />
                <div>
                  <span style={{
                    fontSize: "10.5px",
                    padding: "0.5em 0.8em",
                    boxShadow: "rgba(95, 234, 255, 0.7) 0px 0px 0px 1px inset",
                    display: "inline-block"
                  }} className="nb1-tag">{checked?.validatorTag}</span>
                  <div style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "clamp(21px, 3.6cqi, 26px)",
                    lineHeight: "1.1",
                    marginTop: "12px"
                  }}>
                    {vl.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.45",
                    opacity: "0.75",
                    marginTop: "7px"
                  }}>
                    {vl.cred}
                  </div>
                  <blockquote style={{
                    margin: "16px 0px 0px",
                    paddingLeft: "14px",
                    borderLeft: "2px solid var(--nb1-blue)",
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14.5px",
                    lineHeight: "1.55"
                  }}>
                    {vl.quote}
                  </blockquote>
                  <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "16px"
                  }}>
                    {(vl.pills || []).map((vp, vpIdx) => (
                      <span key={vpIdx} style={{
                        fontSize: "10.5px",
                        padding: "0.5em 0.8em",
                        boxShadow: "inset 0 0 0 1px var(--nb1-hairline)"
                      }} className="nb1-tag">
                        {vp.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbBoardComponent = RdLbBoard

export default RdLbBoard
