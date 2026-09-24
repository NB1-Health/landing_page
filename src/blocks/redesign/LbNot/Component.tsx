'use client'

import React from 'react'
import RichText from '@/components/RichText'
import type { RdLbNotBlock as Props } from '@/payload-types'

// GENERATED from manifests/section-02.json + bindings/RdLbNot.json by
// tools/block_component.py — do not hand-edit; regenerate.
//
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-lb.css — this page's stylesheet,
// ported by port_css.py and rescoped from `.rd-block` to `.rd-lb` so it
// cannot reach any other page's blocks. That scope is why this root carries
// `rd-lb rd-lbnot` and NOT `rd-block`.
//
// Three ruled rows saying what the product is not, plus a fourth row saying what it is — drawn differently on purpose, so it is a group and not a fourth array item.


export const RdLbNot: React.FC<Props> = ({ anchorId, conclusion, heading, intro, notRows }) => {
  return (
    <section style={{
      background: "var(--nb1-cool-grey)"
    }} className="rd-lb rd-lbnot" id={anchorId || undefined}>
      <div style={{
        maxWidth: "1240px",
        margin: "0px auto",
        padding: "64px 20px 56px"
      }} data-d="pad">
        <div style={{
          maxWidth: "24ch"
        }} className="h2" data-d="bigh">
          {(heading)?.root ? (
            <RichText data={heading} enableGutter={false} enableProse={false} />
          ) : null}
        </div>
        <p style={{
          marginTop: "16px",
          maxWidth: "56ch"
        }} className="lede">{intro}</p>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0px",
          marginTop: "30px",
          maxWidth: "76ch"
        }}>
          {(notRows || []).map((row, rowIdx) => (
            <div key={rowIdx} style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "6px",
              padding: "22px 0px",
              borderTop: "1px solid rgba(81, 71, 69, 0.22)"
            }} data-d="notrow">
              <div style={{
                fontFamily: "var(--nb1-font-primary)",
                fontSize: "clamp(21px, 3.6cqi, 27px)",
                lineHeight: "1.1"
              }}>
                {row.title}
              </div>
              <p style={{
                fontFamily: "var(--nb1-font-secondary)",
                fontSize: "15px",
                lineHeight: "1.55",
                opacity: "0.82"
              }}>
                {row.body}
              </p>
            </div>
          ))}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "6px",
            padding: "26px 0px 0px",
            borderTop: "1.5px solid var(--nb1-dark-brown)"
          }} data-d="notrow">
            <div style={{
              fontFamily: "var(--nb1-font-primary)",
              fontSize: "clamp(21px, 3.6cqi, 27px)",
              lineHeight: "1.1"
            }}>{conclusion?.title}</div>
            <p style={{
              fontFamily: "var(--nb1-font-secondary)",
              fontSize: "15px",
              lineHeight: "1.55"
            }}>{conclusion?.body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// RenderBlocks.client.tsx imports every block as `<Name>Component`; the alias
// keeps that one import name stable whatever the component itself is called.
export const RdLbNotComponent = RdLbNot

export default RdLbNot
