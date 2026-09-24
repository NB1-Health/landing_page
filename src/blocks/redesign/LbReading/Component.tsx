'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import type { RdLbReadingBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-06.json + bindings/RdLbReading.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbreading` and NOT `rd-block`.
//
// Two pieces of state: which of eight symptom patterns is selected, and teams or ratios. Everything the panel draws is derived from the selected pattern's numbers, the way the mockup derives it.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

// Drawing, not content: the six team colours and the two warning inks are the
// design's, and an editor changing a team's NAME must not be able to change what
// colour its slider is. They live here rather than as fields for the same reason
// the read cards' icons in #reads do.
const TEAM_COLOURS = [
  'var(--nb1-blue)',
  'var(--nb1-lime)',
  'var(--nb1-blue-grey)',
  'var(--nb1-soft-pink)',
  'var(--nb1-warm-grey)',
  'var(--nb1-orange)',
]
const OUT_OF_RANGE = 'var(--nb1-orange)'
const WARN_INK = '#8A5416'
const MUTED_INK = 'rgba(81,71,69,.86)'

const n0 = (v: unknown): number => (typeof v === 'number' ? v : 0)

// The bubble handle is a design-system component driven entirely by custom
// properties, so the only thing that varies per row is its colour and where it
// sits. Written once here so six sliders and four ratios cannot drift apart.
const bubble = (left: number, colour: string): React.CSSProperties =>
  ({
    position: 'absolute',
    left: `${Math.min(left, 100)}%`,
    top: '50%',
    transform: 'translate(-50%,-50%)',
    gap: 0,
    '--nb1-bubble-size': '24px',
    '--nb1-bubble-halo': colour,
    '--nb1-bubble-core': `color-mix(in oklab, ${colour} 62%, var(--nb1-cool-grey))`,
    '--nb1-bubble-fill': '46%',
    '--nb1-bubble-blur': '10%',
  }) as React.CSSProperties

