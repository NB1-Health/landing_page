'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { RdBiologyBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-05.json + section-10..15.json
//              + bindings/RdBiology.json + bindings/RdBiologyModal.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// The diagram is the mockup's own SVG, node for node: six connector rails, the
// nucleus and its glow, eight static specks, and six <animateMotion> particles
// that ride the rails inward on a 3.2s loop, each offset half a second from the
// last. Nothing in it was redrawn.
//
// THE PANEL. Tapping an orb rings it and opens a panel over the page. In the
// mockup that panel is NOT inside this section — it is a page-level overlay,
// display:none at rest and filled in only once an orb is clicked, so a first
// pass that diffed the section alone saw the click change two bytes and
// concluded there was no reveal. It was extracted by clicking each orb in turn
// (manifests 10-15) and is rendered here, still verbatim, because
// position:fixed makes its place in the tree irrelevant.
//
// Behaviour matched to the mockup by driving it: selecting an orb is NOT a
// toggle (clicking the same orb twice leaves the panel open), the backdrop
// closes, and closing clears the orb's ring. Escape does NOT close it in the
// mockup — that one is ours, because a dialog no keyboard can dismiss is a
// defect rather than a design decision.

export const RdBiology: React.FC<Props> = (props) => {
  const { anchorId, heading, intro, centreLabel, hint, modal } = props
  const bubbles = props.bubbles ?? []
  const [activeBubble, setActiveBubble] = useState<number | null>(null)
  const active = activeBubble === null ? undefined : bubbles[activeBubble]

  const close = useCallback(() => setActiveBubble(null), [])
  useEffect(() => {
    if (activeBubble === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeBubble, close])

  return (
    <>
    <section style={{
      background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))"
    }} className="rd-block rd-biology" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad" data-m="stack">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "34px",
          alignItems: "center"
        }} data-d="side gutside">
          <div data-d="guttext">
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 4.4cqi, 46px)",
              lineHeight: "1",
              letterSpacing: "-0.02em",
              maxWidth: "560px"
            }}>{heading}</h2>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.5",
              opacity: "0.78",
              marginTop: "20px",
              maxWidth: "50ch"
            }}>{intro}</p>
          </div>
          <div>
            <div style={{
              position: "relative",
              width: "min(100%, 440px)",
              aspectRatio: "1 / 1",
              margin: "0px auto"
            }} data-m="ring">
              <svg style={{
                position: "absolute",
                inset: "0px",
                width: "100%",
                height: "100%"
              }} viewBox="0 0 360 360" fill="none">
                <defs>
                  <radialGradient id="gutGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#514745" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#514745" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <g stroke="rgba(81,71,69,.3)" strokeWidth="1">
                  <path fill="none" d="M180 176 Q199.2 116.0 180 56" />
                  <path fill="none" d="M180 176 Q240.6 162.3 282 116" />
                  <path fill="none" d="M180 176 Q221.4 222.3 282 236" />
                  <path fill="none" d="M180 176 Q160.8 236.0 180 296" />
                  <path fill="none" d="M180 176 Q119.4 189.7 78 236" />
                  <path fill="none" d="M180 176 Q138.6 129.7 78 116" />
                </g>
                <g aria-hidden="true">
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="0s" repeatCount="indefinite" path="M180 176 Q199.2 116.0 180 56" />
                    <animate attributeName="opacity" dur="3.2s" begin="0s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="0.5s" repeatCount="indefinite" path="M180 176 Q240.6 162.3 282 116" />
                    <animate attributeName="opacity" dur="3.2s" begin="0.5s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="1s" repeatCount="indefinite" path="M180 176 Q221.4 222.3 282 236" />
                    <animate attributeName="opacity" dur="3.2s" begin="1s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="1.5s" repeatCount="indefinite" path="M180 176 Q160.8 236.0 180 296" />
                    <animate attributeName="opacity" dur="3.2s" begin="1.5s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="2s" repeatCount="indefinite" path="M180 176 Q119.4 189.7 78 236" />
                    <animate attributeName="opacity" dur="3.2s" begin="2s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                  <circle r="2.6" fill="#514745" opacity=".5">
                    <animateMotion dur="3.2s" begin="2.5s" repeatCount="indefinite" path="M180 176 Q138.6 129.7 78 116" />
                    <animate attributeName="opacity" dur="3.2s" begin="2.5s" repeatCount="indefinite" values="0;.6;.6;0" keyTimes="0;.15;.8;1" />
                  </circle>
                </g>
                <circle cx="180" cy="176" r="50" fill="url(#gutGlow)" />
                <circle cx="164" cy="164" r="1.6" fill="#514745" opacity="0.54" />
                <circle cx="198" cy="167" r="1.3" fill="#514745" opacity="0.42" />
                <circle cx="170" cy="190" r="1.7" fill="#514745" opacity="0.48" />
                <circle cx="192" cy="191" r="1.2" fill="#514745" opacity="0.36" />
                <circle cx="157" cy="179" r="1.1" fill="#514745" opacity="0.3" />
                <circle cx="187" cy="158" r="1.3" fill="#514745" opacity="0.36" />
                <circle cx="202" cy="184" r="1" fill="#514745" opacity="0.27" />
                <circle cx="174" cy="197" r="1" fill="#514745" opacity="0.24" />
                <circle cx="180" cy="176" r="6" fill="#514745" />
                <text x="180" y="212" textAnchor="middle" fontFamily="var(--nb1-font-tertiary)" fontSize="11" letterSpacing="1.4" fill="#514745" opacity=".75">{centreLabel}</text>
              </svg>
              <button style={{
                position: "absolute",
                left: "50%",
                top: "15.6%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#D9FF65",
                '--orb-core': "#F0F5FF"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 0 ? '1' : '0'} data-domain="energy" aria-label="Energy" type={'button'} aria-pressed={activeBubble === 0} onClick={() => setActiveBubble(0)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[0]?.label}</span>
              </button>
              <button style={{
                position: "absolute",
                left: "78.3%",
                top: "32.2%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#5FEAFF",
                '--orb-core': "#F0F5FF"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 1 ? '1' : '0'} data-domain="resilience" aria-label="Focus" type={'button'} aria-pressed={activeBubble === 1} onClick={() => setActiveBubble(1)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[1]?.label}</span>
              </button>
              <button style={{
                position: "absolute",
                left: "78.3%",
                top: "65.6%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#514745",
                '--orb-core': "#5FEAFF"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 2 ? '1' : '0'} data-domain="immunity" aria-label="Immunity" type={'button'} aria-pressed={activeBubble === 2} onClick={() => setActiveBubble(2)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[2]?.label}</span>
              </button>
              <button style={{
                position: "absolute",
                left: "50%",
                top: "82.2%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#FF9CE0",
                '--orb-core': "#D9FF65"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 3 ? '1' : '0'} data-domain="gut" aria-label="Digestion" type={'button'} aria-pressed={activeBubble === 3} onClick={() => setActiveBubble(3)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[3]?.label}</span>
              </button>
              <button style={{
                position: "absolute",
                left: "21.7%",
                top: "65.6%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#514745",
                '--orb-core': "#514745"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 4 ? '1' : '0'} data-domain="sleep" aria-label="Sleep" type={'button'} aria-pressed={activeBubble === 4} onClick={() => setActiveBubble(4)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[4]?.label}</span>
              </button>
              <button style={{
                position: "absolute",
                left: "21.7%",
                top: "32.2%",
                transform: "translate(-50%, -50%)",
                zIndex: "2",
                border: "0px",
                background: "transparent",
                padding: "0px",
                cursor: "pointer",
                color: "var(--nb1-dark-brown)",
                opacity: "0.9",
                transition: "opacity 0.2s",
                '--orb-ring': "#FF8B3E",
                '--orb-core': "#F0F5FF"
              } as React.CSSProperties} className="nb1-bubble nb1-bubble--solid" data-m="gbub" data-on={activeBubble === 5 ? '1' : '0'} data-domain="resilience" aria-label="Stress" type={'button'} aria-pressed={activeBubble === 5} onClick={() => setActiveBubble(5)}>
                <span className="nb1-bubble__orb" />
                <span className="nb1-bubble__label">{bubbles?.[5]?.label}</span>
              </button>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "14px"
            }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                border: "1px solid rgba(81, 71, 69, 0.24)",
                borderRadius: "999px",
                padding: "0.65em 1.1em",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "10.5px",
                opacity: "0.75",
                whiteSpace: "nowrap"
              }}>
                <span style={{
                  width: "0.55em",
                  height: "0.55em",
                  borderRadius: "50%",
                  background: "var(--nb1-dark-brown)",
                  flex: "0 0 auto"
                }} />
                <span>
                  <span>{hint}</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div style={{ ...{
      position: "fixed",
      inset: "0px",
      borderRadius: "0px",
      zIndex: "120",
      background: "rgba(42, 36, 34, 0.6)",
      backdropFilter: "blur(6px)",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      overflow: "auto",
      WebkitBackdropFilter: "blur(6px)"
    }, display: activeBubble === null ? 'none' : 'flex' }} className="rd-block rd-block__overlay rd-biology__modal" role={'dialog'} aria-modal={true} aria-hidden={activeBubble === null} onClick={() => setActiveBubble(null)}>
      <div style={{
        width: "min(100%, 460px)",
        background: "var(--nb1-dark-brown)",
        color: "var(--nb1-cool-grey)",
        borderRadius: "22px",
        padding: "30px 28px 32px",
        position: "relative",
        boxShadow: "rgba(42, 36, 34, 0.7) 0px 50px 110px -40px"
      }} role={'document'} onClick={(e) => e.stopPropagation()}>
        <button style={{
          position: "absolute",
          top: "18px",
          right: "18px",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: "0px",
          background: "rgba(240, 245, 255, 0.14)",
          color: "var(--nb1-cool-grey)",
          fontSize: "14px",
          cursor: "pointer"
        }} aria-label={modal?.closeLabel || 'Close'} type={'button'} onClick={() => setActiveBubble(null)}>{"\u2715"}</button>
        <div style={{
          fontFamily: "var(--nb1-font-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: "10.5px",
          color: "var(--nb1-blue)"
        }}>{modal?.eyebrow}</div>
        <h3 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(28px, 4.4cqi, 36px)",
          lineHeight: "1.05",
          marginTop: "14px"
        }}>
          <span>{active?.label}</span>
        </h3>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15.5px",
          lineHeight: "1.55",
          opacity: "0.82",
          marginTop: "14px"
        }}>
          <span>{active?.revealBody}</span>
        </p>
        <div style={{
          fontFamily: "var(--nb1-font-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "10.5px",
          opacity: "0.6",
          marginTop: "20px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(240, 245, 255, 0.18)"
        }}>
          {modal?.readFromLabel}
          <span>{active?.readFrom}</span>
        </div>
      </div>
    </div>
    </>
  )
}

export const RdBiologyComponent = RdBiology

export default RdBiology
