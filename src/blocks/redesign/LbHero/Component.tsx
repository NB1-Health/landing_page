'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdLbHeroBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-01.json + bindings/RdLbHero.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbhero` and NOT `rd-block`.
//
// The Lab's opening section: copy over a full-bleed photograph. The two CTAs are built differently on purpose — the primary's arrow is its own span, the secondary's is inside the label. The board note and its link are two fields, not one rich-text sentence.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdLbHero: React.FC<Props> = ({ anchorId, backgroundImage, boardCta, boardNote, eyebrow, heading, intro, primaryCta, secondaryCta }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-lb rd-lbhero" id={anchorId || undefined}>
      <div style={{
        position: "relative",
        minHeight: "clamp(540px, 68svh, 760px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }} data-m="herostage">
        <img style={{
          position: "absolute",
          inset: "0px",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          mixBlendMode: "multiply",
          opacity: "0.92"
        }} src={mediaUrl(backgroundImage)} alt={mediaAlt(backgroundImage) || ''} />
        <div style={{
          position: "absolute",
          inset: "0px",
          background: "linear-gradient(0deg,var(--nb1-cool-grey) 0%,var(--nb1-cool-grey) 46%,rgba(179,231,243,.18) 100%)"
        }} data-m="heroveil" />
        <div style={{
          position: "relative",
          flex: "1 1 0%",
          display: "flex",
          alignItems: "center",
          maxWidth: "1240px",
          width: "100%",
          margin: "0px auto",
          padding: "44px 20px"
        }} data-d="pad">
          <div>
            <div style={{
              fontFamily: "var(--nb1-font-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: "10.5px",
              color: "rgba(81, 71, 69, 0.88)"
            }}>{eyebrow}</div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(36px, 6cqi, 68px)",
              lineHeight: "1",
              letterSpacing: "-0.03em",
              marginTop: "18px",
              maxWidth: "18ch"
            }} data-d="bigh">
              {(heading)?.root ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18.5px)",
              lineHeight: "1.5",
              opacity: "0.82",
              marginTop: "18px",
              maxWidth: "44ch"
            }}>{intro}</p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "22px",
              marginTop: "28px"
            }}>
              <a style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1.1em",
                fontFamily: "var(--nb1-font-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "14px",
                background: "var(--cta)",
                color: "var(--nb1-black)",
                padding: "1.1em 1.6em",
                borderRadius: "var(--nb1-radius-pill)",
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
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "12px",
                opacity: "0.85",
                whiteSpace: "nowrap"
              }} href={secondaryCta?.url || '#'}>{secondaryCta?.label}</a>
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(81, 71, 69, 0.22)",
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "14px",
              opacity: "0.82"
            }}>
              <span>{boardNote}</span>
              <a style={{
                borderBottom: "1.5px solid var(--nb1-dark-brown)",
                paddingBottom: "1px"
              }} href={boardCta?.url || '#'}>{boardCta?.label}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbHeroComponent = RdLbHero

export default RdLbHero
