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

/** TOP_OFFSET from _shared/layout.ts — the rail's resting distance from the top. */
const TOP_OFFSET = 96

/**
 * Top of a region's CONTENT, not of its box.
 *
 * Every block in the kit carries its vertical rhythm as padding on the section
 * that holds `data-help-article` (44px on Steps and on a plain Callout, 48px on
 * a Callout that joins the rail). Aligning the rail to the box top would lift it
 * into the article header sitting above — the header is centred in the viewport,
 * so the two would overlap. The content top is where the mockup's sticky sidebar
 * starts, level with the first thing in the body column.
 */
function contentTop(region: HTMLElement): number {
  const { top } = region.getBoundingClientRect()
  const pad = parseFloat(getComputedStyle(region).paddingTop)
  return top + (Number.isFinite(pad) ? pad : 0)
}

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
  // `top` follows the article body while it sits below the rail's resting
  // position, so the rail never floats beside the article header above it.
  const [rail, setRail] = useState<{ top: number; visible: boolean }>({
    top: TOP_OFFSET,
    visible: false,
  })
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

  // Show the rail while the article body is on screen, and keep it level with
  // the top of that body until the body has scrolled up past its resting
  // position. Two things this avoids: the rail floating beside the article
  // header (which is centred in the viewport and would run straight through
  // it), and the rail being invisible at the top of the page, where there is
  // obviously room for it — the mockup's sticky sidebar shows from the start.
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const regions = Array.from(document.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR))
      if (!regions.length) {
        setRail((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      const rects = regions.map((r) => r.getBoundingClientRect())
      const top = Math.min(...rects.map((r) => r.top))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      const vh = window.innerHeight

      // In view at all, and not yet scrolled off the bottom.
      const visible = top <= vh - 160 && bottom >= 260
      // Level with the top of the body column, then resting at TOP_OFFSET once
      // the body has scrolled up past it — and never pushed so far down the
      // list itself is off-screen.
      const bodyTop = Math.min(...regions.map(contentTop))
      const railTop = Math.min(Math.max(bodyTop, TOP_OFFSET), Math.max(TOP_OFFSET, vh - 180))

      setRail((prev) =>
        prev.visible === visible && Math.abs(prev.top - railTop) < 1 ? prev : { top: railTop, visible },
      )
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()

    // Measuring once on mount is not enough, and this is the bug it hides: the
    // first measurement runs before the layout has settled — web fonts swap in
    // and change the article header's height, images above the body resolve —
    // and at the top of the page no scroll event ever fires to correct the
    // rail, so it sits too high until you scroll. Re-measure on the next frame,
    // once fonts are ready, and whenever a region's box actually changes.
    let cancelled = false
    const remeasure = () => {
      if (!cancelled) update()
    }

    const settle = window.requestAnimationFrame(remeasure)
    if ('fonts' in document) void document.fonts.ready.then(remeasure)

    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onScroll)
      document.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR).forEach((r) => ro?.observe(r))
      ro.observe(document.body)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(settle)
      if (frame) window.cancelAnimationFrame(frame)
      ro?.disconnect()
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
      className={`hn-rail${rail.visible ? ' in' : ''}`}
      style={{ top: `${rail.top}px` }}
      aria-label={heading}
      data-screen-label="On this page"
    >
      <style jsx>{`
        .hn-rail {
          /* Aligned to the article column: see _shared/layout.ts.
             left = 50% - ARTICLE_MAX/2, width = RAIL. */
          position: fixed;
          /* top is set inline, from the scroll handler above — this is the
             resting value, and what a no-JS render gets. */
          top: 96px;
          left: max(24px, calc(50% - 410px));
          width: 190px;
          /* No max-height and no overflow: the rail is exactly as tall as its
             list and never scrolls inside itself. */
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
