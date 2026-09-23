'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPgHeroBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-01.json + bindings/RdPgHero.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// No state and no effects: the hero has no interactions. It stays a client component only because RenderBlocks.client.tsx imports every block into one client bundle.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPgHero: React.FC<Props> = ({ anchorId, heading, image, imageBadge, intro, primaryCta, scoreLabel, scoreRating, scoreValue, secondaryCta, trustAvatars, trustDetail, trustHeadline }) => {
  return (
    <header style={{
      maxWidth: "1240px",
      margin: "0px auto",
      padding: "22px 48px 80px"
    }} className="rd-pg rd-pghero" id={anchorId || undefined}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "12px"
      }}>
        <div style={{
          display: "flex",
          gap: "16px"
        }}>
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
        </div>
        <div style={{
          display: "flex",
          gap: "16px"
        }}>
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
          <span style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "var(--nb1-warm-grey)"
          }} />
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0px, 1.02fr) minmax(0px, 0.98fr)",
        alignItems: "center",
        gap: "40px"
      }} data-m="herogrid">
        <div>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(52px, 6vw, 84px)",
            lineHeight: "0.92",
            letterSpacing: "-0.02em"
          }}>
            {(heading)?.root ? (
              <RichText data={heading} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "20px",
            lineHeight: "1.42",
            letterSpacing: "-0.01em",
            opacity: "0.8",
            maxWidth: "42ch",
            marginTop: "26px"
          }}>{intro}</p>
          <div style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px 22px",
            marginTop: "36px"
          }}>
            <a style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "1.1em",
              fontFamily: "var(--nb1-font-tertiary)",
              fontWeight: "300",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "15px",
              background: "var(--cta)",
              color: "var(--nb1-black)",
              padding: "1.05em 1.5em",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              flexShrink: "0"
            }} href={primaryCta?.url || '#'}>
              <span>{primaryCta?.label}</span>
              <span style={{
                fontSize: "1.05em",
                lineHeight: "1"
              }}>{"\u2197"}</span>
            </a>
            <a style={{
              fontFamily: "var(--nb1-font-tertiary)",
              fontWeight: "300",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "13px",
              opacity: "0.78",
              whiteSpace: "nowrap"
            }} href={secondaryCta?.url || '#'}>{secondaryCta?.label}</a>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginTop: "34px",
            paddingTop: "28px",
            borderTop: "1px solid rgba(81, 71, 69, 0.16)",
            maxWidth: "52ch"
          }} data-trust="1">
            <div style={{
              display: "flex",
              flexShrink: "0"
            }}>
              {(trustAvatars || []).map((av, avIdx) => (
                <div key={avIdx} style={{ ...{
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid var(--nb1-cool-grey)",
                  background: "var(--nb1-blue-grey)"
                }, width: '44px', height: '44px', marginLeft: avIdx === 0 ? undefined : '-12px' }}>
                  <img style={{ ...{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }, objectPosition: '50% 50%' }} src={mediaUrl(av.photo)} alt={mediaAlt(av.photo)} />
                </div>
              ))}
            </div>
            <div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontWeight: "500",
                fontSize: "16px",
                lineHeight: "1.3"
              }}>{trustHeadline}</div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15px",
                lineHeight: "1.35",
                opacity: "0.62",
                marginTop: "3px"
              }}>{trustDetail}</div>
            </div>
          </div>
        </div>
        <div style={{
          position: "relative",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: "54px"
        }} data-heroart="1">
          <div style={{
            position: "relative",
            zIndex: "1",
            width: "100%",
            maxWidth: "480px"
          }}>
            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: "480px",
              aspectRatio: "480 / 564",
              borderRadius: "26px",
              overflow: "hidden",
              background: "var(--nb1-blue-grey)",
              boxShadow: "rgba(81, 71, 69, 0.5) 0px 44px 100px -50px"
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
                top: "22px",
                left: "22px",
                zIndex: "3",
                pointerEvents: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "11px",
                color: "var(--nb1-dark-brown)",
                background: "var(--nb1-cool-grey)",
                padding: "0.6em 1em",
                borderRadius: "999px"
              }}>{imageBadge}</div>
            </div>
            <div style={{
              position: "absolute",
              zIndex: "4",
              left: "-46px",
              bottom: "40px",
              width: "158px",
              height: "158px",
              borderRadius: "50%",
              background: "var(--nb1-cool-grey)",
              border: "17px solid var(--nb1-blue)",
              display: "grid",
              placeItems: "center",
              boxShadow: "rgba(81, 71, 69, 0.5) 0px 24px 54px -26px",
              pointerEvents: "none"
            }} data-scorebadge="1">
              <div style={{
                textAlign: "center"
              }}>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "8.5px",
                  opacity: "0.55"
                }}>{scoreLabel}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-primary)",
                  fontSize: "40px",
                  lineHeight: "1"
                }}>{scoreValue}</div>
                <div style={{
                  fontFamily: "var(--nb1-font-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "8.5px",
                  opacity: "0.55"
                }}>{scoreRating}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgHeroComponent = RdPgHero

export default RdPgHero
