'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPrHeroBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-01.json + bindings/RdPrHero.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The Protocol's opening section. Two CTAs built differently on purpose — the primary's arrow is its own span, the secondary's is inside the label. The avatars overlap by an index rule, so the stack survives a change of count.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPrHero: React.FC<Props> = ({ anchorId, heading, image, intro, primaryCta, secondaryCta, trustAvatars, trustText }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-pr rd-prhero" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "104px 20px 56px"
      }} data-d="pad">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "38px",
          alignItems: "start"
        }} data-d="side">
          <div>
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontWeight: "400",
              fontSize: "clamp(36px, 6cqi, 64px)",
              lineHeight: "1",
              letterSpacing: "-0.03em",
              maxWidth: "15ch"
            }} data-d="bigh">
              {(heading)?.root ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "clamp(16px, 4.2cqi, 18.5px)",
              lineHeight: "1.55",
              color: "rgba(81, 71, 69, 0.86)",
              marginTop: "20px",
              maxWidth: "46ch"
            }}>{intro}</p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "22px",
              marginTop: "30px"
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
                whiteSpace: "nowrap"
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
                color: "rgba(81, 71, 69, 0.86)",
                whiteSpace: "nowrap"
              }} href={secondaryCta?.url || '#'}>{secondaryCta?.label}</a>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(81, 71, 69, 0.22)",
              maxWidth: "44ch"
            }}>
              <div style={{
                display: "flex",
                flex: "0 0 auto"
              }}>
                {(trustAvatars || []).map((av, avIdx) => (
                  <img key={avIdx} style={{ ...{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    objectPosition: "50% 50%",
                    boxShadow: "0 0 0 2px var(--nb1-cool-grey)"
                  }, marginLeft: avIdx === 0 ? undefined : '-6px' }} src={mediaUrl(av.photo)} alt={mediaAlt(av.photo) || ''} />
                ))}
              </div>
              <div style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "rgba(81, 71, 69, 0.86)"
              }}>
                {(trustText)?.root ? (
                  <RichText data={trustText} enableGutter={false} enableProse={false} />
                ) : null}
              </div>
            </div>
          </div>
          <img style={{
            width: "100%",
            height: "auto",
            maxHeight: "540px",
            objectFit: "cover",
            objectPosition: "center 20%",
            display: "block",
            borderRadius: "20px",
            boxShadow: "rgba(81, 71, 69, 0.06) 0px 1px 2px, rgba(81, 71, 69, 0.45) 0px 34px 64px -34px"
          }} src={mediaUrl(image)} alt={mediaAlt(image) || ''} />
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPrHeroComponent = RdPrHero

export default RdPrHero
