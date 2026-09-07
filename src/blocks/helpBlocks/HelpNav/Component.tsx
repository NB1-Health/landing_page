'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

export type HelpNavBlockType = {
  blockType?: 'helpNav'
  label?: string | null
  minHeadings?: number | null
}

type Item = { id: string; text: string }

const HEADING_SELECTOR = '[data-help-heading]'
const ARTICLE_SELECTOR = '[data-help-article]'

function readHeadings(): Item[] {
  if (typeof document === 'undefined') return []
  return Array.from(document.querySelectorAll<HTMLElement>(HEADING_SELECTOR))
    .map((h) => ({ id: h.id, text: (h.textContent || '').trim() }))
    .filter((i) => i.id && i.text)
}

function sameItems(a: Item[], b: Item[]) {
  return a.length === b.length && a.every((x, i) => x.id === b[i].id && x.text === b[i].text)
}

/**
 * The sticky "On this page" rail.
 *
 * Two things about it are worth knowing before editing:
 *
 * 1. It reads the DOM rather than block data. The step headings live in a
 *    *sibling* block (`helpSteps` / `helpFaq`), and `RenderBlocks` gives each
 *    block its own subtree, so there is no prop path between them. Every step
 *    heading carries `data-help-heading`, and this component collects them after
 *    mount. A `MutationObserver` re-reads them so the rail stays correct in the
 *    admin's live preview, where blocks are re-rendered as the editor types.
 *
 * 2. It is `position: fixed`, not `position: sticky`, for the same reason —
 *    sticky positioning cannot escape its own block's subtree. It is aligned to
 *    the article column by arithmetic instead; see `_shared/layout.ts` for the
 *    numbers, which the Steps and FAQ blocks have to match.
 */
export const HelpNavComponent: React.FC<HelpNavBlockType> = ({ label, minHeadings }) => {
  const [items, setItems] = useState<Item[]>([])
  const [activeId, setActiveId] = useState('')
  const [visible, setVisible] = useState(false)
  const rescanTimer = useRef<number | undefined>(undefined)

  const heading = label || 'On this page'
  const min = typeof minHeadings === 'number' && minHeadings > 0 ? minHeadings : 2

  // Collect the headings, then keep watching for edits (live preview).
  useEffect(() => {
    const sync = () => setItems((prev) => (sameItems(prev, readHeadings()) ? prev : readHeadings()))
    sync()

    if (typeof MutationObserver === 'undefined') return
    const mo = new MutationObserver(() => {
      window.clearTimeout(rescanTimer.current)
      rescanTimer.current = window.setTimeout(sync, 150)
    })
    mo.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => {
      window.clearTimeout(rescanTimer.current)
      mo.disconnect()
    }
  }, [])

  // Highlight the heading currently in the reading band.
  useEffect(() => {
    if (!items.length || typeof IntersectionObserver === 'undefined') return
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!els.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id)
        })
      },
      { rootMargin: '-90px 0px -70% 0px' },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [items])

  // Show the rail only while the article body is on screen, so it does not
  // float over the header above it or the CTA banner below it.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const regions = Array.from(document.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR))
      if (!regions.length) {
        setVisible(false)
        return
      }
      const rects = regions.map((r) => r.getBoundingClientRect())
      const top = Math.min(...rects.map((r) => r.top))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      setVisible(top <= 120 && bottom >= 260)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  const go = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id)
    if (!el) return // let the browser handle the plain anchor
    e.preventDefault()
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${id}`)
  }, [])

  if (items.length < min) return null

  return (
    <nav
      className={`hn-rail${visible ? ' in' : ''}`}
      aria-label={heading}
      data-screen-label="On this page"
    >
      <style jsx>{`
        .hn-rail {
          /* Aligned to the article column: see _shared/layout.ts.
             left = 50% - ARTICLE_MAX/2, width = RAIL. */
          position: fixed;
          top: 96px;
          left: max(24px, calc(50% - 410px));
          width: 190px;
          max-height: calc(100vh - 140px);
          overflow-y: auto;
          z-index: 20;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.22s ease;
        }
        .hn-rail.in {
          opacity: 1;
          visibility: visible;
        }
        /* Below the rail breakpoint the article runs full width and the rail is
           dropped entirely, as in the mockup. */
        @media (max-width: 999px) {
          .hn-rail {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hn-rail {
            transition: none;
          }
        }

        .lbl {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          margin-bottom: 12px;
        }
        .hn-rail a {
          display: block;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(18, 49, 77, 0.55);
          padding: 6px 0 6px 13px;
          border-left: 2px solid rgba(18, 49, 77, 0.1);
          text-decoration: none;
        }
        .hn-rail a:hover,
        .hn-rail a.active {
          color: #0a8fb0;
          border-left-color: #0a8fb0;
        }
      `}</style>

      <div className="lbl">{heading}</div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={item.id === activeId ? 'active' : undefined}
          aria-current={item.id === activeId ? 'true' : undefined}
          onClick={(e) => go(e, item.id)}
        >
          {item.text}
        </a>
      ))}
    </nav>
  )
}
