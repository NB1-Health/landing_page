'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { RdPgBoardBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-09.json + bindings/RdPgBoard.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Our Plans' science board: three cards in a three-column grid, each opening a bio panel over the page. Fields shared with the homepage's rdLab via _shared/scienceBoard.ts; the markup is this page's own.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPgBoard: React.FC<Props> = ({ anchorId, closeLabel, heading, intro, readBioLabel, scientists }) => {
  const [openBio, setOpenBio] = useState(null as number | null)

  const close = useCallback(() => setOpenBio(null), [])
  // The overlay closes on a backdrop click, so the panel has to swallow its own.
  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])
  useEffect(() => {
    if (openBio === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenBio(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openBio])

  return (
      <section style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "24px 48px 104px"
      }} className="rd-pg rd-pgboard" id={anchorId || undefined}>
        <div style={{
          maxWidth: "620px",
          marginBottom: "48px"
        }}>
          <h2 style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(40px, 5vw, 58px)",
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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "22px"
        }} data-m="brail">
          {(scientists || []).map((sci, sciIdx) => (
            <button key={sciIdx} style={{
              textAlign: "left",
              padding: "0px",
              border: "1.5px solid rgba(81, 71, 69, 0.16)",
              background: "var(--nb1-cool-grey)",
              borderRadius: "20px",
              overflow: "hidden",
              cursor: "pointer",
              color: "var(--nb1-dark-brown)",
              display: "flex",
              flexDirection: "column"
            }} data-m="bcard" type={'button'} onClick={() => setOpenBio(sciIdx)} aria-expanded={openBio === sciIdx}>
              <img style={{
                width: "100%",
                aspectRatio: "3 / 4.4",
                height: "auto",
                objectFit: "cover",
                objectPosition: "50% 0%",
                display: "block"
              }} src={mediaUrl(sci.photo)} alt={mediaAlt(sci.photo) || sci.name || ''} data-m="bimg" />
              <div style={{
                padding: "22px 24px 26px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "19px"
                }}>{sci.name}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "10.5px",
                  color: "var(--nb1-dark-brown)",
                  opacity: "0.9",
                  marginTop: "8px",
                  lineHeight: "1.5"
                }}>{sci.role}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14px",
                  lineHeight: "1.45",
                  opacity: "0.62",
                  marginTop: "10px"
                }}>{sci.credentials}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  marginTop: "16px",
                  display: "inline-block",
                  borderBottom: "1.5px solid var(--nb1-blue)",
                  paddingBottom: "2px"
                }}>{readBioLabel}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ ...{
          position: "fixed",
          inset: "0px",
          zIndex: "100",
          background: "rgba(42, 36, 34, 0.6)",
          backdropFilter: "blur(6px)",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          overflow: "auto",
          WebkitBackdropFilter: "blur(6px)"
        }, display: (openBio !== null) ? "flex" : 'none' }} onClick={close} role={'dialog'} aria-modal={openBio !== null}>
          <div style={{ display: (openBio === 0) ? "block" : 'none' }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "330px 1fr",
              maxWidth: "940px",
              width: "100%",
              margin: "auto",
              background: "var(--nb1-cool-grey)",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
            }} onClick={stop}>
              <div style={{
                alignSelf: "stretch"
              }}>
                <img style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 0%",
                  display: "block"
                }} src={mediaUrl(scientists?.[0]?.photo)} alt={mediaAlt(scientists?.[0]?.photo) || scientists?.[0]?.name || ''} />
              </div>
              <div style={{
                padding: "38px 42px",
                position: "relative"
              }}>
                <button style={{
                  position: "absolute",
                  top: "22px",
                  right: "22px",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "0px",
                  background: "rgba(81, 71, 69, 0.1)",
                  color: "var(--nb1-dark-brown)",
                  fontSize: "16px",
                  cursor: "pointer"
                }} aria-label={closeLabel || 'Close'} type={'button'} onClick={close}>{"\u2715"}</button>
                <div style={{
                  display: "inline-block",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  border: "1.5px solid var(--nb1-blue)",
                  borderRadius: "999px",
                  padding: "0.55em 1em"
                }}>{scientists?.[0]?.panelEyebrow}</div>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "34px",
                  lineHeight: "1.05",
                  letterSpacing: "-0.02em",
                  marginTop: "16px"
                }}>{scientists?.[0]?.name}</h3>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "11px",
                  lineHeight: "1.6",
                  marginTop: "14px"
                }}>{scientists?.[0]?.panelCredentials}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.8",
                  marginTop: "16px"
                }}>{scientists?.[0]?.bio}</p>
                {(!!scientists?.[0]?.bioExtra) ? (
                  <p style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15px",
                    lineHeight: "1.55",
                    opacity: "0.8",
                    marginTop: "16px"
                  }}>{scientists?.[0]?.bioExtra}</p>
                ) : null}
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.75",
                  marginTop: "22px",
                  borderLeft: "2px solid var(--nb1-blue)",
                  paddingLeft: "18px"
                }}>{scientists?.[0]?.quote}</p>
              </div>
            </div>
          </div>
          <div style={{ display: (openBio === 1) ? "block" : 'none' }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "330px 1fr",
              maxWidth: "940px",
              width: "100%",
              margin: "auto",
              background: "var(--nb1-cool-grey)",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
            }} onClick={stop}>
              <div style={{
                alignSelf: "stretch"
              }}>
                <img style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 0%",
                  display: "block"
                }} src={mediaUrl(scientists?.[1]?.photo)} alt={mediaAlt(scientists?.[1]?.photo) || scientists?.[1]?.name || ''} />
              </div>
              <div style={{
                padding: "38px 42px",
                position: "relative"
              }}>
                <button style={{
                  position: "absolute",
                  top: "22px",
                  right: "22px",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "0px",
                  background: "rgba(81, 71, 69, 0.1)",
                  color: "var(--nb1-dark-brown)",
                  fontSize: "16px",
                  cursor: "pointer"
                }} aria-label={closeLabel || 'Close'} type={'button'} onClick={close}>{"\u2715"}</button>
                <div style={{
                  display: "inline-block",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  border: "1.5px solid var(--nb1-blue)",
                  borderRadius: "999px",
                  padding: "0.55em 1em"
                }}>{scientists?.[1]?.panelEyebrow}</div>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "34px",
                  lineHeight: "1.05",
                  letterSpacing: "-0.02em",
                  marginTop: "16px"
                }}>{scientists?.[1]?.name}</h3>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "11px",
                  lineHeight: "1.6",
                  marginTop: "14px"
                }}>{scientists?.[1]?.panelCredentials}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.8",
                  marginTop: "16px"
                }}>{scientists?.[1]?.bio}</p>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.75",
                  marginTop: "22px",
                  borderLeft: "2px solid var(--nb1-blue)",
                  paddingLeft: "18px"
                }}>{scientists?.[1]?.quote}</p>
              </div>
            </div>
          </div>
          <div style={{ display: (openBio === 2) ? "block" : 'none' }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "330px 1fr",
              maxWidth: "940px",
              width: "100%",
              margin: "auto",
              background: "var(--nb1-cool-grey)",
              borderRadius: "22px",
              overflow: "hidden",
              boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
            }} onClick={stop}>
              <div style={{
                alignSelf: "stretch"
              }}>
                <img style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 0%",
                  display: "block"
                }} src={mediaUrl(scientists?.[2]?.photo)} alt={mediaAlt(scientists?.[2]?.photo) || scientists?.[2]?.name || ''} />
              </div>
              <div style={{
                padding: "38px 42px",
                position: "relative"
              }}>
                <button style={{
                  position: "absolute",
                  top: "22px",
                  right: "22px",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "0px",
                  background: "rgba(81, 71, 69, 0.1)",
                  color: "var(--nb1-dark-brown)",
                  fontSize: "16px",
                  cursor: "pointer"
                }} aria-label={closeLabel || 'Close'} type={'button'} onClick={close}>{"\u2715"}</button>
                <div style={{
                  display: "inline-block",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  border: "1.5px solid var(--nb1-blue)",
                  borderRadius: "999px",
                  padding: "0.55em 1em"
                }}>{scientists?.[2]?.panelEyebrow}</div>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "34px",
                  lineHeight: "1.05",
                  letterSpacing: "-0.02em",
                  marginTop: "16px"
                }}>{scientists?.[2]?.name}</h3>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontSize: "11px",
                  lineHeight: "1.6",
                  marginTop: "14px"
                }}>{scientists?.[2]?.panelCredentials}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.8",
                  marginTop: "16px"
                }}>{scientists?.[2]?.bio}</p>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.75",
                  marginTop: "22px",
                  borderLeft: "2px solid var(--nb1-blue)",
                  paddingLeft: "18px"
                }}>{scientists?.[2]?.quote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgBoardComponent = RdPgBoard

export default RdPgBoard
