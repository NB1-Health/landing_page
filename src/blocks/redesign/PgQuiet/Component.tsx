'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdPgQuietBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-11.json + bindings/RdPgQuiet.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-pg.css — the Our Plans stylesheet, ported
// by port_css.py and scoped to `.rd-pg` so it cannot reach the homepage's
// blocks. That scope is why every root here carries `rd-block rd-pg rd-<name>`.
//
// The quiet band: a hairline rule and one sentence, on the same dark ground as the athletes section above it.


export const RdPgQuiet: React.FC<Props> = ({ anchorId, statement }) => {
  return (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-pg rd-pgquiet" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "0px 48px 104px"
      }} data-m="brk">
        <div style={{
          borderTop: "1px solid rgba(240, 245, 255, 0.18)",
          paddingTop: "56px"
        }}>
          <div style={{
            fontFamily: "var(--nb1-font-primary)",
            fontWeight: "400",
            fontSize: "clamp(30px, 3.6vw, 46px)",
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            maxWidth: "34ch"
          }}>
            {(statement)?.root ? (
              <RichText data={statement} enableGutter={false} enableProse={false} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdPgQuietComponent = RdPgQuiet

export default RdPgQuiet
