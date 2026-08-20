'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Athlete = {
  name?: string | null
  credential?: string | null
  photo?: { url?: string | null; width?: number | null; height?: number | null } | null
  hasVideo?: boolean | null
  video?: { url?: string | null } | null
  videoAriaLabel?: string | null
  subtitles?: { url?: string | null } | null
}

type Props = {
  quoteText?: any
  quoteAttribution?: any
  recordText?: any
  athletes?: Athlete[] | null
}

export const AthletesComponent: React.FC<Props> = ({
  quoteText, quoteAttribution, recordText, athletes,
}) => {
  const secRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const [lbOpen, setLbOpen] = useState(false)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null)

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const openLightbox = useCallback((athlete: Athlete) => {
    if (!athlete.video?.url) return
    setActiveVideoUrl(getMediaUrl(athlete.video.url))
    setActiveAthlete(athlete)
    setLbOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLbOpen(false)
    const v = videoRef.current
    if (v) { v.pause(); try { v.currentTime = 0 } catch (_) {} }
  }, [])

  // Auto-play and enable subtitles when lightbox opens
  useEffect(() => {
    const v = videoRef.current
    if (!lbOpen || !v) return
    const p = v.play()
    if (p?.catch) p.catch(() => {})
    const enableTrack = () => {
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i].mode = 'showing'
      }
    }
    if (v.readyState >= 1) enableTrack()
    else v.addEventListener('loadedmetadata', enableTrack, { once: true })
  }, [lbOpen, activeVideoUrl])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && lbOpen) closeLightbox() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lbOpen, closeLightbox])

  return (
    <>
      <style jsx>{`
        .athv-wrap {
          background: #FAF8F2;
          padding: 58px 30px;
        }
        @media (max-width: 760px) { .athv-wrap { padding: 18px 12px; } }

        .athv-stage {
          border-radius: 30px;
          overflow: hidden;
          padding: 108px 32px 112px;
          box-shadow: 0 50px 100px -54px rgba(8,24,40,.6), 0 10px 30px -18px rgba(8,24,40,.4);
          background:
            radial-gradient(140% 120% at 88% -12%, rgba(20,150,184,.28) 0%, rgba(14,95,120,.10) 32%, rgba(14,39,64,0) 64%),
            linear-gradient(166deg, #154663 0%, #0E2740 50%, #081A2B 100%);
        }
        @media (max-width: 760px) { .athv-stage { border-radius: 22px; padding: 56px 22px 60px; } }

        .athv-in { max-width: 1200px; margin: 0 auto; }

        /* ── Layout ── */
        .ath-layout {
          display: grid;
          grid-template-columns: .85fr 1.15fr;
          gap: 56px;
          align-items: center;
        }
        @media (max-width: 1040px) { .ath-layout { grid-template-columns: 1fr; gap: 38px; } }

        /* ── Copy ── */
        .ath-q-mark {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 84px;
          line-height: .5;
          color: #13A6CC;
          height: 36px;
          margin-bottom: 24px;
        }
        .ath-quote-text :global(p) {
          margin: 0;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .ath-quote-text :global(em) { font-style: normal; color: #13A6CC; }
        .ath-attribution {
          margin-top: 24px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,.62);
        }
        .ath-attribution :global(strong) { color: #fff; font-weight: 600; }
        .ath-attribution :global(p) { margin: 0; }
        .ath-record {
          margin: 30px 0 0;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,.14);
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.55;
          color: rgba(255,255,255,.70);
          max-width: 440px;
        }
        .ath-record :global(strong) { color: #fff; font-weight: 600; }
        .ath-record :global(p) { margin: 0; }
        @media (max-width: 760px) { .ath-record { display: none; } }

        /* ── Cards ── */
        .ath-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 560px) { .ath-cards { grid-template-columns: 1fr; } }

        .ath-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          background: #0e1a23;
          border: 1px solid rgba(255,255,255,.10);
          box-shadow: 0 30px 62px -34px rgba(0,0,0,.6);
          cursor: default;
        }
        .ath-card.has-video {
          cursor: pointer;
        }
        .ath-card.has-video:focus { outline: none; }
        .ath-card.has-video:focus-visible { outline: 2px solid #13A6CC; }
        @media (max-width: 560px) { .ath-card { aspect-ratio: 3 / 4; } }

        .ath-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: top center;
          transition: transform .65s cubic-bezier(.4,0,.2,1);
          display: block;
        }
        .ath-card.has-video:hover .ath-bg { transform: scale(1.04); }

        .ath-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,17,28,.92) 0%, rgba(8,17,28,0) 50%, rgba(8,17,28,.5) 100%);
          z-index: 1;
        }

        .ath-play {
          position: absolute;
          top: 46%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 4;
          width: 46px; height: 46px;
          border-radius: 50%;
          background: rgba(255,255,255,.16);
          backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
          border: 1px solid rgba(255,255,255,.55);
          display: flex; align-items: center; justify-content: center;
          transition: transform .2s ease, background .2s ease;
          pointer-events: none;
        }
        .ath-card.has-video:hover .ath-play {
          transform: translate(-50%, -50%) scale(1.1);
          background: rgba(255,255,255,.28);
        }
        .ath-play svg { width: 15px; height: 15px; margin-left: 1px; fill: #fff; }

        .ath-watch {
          position: absolute;
          top: calc(46% + 33px); left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 10px; font-weight: 600;
          letter-spacing: .16em; text-transform: uppercase;
          color: rgba(255,255,255,.88);
          pointer-events: none;
          white-space: nowrap;
        }

        .ath-info {
          position: absolute;
          left: 20px; right: 20px; bottom: 20px;
          z-index: 3; pointer-events: none;
        }
        .ath-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 17px; font-weight: 600; color: #fff;
        }
        .ath-cred {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 12px; font-weight: 400;
          color: rgba(255,255,255,.62);
          margin-top: 2px;
        }

        /* ── Lightbox ── */
        .ath-lb {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(6,10,14,.88);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 30px;
          opacity: 0; pointer-events: none;
          transition: opacity .28s ease;
        }
        .ath-lb.open { opacity: 1; pointer-events: auto; }

        .ath-lb-inner {
          position: relative;
          height: min(86vh, 780px);
          aspect-ratio: 9 / 16;
          max-width: 90vw;
        }
        .ath-lb-video {
          display: block;
          width: 100%; height: 100%;
          object-fit: cover;
          border-radius: 18px;
          background: #0e1a23;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,.8);
        }
        .ath-lb-close {
          position: absolute;
          top: -48px; right: 0;
          width: 38px; height: 38px;
          border: none; border-radius: 50%;
          background: rgba(255,255,255,.16);
          color: #fff; font-size: 17px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s;
        }
        .ath-lb-close:hover { background: rgba(255,255,255,.30); }

        /* ── Scroll-in ── */
        .r-up {
          opacity: 0; transform: translateY(20px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .r-up.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .r-up { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <div className="athv-wrap">
        <section ref={secRef} className="athv-stage" data-screen-label="Athletes">
          <div className="athv-in">
            <div className="ath-layout">

              {/* Copy */}
              <div className={`r-up${visible ? ' in' : ''}`}>
                <figure className="ath-q" style={{ margin: 0 }}>
                  <div className="ath-q-mark" aria-hidden="true">&ldquo;</div>
                  {quoteText && (
                    <div className="ath-quote-text">
                      <RichText data={quoteText} enableGutter={false} enableProse={false} />
                    </div>
                  )}
                  {quoteAttribution && (
                    <div className="ath-attribution">
                      <RichText data={quoteAttribution} enableGutter={false} enableProse={false} />
                    </div>
                  )}
                </figure>
                {recordText && (
                  <div className="ath-record">
                    <RichText data={recordText} enableGutter={false} enableProse={false} />
                  </div>
                )}
              </div>

              {/* Cards */}
              {athletes && athletes.length > 0 && (
                <div className={`ath-cards r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.1s' }}>
                  {athletes.map((ath, i) => {
                    const photoUrl = ath.photo?.url ? getMediaUrl(ath.photo.url) : null
                    const videoUrl = ath.video?.url ? getMediaUrl(ath.video.url) : null
                    const canPlay = !!ath.hasVideo && !!videoUrl

                    return (
                      <article
                        key={i}
                        className={`ath-card${canPlay ? ' has-video' : ''}`}
                        role={canPlay ? 'button' : undefined}
                        tabIndex={canPlay ? 0 : undefined}
                        aria-label={canPlay ? (ath.videoAriaLabel || `Play ${ath.name}'s video`) : undefined}
                        onClick={canPlay ? () => openLightbox(ath) : undefined}
                        onKeyDown={canPlay ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(ath) } } : undefined}
                      >
                        {photoUrl && (
                          <img
                            className="ath-bg"
                            src={photoUrl}
                            alt={ath.name || ''}
                            width={ath.photo?.width ?? undefined}
                            height={ath.photo?.height ?? undefined}
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="ath-scrim" />
                        {canPlay && (
                          <>
                            <span className="ath-play" aria-hidden="true">
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                            <div className="ath-watch">Watch</div>
                          </>
                        )}
                        <div className="ath-info">
                          {ath.name && <div className="ath-name">{ath.name}</div>}
                          {ath.credential && <div className="ath-cred">{ath.credential}</div>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

            </div>
          </div>
        </section>
      </div>

      {/* Lightbox — rendered outside the section so it's fixed over the whole page */}
      <div
        className={`ath-lb${lbOpen ? ' open' : ''}`}
        aria-hidden={!lbOpen}
        onClick={(e) => { if (e.target === e.currentTarget) closeLightbox() }}
      >
        <div className="ath-lb-inner">
          <button
            className="ath-lb-close"
            type="button"
            aria-label="Close video"
            onClick={closeLightbox}
          >
            ✕
          </button>
          {activeVideoUrl && (
            <video
              ref={videoRef}
              className="ath-lb-video"
              controls
              playsInline
              preload="metadata"
              src={activeVideoUrl}
            >
              {activeAthlete?.subtitles?.url && (
                <track
                  kind="subtitles"
                  src={getMediaUrl(activeAthlete.subtitles.url)}
                  default
                />
              )}
            </video>
          )}
        </div>
      </div>
    </>
  )
}
