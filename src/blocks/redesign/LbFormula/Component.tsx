'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdLbFormulaBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-07.json + bindings/RdLbFormula.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbformula` and NOT `rd-block`.
//
// Four numbered steps down a rail. The fibre list repeats; the definitions, the counts and the strain library are bound by index because each carries its own drawing.


export const RdLbFormula: React.FC<Props> = ({ advanced, anchorId, basics, closingEmphasis, closingLead, cultures, doseFibres, eyebrow, fibres, genera, heading, intro, layer, prebiotics, steps }) => {
  return (
    <section style={{
      background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
      borderTop: "1px solid rgba(81, 71, 69, 0.16)",
      borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
    }} className="rd-lb rd-lbformula" id={anchorId || undefined}>
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
          opacity: "0.8"
        }}>{eyebrow}</div>
        <div style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(30px, 5cqi, 50px)",
          lineHeight: "1",
          letterSpacing: "-0.025em",
          marginTop: "14px",
          maxWidth: "28ch"
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
          maxWidth: "58ch"
        }}>{intro}</p>
        <div style={{
          position: "relative",
          marginTop: "44px",
          display: "flex",
          flexDirection: "column",
          gap: "40px"
        }}>
          <span style={{
            position: "absolute",
            left: "19px",
            top: "40px",
            bottom: "10px",
            width: "1px",
            background: "rgba(81, 71, 69, 0.26)"
          }} data-m="railline" />
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <span style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                boxShadow: "rgba(81, 71, 69, 0.26) 0px 0px 0px 1.5px inset",
                background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "12px",
                letterSpacing: "0.04em"
              }}>{steps?.[0]?.number}</span>
              <span style={{
                width: "18px",
                height: "1px",
                background: "rgba(81, 71, 69, 0.3)",
                flex: "0 0 auto"
              }} />
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.8)"
              }}>{steps?.[0]?.label}</span>
            </div>
            <div style={{
              paddingLeft: "52px"
            }} data-m="stepbody">
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.6",
                opacity: "0.78",
                margin: "14px 0px 0px",
                maxWidth: "62ch"
              }}>{basics?.body}</p>
              <div style={{
                marginTop: "20px",
                background: "var(--nb1-cool-grey)",
                borderRadius: "var(--nb1-radius-md)",
                padding: "24px 22px",
                boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px"
              }}>
                <svg style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }} viewBox="0 0 760 224" role="img" aria-label={basics?.figureAlt || ''} xmlns="http://www.w3.org/2000/svg">
                  <g className="pro">
                    <g transform="translate(125 80) rotate(-20)">
                      <rect x="-16" y="-6.5" width="32" height="13" rx="6.5" fill="#514745" />
                    </g>
                    <g transform="translate(143 96) rotate(24)">
                      <rect x="-15" y="-6" width="30" height="12" rx="6" fill="#7A6E6B" />
                    </g>
                    <g transform="translate(109 99) rotate(6)">
                      <rect x="-13" y="-5.5" width="26" height="11" rx="5.5" fill="#2F2827" />
                    </g>
                    <g transform="translate(130 121) rotate(14)" opacity="0.42">
                      <rect x="-12" y="-5" width="24" height="10" rx="5" fill="#8FD4E4" />
                    </g>
                    <g transform="translate(118 144) rotate(-10)" opacity="0.20">
                      <rect x="-10" y="-4.2" width="20" height="8.4" rx="4.2" fill="#8FD4E4" />
                    </g>
                    <g transform="translate(134 165) rotate(8)" opacity="0.09">
                      <rect x="-8" y="-3.4" width="16" height="6.8" rx="3.4" fill="#8FD4E4" />
                    </g>
                    <text className="sc-cap" x="127" y="188" fontFamily="F37 Zagma,sans-serif" fontSize="13" fontWeight="400" fill="rgba(81,71,69,.72)" textAnchor="middle">{"On its own, it washes through"}</text>
                  </g>
                  <text className="plus" x="253" y="102" fontFamily="Martina Plantijn,serif" fontSize="34" fill="rgba(81,71,69,.42)" textAnchor="middle">{"+"}</text>
                  <g className="pre" fill="none" strokeLinecap="round">
                    <path d="M322 84 C 354 67, 386 106, 438 81" stroke="#8FD4E4" strokeWidth="5" />
                    <path d="M322 103 C 356 120, 380 76, 438 105" stroke="#B3E7F3" strokeWidth="5" />
                    <path d="M326 93 C 366 89, 392 99, 436 92" stroke="#7A6E6B" strokeWidth="3.5" />
                    <path d="M330 75 C 368 84, 380 104, 430 112" stroke="#DCF1F7" strokeWidth="2.5" />
                  </g>
                  <text className="plus" x="507" y="101" fontFamily="Martina Plantijn,serif" fontSize="30" fill="rgba(81,71,69,.42)" textAnchor="middle">{"="}</text>
                  <circle cx="633" cy="92" r="58" fill="#514745" opacity="0.10" />
                  <g className="syn">
                    <g fill="none" strokeLinecap="round">
                      <path d="M581 78 C 615 63, 665 69, 695 87" stroke="#8FD4E4" strokeWidth="4.5" />
                      <path d="M577 106 C 615 122, 667 115, 697 97" stroke="#B3E7F3" strokeWidth="4.5" />
                    </g>
                    <g transform="translate(616 88) rotate(-16)">
                      <rect x="-16" y="-6.5" width="32" height="13" rx="6.5" fill="#514745" />
                    </g>
                    <g transform="translate(650 99) rotate(18)">
                      <rect x="-14" y="-6" width="28" height="12" rx="6" fill="#2F2827" />
                    </g>
                    <g transform="translate(630 105) rotate(46)">
                      <rect x="-11" y="-5" width="22" height="10" rx="5" fill="#7A6E6B" />
                    </g>
                    <path d="M601 95 C 625 89, 651 99, 683 93" stroke="#B3E7F3" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <text className="sc-cap" x="633" y="188" fontFamily="F37 Zagma,sans-serif" fontSize="13" fontWeight="400" fill="#514745" textAnchor="middle">{"Fed the right fibre, it stays and works"}</text>
                  </g>
                </svg>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  marginTop: "22px",
                  paddingTop: "22px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }} data-d="g3">
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px"
                    }}>
                      <span style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "var(--nb1-dark-brown)",
                        flex: "0 0 auto",
                        display: "block"
                      }} />
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "16px"
                      }}>
                        {basics?.defs?.[0]?.name}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "14px",
                      lineHeight: "1.55",
                      opacity: "0.78",
                      marginTop: "9px"
                    }}>
                      {basics?.defs?.[0]?.desc}
                    </p>
                  </div>
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px"
                    }}>
                      <span style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "rgb(143, 212, 228)",
                        flex: "0 0 auto",
                        display: "block"
                      }} />
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "16px"
                      }}>
                        {basics?.defs?.[1]?.name}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "14px",
                      lineHeight: "1.55",
                      opacity: "0.78",
                      marginTop: "9px"
                    }}>
                      {basics?.defs?.[1]?.desc}
                    </p>
                  </div>
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px"
                    }}>
                      <span style={{
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "var(--nb1-lime)",
                        flex: "0 0 auto",
                        display: "block"
                      }} />
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "16px"
                      }}>
                        {basics?.defs?.[2]?.name}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "14px",
                      lineHeight: "1.55",
                      opacity: "0.78",
                      marginTop: "9px"
                    }}>
                      {basics?.defs?.[2]?.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <span style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                boxShadow: "rgba(81, 71, 69, 0.26) 0px 0px 0px 1.5px inset",
                background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "12px",
                letterSpacing: "0.04em"
              }}>{steps?.[1]?.number}</span>
              <span style={{
                width: "18px",
                height: "1px",
                background: "rgba(81, 71, 69, 0.3)",
                flex: "0 0 auto"
              }} />
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.8)"
              }}>{steps?.[1]?.label}</span>
            </div>
            <div style={{
              paddingLeft: "52px"
            }} data-m="stepbody">
              <h3 style={{
                fontFamily: "var(--nb1-font-primary)",
                fontWeight: "400",
                fontSize: "clamp(24px, 4.2cqi, 34px)",
                lineHeight: "1.08",
                letterSpacing: "-0.02em",
                marginTop: "14px",
                maxWidth: "24ch"
              }}>{cultures?.heading}</h3>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.6",
                opacity: "0.8",
                marginTop: "12px",
                maxWidth: "58ch"
              }}>
                {(cultures?.intro)?.root ? (
                  <RichText data={cultures?.intro} enableGutter={false} enableProse={false} />
                ) : null}
              </div>
              <div style={{
                marginTop: "26px",
                background: "var(--nb1-cool-grey)",
                borderRadius: "var(--nb1-radius-md)",
                padding: "8px 24px 26px",
                boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px"
              }}>
                <div style={{
                  padding: "20px 0px 4px"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "10.5px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>{cultures?.libraryLabel}</div>
                  <div style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "clamp(21px, 3.6cqi, 27px)",
                    lineHeight: "1.12",
                    marginTop: "10px"
                  }}>{cultures?.libraryTitle}</div>
                </div>
                <div style={{
                  padding: "22px 0px 6px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      background: "radial-gradient(circle closest-side at 50% 50%,color-mix(in oklab,var(--nb1-blue) 62%,var(--nb1-cool-grey)) 0% 36%,var(--nb1-blue) 56%,transparent 96%)"
                    }} />
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontSize: "10.5px",
                      color: "rgba(81, 71, 69, 0.86)"
                    }}>{genera?.[0]?.genus}</span>
                  </div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[0]?.species?.[0]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[0]?.species?.[0]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[0]?.species?.[1]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[0]?.species?.[1]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[0]?.species?.[2]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[0]?.species?.[2]?.codes}</span>
                </div>
                <div style={{
                  padding: "22px 0px 6px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      background: "radial-gradient(circle closest-side at 50% 50%,color-mix(in oklab,var(--nb1-soft-pink) 62%,var(--nb1-cool-grey)) 0% 36%,var(--nb1-soft-pink) 56%,transparent 96%)"
                    }} />
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontSize: "10.5px",
                      color: "rgba(81, 71, 69, 0.86)"
                    }}>{genera?.[1]?.genus}</span>
                  </div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[0]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[0]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[1]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[1]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[2]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[2]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[3]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[3]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[4]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[4]?.codes}</span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[1]?.species?.[5]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[1]?.species?.[5]?.codes}</span>
                </div>
                <div style={{
                  padding: "22px 0px 6px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}>
                    <span style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      background: "radial-gradient(circle closest-side at 50% 50%,color-mix(in oklab,var(--nb1-lime) 62%,var(--nb1-cool-grey)) 0% 36%,var(--nb1-lime) 56%,transparent 96%)"
                    }} />
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontSize: "10.5px",
                      color: "rgba(81, 71, 69, 0.86)"
                    }}>{genera?.[2]?.genus}</span>
                  </div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "18px",
                  alignItems: "baseline",
                  padding: "11px 0px",
                  borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                }}>
                  <span style={{
                    fontFamily: "var(--nb1-font-secondary)",
                    fontSize: "15.5px"
                  }}>{genera?.[2]?.species?.[0]?.name}</span>
                  <span style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    fontSize: "12.5px",
                    color: "rgba(81, 71, 69, 0.86)",
                    textAlign: "right"
                  }}>{genera?.[2]?.species?.[0]?.codes}</span>
                </div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "14.5px",
                  lineHeight: "1.55",
                  opacity: "0.82",
                  marginTop: "22px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>{cultures?.note}</p>
              </div>
            </div>
          </div>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <span style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                boxShadow: "rgba(81, 71, 69, 0.26) 0px 0px 0px 1.5px inset",
                background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "12px",
                letterSpacing: "0.04em"
              }}>{steps?.[2]?.number}</span>
              <span style={{
                width: "18px",
                height: "1px",
                background: "rgba(81, 71, 69, 0.3)",
                flex: "0 0 auto"
              }} />
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.8)"
              }}>{steps?.[2]?.label}</span>
            </div>
            <div style={{
              paddingLeft: "52px"
            }} data-m="stepbody">
              <h3 style={{
                fontFamily: "var(--nb1-font-primary)",
                fontWeight: "400",
                fontSize: "clamp(24px, 4.2cqi, 34px)",
                lineHeight: "1.08",
                letterSpacing: "-0.02em",
                marginTop: "14px",
                maxWidth: "22ch"
              }}>{prebiotics?.heading}</h3>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.6",
                opacity: "0.8",
                marginTop: "12px",
                maxWidth: "58ch"
              }}>{prebiotics?.intro}</p>
              <div style={{
                marginTop: "20px",
                background: "var(--nb1-cool-grey)",
                borderRadius: "var(--nb1-radius-md)",
                padding: "8px 24px 26px",
                boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px"
              }}>
                <div style={{
                  padding: "20px 0px 4px"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "10.5px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>{prebiotics?.libraryLabel}</div>
                  <div style={{
                    fontFamily: "var(--nb1-font-primary)",
                    fontSize: "clamp(21px, 3.6cqi, 27px)",
                    lineHeight: "1.12",
                    marginTop: "10px"
                  }}>{prebiotics?.libraryTitle}</div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "0px 44px",
                  paddingTop: "6px"
                }} data-m="fibrecols">
                  {(fibres || []).map((fb, fbIdx) => (
                    <div key={fbIdx} style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "14px",
                      alignItems: "baseline",
                      padding: "10px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                    }}>
                      <span style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15px"
                      }}>{fb.name}</span>
                      <span style={{
                        fontFamily: "var(--nb1-font-tertiary)",
                        fontSize: "12px",
                        color: "rgba(81, 71, 69, 0.86)"
                      }}>{fb.code}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  padding: "22px 0px 6px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>
                  <div style={{
                    fontFamily: "var(--nb1-font-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "10.5px",
                    color: "rgba(81, 71, 69, 0.86)"
                  }}>{prebiotics?.doseLabel}</div>
                </div>
                <svg style={{
                  width: "100%",
                  height: "auto",
                  display: "block"
                }} data-m="dosesvg" fontFamily="F37 Zagma,sans-serif" viewBox="0 0 520 190" aria-hidden="true">
                  <rect x="102" y="74" width="398" height="46" rx="10" fill="rgba(179,231,243,.5)" />
                  <text x="90" y="56" textAnchor="end" fontSize="10.5" fill="rgba(81,71,69,.86)">{"too much"}</text>
                  <text x="90" y="70" textAnchor="end" fontSize="9.5" fill="rgba(81,71,69,.8)">{"bloating and gas"}</text>
                  <text x="90" y="101" textAnchor="end" fontSize="11" fontWeight="400" fill="#514745">{"right for you"}</text>
                  <text x="90" y="139" textAnchor="end" fontSize="10.5" fill="rgba(81,71,69,.86)">{"too little"}</text>
                  <text x="90" y="153" textAnchor="end" fontSize="9.5" fill="rgba(81,71,69,.8)">{"no impact at all"}</text>
                  <line x1="102" y1="160" x2="500" y2="160" stroke="rgba(81,71,69,.2)" strokeWidth="1" />
                  <rect x="125" y="112" width="30" height="48" rx="9" fill="#514745" />
                  <rect x="190" y="86" width="30" height="74" rx="9" fill="#6B5F5C" />
                  <rect x="255" y="104" width="30" height="56" rx="9" fill="#8FD4E4" />
                  <rect x="320" y="94" width="30" height="66" rx="9" fill="#514745" />
                  <g stroke="#F0F5FF" strokeWidth="1.4" opacity="0.45" strokeLinecap="round">
                    <line x1="140" y1="119" x2="140" y2="154" />
                    <line x1="205" y1="93" x2="205" y2="154" />
                    <line x1="270" y1="111" x2="270" y2="154" />
                    <line x1="335" y1="101" x2="335" y2="154" />
                  </g>
                  <rect x="385" y="150" width="30" height="10" rx="5" fill="rgba(81,71,69,.22)" />
                  <rect x="450" y="152" width="30" height="8" rx="4" fill="rgba(81,71,69,.22)" />
                </svg>
                <div style={{
                  display: "none",
                  marginTop: "16px"
                }} data-m="dosealt">
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px"
                  }} data-m="doselegend">
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontSize: "10.5px",
                      color: "rgba(81, 71, 69, 0.7)"
                    }}>{prebiotics?.doseTooLittle}</span>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontSize: "10.5px",
                      color: "var(--nb1-dark-brown)",
                      textAlign: "center"
                    }}>{prebiotics?.doseRight}</span>
                    <span style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontSize: "10.5px",
                      color: "rgba(81, 71, 69, 0.7)",
                      textAlign: "right"
                    }}>{prebiotics?.doseTooMuch}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    marginTop: "18px"
                  }}>
                    {(doseFibres || []).map((df, dfIdx) => (
                      <div key={dfIdx}>
                        <div style={{
                          fontFamily: "var(--nb1-font-secondary)",
                          fontSize: "15px"
                        }}>
                          {df.name}
                        </div>
                        <div style={{
                          position: "relative",
                          height: "8px",
                          borderRadius: "999px",
                          background: "rgba(81, 71, 69, 0.14)",
                          marginTop: "9px"
                        }}>
                          <span style={{
                            position: "absolute",
                            inset: "0px 28%",
                            borderRadius: "999px",
                            background: "rgba(179, 231, 243, 0.85)"
                          }} />
                          <span style={{ ...{
                            position: "absolute",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "17px",
                            height: "17px",
                            borderRadius: "50%",
                            background: "var(--nb1-dark-brown)",
                            boxShadow: "0 0 0 3px var(--nb1-cool-grey)"
                          }, left: `${df.at ?? 50}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "13.5px",
                  lineHeight: "1.55",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "22px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--nb1-hairline)",
                  maxWidth: "62ch"
                }}>
                  <b style={{
                    fontWeight: "500",
                    color: "var(--nb1-dark-brown)"
                  }}>{prebiotics?.noteLead}</b>
                  {prebiotics?.noteRest}
                </p>
              </div>
            </div>
          </div>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}>
              <span style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                flex: "0 0 auto",
                display: "grid",
                placeItems: "center",
                boxShadow: "rgba(81, 71, 69, 0.26) 0px 0px 0px 1.5px inset",
                background: "color-mix(in oklab,var(--nb1-blue-grey) 34%,var(--nb1-cool-grey))",
                fontFamily: "var(--nb1-font-tertiary)",
                fontSize: "12px",
                letterSpacing: "0.04em"
              }}>{steps?.[3]?.number}</span>
              <span style={{
                width: "18px",
                height: "1px",
                background: "rgba(81, 71, 69, 0.3)",
                flex: "0 0 auto"
              }} />
              <span style={{
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "10.5px",
                color: "rgba(81, 71, 69, 0.86)"
              }}>{steps?.[3]?.label}</span>
            </div>
            <div style={{
              paddingLeft: "52px"
            }} data-m="stepbody">
              <h3 style={{
                fontFamily: "var(--nb1-font-primary)",
                fontWeight: "400",
                fontSize: "clamp(24px, 4.2cqi, 34px)",
                lineHeight: "1.08",
                letterSpacing: "-0.02em",
                marginTop: "14px",
                maxWidth: "24ch"
              }}>{layer?.heading}</h3>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15.5px",
                lineHeight: "1.6",
                opacity: "0.8",
                marginTop: "12px",
                maxWidth: "58ch"
              }}>{layer?.intro}</p>
              <div style={{
                background: "var(--nb1-cool-grey)",
                borderRadius: "var(--nb1-radius-md)",
                padding: "26px 24px",
                marginTop: "20px",
                boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.34) 0px 22px 44px -26px"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)"
                }}>{layer?.chosenLabel}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "clamp(21px, 3.6cqi, 27px)",
                  lineHeight: "1.12",
                  marginTop: "10px"
                }}>{layer?.title}</div>
                <p style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.6",
                  opacity: "0.82",
                  marginTop: "12px",
                  maxWidth: "60ch"
                }}>{layer?.body}</p>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0px",
                  marginTop: "20px"
                }} data-d="g2">
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "16px",
                    alignItems: "baseline",
                    padding: "13px 0px",
                    borderTop: "1px solid var(--nb1-hairline)"
                  }}>
                    <span style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "30px",
                      lineHeight: "1"
                    }}>{layer?.stats?.[0]?.number}</span>
                    <span style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "15px"
                    }}>{layer?.stats?.[0]?.label}</span>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "16px",
                    alignItems: "baseline",
                    padding: "13px 0px",
                    borderTop: "1px solid var(--nb1-hairline)"
                  }}>
                    <span style={{
                      fontFamily: "var(--nb1-font-primary)",
                      fontSize: "30px",
                      lineHeight: "1"
                    }}>{layer?.stats?.[1]?.number}</span>
                    <span style={{
                      fontFamily: "var(--nb1-font-secondary)",
                      fontSize: "15px"
                    }}>{layer?.stats?.[1]?.label}</span>
                  </div>
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "24px",
                  paddingTop: "18px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>{layer?.chipsLabel}</div>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "18px"
                }}>
                  {(layer?.chips || []).map((chip, chipIdx) => (
                    <span key={chipIdx} style={{
                      fontFamily: "var(--nb1-font-tertiary)",
                      fontSize: "12.5px",
                      padding: "0.5em 0.8em",
                      borderRadius: "999px",
                      boxShadow: "inset 0 0 0 1px var(--nb1-hairline)",
                      whiteSpace: "nowrap"
                    }}>
                      {chip.label}
                    </span>
                  ))}
                </div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "10.5px",
                  color: "rgba(81, 71, 69, 0.86)",
                  marginTop: "26px",
                  paddingTop: "20px",
                  borderTop: "1px solid var(--nb1-hairline)"
                }}>{layer?.driversLabel}</div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0px",
                  marginTop: "14px"
                }} data-d="g3">
                  {(layer?.drivers || []).map((dr, drIdx) => (
                    <div key={drIdx} style={{
                      padding: "14px 0px",
                      borderTop: "1px solid rgba(81, 71, 69, 0.1)"
                    }}>
                      <div style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "15.5px"
                      }}>
                        {dr.title}
                      </div>
                      <p style={{
                        fontFamily: "var(--nb1-font-secondary)",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        opacity: "0.82",
                        marginTop: "6px",
                        maxWidth: "34ch"
                      }}>
                        {dr.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: "14px",
                flexWrap: "wrap",
                marginTop: "22px"
              }}>
                <span style={{
                  fontSize: "10.5px",
                  padding: "0.5em 0.8em",
                  boxShadow: "rgba(255, 139, 62, 0.5) 0px 0px 0px 1px inset",
                  color: "rgb(138, 84, 22)",
                  whiteSpace: "nowrap"
                }} className="nb1-tag">{advanced?.tag}</span>
                <span style={{
                  fontFamily: "var(--nb1-font-secondary)",
                  fontSize: "15px",
                  lineHeight: "1.55",
                  flex: "1 1 0%",
                  minWidth: "14ch"
                }}>
                  {advanced?.text}
                  <a style={{
                    borderBottom: "1.5px solid var(--nb1-orange)",
                    paddingBottom: "1px",
                    whiteSpace: "nowrap"
                  }} href={advanced?.link?.url || '#'}>{advanced?.link?.label}</a>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "15px",
          lineHeight: "1.55",
          marginTop: "24px",
          opacity: "0.82"
        }}>
          {closingLead}
          <b style={{
            fontWeight: "500",
            opacity: "1"
          }}>{closingEmphasis}</b>
        </p>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbFormulaComponent = RdLbFormula

export default RdLbFormula
