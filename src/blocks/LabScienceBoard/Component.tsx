'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import type { AppLocale } from '@/i18n/config'
import { getScienceBoardStrings } from './i18n'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined
type Tag = { label?: string | null }

type Cso = {
  photo?: MediaLike
  initials?: string | null
  role?: string | null
  name?: string | null
  bio?: string | null
  quote?: string | null
  tags?: Tag[] | null
}
type TeamMember = {
  photo?: MediaLike
  initials?: string | null
  discipline?: string | null
  name?: string | null
  affiliation?: string | null
  quote?: string | null
}
type Validator = {
  photo?: MediaLike
  initials?: string | null
  name?: string | null
  affiliation?: string | null
  quote?: string | null
  tags?: Tag[] | null
}
type Stat = { number?: string | null; label?: string | null }

export type LabScienceBoardBlockType = {
  blockType?: 'labScienceBoard'
  heading?: DefaultTypedEditorState | null
  lede?: string | null
  stats?: Stat[] | null
  teamGroupLabel?: string | null
  teamGroupSub?: string | null
  cso?: Cso | null
  teamMembers?: TeamMember[] | null
  checkGroupLabel?: string | null
  checkStatement?: DefaultTypedEditorState | null
  checkStatementSub?: string | null
  validators?: Validator[] | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

const Photo: React.FC<{ image?: MediaLike; initials?: string | null; name?: string | null }> = ({
  image,
  initials,
  name,
}) => {
  const [failed, setFailed] = useState(false)
  const src = imgUrl(image)
  return (
    <div className="photo">
      <span className="mono">{initials}</span>
      {src && !failed && <img src={src} alt={imgAlt(image) || name || ''} onError={() => setFailed(true)} />}
    </div>
  )
}

export const LabScienceBoardComponent: React.FC<LabScienceBoardBlockType & { locale?: AppLocale }> = ({
  locale,
  heading,
  lede,
  stats,
  teamGroupLabel,
  teamGroupSub,
  cso,
  teamMembers,
  checkGroupLabel,
  checkStatement,
  checkStatementSub,
  validators,
}) => {
  const T = getScienceBoardStrings(locale)
  const statRows = stats ?? []
  const teamRows = teamMembers ?? []
  const validatorRows = validators ?? []
  const sectionRef = useRef<HTMLElement | null>(null)
  useReveal(
    sectionRef,
    'h2, .sbx-lede, .sbx-stat, .sbx-group, .sbx-hero, .member, .sbx-statement, .sbx-statementsub, .vald',
  )

  const statsRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const stats = statsRef.current
    if (!stats) return
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    const nodes = Array.from(stats.querySelectorAll<HTMLElement>('.sbx-stat .n'))
    let done = false

    function run() {
      if (done) return
      done = true
      nodes.forEach((el) => {
        const raw = el.textContent?.trim() ?? ''
        const suffix = /\+$/.test(raw) ? '+' : ''
        const target = parseInt(raw.replace(/[^0-9]/g, ''), 10)
        if (!target) return
        const dur = 1300
        let t0: number | null = null
        el.textContent = '0' + suffix
        function step(ts: number) {
          if (t0 === null) t0 = ts
          const p = Math.min((ts - t0) / dur, 1)
          const e = 1 - Math.pow(1 - p, 3)
          el.textContent = Math.round(e * target).toLocaleString('en-US') + suffix
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            io.disconnect()
          }
        })
      },
      { threshold: 0.4 },
    )
    io.observe(stats)
    return () => io.disconnect()
  }, [])

  return (
    <section className="sbx" id="board" data-screen-label="Board" ref={sectionRef as React.RefObject<HTMLElement>}>
      <style jsx>{`
        .sbx {
          background: #f6f9fc;
          padding: 94px 0 0;
          /* Mockup base font for this section is --font (Inter); only display
             elements (h2, .sbx-stat .n, .mono, names, statement) use Instrument
             Sans, and they set it explicitly below. */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .sbx :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(32px, 4.6vw, 52px);
          line-height: 1.06;
          letter-spacing: -0.01em;
          color: #12314d;
          margin: 18px 0 0;
          max-width: 16ch;
        }
        .sbx :global(em) {
          font-style: normal;
          color: #0a8fb0;
        }
        .sbx-lede {
          font-size: clamp(16px, 1.6vw, 18px);
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          max-width: 54ch;
          margin: 20px 0 0;
        }
        .sbx-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin: 42px 0 0;
        }
        .sbx-stat {
          background: #fff;
          border: 1px solid #e4ebf1;
          border-radius: 16px;
          padding: 20px 22px;
        }
        .sbx-stat .n {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #12314d;
        }
        .sbx-stat .l {
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.5);
          margin-top: 9px;
        }
        .sbx-group {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a8fb0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sbx-group::before {
          content: '';
          width: 28px;
          height: 1.5px;
          background: #0a8fb0;
        }
        .sbx-groupsub {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.5);
          margin-top: 8px;
          max-width: 64ch;
        }
        :global(.photo) {
          position: relative;
          aspect-ratio: 4 / 5;
          background: radial-gradient(circle at 50% 42%, #d9e8f3 0%, #e8f0f6 42%, #f6f3ed 82%);
          -webkit-mask-image: radial-gradient(128% 134% at 50% 44%, #000 56%, transparent 100%);
          mask-image: radial-gradient(128% 134% at 50% 44%, #000 56%, transparent 100%);
        }
        :global(.photo img) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        :global(.mono) {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          /* Mockup ships Instrument Sans only at 500/600/700; its weight-400
             display text resolves up to 500. We load a real 400, so pin 500
             explicitly to match the mockup's thickness. */
          font-weight: 500;
          font-size: clamp(24px, 3vw, 40px);
          color: #9dbbd0;
          letter-spacing: 0.04em;
        }
        .role {
          display: inline-block;
          align-self: flex-start;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #fff;
          background: #0a8fb0;
          padding: 6px 12px;
          border-radius: 999px;
        }
        .role.ghost {
          color: #15607a;
          background: transparent;
          border: 1px solid #bcd6e3;
        }
        .pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pill {
          font-size: 12.5px;
          font-weight: 500;
          color: #3e586a;
          background: #eff4f7;
          border: 1px solid #e1eaf0;
          padding: 6px 12px;
          border-radius: 999px;
          /* Mockup renders these tags uppercase with wide tracking (0.14em);
             the wider tracking also makes 3 tags overflow the 346px column so
             they wrap to two rows, matching the handoff. Mobile tightens to
             0.02em (below). */
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }
        .quote {
          position: relative;
          padding-left: 16px;
        }
        .quote::before {
          content: '';
          position: absolute;
          left: 0;
          top: 3px;
          bottom: 3px;
          width: 2.5px;
          border-radius: 2px;
          background: #0a8fb0;
        }
        .quote p {
          margin: 0;
          font-size: 16px;
          line-height: 1.55;
          color: #12314d;
        }
        .sbx-hero {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 44px;
          align-items: center;
          margin-top: 30px;
        }
        .sbx-hero :global(.photo) {
          width: 280px;
        }
        .sbx-hero .stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .sbx-hero .name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 30px;
          line-height: 1.05;
          color: #12314d;
          margin: 0;
        }
        .sbx-hero .bio {
          color: rgba(18, 49, 77, 0.7);
          font-size: 16px;
          line-height: 1.55;
          max-width: 52ch;
        }
        .sbx-team {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 64px;
        }
        .member {
          display: flex;
          flex-direction: column;
        }
        .member :global(.photo) {
          width: 100%;
          max-width: 184px;
        }
        .member .disc {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #3e96be;
          margin-top: 14px;
        }
        .member .mname {
          font-size: 17px;
          font-weight: 600;
          color: #12314d;
          margin-top: 5px;
        }
        .member .maff {
          font-size: 13.5px;
          color: rgba(18, 49, 77, 0.5);
          line-height: 1.45;
          margin-top: 4px;
          min-height: 2.9em;
        }
        .mquote {
          position: relative;
          padding-left: 15px;
          margin-top: 13px;
        }
        .mquote::before {
          content: '';
          position: absolute;
          left: 0;
          top: 3px;
          bottom: 3px;
          width: 2px;
          border-radius: 2px;
          background: #0a8fb0;
        }
        .mquote p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #12314d;
        }
        .sbx-check {
          position: relative;
          margin-top: 128px;
          padding: 72px 0 80px;
        }
        .sbx-check::before {
          content: '';
          position: absolute;
          inset: 0 calc(50% - 50vw);
          background: #edf2f7;
          z-index: 0;
        }
        .sbx-check > :global(*) {
          position: relative;
          z-index: 1;
        }
        .sbx-statement {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(24px, 3.2vw, 36px);
          line-height: 1.2;
          letter-spacing: -0.01em;
          color: #12314d;
          margin-top: 18px;
          max-width: 26ch;
        }
        .sbx-statement :global(strong) {
          font-weight: 500;
          color: #0a8fb0;
        }
        .sbx-statementsub {
          font-size: 15px;
          color: rgba(18, 49, 77, 0.7);
          line-height: 1.6;
          max-width: 54ch;
          margin-top: 14px;
        }
        .sbx-validators {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 34px;
        }
        .vald {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 22px;
          align-items: start;
        }
        .vald :global(.photo) {
          width: 120px;
        }
        .vald .stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .vald .name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 21px;
          color: #12314d;
          line-height: 1.12;
        }
        .vald .aff {
          font-size: 13px;
          color: rgba(18, 49, 77, 0.5);
          line-height: 1.4;
          margin-top: 4px;
        }
        @media (max-width: 820px) {
          .sbx-stats {
            grid-template-columns: 1fr 1fr;
          }
          .sbx-hero {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .sbx-hero :global(.photo) {
            width: 230px;
          }
          .sbx-team {
            grid-template-columns: 1fr;
            gap: 56px;
            margin-top: 42px;
          }
          .member {
            display: grid;
            grid-template-columns: 84px 1fr;
            column-gap: 18px;
            align-items: start;
          }
          .member :global(.photo) {
            grid-row: 1 / 4;
            grid-column: 1;
            width: 84px;
            max-width: 84px;
            align-self: start;
          }
          .member .disc {
            grid-column: 2;
            grid-row: 1;
            margin-top: 2px;
          }
          .member .mname {
            grid-column: 2;
            grid-row: 2;
          }
          .member .maff {
            grid-column: 2;
            grid-row: 3;
          }
          .member .mquote {
            grid-column: 1 / -1;
            grid-row: 4;
            margin-top: 18px;
          }
          .sbx-validators {
            grid-template-columns: 1fr;
            gap: 56px;
          }
          .vald {
            grid-template-columns: 1fr;
          }
          .vald :global(.photo) {
            width: 100%;
            max-width: 240px;
          }
          .pills {
            gap: 7px;
          }
          .pill {
            font-size: 10.5px;
            padding: 5px 10px;
            letter-spacing: 0.02em;
          }
        }
      `}</style>

      <div className="wrap">
        {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
        {lede && <p className="sbx-lede">{lede}</p>}

        {statRows.length > 0 && (
          <div className="sbx-stats" ref={statsRef}>
            {statRows.map((s, i) => (
              <div className="sbx-stat" key={i}>
                <div className="n">{s.number}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 64 }}>
          {teamGroupLabel && <div className="sbx-group">{teamGroupLabel}</div>}
          {teamGroupSub && <div className="sbx-groupsub">{teamGroupSub}</div>}
        </div>

        {cso && (
          <div className="sbx-hero">
            <Photo image={cso.photo} initials={cso.initials} name={cso.name} />
            <div className="stack">
              {cso.role && <span className="role">{cso.role}</span>}
              <h3 className="name">{cso.name}</h3>
              {cso.bio && <p className="bio">{cso.bio}</p>}
              {cso.quote && (
                <div className="quote">
                  <p>&ldquo;{cso.quote}&rdquo;</p>
                </div>
              )}
              {(cso.tags?.length ?? 0) > 0 && (
                <div className="pills">
                  {cso.tags?.map((t, i) => (
                    <span className="pill" key={i}>
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {teamRows.length > 0 && (
          <div className="sbx-team">
            {teamRows.map((m, i) => (
              <div className="member" key={i}>
                <Photo image={m.photo} initials={m.initials} name={m.name} />
                {m.discipline && <div className="disc">{m.discipline}</div>}
                <div className="mname">{m.name}</div>
                {m.affiliation && <div className="maff">{m.affiliation}</div>}
                {m.quote && (
                  <div className="mquote">
                    <p>&ldquo;{m.quote}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="sbx-check">
          {checkGroupLabel && <div className="sbx-group">{checkGroupLabel}</div>}
          {checkStatement && (
            <div className="sbx-statement">
              <RichText data={checkStatement as any} enableGutter={false} enableProse={false} />
            </div>
          )}
          {checkStatementSub && <p className="sbx-statementsub">{checkStatementSub}</p>}

          {validatorRows.length > 0 && (
            <div className="sbx-validators">
              {validatorRows.map((v, i) => (
                <div className="vald" key={i}>
                  <Photo image={v.photo} initials={v.initials} name={v.name} />
                  <div className="stack">
                    <span className="role ghost">{T.independentValidator}</span>
                    <div>
                      <div className="name">{v.name}</div>
                      {v.affiliation && <div className="aff">{v.affiliation}</div>}
                    </div>
                    {v.quote && (
                      <div className="quote">
                        <p>&ldquo;{v.quote}&rdquo;</p>
                      </div>
                    )}
                    {(v.tags?.length ?? 0) > 0 && (
                      <div className="pills">
                        {v.tags?.map((t, i) => (
                          <span className="pill" key={i}>
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
