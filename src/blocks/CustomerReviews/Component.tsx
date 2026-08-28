/* eslint-disable @next/next/no-img-element */
'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaLike = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

type Review = {
  quote?: string | null
  body?: string | null
  authorName?: string | null
  authorMeta?: string | null
  initials?: string | null
  photo?: MediaLike | number | string | null
}

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading?: any
  reviews?: Review[] | null
  seeMoreLabel?: string | null
  seeLessLabel?: string | null
  prevAriaLabel?: string | null
  nextAriaLabel?: string | null
  railAriaLabel?: string | null
}

const CARD_GAP = 20

/** First letters of the first two words, e.g. "Anna Lee" -> "AL". */
const deriveInitials = (name?: string | null): string =>
  (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()

export const CustomerReviewsComponent: React.FC<Props> = ({
  heading,
  reviews,
  seeMoreLabel,
  seeLessLabel,
  prevAriaLabel,
  nextAriaLabel,
  railAriaLabel,
}) => {
  const items = useMemo(() => reviews ?? [], [reviews])

  const railRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const bodyRefs = useRef<Array<HTMLParagraphElement | null>>([])

  const [bar, setBar] = useState({ width: 140, x: 0 })
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [overflowing, setOverflowing] = useState<Record<number, boolean>>({})

  // Read inside measure callbacks without making them depend on `expanded`.
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded

  /** Progress-bar geometry + arrow disabled state, mirrored from scroll position. */
  const update = useCallback(() => {
    const rail = railRef.current
    const track = trackRef.current
    if (!rail || !track) return

    const max = rail.scrollWidth - rail.clientWidth
    const ratio = rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1
    const width = Math.max(56, Math.round(track.clientWidth * Math.min(1, ratio)))
    const progress = max > 0 ? rail.scrollLeft / max : 0

    setBar({ width, x: progress * (track.clientWidth - width) })
    setAtStart(rail.scrollLeft <= 2)
    setAtEnd(rail.scrollLeft >= max - 2)
  }, [])

  /**
   * A "See more" toggle only makes sense when the clamped text actually overflows.
   * Expanded cards are skipped — once open they never overflow, and re-measuring
   * them would make the "See less" toggle disappear.
   */
  const measureClamp = useCallback(() => {
    setOverflowing((prev) => {
      const next = { ...prev }
      let changed = false
      bodyRefs.current.forEach((el, i) => {
        if (!el || expandedRef.current[i]) return
        const isOver = el.scrollHeight > el.clientHeight + 1
        if (next[i] !== isOver) {
          next[i] = isOver
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const measure = () => {
      update()
      measureClamp()
    }

    measure()
    // Web fonts land after first paint and change how many lines the body wraps to.
    const raf = requestAnimationFrame(measure)
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {})
    }

    const observer = new ResizeObserver(measure)
    observer.observe(rail)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [update, measureClamp, items.length])

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.firstElementChild
    const step = card ? card.getBoundingClientRect().width + CARD_GAP : 320
    rail.scrollBy({ left: direction * step, behavior: 'smooth' })
  }, [])

  const toggleExpanded = useCallback(
    (index: number) => {
      setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
      // Un-clamping changes the card height, which can change the rail's scroll width.
      requestAnimationFrame(update)
    },
    [update],
  )

  if (items.length === 0) return null

  return (
    <>
      <style jsx>{`
        /* The mockup paints the paper tone on <body>; here the block owns it, so
           the white cards keep their contrast whatever sits above and below. */
        .cvr-wrap {
          --display: 'Instrument Sans', 'Inter', system-ui, sans-serif;
          --font: 'Inter', system-ui, -apple-system, sans-serif;
          --navy: #12314d;
          --petrol: #0a8fb0;
          --paper: #f6f9fc;
          --card: #ffffff;
          --line: #e4ebf1;
          --ink-55: rgba(18, 49, 77, 0.55);
          --ink-40: rgba(18, 49, 77, 0.4);

          background: var(--paper);
        }
        .tst {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 40px 96px;
          font-family: var(--font);
          color: var(--navy);
          box-sizing: border-box;
        }
        .tst *,
        .tst :global(*) {
          box-sizing: border-box;
        }

        .tst-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 34px;
        }
        .tst-heading :global(h2),
        .tst-heading :global(p) {
          font-family: var(--display);
          font-weight: 600;
          font-size: clamp(27px, 3.2vw, 38px);
          line-height: 1.06;
          letter-spacing: -0.022em;
          color: var(--navy);
          margin: 0;
        }

        /* ── controls ── */
        .tst-arrows {
          display: flex;
          gap: 10px;
          padding-bottom: 4px;
        }
        .tst-arrow {
          width: 44px;
          height: 44px;
          flex: none;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--navy);
          display: grid;
          place-items: center;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition:
            background 0.18s,
            border-color 0.18s,
            color 0.18s,
            opacity 0.18s;
        }
        .tst-arrow:hover:not(:disabled) {
          background: var(--petrol);
          border-color: var(--petrol);
          color: #fff;
        }
        .tst-arrow:disabled {
          opacity: 0.35;
          cursor: default;
        }

        /* ── rail ── */
        .tst-rail {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 4px 2px 8px;
          margin: 0 -2px;
          align-items: stretch;
        }
        .tst-rail::-webkit-scrollbar {
          display: none;
        }
        .tst-card {
          scroll-snap-align: start;
          flex: 0 0 clamp(258px, 27%, 326px);
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 26px 24px 22px;
          display: flex;
          flex-direction: column;
        }

        .tst-quote p {
          margin: 0;
          font-family: var(--display);
          font-weight: 600;
          font-size: clamp(19px, 1.6vw, 21px);
          line-height: 1.26;
          letter-spacing: -0.018em;
          color: var(--navy);
        }
        .tst-body {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink-55);
          margin: 14px 0 0;
          white-space: pre-line;
        }
        .tst-body.is-clamped {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tst-more {
          align-self: flex-start;
          margin-top: 8px;
          padding: 0;
          background: none;
          border: 0;
          cursor: pointer;
          font-family: var(--font);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--petrol);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .tst-more:hover {
          color: var(--navy);
        }

        .tst-foot {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid var(--line);
        }
        .tst-avatar {
          position: relative;
          width: 52px;
          height: 52px;
          flex: none;
          border-radius: 999px;
          overflow: hidden;
          background: radial-gradient(circle at 50% 40%, #d9e8f3 0%, #e8f0f6 46%, #f6f3ed 100%);
          box-shadow:
            0 0 0 1px var(--line),
            0 0 0 4px #fff,
            0 0 0 5px rgba(10, 143, 176, 0.22);
        }
        .tst-avatar img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }
        .tst-avatar .mono {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: var(--display);
          font-weight: 500;
          font-size: 17px;
          letter-spacing: 0.04em;
          color: #9dbbd0;
        }
        .tst-name {
          font-family: var(--display);
          font-size: 17px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--navy);
          line-height: 1.15;
        }
        .tst-meta {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-40);
          margin-top: 6px;
        }

        /* ── progress ── */
        .tst-track {
          position: relative;
          height: 2px;
          background: var(--line);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 26px;
        }
        .tst-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: var(--petrol);
          border-radius: 999px;
        }

        @media (max-width: 860px) {
          .tst {
            padding: 56px 20px 64px;
          }
          .tst-head {
            flex-wrap: wrap;
            gap: 24px;
          }
          .tst-card {
            flex-basis: 74%;
          }
        }
      `}</style>

      <div className="cvr-wrap">
        <section className="tst">
          <div className="tst-head">
            <div className="tst-heading">
              {heading ? (
                <RichText data={heading} enableGutter={false} enableProse={false} />
              ) : null}
            </div>
            <div className="tst-arrows">
              <button
                type="button"
                className="tst-arrow"
                onClick={() => scrollByCard(-1)}
                disabled={atStart}
                aria-label={prevAriaLabel || 'Previous reviews'}
              >
                &#8592;
              </button>
              <button
                type="button"
                className="tst-arrow"
                onClick={() => scrollByCard(1)}
                disabled={atEnd}
                aria-label={nextAriaLabel || 'Next reviews'}
              >
                &#8594;
              </button>
            </div>
          </div>

          <div
            className="tst-rail"
            ref={railRef}
            onScroll={update}
            tabIndex={0}
            aria-label={railAriaLabel || 'Member reviews'}
          >
            {items.map((item, index) => {
              const photo =
                typeof item.photo === 'object' && item.photo !== null ? item.photo : null
              const photoUrl = photo?.url ? getMediaUrl(photo.url) : null
              const initials = item.initials?.trim() || deriveInitials(item.authorName)
              const isExpanded = !!expanded[index]
              const showToggle = !!item.body && (overflowing[index] || isExpanded)

              return (
                <article className="tst-card" key={index}>
                  {item.quote ? (
                    <div className="tst-quote">
                      <p>{item.quote}</p>
                    </div>
                  ) : null}

                  {item.body ? (
                    <p
                      className={`tst-body${isExpanded ? '' : ' is-clamped'}`}
                      ref={(el) => {
                        bodyRefs.current[index] = el
                      }}
                    >
                      {item.body}
                    </p>
                  ) : null}

                  {showToggle ? (
                    <button
                      type="button"
                      className="tst-more"
                      onClick={() => toggleExpanded(index)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? seeLessLabel || 'See less' : seeMoreLabel || 'See more'}
                    </button>
                  ) : null}

                  <div className="tst-foot">
                    <span className="tst-avatar">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={photo?.alt || item.authorName || ''}
                          width={photo?.width ?? undefined}
                          height={photo?.height ?? undefined}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="mono" aria-hidden="true">
                          {initials}
                        </span>
                      )}
                    </span>
                    <div>
                      <div className="tst-name">{item.authorName}</div>
                      {item.authorMeta ? <div className="tst-meta">{item.authorMeta}</div> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="tst-track" ref={trackRef}>
            <span
              className="tst-bar"
              style={{ width: `${bar.width}px`, transform: `translateX(${bar.x}px)` }}
            />
          </div>
        </section>
      </div>
    </>
  )
}
