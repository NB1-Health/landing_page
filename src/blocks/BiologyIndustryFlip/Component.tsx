'use client'

import React, { useEffect, useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useBiologyReveal } from '@/hooks/useBiologyReveal'

type Stat = {
  number?: string | null
  unit?: string | null
  tag?: string | null
  frontText?: string | null
  backText?: string | null
  readMoreLabel?: string | null
  backLabel?: string | null
}

export type BiologyIndustryFlipBlockType = {
  blockType?: 'biologyIndustryFlip'
  heading?: DefaultTypedEditorState | null
  lede?: string | null
  stats?: Stat[] | null
  closingText?: DefaultTypedEditorState | null
}

export const BiologyIndustryFlipComponent: React.FC<BiologyIndustryFlipBlockType> = ({
  heading,
  lede,
  stats,
  closingText,
}) => {
  const rows = stats ?? []
  const sectionRef = useRef<HTMLElement | null>(null)
  useBiologyReveal(sectionRef, '.bif-lead, .bif-lede, .bif-case-stats, .bif-pivot')

  // Ported verbatim from the mockup's "flip-card indictment widget" script:
  // click, or Enter/Space when focused, toggles the flipped state.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const cards = Array.from(section.querySelectorAll<HTMLElement>('.bif-cstat'))
    function toggle(card: HTMLElement) {
      const flipped = card.classList.toggle('flipped')
      card.setAttribute('aria-expanded', flipped ? 'true' : 'false')
    }
    const clickHandlers: Array<() => void> = []
    const keyHandlers: Array<(e: KeyboardEvent) => void> = []
    cards.forEach((card, i) => {
      const onClick = () => toggle(card)
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle(card)
        }
      }
      clickHandlers[i] = onClick
      keyHandlers[i] = onKey
      card.addEventListener('click', onClick)
      card.addEventListener('keydown', onKey)
    })
    return () => {
      cards.forEach((card, i) => {
        card.removeEventListener('click', clickHandlers[i])
        card.removeEventListener('keydown', keyHandlers[i])
      })
    }
  }, [rows.length])

  return (
    <section className="bif" ref={sectionRef as React.RefObject<HTMLElement>}>
      <style jsx>{`
        .bif {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          background: linear-gradient(180deg, #f0ebe0 0%, #eee8db 62%, #ece5d6 100%);
          padding-block: clamp(72px, 10vw, 124px);
        }
        .bif::before {
          content: '';
          position: absolute;
          inset: -20%;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(34% 42% at 10% 8%, rgba(20, 150, 184, 0.13), transparent 60%),
            radial-gradient(40% 48% at 90% 6%, rgba(150, 175, 195, 0.15), transparent 62%),
            radial-gradient(46% 54% at 74% 92%, rgba(20, 150, 184, 0.11), transparent 60%),
            radial-gradient(42% 50% at 22% 90%, rgba(150, 170, 200, 0.13), transparent 62%),
            radial-gradient(30% 36% at 50% 78%, rgba(200, 225, 232, 0.16), transparent 66%);
          filter: blur(90px) saturate(1.05);
          transform: translateZ(0);
        }
        .bif-wrap {
          position: relative;
          z-index: 2;
          max-width: 1160px;
          margin-inline: auto;
          padding-inline: clamp(20px, 5vw, 72px);
        }
        .bif-lead {
          max-width: 20ch;
          margin-inline: auto;
          text-align: center;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(2rem, 4.4vw, 3.2rem);
          letter-spacing: -0.035em;
          line-height: 1.05;
          color: #12314d;
        }
        .bif-lead :global(h2) {
          margin: 0;
          font: inherit;
          color: inherit;
          max-width: none;
        }
        .bif-lead :global(em) {
          font-style: normal;
          color: #0a8fb0;
        }
        .bif-lede {
          max-width: 820px;
          margin: 20px auto 0;
          text-align: center;
          color: rgba(18, 49, 77, 0.7);
        }
        .bif-case-stats {
          margin-top: 60px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        /* Height follows the taller of the two faces rather than being fixed:
           both faces share one grid cell (see .bif-cstat-face), so the longest
           copy sets the card height instead of overflowing it. The old fixed
           value survives as a floor so short cards keep the designed look. */
        .bif-cstat {
          position: relative;
          display: grid;
          min-height: 290px;
          border: 0;
          background: none;
          padding: 0;
          perspective: 1400px;
          cursor: pointer;
          text-align: left;
          font: inherit;
          -webkit-tap-highlight-color: transparent;
        }
        .bif-cstat:focus-visible {
          outline: 2px solid #0a8fb0;
          outline-offset: 3px;
          border-radius: 16px;
        }
        .bif-cstat-inner {
          /* relative, not static: .bif-cstat-shell is positioned and comes first
             in the DOM, so an unpositioned inner would paint underneath it. */
          position: relative;
          display: grid;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .bif-cstat.flipped .bif-cstat-inner {
          transform: rotateY(180deg);
        }
        /* The card's "glass" chrome lives on its own flat, non-rotated layer.
           Firefox fails to honor backface-visibility:hidden on an element that
           also carries backdrop-filter, which let the back face's mirrored text
           bleed through the front face (and vice versa) once flipped. Keeping
           backdrop-filter off the rotated faces entirely avoids that bug. */
        .bif-cstat-shell {
          position: absolute;
          inset: 0;
          border-radius: 16px;
          transition: box-shadow 0.25s ease;
          background: linear-gradient(157deg, rgba(255, 255, 255, 0.72) 0%, rgba(234, 245, 249, 0.5) 100%);
          border: 1px solid rgba(150, 185, 205, 0.32);
          -webkit-backdrop-filter: blur(18px) saturate(1.4);
          backdrop-filter: blur(18px) saturate(1.4);
          box-shadow:
            0 28px 56px -30px rgba(18, 49, 77, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          pointer-events: none;
        }
        .bif-cstat-shell::before {
          content: '';
          position: absolute;
          left: 26px;
          top: 0;
          width: 26px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: #0a8fb0;
        }
        .bif-cstat:hover .bif-cstat-shell {
          box-shadow:
            0 36px 68px -32px rgba(18, 49, 77, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.36);
        }
        .bif-cstat-face {
          grid-area: 1 / 1;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          padding: 28px 26px;
        }
        /* Firefox can fail to compute backface-visibility correctly for a face
           with no 3D transform of its own — give the front an explicit identity
           rotation so both faces go through the same 3D code path. */
        .bif-cstat-front {
          transform: rotateY(0deg);
        }
        .bif-cstat-back {
          transform: rotateY(180deg);
        }
        .bif-n {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(34px, 4vw, 46px);
          line-height: 1;
          letter-spacing: -0.03em;
          color: #12314d;
        }
        .bif-unit {
          margin-top: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
        }
        .bif-cstat-front .bif-tag {
          margin-top: 18px;
        }
        .bif-tag {
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0a8fb0;
        }
        .bif-exp {
          margin-top: 9px;
          font-size: 15px;
          line-height: 1.5;
          color: rgba(18, 49, 77, 0.7);
          max-width: 30ch;
        }
        .bif-back-body {
          margin-top: 12px;
          font-size: 14px;
          line-height: 1.56;
          color: rgba(18, 49, 77, 0.7);
        }
        .bif-cstat-more {
          /* auto pins the label to the bottom of the face; the padding is a
             floor, so when the copy fills the card and the auto margin collapses
             to zero the label still cannot touch the text. */
          margin-top: auto;
          padding-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          transition: color 0.25s ease;
        }
        .bif-cstat-more i {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(18, 49, 77, 0.1);
          font-style: normal;
          font-size: 13px;
          line-height: 1;
          color: #0a8fb0;
        }
        .bif-cstat:hover .bif-cstat-more {
          color: #0a8fb0;
        }
        .bif-pivot {
          text-align: center;
          max-width: 700px;
          margin: 48px auto 0;
          font-size: clamp(15px, 1.6vw, 16.5px);
          line-height: 1.62;
          color: rgba(18, 49, 77, 0.55);
        }
        .bif-pivot :global(strong) {
          color: #12314d;
          font-weight: 700;
        }
        .bif-pivot :global(em) {
          font-style: normal;
          color: #0a8fb0;
          font-weight: 600;
        }
        @media (max-width: 880px) {
          .bif-case-stats {
            grid-template-columns: 1fr;
            gap: 14px;
            margin-top: 42px;
          }
          .bif-cstat {
            min-height: 224px;
          }
        }
      `}</style>

      <div className="bif-wrap">
        {heading && (
          <div className="bif-lead">
            <RichText data={heading as any} enableGutter={false} enableProse={false} />
          </div>
        )}
        {lede && <p className="bif-lede">{lede}</p>}

        <div className="bif-case-stats">
          {rows.map((s, i) => (
            <div className="bif-cstat" role="button" tabIndex={0} aria-expanded="false" key={i}>
              <div className="bif-cstat-shell" aria-hidden="true" />
              <div className="bif-cstat-inner">
                <div className="bif-cstat-face bif-cstat-front">
                  <div className="bif-n">{s.number}</div>
                  <div className="bif-unit">{s.unit}</div>
                  <div className="bif-tag">{s.tag}</div>
                  <p className="bif-exp">{s.frontText}</p>
                  <span className="bif-cstat-more">
                    {s.readMoreLabel} <i>+</i>
                  </span>
                </div>
                <div className="bif-cstat-face bif-cstat-back">
                  <div className="bif-tag">{s.tag}</div>
                  <p className="bif-back-body">{s.backText}</p>
                  <span className="bif-cstat-more">
                    {s.backLabel} <i>×</i>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {closingText && (
          <div className="bif-pivot">
            <RichText data={closingText as any} enableGutter={false} enableProse={false} />
          </div>
        )}
      </div>
    </section>
  )
}