export const RdLbReading: React.FC<Props> = ({ analysis, anchorId, archetypes, focusLabel, heading, intro, inventory, mechanisms, phone, phoneAvatar, phoneLogo, pillarNames, ratioDefs, ratiosTab, resultLabel, seals, sliderLabels, teamDefs, teamsTab }) => {
  const [archIdx, setArchIdx] = useState(0)
  const [tab, setTab] = useState(0)

  // Everything the panel shows is DERIVED from the selected archetype's numbers
  // and the shared definitions beside them, exactly as the mockup's own script
  // derives it. Storing the derived values instead — each slider's position, each
  // verdict, each printed maximum — would have been eleven more fields per
  // archetype that an editor could put out of step with the number they describe.
  const arch = (archetypes || [])[archIdx]
  const good = n0(arch?.score) >= 80
  const accent = good ? 'var(--nb1-lime)' : 'var(--nb1-orange)'

  const teamRows = (teamDefs || []).map((def, i) => {
    const v = n0(arch?.teams?.[i]?.value)
    const lo = n0(def.low)
    const hi = n0(def.high)
    const out = v < lo || v > hi
    // one axis per row: the value, the handle, the healthy band and the printed
    // maximum all come off the same number, so they cannot disagree
    const max = Math.max(hi * 1.6, v * 1.15) || 1
    const colour = out ? OUT_OF_RANGE : (TEAM_COLOURS[i] ?? OUT_OF_RANGE)
    return {
      name: def.name,
      sub: def.sub,
      value: `${v}%`,
      range: `${lo}–${hi}%`,
      max: `${Math.round(max)}%`,
      verdict: out
        ? (v > hi ? sliderLabels?.overRange : sliderLabels?.underRange)
        : sliderLabels?.inRange,
      ink: out ? WARN_INK : MUTED_INK,
      bandLeft: `${(lo / max) * 100}%`,
      bandWidth: `${((hi - lo) / max) * 100}%`,
      mark: bubble((v / max) * 100, colour),
    }
  })

  const ratioRows = (ratioDefs || []).map((def, i) => ({
    name: def.name,
    bad: def.bad,
    good: def.good,
    mark: bubble(n0(arch?.ratios?.[i]?.value), 'var(--nb1-blue)'),
  }))

  const pillarValues = (pillarNames || []).map((_, i) => n0(arch?.pillars?.[i]?.value))
  const lowestPillar = pillarValues.length ? Math.min(...pillarValues) : 0
  const pillarRows = (pillarNames || []).map((def, i) => {
    const v = pillarValues[i] ?? 0
    const lowest = v === lowestPillar
    return {
      name: def.name,
      value: v,
      ink: lowest ? WARN_INK : MUTED_INK,
      barWidth: `${v}%`,
      barColour: lowest ? 'var(--nb1-orange)' : 'var(--nb1-blue)',
    }
  })

  const tabBlurb = tab === 0 ? teamsTab?.blurb : ratiosTab?.blurb

  return (
      <section style={{
        background: "var(--nb1-cool-grey)"
      }} className="rd-lb rd-lbreading" id={anchorId || undefined}>
        <div style={{
          maxWidth: "1240px",
          margin: "0px auto",
          padding: "64px 20px"
        }} data-d="pad bigpad">
          <div style={{
            maxWidth: "23ch"
          }} className="h2" data-d="bigh">
            {(heading)?.root ? (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <p style={{
            marginTop: "18px",
            maxWidth: "58ch"
          }} className="lede">{intro}</p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "0.92fr 1.08fr",
            gap: "40px",
            alignItems: "center",
            marginTop: "36px"
          }} data-d="side">
            <div style={{
              padding: "24px 22px",
              opacity: "0.86"
            }} className="card">
              <div style={{
                color: "rgb(138, 84, 22)"
              }} className="lab">{inventory?.label}</div>
              <div style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column"
              }}>
                {(inventory?.species || []).map((sp, spIdx) => (
                  <div key={spIdx} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "9px 0px",
                    borderBottom: "1px solid var(--nb1-hairline)",
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px"
                  }}>
                    {sp.name}
                    <span style={{
                      opacity: "0.7"
                    }}>
                      {sp.value}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: "14px",
                color: "rgba(81, 71, 69, 0.86)"
              }} className="mono">{inventory?.moreLabel}</div>
              <p style={{
                fontSize: "13.5px",
                lineHeight: "1.5",
                opacity: "0.78",
                marginTop: "16px",
                paddingTop: "14px",
                borderTop: "1px solid var(--nb1-hairline)"
              }}>{inventory?.note}</p>
            </div>
            <div>
              <h3 style={{
                maxWidth: "20ch",
                fontSize: "clamp(23px, 2.8vw, 32px)"
              }} className="h3">{analysis?.heading}</h3>
              <p style={{
                marginTop: "14px",
                maxWidth: "47ch"
              }} className="lede">{analysis?.intro}</p>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0px",
                marginTop: "24px",
                maxWidth: "44ch"
              }}>
                {(analysis?.passes || []).map((ps, psIdx) => (
                  <div key={psIdx} style={{
                    display: "flex",
                    gap: "16px",
                    padding: "15px 0px",
                    borderTop: "1px solid rgba(81, 71, 69, 0.22)"
                  }}>
                    <span style={{
                      opacity: "0.6",
                      flex: "0 0 auto"
                    }} className="mono">
                      {ps.number}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "16px"
                      }}>
                        {ps.title}
                      </div>
                      <p style={{
                        fontSize: "14px",
                        lineHeight: "1.5",
                        opacity: "0.78",
                        marginTop: "5px"
                      }}>
                        {ps.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            marginTop: "52px",
            paddingTop: "36px",
            borderTop: "1px solid rgba(81, 71, 69, 0.22)"
          }}>
            <h3 style={{
              maxWidth: "28ch"
            }} className="h3">{mechanisms?.heading}</h3>
            <p style={{
              marginTop: "12px",
              maxWidth: "56ch"
            }} className="lede">{mechanisms?.intro}</p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            marginTop: "30px"
          }} data-m="cols4">
            {(archetypes || []).map((arc, arcIdx) => (
              <button key={arcIdx} style={{ ...{
                textAlign: "left",
                cursor: "pointer",
                border: "0px",
                borderRadius: "12px",
                padding: "14px 16px 15px",
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14.5px",
                lineHeight: "1.32"
              }, background: archIdx === arcIdx ? 'var(--nb1-dark-brown)' : 'var(--nb1-cool-grey)', color: archIdx === arcIdx ? 'var(--nb1-cool-grey)' : 'var(--nb1-dark-brown)', boxShadow: archIdx === arcIdx ? 'none' : 'inset 0 0 0 1px var(--nb1-hairline)' }} type={'button'} onClick={() => setArchIdx(arcIdx)} aria-pressed={archIdx === arcIdx}>
                {arc.cardLabel}
              </button>
            ))}
          </div>
          <div style={{
            marginTop: "34px",
            paddingTop: "26px",
            borderTop: "1px solid rgba(81, 71, 69, 0.22)"
          }}>
            <div className="lab">{resultLabel}</div>
            <h3 style={{
              marginTop: "10px",
              maxWidth: "30ch",
              fontSize: "clamp(24px, 3vw, 34px)"
            }} className="h3">
              {arch?.name}
            </h3>
            <p style={{
              marginTop: "12px",
              maxWidth: "62ch"
            }} className="lede">
              {arch?.whats}
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "36px",
            alignItems: "start",
            marginTop: "32px"
          }} data-d="side">
            <div>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap"
              }}>
                <button style={{ ...{
                  cursor: "pointer",
                  border: "0px",
                  borderRadius: "999px",
                  padding: "0.7em 1.15em",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px"
                }, background: tab === 0 ? 'var(--nb1-dark-brown)' : 'transparent', color: tab === 0 ? 'var(--nb1-cool-grey)' : 'var(--nb1-dark-brown)', boxShadow: tab === 0 ? 'none' : 'inset 0 0 0 1px rgba(81,71,69,.28)' }} type={'button'} onClick={() => setTab(0)} aria-pressed={tab === 0}>
                  {teamsTab?.label}
                </button>
                <button style={{ ...{
                  cursor: "pointer",
                  border: "0px",
                  borderRadius: "999px",
                  padding: "0.7em 1.15em",
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "11px"
                }, background: tab === 1 ? 'var(--nb1-dark-brown)' : 'transparent', color: tab === 1 ? 'var(--nb1-cool-grey)' : 'var(--nb1-dark-brown)', boxShadow: tab === 1 ? 'none' : 'inset 0 0 0 1px rgba(81,71,69,.28)' }} type={'button'} onClick={() => setTab(1)} aria-pressed={tab === 1}>
                  {ratiosTab?.label}
                </button>
              </div>
              <div style={{
                padding: "26px 24px",
                marginTop: "14px"
              }} className="card">
                <p style={{
                  fontSize: "15px",
                  lineHeight: "1.55",
                  opacity: "0.82"
                }}>
                  {tabBlurb}
                </p>
                <div style={{ display: tab === 0 ? 'block' : 'none' }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0px",
                    marginTop: "18px"
                  }}>
                    {(teamRows || []).map((tm, tmIdx) => (
                      <div key={tmIdx} style={{
                        padding: "14px 0px 16px",
                        borderTop: "1px solid var(--nb1-hairline)"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          gap: "12px"
                        }}>
                          <span style={{
                            fontSize: "15px"
                          }}>
                            {tm.name}
                            {" "}
                            <span style={{
                              color: "rgba(81, 71, 69, 0.86)",
                              fontSize: "13px"
                            }}>
                              {"\u00b7 "}
                              {tm.sub}
                            </span>
                          </span>
                          <span style={{ ...{
                            fontFamily: "var(--nb1-font-tertiary)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            fontSize: "10.5px",
                            whiteSpace: "nowrap",
                            flex: "0 0 auto"
                          }, color: tm.ink }}>
                            {tm.verdict}
                          </span>
                        </div>
                        <div style={{
                          margin: "10px 0px 0px"
                        }} className="nb1-slider">
                          <div>
                            <span className="nb1-slider__label">{sliderLabels?.thisReading}</span>
                            <span className="nb1-slider__value">
                              {tm.value}
                            </span>
                          </div>
                          <div className="nb1-slider__track">
                            <span style={{ ...{
                              position: "absolute",
                              top: "-2.5px",
                              height: "6.5px",
                              borderRadius: "999px",
                              background: "rgba(81, 71, 69, 0.2)"
                            }, left: tm.bandLeft, width: tm.bandWidth }} />
                            <span style={tm.mark} className="nb1-bubble">
                              <span className="nb1-bubble__orb" />
                            </span>
                          </div>
                          <div className="nb1-slider__max">
                            {tm.max}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: "10.5px",
                          color: "rgba(81, 71, 69, 0.86)",
                          textAlign: "right",
                          marginTop: "-4px"
                        }}>
                          {sliderLabels?.healthyPrefix}
                          {tm.range}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: tab === 1 ? 'block' : 'none' }}>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0px",
                    marginTop: "18px"
                  }}>
                    {(ratioRows || []).map((rt, rtIdx) => (
                      <div key={rtIdx} style={{
                        padding: "17px 0px",
                        borderTop: "1px solid var(--nb1-hairline)"
                      }}>
                        <div style={{
                          fontSize: "15px"
                        }}>
                          {rt.name}
                        </div>
                        <div style={{
                          margin: "16px 0px 11px"
                        }} className="nb1-slider__track">
                          <span style={rt.mark} className="nb1-bubble">
                            <span className="nb1-bubble__orb" />
                          </span>
                        </div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--nb1-font-tertiary)",
                          fontSize: "10.5px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "rgba(81, 71, 69, 0.8)"
                        }}>
                          <span>
                            {rt.bad}
                          </span>
                          <span>
                            {rt.good}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  marginTop: "22px",
                  paddingTop: "18px",
                  borderTop: "1px solid var(--nb1-hairline)",
                  fontSize: "15px",
                  lineHeight: "1.55"
                }}>
                  <b style={{
                    fontWeight: "500"
                  }}>{focusLabel}</b>
                  {" "}
                  {arch?.focus}
                </div>
              </div>
            </div>
            <div style={{
              justifySelf: "center",
              width: "100%",
              maxWidth: "300px"
            }}>
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "372 / 760",
                background: "rgb(42, 36, 34)",
                borderRadius: "50px",
                padding: "11px",
                boxShadow: "rgba(81, 71, 69, 0.7) 0px 40px 90px -40px"
              }}>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  background: "var(--nb1-cool-grey)",
                  borderRadius: "40px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "100px",
                    height: "28px",
                    background: "rgb(0, 0, 0)",
                    borderRadius: "999px",
                    zIndex: "5"
                  }} />
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "15px 24px 0px",
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12px"
                  }}>
                    <span>{phone?.time}</span>
                    <span style={{
                      letterSpacing: "0.1em"
                    }}>{"\u25aa\u25aa\u25aa \u2303 \u25ae"}</span>
                  </div>
                  <div style={{
                    padding: "18px 22px 0px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <img style={{
                      height: "16px",
                      width: "auto"
                    }} src={mediaUrl(phoneLogo)} alt={mediaAlt(phoneLogo) || ''} />
                    <img style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      objectPosition: "50% 0%"
                    }} src={mediaUrl(phoneAvatar)} alt={''} />
                  </div>
                  <div style={{
                    padding: "16px 22px 0px"
                  }}>
                    <div style={{
                      fontSize: "9.5px"
                    }} className="lab">{phone?.scoreLabel}</div>
                    <div style={{ ...{
                      width: "min(60%, 146px)",
                      aspectRatio: "1 / 1",
                      borderRadius: "50%",
                      margin: "12px auto 0px",
                      display: "grid",
                      placeItems: "center",
                      background: "var(--nb1-cool-grey)"
                    }, border: `19px solid ${good ? 'var(--nb1-lime)' : 'var(--nb1-blue)'}` }}>
                      <div style={{
                        textAlign: "center"
                      }}>
                        <div style={{
                          fontFamily: "var(--nb1-font-primary)",
                          fontSize: "38px",
                          lineHeight: "1"
                        }}>
                          {arch?.score}
                        </div>
                        <div style={{
                          fontSize: "8.5px",
                          marginTop: "4px"
                        }} className="lab">{phone?.outOfLabel}</div>
                      </div>
                    </div>
                    <div style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "12px"
                    }}>
                      <span style={{ ...{
                        fontFamily: "var(--nb1-font-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontSize: "10px",
                        color: "var(--nb1-black)",
                        padding: "0.5em 0.85em",
                        borderRadius: "999px"
                      }, background: accent }}>
                        {arch?.band}
                      </span>
                    </div>
                    <div style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--nb1-hairline)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px"
                    }}>
                      {(pillarRows || []).map((pl, plIdx) => (
                        <div key={plIdx}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12.5px"
                          }}>
                            <span>
                              {pl.name}
                            </span>
                            <span style={{ ...{
                              fontFamily: "var(--nb1-font-tertiary)",
                              fontSize: "11px"
                            }, color: pl.ink }}>
                              {pl.value}
                            </span>
                          </div>
                          <div style={{
                            position: "relative",
                            height: "3px",
                            borderRadius: "999px",
                            background: "rgba(81, 71, 69, 0.14)",
                            marginTop: "6px"
                          }}>
                            <span style={{ ...{
                              position: "absolute",
                              left: "0px",
                              top: "0px",
                              height: "3px",
                              borderRadius: "999px"
                            }, width: pl.barWidth, background: pl.barColour }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{
                      fontSize: "11.5px",
                      lineHeight: "1.45",
                      opacity: "0.75",
                      marginTop: "14px"
                    }}>
                      {arch?.note}
                    </p>
                  </div>
                </div>
              </div>
              <div style={{
                textAlign: "center",
                marginTop: "14px"
              }} className="lab">{phone?.caption}</div>
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginTop: "44px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(81, 71, 69, 0.22)"
          }} data-m="sealtri">
            {(seals || []).map((sl, slIdx) => (
              <div key={slIdx} style={{
                padding: "18px 0px"
              }} data-m="sealrow">
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "34px",
                  lineHeight: "1"
                }}>
                  {sl.number}
                </div>
                <p style={{
                  fontSize: "13.5px",
                  lineHeight: "1.5",
                  opacity: "0.8",
                  marginTop: "10px",
                  maxWidth: "30ch"
                }} data-m="seallong">
                  {sl.long}
                </p>
                <p style={{
                  display: "none",
                  fontSize: "12px",
                  lineHeight: "1.45",
                  opacity: "0.82",
                  marginTop: "7px"
                }} data-m="sealshort">
                  {sl.short}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbReadingComponent = RdLbReading

export default RdLbReading
