'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import type { RdProofBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-04.json + bindings/RdProof.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// Everything that restates a number is DERIVED here, not stored:
//   - the two values printed on a card come from `from` / `to`
//   - the filled bar segment and its two dots come from the same pair via barPct
//   - the "▲ 2.0" pill comes from their difference and its direction
//   - the ring's arrow, "11.9 pts" and "up from 68.3" come from score.value /
//     score.prior
// barPct reproduces every one of the mockup's four bars exactly, so nothing was
// eyeballed. Numbers print through Intl.NumberFormat, so a German editor gets
// "8,0" without touching the data.
//
// The card rail keeps the mockup's scroll snapping: it IS the interaction below
// 900px. Tapping a card flips it; openCard holds which one is face-down.

type ComponentProps = Props & { locale?: string | null }

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

/** One decimal, in the reader's locale — "8.0" in en, "8,0" in de. */
const fmtValue = (v: unknown, locale?: string | null): string =>
  new Intl.NumberFormat(locale || 'en', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(v) || 0)

type Card = NonNullable<Props['cards']>[number]

/**
 * Where a value sits on the track, as a percentage.
 *
 * When higher is better the bar fills with the value; when lower is better it
 * fills with the headroom left. Derived from the mockup's own four cards:
 * 6→8 (higher better) gives 60→80, 6→3 gives 40→70, 8→3 gives 20→70,
 * 7→5 gives 30→50 — every one an exact match.
 */
const barPct = (v: unknown, card: Card): number => {
  const max = Number(card?.scaleMax) || 10
  const n = Number(v) || 0
  const pct = card?.higherIsBetter ? (n / max) * 100 : ((max - n) / max) * 100
  return Math.min(100, Math.max(0, pct))
}

/** "▲ 2.0" / "▼ 3.0" — the glyph follows the raw direction, not good vs bad. */
const cardDelta = (card: Card, locale?: string | null): string => {
  const from = Number(card?.from) || 0
  const to = Number(card?.to) || 0
  return `${to >= from ? '\u25B2' : '\u25BC'} ${fmtValue(Math.abs(to - from), locale)}`
}

