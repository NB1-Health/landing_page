'use client'

import React, { useState } from 'react'
import RichText from '@/components/RichText'
import type { RdPgDataBlock as Props } from '@/payload-types'
import { getDictionary } from '@/i18n/getDictionary'

// GENERATED from manifests/section-06.json + bindings/RdPgData.json by
// tools/block_component.py — NO LONGER REGENERABLE WITHOUT LOSS: the mock-up
// strings below were moved into the locale dictionaries and a regeneration
// would hardcode all 55 of them back into English.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// Four tabs. Both the text panel and the phone's screen are swapped by activeTab; all eight live in the DOM at once and are toggled by display, exactly as the mockup does it.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

export const RdPgData: React.FC<Props & { locale?: string | null }> = ({ anchorId, cta, heading, intro, panels, reportAvatar, tabs, locale }) => {
  /*
   * THE PHONE MOCK-UP IS NOT CMS CONTENT, and it is not English-only any more.
   *
   * Every word inside the device, the bacterial-team chart, the four-bar panel
   * and the reading→ingredient strip used to be a literal in this file, so a
   * German reader got "Hello, Jane" and "Up from 73.6". Fifty-five strings, all
   * of them translated in the rebrand sheet, none of them reachable.
   *
   * They live in the locale dictionaries rather than in rdPgData's config
   * because this is a fixed illustration, not copy anyone edits: the numbers
   * are sample data, the layout depends on them staying roughly this length,
   * and the five dictionaries already cover the nine locales (ch->de, be->nl,
   * uk/uae->en). Putting them in the CMS would have meant ~20 new localized
   * fields, a migration, and a translator filling 55 cells nine times.
   */
  const d = getDictionary(locale ?? undefined).pgData
  const [activeTab, setActiveTab] = useState(0)

  return (
      <section style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "104px 48px"
      }} className="rd-pg rd-pgdata" id={anchorId || undefined}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "64px",
          alignItems: "start"
        }}>
          <div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(44px, 5vw, 68px)",
              lineHeight: "0.92",
              letterSpacing: "-0.02em"
            }}>
              {(heading)?.root ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "18px",
              lineHeight: "1.45",
              opacity: "0.78",
              marginTop: "20px",
              maxWidth: "46ch"
            }}>{intro}</p>
            <div style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "30px"
            }}>
              <button style={activeTab === 0 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "transparent",
                color: "var(--nb1-dark-brown)",
                boxShadow: "rgba(81, 71, 69, 0.28) 0px 0px 0px 1.5px inset"
              }} type={'button'} aria-selected={activeTab === 0} onClick={() => setActiveTab(0)}>{tabs?.[0]?.label}</button>
              <button style={activeTab !== 1 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "transparent",
                color: "var(--nb1-dark-brown)",
                boxShadow: "rgba(81, 71, 69, 0.28) 0px 0px 0px 1.5px inset"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)"
              }} type={'button'} aria-selected={activeTab === 1} onClick={() => setActiveTab(1)}>{tabs?.[1]?.label}</button>
              <button style={activeTab !== 2 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "transparent",
                color: "var(--nb1-dark-brown)",
                boxShadow: "rgba(81, 71, 69, 0.28) 0px 0px 0px 1.5px inset"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)"
              }} type={'button'} aria-selected={activeTab === 2} onClick={() => setActiveTab(2)}>{tabs?.[2]?.label}</button>
              <button style={activeTab !== 3 ? {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "transparent",
                color: "var(--nb1-dark-brown)",
                boxShadow: "rgba(81, 71, 69, 0.28) 0px 0px 0px 1.5px inset"
              } : {
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "12.5px",
                padding: "0.7em 1.2em",
                borderRadius: "999px",
                border: "0px",
                cursor: "pointer",
                background: "var(--nb1-lime)",
                color: "rgb(0, 0, 0)"
              }} type={'button'} aria-selected={activeTab === 3} onClick={() => setActiveTab(3)}>{tabs?.[3]?.label}</button>
            </div>
            <div style={{
              marginTop: "52px",
              minHeight: "430px"
            }}>
              <div style={{ display: activeTab === 0 ? undefined : 'none' }}>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(32px, 3.4vw, 44px)",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                  marginBottom: "32px"
                }}>{panels?.[0]?.title}</h3>
                <ol style={{
                  listStyle: "none",
                  padding: "0px",
                  margin: "0px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {(panels?.[0]?.steps || []).map((st0, st0Idx) => (
                    <li key={st0Idx} style={{
                      display: "flex",
                      gap: "18px",
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        width: "38px",
                        height: "38px",
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        background: "var(--nb1-dark-brown)",
                        color: "var(--nb1-cool-grey)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15px"
                      }}>{String(st0Idx + 1)}</span>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "19px",
                          lineHeight: "1.25"
                        }}>{st0.title}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "14.5px",
                          lineHeight: "1.4",
                          opacity: "0.66",
                          marginTop: "5px",
                          maxWidth: "44ch"
                        }}>{st0.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div style={{ display: activeTab === 1 ? undefined : 'none' }}>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(32px, 3.4vw, 44px)",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                  marginBottom: "32px"
                }}>{panels?.[1]?.title}</h3>
                <ol style={{
                  listStyle: "none",
                  padding: "0px",
                  margin: "0px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {(panels?.[1]?.steps || []).map((st1, st1Idx) => (
                    <li key={st1Idx} style={{
                      display: "flex",
                      gap: "18px",
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        width: "38px",
                        height: "38px",
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        background: "var(--nb1-dark-brown)",
                        color: "var(--nb1-cool-grey)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15px"
                      }}>{String(st1Idx + 1)}</span>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "19px",
                          lineHeight: "1.25"
                        }}>{st1.title}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "14.5px",
                          lineHeight: "1.4",
                          opacity: "0.66",
                          marginTop: "5px",
                          maxWidth: "44ch"
                        }}>{st1.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div style={{ display: activeTab === 2 ? undefined : 'none' }}>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(32px, 3.4vw, 44px)",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                  marginBottom: "32px"
                }}>{panels?.[2]?.title}</h3>
                <ol style={{
                  listStyle: "none",
                  padding: "0px",
                  margin: "0px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {(panels?.[2]?.steps || []).map((st2, st2Idx) => (
                    <li key={st2Idx} style={{
                      display: "flex",
                      gap: "18px",
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        width: "38px",
                        height: "38px",
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        background: "var(--nb1-dark-brown)",
                        color: "var(--nb1-cool-grey)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15px"
                      }}>{String(st2Idx + 1)}</span>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "19px",
                          lineHeight: "1.25"
                        }}>{st2.title}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "14.5px",
                          lineHeight: "1.4",
                          opacity: "0.66",
                          marginTop: "5px",
                          maxWidth: "44ch"
                        }}>{st2.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div style={{ display: activeTab === 3 ? undefined : 'none' }}>
                <h3 style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontWeight: "400",
                  fontSize: "clamp(32px, 3.4vw, 44px)",
                  lineHeight: "1",
                  letterSpacing: "-0.02em",
                  marginBottom: "32px"
                }}>{panels?.[3]?.title}</h3>
                <ol style={{
                  listStyle: "none",
                  padding: "0px",
                  margin: "0px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px"
                }}>
                  {(panels?.[3]?.steps || []).map((st3, st3Idx) => (
                    <li key={st3Idx} style={{
                      display: "flex",
                      gap: "18px",
                      alignItems: "flex-start"
                    }}>
                      <span style={{
                        width: "38px",
                        height: "38px",
                        flex: "0 0 auto",
                        borderRadius: "50%",
                        background: "var(--nb1-dark-brown)",
                        color: "var(--nb1-cool-grey)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15px"
                      }}>{String(st3Idx + 1)}</span>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "19px",
                          lineHeight: "1.25"
                        }}>{st3.title}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "14.5px",
                          lineHeight: "1.4",
                          opacity: "0.66",
                          marginTop: "5px",
                          maxWidth: "44ch"
                        }}>{st3.body}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <a style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.1em",
              marginTop: "44px",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "13px",
              background: "var(--cta)",
              color: "var(--nb1-black)",
              padding: "0.95em 1.4em",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              flexShrink: "0"
            }} href={cta?.url || '#'}>
              <span>{cta?.label}</span>
              <span style={{
                fontSize: "1.05em",
                lineHeight: "1"
              }}>{"\u2197"}</span>
            </a>
          </div>
          <div style={{
            position: "sticky",
            top: "100px",
            justifySelf: "center",
            width: "372px",
            height: "760px",
            background: "rgb(42, 36, 34)",
            borderRadius: "52px",
            padding: "12px",
            boxShadow: "rgba(81, 71, 69, 0.7) 0px 40px 90px -40px"
          }} data-phone="1">
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              background: "var(--nb1-cool-grey)",
              borderRadius: "42px",
              overflow: "hidden",
              color: "var(--nb1-dark-brown)"
            }}>
              <div style={{
                position: "absolute",
                top: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "112px",
                height: "32px",
                background: "rgb(0, 0, 0)",
                borderRadius: "999px",
                zIndex: "5"
              }} />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 28px 0px",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "13px"
              }}>
                <span>{d.device.time}</span>
                <span style={{
                  display: "flex",
                  gap: "5px",
                  alignItems: "center",
                  letterSpacing: "0.1em"
                }}>{"\u25aa\u25aa\u25aa \u2303 \u25ae"}</span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 26px 0px"
              }}>
                <img style={{
                  height: "20px",
                  width: "auto"
                }} src={'/rd-pg/nb1-mark.png'} alt="nb1" />
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <span style={{
                    fontSize: "16px",
                    opacity: "0.7"
                  }}>{"\u25d4"}</span>
                  <img style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    objectPosition: "50% 14%"
                  }} src={mediaUrl(reportAvatar)} alt={''} />
                </div>
              </div>
              <div style={{
                padding: "14px 26px 0px"
              }}>
                <div style={{ display: activeTab === 0 ? undefined : 'none' }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "21px",
                    lineHeight: "1.2"
                  }}>
                    {d.device.greeting}
                    <br />
                    {d.device.sub}
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "16px 0px 4px"
                  }}>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontSize: "11px",
                      opacity: "0.6"
                    }}>{d.device.verdict}</span>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "12px"
                    }}>
                      <span style={{
                        width: "2em",
                        height: "2em",
                        borderRadius: "50%",
                        background: "var(--nb1-lime)",
                        color: "rgb(0, 0, 0)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "0.8em",
                        clipPath: "inset(0px -1px 0px 0px round 999px)"
                      }}>{"\u2191"}</span>
                      <span style={{
                        background: "var(--nb1-lime)",
                        color: "rgb(0, 0, 0)",
                        padding: "0.5em 0.7em 0.5em 0.55em",
                        borderRadius: "999px",
                        marginLeft: "-0.35em"
                      }}>{d.device.delta}</span>
                    </span>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      fontSize: "11px",
                      opacity: "0.5"
                    }}>{d.device.deltaFrom}</span>
                  </div>
                  <div style={{
                    width: "168px",
                    height: "168px",
                    borderRadius: "50%",
                    background: "var(--nb1-cool-grey)",
                    border: "21px solid var(--nb1-blue)",
                    display: "grid",
                    placeItems: "center",
                    margin: "12px auto 18px"
                  }}>
                    <span style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "46px",
                      lineHeight: "1"
                    }}>{d.device.score}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "13px"
                  }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontSize: "9.5px",
                          opacity: "0.55"
                        }}>{d.device.metrics[0].label}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "18px"
                        }}>{d.device.metrics[0].value}</div>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "93%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "22px",
                          height: "22px",
                          backgroundImage: "url(\"assets/4941717e-679e-48ed-bcf0-19fe45bf8b95.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center",
                          display: "block"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        opacity: "0.6"
                      }}>{d.device.metrics[0].max}</span>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontSize: "9.5px",
                          opacity: "0.55"
                        }}>{d.device.metrics[1].label}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "18px"
                        }}>{d.device.metrics[1].value}</div>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "74%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "22px",
                          height: "22px",
                          backgroundImage: "url(\"assets/4c55f4b1-7672-450f-bcdd-127d3154b85f.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center",
                          display: "block"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        opacity: "0.6"
                      }}>{d.device.metrics[1].max}</span>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontSize: "9.5px",
                          opacity: "0.55"
                        }}>{d.device.metrics[2].label}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "18px"
                        }}>{d.device.metrics[2].value}</div>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "98%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "22px",
                          height: "22px",
                          backgroundImage: "url(\"assets/621d96eb-dc40-4e12-ab8f-f8057e32eac6.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center",
                          display: "block"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        opacity: "0.6"
                      }}>{d.device.metrics[2].max}</span>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontSize: "9.5px",
                          opacity: "0.55"
                        }}>{d.device.metrics[3].label}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "18px"
                        }}>{d.device.metrics[3].value}</div>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "73%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "22px",
                          height: "22px",
                          backgroundImage: "url(\"assets/4c55f4b1-7672-450f-bcdd-127d3154b85f.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center",
                          display: "block"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        opacity: "0.6"
                      }}>{d.device.metrics[3].max}</span>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      alignItems: "center",
                      gap: "14px"
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "var(--nb1-font-tertiary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontSize: "9.5px",
                          opacity: "0.55"
                        }}>{d.device.metrics[4].label}</div>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "18px"
                        }}>{d.device.metrics[4].value}</div>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "98%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "22px",
                          height: "22px",
                          backgroundImage: "url(\"assets/4941717e-679e-48ed-bcf0-19fe45bf8b95.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center",
                          display: "block"
                        }} />
                      </div>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        opacity: "0.6"
                      }}>{d.device.metrics[4].max}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: activeTab === 1 ? undefined : 'none' }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "21px",
                    lineHeight: "1.2",
                    marginBottom: "8px"
                  }}>
                    {d.systems.titleA}
                    <br />
                    {d.systems.titleB}
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    opacity: "0.55",
                    marginBottom: "22px"
                  }}>{d.systems.subtitle}</div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px"
                  }}>
                    <div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "15px",
                        marginBottom: "9px"
                      }}>
                        <span>{d.systems.bars[0].label}</span>
                        <b style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontWeight: "350"
                        }}>{d.systems.bars[0].value}</b>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "90%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "20px",
                          height: "20px",
                          backgroundImage: "url(\"assets/4941717e-679e-48ed-bcf0-19fe45bf8b95.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center"
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "15px",
                        marginBottom: "9px"
                      }}>
                        <span>{d.systems.bars[1].label}</span>
                        <b style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontWeight: "350"
                        }}>{d.systems.bars[1].value}</b>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "95%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "20px",
                          height: "20px",
                          backgroundImage: "url(\"assets/4941717e-679e-48ed-bcf0-19fe45bf8b95.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center"
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "15px",
                        marginBottom: "9px"
                      }}>
                        <span>{d.systems.bars[2].label}</span>
                        <b style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontWeight: "350",
                          color: "var(--nb1-orange)"
                        }}>{d.systems.bars[2].value}</b>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "73%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "20px",
                          height: "20px",
                          backgroundImage: "url(\"assets/3f1d362f-62df-4e24-ba71-6bb9d0c60abb.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center"
                        }} />
                      </div>
                    </div>
                    <div>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "15px",
                        marginBottom: "9px"
                      }}>
                        <span>{d.systems.bars[3].label}</span>
                        <b style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontWeight: "350",
                          color: "var(--nb1-orange)"
                        }}>{d.systems.bars[3].value}</b>
                      </div>
                      <div style={{
                        position: "relative",
                        height: "2px",
                        background: "rgba(81, 71, 69, 0.22)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "60%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "20px",
                          height: "20px",
                          backgroundImage: "url(\"assets/3f1d362f-62df-4e24-ba71-6bb9d0c60abb.svg\")",
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center center"
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: activeTab === 2 ? undefined : 'none' }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "21px",
                    lineHeight: "1.2",
                    marginBottom: "8px"
                  }}>{d.teams.title}</div>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    opacity: "0.55",
                    marginBottom: "22px"
                  }}>{d.teams.subtitle}</div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px"
                  }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{d.teams.rows[0].label}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "9.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: "0.6"
                      }}>{d.teams.rows[0].status}</span>
                      <div style={{
                        gridColumn: "1 / -1",
                        position: "relative",
                        height: "5px",
                        borderRadius: "999px",
                        background: "rgba(81, 71, 69, 0.15)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "0px",
                          top: "0px",
                          bottom: "0px",
                          width: "55%",
                          borderRadius: "999px",
                          background: "var(--nb1-blue)"
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{d.teams.rows[1].label}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "9.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: "0.6"
                      }}>{d.teams.rows[1].status}</span>
                      <div style={{
                        gridColumn: "1 / -1",
                        position: "relative",
                        height: "5px",
                        borderRadius: "999px",
                        background: "rgba(81, 71, 69, 0.15)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "0px",
                          top: "0px",
                          bottom: "0px",
                          width: "48%",
                          borderRadius: "999px",
                          background: "var(--nb1-blue)"
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{d.teams.rows[2].label}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "9.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: "0.6"
                      }}>{d.teams.rows[2].status}</span>
                      <div style={{
                        gridColumn: "1 / -1",
                        position: "relative",
                        height: "5px",
                        borderRadius: "999px",
                        background: "rgba(81, 71, 69, 0.15)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "0px",
                          top: "0px",
                          bottom: "0px",
                          width: "72%",
                          borderRadius: "999px",
                          background: "var(--nb1-blue)"
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{d.teams.rows[3].label}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "9.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--nb1-orange)"
                      }}>{d.teams.rows[3].status}</span>
                      <div style={{
                        gridColumn: "1 / -1",
                        position: "relative",
                        height: "5px",
                        borderRadius: "999px",
                        background: "rgba(81, 71, 69, 0.15)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "0px",
                          top: "0px",
                          bottom: "0px",
                          width: "30%",
                          borderRadius: "999px",
                          background: "var(--nb1-orange)"
                        }} />
                      </div>
                    </div>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "6px"
                    }}>
                      <span style={{
                        fontSize: "14px"
                      }}>{d.teams.rows[4].label}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "9.5px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        opacity: "0.6"
                      }}>{d.teams.rows[4].status}</span>
                      <div style={{
                        gridColumn: "1 / -1",
                        position: "relative",
                        height: "5px",
                        borderRadius: "999px",
                        background: "rgba(81, 71, 69, 0.15)"
                      }}>
                        <span style={{
                          position: "absolute",
                          left: "0px",
                          top: "0px",
                          bottom: "0px",
                          width: "88%",
                          borderRadius: "999px",
                          background: "var(--nb1-blue)"
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: activeTab === 3 ? undefined : 'none' }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "21px",
                    lineHeight: "1.2",
                    marginBottom: "8px"
                  }}>
                    {d.trace.titleA}
                    <br />
                    {d.trace.titleB}
                  </div>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "10px",
                    opacity: "0.55",
                    marginBottom: "14px"
                  }}>{d.trace.subtitle}</div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <div style={{
                      padding: "15px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.16)"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontSize: "10px",
                        opacity: "0.6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--nb1-orange)"
                        }} />
                        {d.trace.rows[0].reading}
                      </div>
                      <div style={{
                        fontSize: "15px",
                        marginTop: "4px"
                      }}>{d.trace.rows[0].ingredient}</div>
                    </div>
                    <div style={{
                      padding: "15px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.16)"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontSize: "10px",
                        opacity: "0.6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--nb1-orange)"
                        }} />
                        {d.trace.rows[1].reading}
                      </div>
                      <div style={{
                        fontSize: "15px",
                        marginTop: "4px"
                      }}>{d.trace.rows[1].ingredient}</div>
                    </div>
                    <div style={{
                      padding: "15px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.16)"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontSize: "10px",
                        opacity: "0.6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--nb1-soft-pink)"
                        }} />
                        {d.trace.rows[2].reading}
                      </div>
                      <div style={{
                        fontSize: "15px",
                        marginTop: "4px"
                      }}>{d.trace.rows[2].ingredient}</div>
                    </div>
                    <div style={{
                      padding: "15px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
                      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontSize: "10px",
                        opacity: "0.6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <span style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--nb1-blue)"
                        }} />
                        {d.trace.rows[3].reading}
                      </div>
                      <div style={{
                        fontSize: "15px",
                        marginTop: "4px"
                      }}>{d.trace.rows[3].ingredient}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{
                position: "absolute",
                bottom: "0px",
                left: "0px",
                right: "0px",
                display: "flex",
                justifyContent: "space-around",
                padding: "16px 0px 26px",
                borderTop: "1px solid rgba(81, 71, 69, 0.12)",
                background: "var(--nb1-cool-grey)",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontSize: "9.5px"
              }}>
                <span style={{
                  opacity: "0.5"
                }}>{d.device.tabs.home}</span>
                <span>{d.device.tabs.health}</span>
                <span style={{
                  opacity: "0.5"
                }}>{d.device.tabs.guide}</span>
                <span style={{
                  opacity: "0.5"
                }}>{d.device.tabs.more}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgDataComponent = RdPgData

export default RdPgData
