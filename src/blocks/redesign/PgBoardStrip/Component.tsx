'use client'

import React from 'react'
import type { RdPgBoardStripBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-07.json + bindings/RdPgBoardStrip.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The science board band: three overlapping portraits, a sentence, and an inline link, between rules top and bottom.


const mediaUrl = (m: unknown): string | undefined =>
  m && typeof m === 'object' && 'url' in m ? ((m as { url?: string }).url ?? undefined) : undefined

const mediaAlt = (m: unknown): string =>
  m && typeof m === 'object' && 'alt' in m ? ((m as { alt?: string }).alt ?? '') : ''

export const RdPgBoardStrip: React.FC<Props> = ({ anchorId, avatars, cta, note }) => {
  return (
    <div style={{
      maxWidth: "1240px",
      margin: "0px auto",
      padding: "0px 48px 96px"
    }} className="rd-pg rd-pgboardstrip" id={anchorId || undefined}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "26px 0px",
        borderTop: "1px solid rgba(81, 71, 69, 0.16)",
        borderBottom: "1px solid rgba(81, 71, 69, 0.16)"
      }} data-trust="1">
        <div style={{
          display: "flex",
          flexShrink: "0"
        }}>
          {(avatars || []).map((av, avIdx) => (
            <div key={avIdx} style={{ ...{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid var(--nb1-cool-grey)",
              background: "var(--nb1-blue-grey)"
            }, marginLeft: avIdx === 0 ? undefined : '-14px' }}>
              <img style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "50% 0%"
              }} src={mediaUrl(av.photo)} alt={mediaAlt(av.photo)} />
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "16px",
          opacity: "0.72"
        }}>
          {note}
          <a style={{
            opacity: "1",
            color: "var(--nb1-dark-brown)",
            borderBottom: "1.5px solid var(--nb1-blue)",
            paddingBottom: "1px"
          }} href={cta?.url || '#'}>{cta?.label}</a>
        </div>
      </div>
    </div>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgBoardStripComponent = RdPgBoardStrip

export default RdPgBoardStrip
