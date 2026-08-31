'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getDictionary } from '@/i18n/getDictionary'

type BioParagraph = { paragraph?: string | null }

type Member = {
  photo?: { url?: string | null; width?: number | null; height?: number | null } | null
  name?: string | null
  role?: string | null
  detail?: string | null
  pill?: string | null
  modalTitle?: string | null
  bio?: BioParagraph[] | null
  quote?: string | null
}

type Props = {
  heading?: any
  subheading?: string | null
  members?: Member[] | null
  locale?: string
}

export const ScienceBoardNewComponent: React.FC<Props> = ({ heading, subheading, members, locale }) => {
  const dict = getDictionary(locale)
  const secRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  // Up to 6 members the original 3-up grid is left alone. From 7 the cards drop
  // to the 4-up size, and any leftover count rides in a centred last row so no
  // row is ever left ragged -- 7 renders as 4, then 3 centred.
  const memberCount = members?.length ?? 0
  const isCompact = memberCount > 6
  const remainder = isCompact ? memberCount % 4 : 0
  // Index of the card that opens the short final row, so it can be offset.
  const lastRowStart = remainder ? memberCount - remainder : -1
  // 24 tracks, each card spanning 6 => 4 per row. Centring r cards leaves
  // (24 - 6r)/2 empty tracks on each side, so that card starts at 13 - 3r.
  const lastRowStartColumn = remainder ? 13 - 3 * remainder : 1
  const gridStyle = {
    transitionDelay: '0.1s',
    ...(isCompact ? { '--sb-last-row-start': String(lastRowStartColumn) } : {}),
  } as React.CSSProperties

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const close = useCallback(() => {
    setOpenIdx(null)
    document.body.style.overflow = ''
  }, [])

  const open = useCallback((i: number) => {
    setOpenIdx(i)
    document.body.style.overflow = 'hidden'
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && openIdx !== null) close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openIdx, close])

  // cleanup on unmount
  useEffect(() => () => { document.body.style.overflow = '' }, [])

  const active = openIdx !== null && members ? members[openIdx] : null

  return (
    <>
      <style jsx>{`
        .sb-wrap {
          background: #FAF8F2;
          padding: 96px 30px;
        }
        @media (max-width: 760px) { .sb-wrap { padding: 64px 20px; } }

        .sb-in { max-width: 1040px; margin: 0 auto; }

        /* ── Header ── */
        .sb-head {
          text-align: center;
          max-width: 660px;
          margin: 0 auto 46px;
        }
        .sb-title :global(p) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4vw, 46px);
          line-height: 1.06;
          letter-spacing: -0.025em;
          color: #12314D;
          text-wrap: balance;
          margin: 0;
        }
        .sb-title :global(em) { font-style: normal; color: #0A8FB0; }
        .sb-sub {
          margin: 18px auto 0;
          font-size: 16px;
          line-height: 1.6;
          color: rgba(18,49,77,.70);
          max-width: 580px;
        }

        /* ── Grid ── */
        .sb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }
        /* 24 tracks with each card spanning 6 reproduces the 4-up width exactly
           (243.5px in the 1040px .sb-in, same maths as 3-up giving 332px), and
           keeps everything on fr units so it still scales below 1040px. */
        .sb-grid.is-compact { grid-template-columns: repeat(24, 1fr); }
        .sb-grid.is-compact .sb-card { grid-column: span 6; }
        .sb-grid.is-compact .sb-card.is-row-start {
          grid-column: var(--sb-last-row-start, 1) / span 6;
        }
        @media (max-width: 680px) {
          .sb-grid {
            display: flex; gap: 14px; overflow-x: auto;
            scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; margin: 0 -20px; padding: 4px 20px 6px;
          }
          .sb-grid::-webkit-scrollbar { display: none; }
          .sb-card { flex: 0 0 76%; scroll-snap-align: center; }
        }

        /* ── Card ── */
        .sb-card {
          background: #fff;
          border: 1px solid rgba(18,49,77,.10);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: transform .25s ease, box-shadow .25s ease;
          text-align: left;
        }
        .sb-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 56px -30px rgba(18,49,77,.34);
        }
        .sb-card:focus { outline: none; }
        .sb-card:focus-visible { outline: 2px solid #0A8FB0; outline-offset: 3px; }

        .sb-photo {
          position: relative;
          aspect-ratio: 4 / 5;
          overflow: hidden;
          background: #EAF1F4;
        }
        .sb-photo img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
          display: block;
        }
        .sb-hover {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(8,20,34,.44);
          opacity: 0;
          transition: opacity .25s ease;
        }
        .sb-card:hover .sb-hover,
        .sb-card:focus-visible .sb-hover { opacity: 1; }
        .sb-hover span {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          color: #fff;
        }

        .sb-body { padding: 20px 22px 22px; }
        .sb-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600; font-size: 18px;
          letter-spacing: -0.01em; color: #12314D;
        }
        .sb-role {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13px; font-weight: 600;
          color: #0A8FB0; margin-top: 5px; line-height: 1.35;
        }
        .sb-detail {
          font-size: 12.5px; line-height: 1.45;
          color: rgba(18,49,77,.55); margin-top: 9px;
        }

        /* ── Modal overlay ── */
        .sb-modal {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(8,20,34,.62);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 28px;
          opacity: 0; pointer-events: none;
          transition: opacity .25s ease;
        }
        .sb-modal.open { opacity: 1; pointer-events: auto; }

        .sb-modal-card {
          position: relative;
          width: min(880px, 94vw);
          max-height: 88vh;
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          display: grid;
          grid-template-columns: 310px 1fr;
          box-shadow: 0 50px 110px -30px rgba(0,0,0,.6);
        }
        @media (max-width: 680px) {
          .sb-modal-card {
            grid-template-columns: 1fr;
            max-height: 90vh; overflow: auto;
          }
          .sb-modal-photo { height: 300px; min-height: 0; }
          .sb-modal-body { padding: 28px 26px; }
        }

        .sb-modal-photo {
          position: relative; min-height: 100%;
          background: #EAF1F4;
        }
        .sb-modal-photo img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center top;
        }

        .sb-modal-x {
          position: absolute; top: 16px; right: 16px;
          width: 34px; height: 34px;
          border: none; border-radius: 50%;
          background: #EEF1F4; color: #12314D;
          font-size: 15px; cursor: pointer; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .sb-modal-x:hover { background: #E2E7EB; }

        .sb-modal-body { padding: 40px 40px 40px; overflow: auto; }
        .sb-modal-pill {
          display: inline-block;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10px; font-weight: 700;
          letter-spacing: .16em; text-transform: uppercase;
          color: #0A8FB0;
          border: 1px solid rgba(10,143,176,.3);
          border-radius: 100px; padding: 5px 12px;
          margin-bottom: 16px;
        }
        .sb-modal-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600; font-size: 26px;
          letter-spacing: -0.02em; color: #12314D; margin: 0;
        }
        .sb-modal-title {
          font-size: 14px; font-weight: 600;
          color: #0A8FB0; margin-top: 8px; line-height: 1.4;
        }
        .sb-modal-bio { margin-top: 18px; }
        .sb-modal-bio p {
          font-size: 14.5px; line-height: 1.62;
          color: rgba(18,49,77,.70); margin: 0 0 14px;
        }
        .sb-modal-quote {
          margin: 20px 0 0; padding-left: 16px;
          border-left: 3px solid #0A8FB0;
          font-style: italic; font-size: 14px;
          color: rgba(18,49,77,.55);
        }

        /* ── Scroll-in ── */
        .r-up {
          opacity: 0; transform: translateY(20px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .r-up.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .r-up { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <section ref={secRef} id="science-board" className="sb-wrap" data-screen-label="Science">
        <div className="sb-in">

          <div className={`sb-head r-up${visible ? ' in' : ''}`}>
            {heading && (
              <div className="sb-title">
                <RichText data={heading} enableGutter={false} enableProse={false} />
              </div>
            )}
            {subheading && <p className="sb-sub">{subheading}</p>}
          </div>

          {members && members.length > 0 && (
            <div
              className={`sb-grid r-up${isCompact ? ' is-compact' : ''}${visible ? ' in' : ''}`}
              style={gridStyle}
            >
              {members.map((m, i) => {
                const photoUrl = m.photo?.url ? getMediaUrl(m.photo.url) : null
                return (
                  <article
                    key={i}
                    className={`sb-card${i === lastRowStart ? ' is-row-start' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${dict.scienceBoard.viewBio}: ${m.name}`}
                    onClick={() => open(i)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i) } }}
                  >
                    <div className="sb-photo">
                      {photoUrl && (
                        <img
                          src={photoUrl}
                          alt={m.name || ''}
                          width={m.photo?.width ?? undefined}
                          height={m.photo?.height ?? undefined}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="sb-hover"><span>{dict.scienceBoard.viewBio}</span></div>
                    </div>
                    <div className="sb-body">
                      <div className="sb-name">{m.name}</div>
                      <div className="sb-role">{m.role}</div>
                      <div className="sb-detail">{m.detail}</div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

        </div>
      </section>

      {/* Modal */}
      <div
        className={`sb-modal${openIdx !== null ? ' open' : ''}`}
        aria-hidden={openIdx === null}
        role="dialog"
        aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) close() }}
      >
        <div className="sb-modal-card">
          <button className="sb-modal-x" type="button" aria-label="Close" onClick={close}>✕</button>
          <div className="sb-modal-photo">
            {active?.photo?.url && (
              <img src={getMediaUrl(active.photo.url)} alt={active.name || ''} />
            )}
          </div>
          <div className="sb-modal-body">
            {active?.pill && <span className="sb-modal-pill">{active.pill}</span>}
            {active?.name && <h3 className="sb-modal-name">{active.name}</h3>}
            {active?.modalTitle && <div className="sb-modal-title">{active.modalTitle}</div>}
            {active?.bio && active.bio.length > 0 && (
              <div className="sb-modal-bio">
                {active.bio.map((b, i) => b.paragraph ? <p key={i}>{b.paragraph}</p> : null)}
              </div>
            )}
            {active?.quote && (
              <blockquote className="sb-modal-quote">{active.quote}</blockquote>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
