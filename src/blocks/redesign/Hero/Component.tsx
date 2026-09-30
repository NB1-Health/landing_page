'use client'

import React, { useEffect, useState } from 'react'
import RichText from '@/components/RichText'
import RdTrustRating from '@/components/Trustpilot/RdTrustRating'
import type { RdHeroBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-01.json + bindings/RdHero.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout, breakpoints and the brand component classes come from rd-tokens.css
// and rd-toolkit.css, which are the mockup's own stylesheets — see port_css.py.
//
// Client component: every block in this repo is, because RenderBlocks.client.tsx
// carries 'use client' and imports them directly. `useState` here is for the
// trust strip only.
//
// The Trustpilot rating is the REAL TrustBox — not the mockup's hand-drawn
// stand-in — composed by <RdTrustRating> with the "★ Trustpilot" wordmark the
// mockup draws beside it. The TrustBox is an iframe, so its own type and stars
// cannot be restyled from here; see that component for why the wordmark is ours
// and why the widget is clipped to the stars.

const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

type ComponentProps = Props & { locale?: string | null }

export const RdHero: React.FC<ComponentProps> = (props) => {
  const {
    anchorId, heading, intro, heroImage, primaryCta, secondaryCta,
    showTrustpilotRating, trustCycleMs, locale,
  } = props
  const bubbles = props.bubbles ?? []
  const claims = props.claims ?? []

  // The trust strip is a row of three at desktop and ONE AT A TIME below 760px,
  // where rd-tokens.css hides every `[data-m="tslide"]` that is not `data-on="1"`.
  // So the cycling only has a visible effect on narrow screens — but the timer is
  // cheap and running it unconditionally keeps the markup identical at every
  // width, which is what lets the fidelity check compare them.
  const slideCount = 1 + claims.length
  const [activeSlide, setActiveSlide] = useState(0)
  useEffect(() => {
    const ms = trustCycleMs ?? 0
    if (!ms || slideCount < 2) return
    const id = window.setInterval(() => setActiveSlide((i) => (i + 1) % slideCount), ms)
    return () => window.clearInterval(id)
  }, [trustCycleMs, slideCount])

  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-block rd-hero" id={anchorId || undefined}>
      <div style={{
        position: "relative",
        minHeight: "max(704px, 78svh)",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden"
      }} data-m="herostage">
        <div style={{
          position: "absolute",
          inset: "0px",
          background: "rgb(47, 40, 39)"
        }}>
          <img style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 0%",
            display: "block"
          }} src={mediaUrl(heroImage)} alt={mediaAlt(heroImage)} />
        </div>
        <div style={{
          position: "absolute",
          inset: "0px",
          background: "linear-gradient(0deg, rgba(28, 23, 22, 0.82) 0%, rgba(28, 23, 22, 0.22) 46%, rgba(28, 23, 22, 0.06) 72%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute",
          top: "17%",
          left: "63%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }} data-m="bub">
          <div style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "rgb(95, 234, 255)",
            display: "grid",
            placeItems: "center",
            margin: "0px auto",
            boxShadow: "rgba(20, 16, 15, 0.55) 0px 10px 30px -14px"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--nb1-warm-grey)",
              filter: "blur(1.5px)"
            }} />
          </div>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "11px",
            color: "rgb(255, 255, 255)",
            marginTop: "10px",
            WebkitTextStroke: "0.35px rgb(255, 255, 255)",
            textShadow: "rgba(20, 16, 15, 0.55) 0px 1px 3px, rgba(20, 16, 15, 0.4) 0px 0px 1px"
          }}>{bubbles?.[0]?.label}</div>
        </div>
        <div style={{
          position: "absolute",
          top: "24%",
          left: "13%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }} data-m="bub bubsm">
          <div style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "rgb(217, 255, 101)",
            display: "grid",
            placeItems: "center",
            margin: "0px auto",
            boxShadow: "rgba(20, 16, 15, 0.55) 0px 10px 30px -14px"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--nb1-cool-grey)"
            }} />
          </div>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "11px",
            color: "rgb(255, 255, 255)",
            marginTop: "10px",
            WebkitTextStroke: "0.35px rgb(255, 255, 255)",
            textShadow: "rgba(20, 16, 15, 0.55) 0px 1px 3px, rgba(20, 16, 15, 0.4) 0px 0px 1px"
          }}>{bubbles?.[1]?.label}</div>
        </div>
        <div style={{
          position: "absolute",
          top: "47%",
          left: "28%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }} data-m="bub">
          <div style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "rgb(255, 156, 224)",
            display: "grid",
            placeItems: "center",
            margin: "0px auto",
            boxShadow: "rgba(20, 16, 15, 0.55) 0px 10px 30px -14px"
          }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgb(255, 156, 224)"
            }} />
          </div>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "11px",
            color: "rgb(255, 255, 255)",
            marginTop: "10px",
            WebkitTextStroke: "0.35px rgb(255, 255, 255)",
            textShadow: "rgba(20, 16, 15, 0.55) 0px 1px 3px, rgba(20, 16, 15, 0.4) 0px 0px 1px"
          }}>{bubbles?.[2]?.label}</div>
        </div>
        <div style={{
          position: "absolute",
          top: "34%",
          left: "82%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }} data-m="bub bubsm">
          <div style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "rgba(74, 64, 60, 0.9)",
            border: "4px solid rgb(217, 255, 101)",
            display: "grid",
            placeItems: "center",
            margin: "0px auto",
            boxShadow: "rgba(20, 16, 15, 0.55) 0px 10px 30px -14px"
          }} />
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "11px",
            color: "rgb(255, 255, 255)",
            marginTop: "10px",
            WebkitTextStroke: "0.35px rgb(255, 255, 255)",
            textShadow: "rgba(20, 16, 15, 0.55) 0px 1px 3px, rgba(20, 16, 15, 0.4) 0px 0px 1px"
          }}>{bubbles?.[3]?.label}</div>
        </div>
        <div style={{
          position: "absolute",
          top: "52%",
          left: "78%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none"
        }} data-m="bub">
          <div style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "rgb(179, 231, 243)",
            display: "grid",
            placeItems: "center",
            margin: "0px auto",
            boxShadow: "rgba(20, 16, 15, 0.55) 0px 10px 30px -14px"
          }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgb(179, 231, 243)"
            }} />
          </div>
          <div style={{
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: "11px",
            color: "rgb(255, 255, 255)",
            marginTop: "10px",
            WebkitTextStroke: "0.35px rgb(255, 255, 255)",
            textShadow: "rgba(20, 16, 15, 0.55) 0px 1px 3px, rgba(20, 16, 15, 0.4) 0px 0px 1px"
          }}>{bubbles?.[4]?.label}</div>
        </div>
        <div style={{
          position: "relative",
          width: "100%",
          padding: "0px 20px 34px"
        }} data-m="herocopy">
          <h1 style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(38px, 7.4cqi, 82px)",
            lineHeight: "0.96",
            letterSpacing: "-0.025em",
            color: "var(--nb1-white,#fff)",
            maxWidth: "18ch"
          }}>{heading}</h1>
          <p style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "clamp(16px, 4.2cqi, 19px)",
            lineHeight: "1.45",
            color: "var(--nb1-white,#fff)",
            opacity: "0.92",
            marginTop: "18px",
            maxWidth: "42ch"
          }}>{intro}</p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "24px",
            marginTop: "28px",
            justifyContent: "flex-start"
          }}>
            <a style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4em",
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "14px",
              color: "var(--nb1-dark-brown)",
              whiteSpace: "nowrap",
              flexShrink: "0"
            }} href={primaryCta?.url || '#'}>
              <span style={{
                background: "var(--nb1-cool-grey)",
                borderRadius: "10px",
                padding: "1.05em 1.5em"
              }}>{primaryCta?.label}</span>
              <span style={{
                width: "3.1em",
                height: "3.1em",
                borderRadius: "50%",
                background: "var(--nb1-cool-grey)",
                display: "grid",
                placeItems: "center",
                fontSize: "1em",
                lineHeight: "1",
                flex: "0 0 auto"
              }} aria-hidden="true">{"\u2192"}</span>
            </a>
            <a style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "12px",
              color: "var(--nb1-white,#fff)",
              opacity: "0.85",
              whiteSpace: "nowrap"
            }} href={secondaryCta?.url || '#'}>{secondaryCta?.label}</a>
          </div>
        </div>
      </div>
      <div style={{
        background: "var(--nb1-cool-grey)",
        borderBottom: "1px solid rgba(81, 71, 69, 0.12)"
      }} data-m="trust">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "22px",
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "16px 20px",
          maxWidth: "1240px",
          margin: "0px auto"
        }} data-m="rail">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: "0 0 auto"
          }} className="rd-hero__tp" data-m="tslide" data-ti="0" data-on={activeSlide === 0 ? '1' : '0'}>
            {(showTrustpilotRating) ? <RdTrustRating locale={locale} /> : null}
          </div>
          <span style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(81, 71, 69, 0.32)",
            flex: "0 0 auto"
          }} data-m="tdot" aria-hidden="true" />
          <div style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "14.5px",
            color: "var(--nb1-dark-brown)",
            opacity: "0.82",
            whiteSpace: "nowrap",
            flex: "0 0 auto"
          }} data-m="tslide" data-ti="1" data-on={activeSlide === 1 ? '1' : '0'}>
            {(claims?.[0]?.body)?.root ? (
              <RichText data={claims?.[0]?.body} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
          <span style={{
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            background: "rgba(81, 71, 69, 0.32)",
            flex: "0 0 auto"
          }} data-m="tdot" aria-hidden="true" />
          <div style={{
            fontFamily: "var(--nb1-font-secondary)",
            fontSize: "14.5px",
            color: "var(--nb1-dark-brown)",
            opacity: "0.82",
            whiteSpace: "nowrap",
            flex: "0 0 auto"
          }} data-m="tslide" data-ti="2" data-on={activeSlide === 2 ? '1' : '0'}>
            {(claims?.[1]?.body)?.root ? (
              <RichText data={claims?.[1]?.body} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export const RdHeroComponent = RdHero

export default RdHero