export const RdProof: React.FC<ComponentProps> = (props) => {
  const { anchorId, heading, intro, score, availability, footnote, locale } = props
  const cards = props.cards ?? []
  const [openCard, setOpenCard] = useState<number | null>(null)

  const scoreValue = Number(score?.value) || 0
  const scorePrior = Number(score?.prior) || 0
  const scoreDeltaGlyph = scoreValue >= scorePrior ? '\u2191' : '\u2193'
  const scoreDelta = [fmtValue(Math.abs(scoreValue - scorePrior), locale), score?.deltaUnit]
    .filter(Boolean)
    .join(' ')
  const scorePriorLabel = [score?.priorPrefix, fmtValue(scorePrior, locale)]
    .filter(Boolean)
    .join(' ')

  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-block rd-proof" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px"
      }} data-d="pad bigpad" data-m="stack">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "34px",
          alignItems: "start"
        }} data-m="scoregrid">
          <div>
            <h2 style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(30px, 5.2cqi, 52px)",
              lineHeight: "0.98",
              letterSpacing: "-0.02em",
              maxWidth: "22ch"
            }}>{heading}</h2>
            <div style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18px)",
              lineHeight: "1.5",
              opacity: "0.8",
              marginTop: "18px",
              maxWidth: "46ch"
            }}>
              {(intro)?.root ? (
                <RichText data={intro} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}>
            <div style={{
              width: "min(78cqi, 250px)",
              minWidth: "0px",
              fontSize: "clamp(42px, 13cqi, 58px)"
            }} className="nb1-score nb1-score--ring" data-m="score">
              <div style={{
                textAlign: "center"
              }}>
                <div style={{
                  lineHeight: "1"
                }}>{fmtValue(score?.value, locale)}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "10.5px",
                  opacity: "0.7",
                  marginTop: "8px"
                }}>{score?.scale}</div>
              </div>
            </div>
            <span className="nb1-value">
              <span style={{
                background: "var(--nb1-lime)"
              }} className="nb1-value__icon">{scoreDeltaGlyph}</span>
              <span style={{
                background: "var(--nb1-lime)",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "13px",
                letterSpacing: "0.04em"
              }} className="nb1-value__pill">{scoreDelta}</span>
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "11px",
                opacity: "0.75",
                marginLeft: "8px"
              }}>{scorePriorLabel}</span>
            </span>
            <div style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "10.5px",
              opacity: "0.55",
              textAlign: "center"
            }}>{score?.caption}</div>
          </div>
        </div>
        <div style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15.5px",
          lineHeight: "1.55",
          opacity: "0.78",
          maxWidth: "60ch"
        }}>
          {(availability)?.root ? (
            <RichText data={availability} enableGutter={false} enableProse={false} />
          ) : null}
        </div>
        <div style={{
          display: "flex",
          gap: "14px",
          marginTop: "32px",
          overflow: "auto hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          paddingBottom: "4px"
        }} data-m="rail">
          {(cards || []).map((card, cardIdx) => (
            <div key={cardIdx} style={{
              position: "relative",
              flex: "0 0 80%",
              scrollSnapAlign: "start",
              aspectRatio: "3 / 4",
              minHeight: "0px",
              cursor: "pointer"
            }} data-m="marker" data-d="mcard" onClick={() => setOpenCard((c) => (c === cardIdx ? null : cardIdx))}>
              <div style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "inherit"
              }}>
                <div style={{ ...{
                  position: "absolute",
                  inset: "0px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "opacity 0.28s"
                }, opacity: openCard === cardIdx ? 0 : 1, pointerEvents: openCard === cardIdx ? 'none' : 'auto' }}>
                  <div style={{ ...{
                    position: "absolute",
                    inset: "0px",
                    backgroundSize: "cover",
                    backgroundPosition: "center center"
                  }, backgroundImage: card.image ? `url(${mediaUrl(card.image)})` : undefined }} />
                  <div style={{
                    position: "absolute",
                    inset: "0px",
                    background: "linear-gradient(rgba(30, 26, 25, 0.5) 0%, rgba(30, 26, 25, 0.05) 34%, rgba(30, 26, 25, 0.05) 60%, rgba(30, 26, 25, 0.55) 100%)"
                  }} />
                  <div style={{
                    position: "absolute",
                    top: "18px",
                    left: "20px",
                    right: "70px",
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: "11px",
                    color: "rgb(255, 255, 255)",
                    opacity: "0.92"
                  }}>
                    <span>{card.metric}</span>
                  </div>
                  <div style={{
                    position: "absolute",
                    top: "14px",
                    right: "16px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(240, 245, 255, 0.22)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "20px",
                    lineHeight: "1",
                    color: "rgb(255, 255, 255)",
                    WebkitBackdropFilter: "blur(10px)"
                  }}>{"+"}</div>
                  <div style={{
                    position: "absolute",
                    left: "14px",
                    right: "14px",
                    bottom: "14px",
                    padding: "20px",
                    borderRadius: "18px",
                    background: "rgba(38, 33, 32, 0.42)",
                    backdropFilter: "blur(18px)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    WebkitBackdropFilter: "blur(18px)"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-primary)",
                        fontSize: "22px",
                        lineHeight: "1.05",
                        color: "rgb(255, 255, 255)",
                        minWidth: "0px"
                      }}>
                        <span>{card.goal}</span>
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "11px",
                        letterSpacing: "0.02em",
                        background: "var(--nb1-blue)",
                        color: "var(--nb1-black)",
                        borderRadius: "var(--nb1-radius-control)",
                        padding: "0.5em 0.7em",
                        whiteSpace: "nowrap",
                        flex: "0 0 auto"
                      }}>
                        <span>{cardDelta(card, locale)}</span>
                      </span>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginTop: "14px",
                      color: "rgb(255, 255, 255)"
                    }}>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "16px",
                        opacity: "0.65"
                      }}>
                        <span>{fmtValue(card.from, locale)}</span>
                      </span>
                      <span style={{
                        opacity: "0.55"
                      }}>{"\u2192"}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-primary)",
                        fontSize: "30px",
                        lineHeight: "1"
                      }}>
                        <span>{fmtValue(card.to, locale)}</span>
                      </span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "12px",
                        opacity: "0.6"
                      }}>{card.scaleSuffix}</span>
                    </div>
                    <div style={{
                      position: "relative",
                      height: "2px",
                      background: "rgba(255, 255, 255, 0.34)",
                      margin: "24px 0px 12px"
                    }}>
                      <span style={{ ...{
                        position: "absolute",
                        background: "rgba(255, 255, 255, 0.8)"
                      }, inset: `0 ${100 - Math.max(barPct(card.from, card), barPct(card.to, card))}% 0 ${Math.min(barPct(card.from, card), barPct(card.to, card))}%` }} />
                      <span style={{ ...{
                        position: "absolute",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "11px",
                        height: "11px",
                        borderRadius: "50%",
                        background: "rgb(255, 255, 255)"
                      }, left: `${barPct(card.from, card)}%` }} />
                      <span style={{ ...{
                        position: "absolute",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "28px",
                        height: "28px",
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center center"
                      }, left: `${barPct(card.to, card)}%`, backgroundImage: card.orb ? `url(${mediaUrl(card.orb)})` : undefined }} />
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontSize: "10.5px",
                      color: "rgb(255, 255, 255)",
                      opacity: "0.8"
                    }}>
                      <span>{card.scaleLow}</span>
                      <span>{card.scaleHigh}</span>
                    </div>
                    <div style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "13px",
                      color: "rgb(255, 255, 255)",
                      opacity: "0.85",
                      marginTop: "12px"
                    }}>
                      <span>{card.summary}</span>
                    </div>
                  </div>
                </div>
                <div style={{ ...{
                  position: "absolute",
                  inset: "0px",
                  borderRadius: "20px",
                  padding: "24px 22px",
                  background: "rgb(51, 43, 42)",
                  border: "1px solid rgba(240, 245, 255, 0.2)",
                  color: "var(--nb1-cool-grey)",
                  overflow: "hidden",
                  transition: "opacity 0.28s, transform 0.32s cubic-bezier(0.16, 0.84, 0.44, 1)"
                }, opacity: openCard === cardIdx ? 1 : 0, transform: openCard === cardIdx ? 'none' : 'translateY(10px)', pointerEvents: openCard === cardIdx ? 'auto' : 'none' }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontSize: "10.5px",
                    color: "var(--nb1-blue)"
                  }}>
                    <span>{card.metric}</span>
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontSize: "10.5px",
                    opacity: "0.8",
                    marginTop: "14px"
                  }}>{card.backLabel}</div>
                  <p style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "14.5px",
                    lineHeight: "1.55",
                    opacity: "1",
                    marginTop: "10px"
                  }}>
                    <span>{card.backBody}</span>
                  </p>
                  <div style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(240, 245, 255, 0.14)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "13px",
                    lineHeight: "1"
                  }}>{"\u2715"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "12.5px",
          lineHeight: "1.5",
          opacity: "0.5",
          marginTop: "22px",
          maxWidth: "64ch"
        }}>{footnote}</p>
      </div>
    </section>
  )
}

export const RdProofComponent = RdProof

export default RdProof
