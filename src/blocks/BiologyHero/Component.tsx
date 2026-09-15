'use client'

import React, { useEffect, useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined
type ProofAvatar = { image?: MediaLike; name?: string | null }

export type BiologyHeroBlockType = {
  blockType?: 'biologyHero'
  heading?: DefaultTypedEditorState | null
  subheading?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  proofText?: DefaultTypedEditorState | null
  proofAvatars?: ProofAvatar[] | null
  cardLabel?: string | null
  genomeValue?: string | null
  genomeLabel?: string | null
  microbiomeValue?: string | null
  microbiomeLabel?: string | null
  ratioTarget?: number | null
  ratioCaption?: string | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

type Particle = { ox: number; oy: number; phase: number; spd: number; size: number }
type MicroParticle = Particle & { spr: HTMLCanvasElement }
type GoldParticle = Particle & { core: boolean }

export const BiologyHeroComponent: React.FC<BiologyHeroBlockType> = ({
  heading,
  subheading,
  ctaLabel,
  ctaUrl,
  proofText,
  proofAvatars,
  cardLabel,
  genomeValue,
  genomeLabel,
  microbiomeValue,
  microbiomeLabel,
  ratioTarget,
  ratioCaption,
}) => {
  const avatars = (proofAvatars ?? []).filter((a) => imgUrl(a?.image))
  const ratio = ratioTarget ?? 165

  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ratioRef = useRef<HTMLSpanElement | null>(null)
  const gtagRef = useRef<HTMLDivElement | null>(null)
  const mtagRef = useRef<HTMLDivElement | null>(null)
  const gholdRef = useRef<HTMLDivElement | null>(null)

  // Ported verbatim from the mockup's "01 scale — zoom out from genome into a
  // dense microbial field" script: a canvas particle field that zooms out from
  // a small gold genome cluster into a dense teal microbiome field, fading in
  // the gene-count labels and counting the ratio stat up as it plays.
  useEffect(() => {
    const cv = canvasRef.current
    const ratioEl = ratioRef.current
    const section = sectionRef.current
    if (!cv || !ratioEl || !section) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const gtag = gtagRef.current
    const mtag = mtagRef.current
    const ghold = gholdRef.current

    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0
    let H = 0
    let DPR = 1
    let t0: number | null = null
    let raf = 0
    const RH = 0.06
    const RM = 1.0
    let gold: GoldParticle[] = []
    let micro: MicroParticle[] = []

    function ease(t: number) {
      return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3)
    }
    function sprite(r: number, g: number, b: number) {
      const s = 52
      const c = document.createElement('canvas')
      c.width = c.height = s
      const x = c.getContext('2d')!
      const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      gr.addColorStop(0, `rgba(${r},${g},${b},.95)`)
      gr.addColorStop(0.3, `rgba(${r},${g},${b},.45)`)
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
      x.fillStyle = gr
      x.fillRect(0, 0, s, s)
      return c
    }
    const teal = [sprite(120, 200, 230), sprite(150, 215, 240), sprite(90, 175, 215), sprite(190, 235, 250)]
    const goldS = sprite(233, 200, 106)
    function disc(rmin: number, rmax: number): [number, number] {
      const a = Math.random() * 6.28
      const rr = Math.sqrt(rmin * rmin + Math.random() * (rmax * rmax - rmin * rmin))
      return [Math.cos(a) * rr, Math.sin(a) * rr]
    }
    function build() {
      gold = []
      for (let i = 0; i < 520; i++) {
        const o = disc(0, RH)
        gold.push({ ox: o[0], oy: o[1], core: i < 28, phase: Math.random() * 6.28, spd: 0.3 + Math.random() * 0.5, size: 2.2 + Math.random() * 2.4 })
      }
      micro = []
      for (let j = 0; j < 1550; j++) {
        let mx = 0
        let my = 0
        do {
          mx = Math.random() * 2 - 1
          my = Math.random() * 2 - 1
        } while (mx * mx + my * my < 0.0169)
        micro.push({ ox: mx, oy: my, phase: Math.random() * 6.28, spd: 0.25 + Math.random() * 0.5, size: 2.6 + Math.random() * 2.8, spr: teal[(Math.random() * teal.length) | 0] })
      }
    }
    function layout() {
      const r = cv!.getBoundingClientRect()
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width || 1000
      H = r.height || 360
      cv!.width = W * DPR
      cv!.height = H * DPR
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    function draw(p: number) {
      const tm = performance.now() / 1000
      ctx!.clearRect(0, 0, W, H)
      const hsX = W * 0.5
      const hsY = H * 0.5
      const zp = ease((p - 0.34) / 0.5)
      const Sx = hsX / RH + (hsX / RM - hsX / RH) * zp
      const Sy = hsY / RH + (hsY / RM - hsY / RH) * zp
      const S = Math.min(Sx, Sy)
      const calm = 1 - zp * 0.55
      ctx!.globalCompositeOperation = 'lighter'
      const mA = Math.min(1, Math.max(0, (zp - 0.02) * 1.7)) * 1.0
      if (mA > 0) {
        for (let i = 0; i < micro.length; i++) {
          const d = micro[i]
          const x = W / 2 + d.ox * Sx
          const y = H / 2 + d.oy * Sy
          if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue
          const ax = Math.abs(d.ox)
          const ay = Math.abs(d.oy)
          const tfx = Math.max(0, Math.min(1, (1 - ax) / 0.17))
          const tfy = Math.max(0, Math.min(1, (1 - ay) / 0.17))
          const fe = tfx * tfx * (3 - 2 * tfx) * (tfy * tfy * (3 - 2 * tfy))
          if (fe <= 0.01) continue
          const dx = Math.sin(tm * d.spd + d.phase) * 1.4 * calm
          const dy = Math.cos(tm * d.spd * 0.8 + d.phase) * 1.4 * calm
          const tw = 0.65 + 0.35 * Math.sin(tm * d.spd * 1.5 + d.phase)
          const s = d.size
          ctx!.globalAlpha = mA * tw * fe
          ctx!.drawImage(d.spr, x + dx - s, y + dy - s, s * 2, s * 2)
        }
      }
      const gfade = 1 - zp * 0.82
      for (let j = 0; j < gold.length; j++) {
        const g = gold[j]
        const gA = (g.core ? 0.72 : 0.3) * gfade
        if (gA <= 0.01) continue
        const gx = W / 2 + g.ox * S
        const gy = H / 2 + g.oy * S
        const gdx = Math.sin(tm * g.spd + g.phase) * 1.3 * calm
        const gdy = Math.cos(tm * g.spd * 0.8 + g.phase) * 1.3 * calm
        const gtw = 0.65 + 0.35 * Math.sin(tm * g.spd * 1.5 + g.phase)
        const gs = g.size
        ctx!.globalAlpha = gA * gtw
        ctx!.drawImage(goldS, gx + gdx - gs, gy + gdy - gs, gs * 2, gs * 2)
      }
      ctx!.globalCompositeOperation = 'source-over'
      ctx!.globalAlpha = 1
      if (zp > 0.45) {
        const a = Math.min(1, (zp - 0.45) / 0.3)
        const gr = RH * S * 1.7
        ctx!.strokeStyle = `rgba(244,232,198,${0.85 * a})`
        ctx!.lineWidth = 1.5
        ctx!.beginPath()
        ctx!.arc(W / 2, H / 2, gr, 0, 6.2832)
        ctx!.stroke()
      }
      if (gtag) gtag.style.opacity = String(zp > 0.5 ? Math.min(1, (zp - 0.5) / 0.28) : 0)
      if (mtag) mtag.style.opacity = String(zp > 0.5 ? Math.min(1, (zp - 0.5) / 0.28) : 0)
      if (ghold) ghold.style.opacity = String(Math.max(0, 1 - zp / 0.1))
      ratioEl!.textContent = String(Math.round(ratio * zp))
    }
    function loop(now: number) {
      if (t0 === null) t0 = now
      const p = (now - t0) / 5600
      draw(Math.min(p, 1))
      raf = requestAnimationFrame(loop)
    }
    function run() {
      build()
      layout()
      if (reduce) {
        draw(1)
        ratioEl!.textContent = String(ratio)
        return
      }
      t0 = null
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', layout)
    const isMobile = window.matchMedia('(max-width:900px)').matches
    let io: IntersectionObserver | null = null
    let autoT: ReturnType<typeof setTimeout> | null = null
    let kick: (() => void) | null = null

    if (reduce) {
      run()
    } else if (isMobile) {
      // Hold the genome animation on mobile — show a resting field, then play on first scroll
      build()
      layout()
      draw(0)
      let started = false
      kick = () => {
        if (started) return
        started = true
        if (autoT) clearTimeout(autoT)
        window.removeEventListener('scroll', kick!)
        window.removeEventListener('touchmove', kick!)
        window.removeEventListener('wheel', kick!)
        window.removeEventListener('touchstart', kick!)
        window.removeEventListener('pointerdown', kick!)
        run()
      }
      window.addEventListener('scroll', kick, { passive: true })
      window.addEventListener('touchmove', kick, { passive: true })
      window.addEventListener('wheel', kick, { passive: true })
      window.addEventListener('touchstart', kick, { passive: true })
      window.addEventListener('pointerdown', kick, { passive: true })
      // Fallback: if no interaction, play on its own shortly after load
      autoT = setTimeout(kick, 1400)
    } else if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              run()
              io?.disconnect()
            }
          })
        },
        { threshold: 0.3 },
      )
      io.observe(section)
    } else {
      run()
    }

    return () => {
      window.removeEventListener('resize', layout)
      if (raf) cancelAnimationFrame(raf)
      io?.disconnect()
      if (kick) {
        window.removeEventListener('scroll', kick)
        window.removeEventListener('touchmove', kick)
        window.removeEventListener('wheel', kick)
        window.removeEventListener('touchstart', kick)
        window.removeEventListener('pointerdown', kick)
      }
      if (autoT) clearTimeout(autoT)
    }
  }, [ratio])

  return (
    <header className="bio-hero" id="scale" data-screen-label="Hero" ref={sectionRef as React.RefObject<HTMLElement>}>
      <style jsx>{`
        .bio-hero {
          position: relative;
          background: linear-gradient(180deg, #ffffff 0%, #fbfaf5 100%);
          color: #12314d;
          overflow: hidden;
        }
        .bio-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.42fr;
          gap: 52px;
          align-items: stretch;
          max-width: 1240px;
          margin-inline: auto;
          width: 100%;
          padding: clamp(28px, 5vw, 60px) clamp(20px, 5vw, 72px) clamp(52px, 6vw, 92px);
        }
        .bio-hero-copy :global(h1) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(2.6rem, 5.6vw, 4.7rem);
          letter-spacing: -0.038em;
          line-height: 1;
          color: #12314d;
          max-width: 12ch;
          margin: 0;
        }
        .bio-hero-sub {
          color: rgba(18, 49, 77, 0.55);
          font-size: clamp(1.08rem, 1.5vw, 1.3rem);
          margin-top: 24px;
          max-width: 40ch;
          line-height: 1.5;
        }
        .bio-cta-row {
          margin-top: clamp(28px, 4vw, 38px);
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .bio-btn {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.45em;
          border-radius: 100px;
          white-space: nowrap;
          line-height: 1;
          padding: 16px 30px;
          background: #c6ff5b;
          color: #0e2740;
          transition:
            transform 0.16s ease,
            filter 0.16s ease,
            background 0.16s ease;
        }
        .bio-btn:hover {
          background: #aaea42;
          transform: translateY(-1px);
        }
        .bio-btn:active {
          transform: translateY(1px);
        }
        .bio-proof {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: clamp(26px, 4vw, 38px);
        }
        .bio-proof-avs {
          display: flex;
        }
        .bio-proof-avs img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #fff;
          margin-left: -11px;
          display: block;
          background: linear-gradient(135deg, #9db8c9, #c8d6df);
        }
        .bio-proof-avs img:first-child {
          margin-left: 0;
        }
        .bio-proof-txt {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.55);
          max-width: 34ch;
          line-height: 1.5;
        }
        .bio-proof-txt :global(strong),
        .bio-proof-txt :global(b) {
          color: #12314d;
          font-weight: 600;
        }
        .bio-hcard {
          background: #0e2740;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 50px 90px -46px rgba(18, 49, 77, 0.5);
          display: flex;
          flex-direction: column;
          min-height: 512px;
          background-image: radial-gradient(90% 80% at 70% 30%, rgba(10, 143, 176, 0.2), transparent 60%);
        }
        .bio-chd {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          gap: 12px;
        }
        .bio-chd-lbl {
          display: flex;
          gap: 10px;
          align-items: center;
          color: #fff;
          font-size: 15px;
        }
        .bio-chd-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #5bc0d8;
        }
        .bio-cvwrap {
          position: relative;
          flex: 1;
          display: flex;
          min-height: 0;
          width: calc(100% + 40px);
          margin-inline: -20px;
        }
        .bio-cvwrap canvas {
          flex: 1;
          width: 100%;
          display: block;
          min-height: 0;
        }
        .bio-ghold {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          text-align: center;
        }
        .bio-gtag {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, calc(-50% - 46px));
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.45s ease;
          pointer-events: none;
          white-space: nowrap;
          text-align: center;
        }
        .bio-gtag b {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.14em;
          color: rgba(233, 200, 106, 0.6);
          text-shadow:
            0 1px 12px rgba(7, 22, 37, 0.95),
            0 0 4px rgba(7, 22, 37, 0.9);
        }
        .bio-gtag span {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: rgba(247, 238, 214, 0.62);
          text-shadow:
            0 1px 10px rgba(7, 22, 37, 0.95),
            0 0 4px rgba(7, 22, 37, 0.9);
        }
        .bio-mtag {
          position: absolute;
          left: 27%;
          top: 68%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.45s ease;
          pointer-events: none;
          white-space: nowrap;
          text-align: center;
        }
        .bio-mtag b {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.12em;
          color: #5bc0d8;
          text-shadow:
            0 1px 14px rgba(7, 22, 37, 0.95),
            0 0 4px rgba(7, 22, 37, 0.9);
        }
        .bio-mtag span {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 600;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(207, 243, 252, 0.92);
          text-shadow:
            0 1px 12px rgba(7, 22, 37, 0.95),
            0 0 4px rgba(7, 22, 37, 0.9);
        }
        .bio-cfoot {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 18px;
          text-align: left;
          flex-wrap: nowrap;
        }
        .bio-read {
          flex: 0 0 auto;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;
          color: #bfeffa;
          flex-wrap: wrap;
        }
        .bio-read-big {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          letter-spacing: -0.03em;
          font-size: clamp(2.8rem, 5.5vw, 4.2rem);
          line-height: 1;
        }
        .bio-read-u {
          font-family: 'Inter', sans-serif;
          color: rgba(255, 255, 255, 0.55);
          font-size: 1rem;
        }
        .bio-rcap {
          flex: 1 1 auto;
          max-width: none;
          margin: 0;
          padding-left: 18px;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          line-height: 1.32;
          color: rgba(255, 255, 255, 0.55);
          text-align: left;
          align-self: stretch;
          display: flex;
          align-items: center;
        }
        @media (max-width: 900px) {
          .bio-hero-grid {
            grid-template-columns: 1fr;
            gap: 22px;
            align-items: start;
          }
          .bio-hero-copy {
            display: contents;
          }
          .bio-hero-copy :global(h1) {
            order: 1;
          }
          .bio-hcard {
            order: 2;
            aspect-ratio: auto;
            min-height: min(76vh, 600px);
          }
          .bio-hero-sub {
            order: 3;
            margin-top: 0;
          }
          .bio-cta-row {
            order: 4;
            margin-top: 2px;
          }
          .bio-proof {
            order: 5;
            margin-top: 2px;
          }
        }
        /* The two scale tags sit absolutely over the canvas and were sized for the
           English copy. Longer translations — FR "8,3 MILLIONS DE GÈNES / VOTRE
           MICROBIOME INTESTINAL", with DE and IT longer still — made the nowrap
           microbiome tag spill past the card's left edge on narrow screens: it is
           anchored at left:27% and centred on itself, inside a wrapper that already
           sits 20px proud of the card. (The short English copy overflowed too, but
           only below ~320px.) Below 560px let both tags wrap and cap them to the
           card's inner width, and centre the microbiome tag so no locale can reach
           either edge. It is centred with auto margins rather than left:50% because
           a box offset from the left can only shrink-to-fit the space remaining to
           its right, which wraps even the English copy; spanning the wrapper gives
           it the full width, so only genuinely long copy wraps. The cloud behind is
           drawn from the canvas centre and is full-bleed, so no art is tied to 27%. */
        @media (max-width: 560px) {
          .bio-gtag,
          .bio-mtag {
            white-space: normal;
            max-width: calc(100% - 56px);
          }
          .bio-mtag {
            left: 0;
            right: 0;
            margin-inline: auto;
            width: max-content;
            transform: translateY(-50%);
          }
        }
      `}</style>

      <div className="bio-hero-grid">
        <div className="bio-hero-copy">
          {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
          {subheading && <p className="bio-hero-sub">{subheading}</p>}

          {ctaLabel && (
            <div className="bio-cta-row">
              <a className="bio-btn" href={ctaUrl || '#'}>
                {ctaLabel}
              </a>
            </div>
          )}

          {(avatars.length > 0 || proofText) && (
            <div className="bio-proof">
              {avatars.length > 0 && (
                <span className="bio-proof-avs">
                  {avatars.map((a, i) => (
                    <img key={i} src={imgUrl(a.image)} alt={imgAlt(a.image) || a.name || ''} />
                  ))}
                </span>
              )}
              {proofText && (
                <span className="bio-proof-txt">
                  <RichText data={proofText as any} enableGutter={false} enableProse={false} />
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bio-hcard">
          <div className="bio-chd">
            <span className="bio-chd-lbl">
              <span className="bio-chd-dot" />
              {cardLabel}
            </span>
          </div>
          <div className="bio-cvwrap">
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="bio-ghold" ref={gholdRef} />
            <div className="bio-gtag" ref={gtagRef}>
              <b>{genomeValue}</b>
              <span>{genomeLabel}</span>
            </div>
            <div className="bio-mtag" ref={mtagRef}>
              <b>{microbiomeValue}</b>
              <span>{microbiomeLabel}</span>
            </div>
          </div>
          <div className="bio-cfoot">
            <div className="bio-read">
              <span className="bio-read-big" ref={ratioRef}>
                0
              </span>
              <span className="bio-read-u">: 1</span>
            </div>
            {ratioCaption && <p className="bio-rcap">{ratioCaption}</p>}
          </div>
        </div>
      </div>
    </header>
  )
}
