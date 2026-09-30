'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { RdLabBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-06.json + section-16.json
//              + bindings/RdLab.json + bindings/RdLabPanel.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// THE PANEL. Tapping a card opens a panel over the page. In the mockup that
// panel is not inside this section: one page-level overlay holds all three, one
// shown at a time, and it was extracted by clicking each card in turn. It is
// rendered here because position:fixed makes its place in the tree irrelevant.
//
// The three panels are laid out individually rather than mapped from one
// template. They are not the same shape — Polina's biography runs to two
// paragraphs and the other two to one — and the quote is always the LAST
// paragraph, so a positional mapping puts the second scientist's quote in the
// slot meant for their second biography paragraph.
//
// Behaviour matched to the mockup by driving it: the backdrop closes the panel,
// and Escape does not. Escape is ours — a dialog no keyboard can dismiss is a
// defect, not a design decision.

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdLab: React.FC<Props> = (props) => {
  const { anchorId, heading, intro, readBioLabel, closeLabel } = props
  const scientists = props.scientists ?? []
  const assurances = props.assurances ?? []
  const [openBio, setOpenBio] = useState<number | null>(null)

  const close = useCallback(() => setOpenBio(null), [])
  useEffect(() => {
    if (openBio === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openBio, close])

  return (
    <>
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-block rd-lab" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad" data-m="stack">
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(30px, 5.2cqi, 52px)",
          lineHeight: "0.98",
          letterSpacing: "-0.02em"
        }}>{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.2cqi, 18px)",
          lineHeight: "1.5",
          opacity: "0.78",
          marginTop: "18px",
          maxWidth: "52ch"
        }}>{intro}</p>
        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "34px",
          overflow: "auto hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none"
        }} data-m="rail" data-d="g3">
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
              flexDirection: "column",
              flex: "0 0 80%",
              scrollSnapAlign: "start"
            }} data-d="bcard" type={'button'} onClick={() => setOpenBio(sciIdx)} aria-haspopup={'dialog'}>
              <img style={{
                width: "100%",
                aspectRatio: "3 / 4.4",
                height: "auto",
                flex: "0 0 auto",
                objectFit: "cover",
                objectPosition: "50% 0%",
                display: "block"
              }} src={mediaUrl(sci.photo)} alt={mediaAlt(sci.photo) || sci.name || ''} data-m="board" />
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
        <section style={{
          padding: "44px 0px 0px"
        }} data-d="pad">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "22px"
          }} data-d="g3">
            <div style={{
              borderTop: "1.5px solid rgba(81, 71, 69, 0.24)",
              paddingTop: "18px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "11px"
              }}>
                <svg style={{
                  flex: "0 0 auto",
                  opacity: "0.8"
                }} viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3.2 9.6h17.6M3.2 14.4h17.6M12 3a16 16 0 0 1 0 18M12 3a16 16 0 0 0 0 18" />
                </svg>
                <div style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "17px"
                }}>{assurances?.[0]?.label}</div>
              </div>
              <p style={{
                fontSize: "14.5px",
                lineHeight: "1.5",
                opacity: "0.72",
                marginTop: "8px"
              }}>{assurances?.[0]?.body}</p>
            </div>
            <div style={{
              borderTop: "1.5px solid rgba(81, 71, 69, 0.24)",
              paddingTop: "18px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "11px"
              }}>
                <svg style={{
                  flex: "0 0 auto",
                  opacity: "0.8"
                }} viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3c0 6 12 12 12 18M18 3c0 6-12 12-12 18" />
                  <path d="M8.2 7.4h7.6M8.2 16.6h7.6" />
                </svg>
                <div style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "17px"
                }}>{assurances?.[1]?.label}</div>
              </div>
              <p style={{
                fontSize: "14.5px",
                lineHeight: "1.5",
                opacity: "0.72",
                marginTop: "8px"
              }}>{assurances?.[1]?.body}</p>
            </div>
            <div style={{
              borderTop: "1.5px solid rgba(81, 71, 69, 0.24)",
              paddingTop: "18px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "11px"
              }}>
                <svg style={{
                  flex: "0 0 auto",
                  opacity: "0.8"
                }} viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="var(--nb1-dark-brown)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 17.5c3.2 0 4.4-3.6 6.6-8.4 1.1-2.4 2.6-2.6 3.2-1 .6 1.7-.6 3.6-2 3.2-1.8-.5.4-3.4 3.4-3.4 2.2 0 3.2 1.6 4.8 1.6" />
                  <path d="M4 21h16" />
                </svg>
                <div style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "17px"
                }}>{assurances?.[2]?.label}</div>
              </div>
              <p style={{
                fontSize: "14.5px",
                lineHeight: "1.5",
                opacity: "0.72",
                marginTop: "8px"
              }}>{assurances?.[2]?.body}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
    <div style={{ ...{
      position: "fixed",
      inset: "0px",
      borderRadius: "0px",
      zIndex: "120",
      background: "rgba(42, 36, 34, 0.62)",
      backdropFilter: "blur(6px)",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      overflow: "auto",
      container: "biomodal / inline-size",
      WebkitBackdropFilter: "blur(6px)"
    }, display: openBio === null ? 'none' : 'flex' }} className="rd-block rd-block__overlay rd-lab__bio" role={'dialog'} aria-modal={true} aria-hidden={openBio === null} onClick={() => setOpenBio(null)}>
      <div style={{ ...{
        width: "100%"
      }, display: openBio === 0 ? 'block' : 'none' }}>
        <div style={{
          maxWidth: "940px",
          width: "100%",
          margin: "auto",
          maxHeight: "100%",
          overflow: "hidden",
          background: "var(--nb1-cool-grey)",
          borderRadius: "22px",
          boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
        }} data-m="biocard" role={'document'} onClick={(e) => e.stopPropagation()}>
          <div style={{
            alignSelf: "stretch"
          }}>
            <img style={{
              width: "100%",
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
            }} aria-label={closeLabel || 'Close'} type={'button'} onClick={() => setOpenBio(null)}>{"\u2715"}</button>
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
            <p style={{ ...{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "15px",
              lineHeight: "1.55",
              opacity: "0.8",
              marginTop: "16px"
            }, display: (!!scientists?.[0]?.bioExtra) ? '' : 'none' }}>{scientists?.[0]?.bioExtra}</p>
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
      <div style={{ ...{
        width: "100%"
      }, display: openBio === 1 ? 'block' : 'none' }}>
        <div style={{
          maxWidth: "940px",
          width: "100%",
          margin: "auto",
          maxHeight: "100%",
          overflow: "hidden",
          background: "var(--nb1-cool-grey)",
          borderRadius: "22px",
          boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
        }} data-m="biocard" role={'document'} onClick={(e) => e.stopPropagation()}>
          <div style={{
            alignSelf: "stretch"
          }}>
            <img style={{
              width: "100%",
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
            }} aria-label={closeLabel || 'Close'} type={'button'} onClick={() => setOpenBio(null)}>{"\u2715"}</button>
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
      <div style={{ ...{
        width: "100%"
      }, display: openBio === 2 ? 'block' : 'none' }}>
        <div style={{
          maxWidth: "940px",
          width: "100%",
          margin: "auto",
          maxHeight: "100%",
          overflow: "hidden",
          background: "var(--nb1-cool-grey)",
          borderRadius: "22px",
          boxShadow: "rgba(42, 36, 34, 0.55) 0px 50px 110px -40px"
        }} data-m="biocard" role={'document'} onClick={(e) => e.stopPropagation()}>
          <div style={{
            alignSelf: "stretch"
          }}>
            <img style={{
              width: "100%",
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
            }} aria-label={closeLabel || 'Close'} type={'button'} onClick={() => setOpenBio(null)}>{"\u2715"}</button>
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
    </>
  )
}

export const RdLabComponent = RdLab

export default RdLab
