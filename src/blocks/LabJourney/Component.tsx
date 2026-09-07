'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

type JourneyNode = { name?: string | null; desc?: string | null; timestamp?: string | null }
type OngoingNode = JourneyNode & { kind?: 'big' | 'inf' | 'gold' | null }

export type LabJourneyBlockType = {
  blockType?: 'labJourney'
  heading?: DefaultTypedEditorState | null
  sub?: string | null
  legendYourPartLabel?: string | null
  legendOurPartLabel?: string | null
  scrollCueText?: string | null
  act0Label?: string | null
  act0Heading?: string | null
  act0Body?: string | null
  act0VizValue?: string | null
  act0VizUnit?: string | null
  act1Label?: string | null
  act1Heading?: string | null
  act1Body?: string | null
  act2Label?: string | null
  act2Heading?: string | null
  act2Body?: string | null
  yourPartNodes?: JourneyNode[] | null
  labNodes?: JourneyNode[] | null
  ongoingNodes?: OngoingNode[] | null
  footNote?: DefaultTypedEditorState | null
}

export const LabJourneyComponent: React.FC<LabJourneyBlockType> = ({
  heading,
  sub,
  legendYourPartLabel,
  legendOurPartLabel,
  scrollCueText,
  act0Label,
  act0Heading,
  act0Body,
  act0VizValue,
  act0VizUnit,
  act1Label,
  act1Heading,
  act1Body,
  act2Label,
  act2Heading,
  act2Body,
  yourPartNodes,
  labNodes,
  ongoingNodes,
  footNote,
}) => {
  const yourPartRows = useMemo(() => yourPartNodes ?? [], [yourPartNodes])
  const labRows = useMemo(() => labNodes ?? [], [labNodes])
  const ongoingRows = useMemo(() => ongoingNodes ?? [], [ongoingNodes])
  const labTotal = labRows.length

  const sectionRef = useRef<HTMLElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const railVpRef = useRef<HTMLDivElement | null>(null)
  const tlRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)
  const glowRef = useRef<HTMLDivElement | null>(null)
  const labCountRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const sec = sectionRef.current
    const track = trackRef.current
    const stage = stageRef.current
    const railVp = railVpRef.current
    const tl = tlRef.current
    const fill = fillRef.current
    if (!sec || !track || !stage || !railVp || !tl || !fill) return

    const glow = glowRef.current
    const labCountEl = labCountRef.current
    const nodes = Array.from(sec.querySelectorAll<HTMLElement>('.tl-node'))
    const groups = Array.from(sec.querySelectorAll<HTMLElement>('.tlg'))
    const asides = Array.from(sec.querySelectorAll<HTMLElement>('.ap'))
    const labNodeEls = Array.from(sec.querySelectorAll<HTMLElement>('.tlg[data-ch="1"] .tl-node'))

    const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const MM = window.matchMedia ? window.matchMedia('(min-width:861px)') : ({ matches: false } as MediaQueryList)

    sec.classList.add('revready')
    let revealObserver: IntersectionObserver | null = null
    if ('IntersectionObserver' in window && !RM) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in')
              revealObserver?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.2, rootMargin: '0px 0px -5% 0px' },
      )
      sec.querySelectorAll('[data-rev]').forEach((el) => revealObserver!.observe(el))
    } else {
      sec.querySelectorAll('[data-rev]').forEach((el) => el.classList.add('in'))
    }

    let pinned = false
    let curCh = -1

    // Fill length at which the spark sits exactly on each node's dot.
    // .tl-fill::after is centred on the fill's bottom edge, so the fill has to
    // span from its own top to the dot's centre. Measured from the DOM rather
    // than hardcoded because the dot's size and offset vary by node kind
    // (.big is 20px at a different top, chapter 1 nodes use tighter padding).
    let stops: number[] = []
    function measureStops() {
      const fillTop = fill!.offsetTop
      stops = nodes.map((n) => {
        const dot = n.querySelector<HTMLElement>('.tl-dot')
        const centre = dot
          ? n.offsetTop + dot.offsetTop + dot.offsetHeight / 2
          : n.offsetTop + n.offsetHeight / 2
        return centre - fillTop
      })
      // Deliberately no stop past the last dot: the scroll ends with the spark
      // parked on the final node, leaving the short tail of rail below it unlit,
      // rather than drifting off into empty space at the bottom.
    }

    // Scroll is quantised to the dots rather than mapped continuously down the
    // rail: each node owns an equal slice of the scroll, and the spark is put
    // exactly on that node's dot for the whole slice. It is therefore always
    // sitting on a dot, never between two. The travel between stops is done by
    // a CSS height transition (see the .jxr.pinned .tl-fill rule) so the hop
    // still reads as movement instead of a jump.
    function stopIndexAt(p: number) {
      let i = Math.floor(p * stops.length)
      if (i < 0) i = 0
      if (i >= stops.length) i = stops.length - 1
      return i
    }

    function layout() {
      pinned = MM.matches && !RM
      sec!.classList.toggle('pinned', pinned)
      if (pinned) {
        tl!.style.transform = 'none'
        const stageH = stage!.offsetHeight
        // .rail-vp's CSS height:100% can't actually resolve to the stage's
        // height here — CSS Grid won't shrink an auto row below its content's
        // *unscaled* intrinsic size, so when the rail is naturally taller
        // than the stage, the row (and rail-vp) grows to fit that instead.
        // That breaks the flex centering below (it centers within the wrong,
        // inflated box), badly misaligning the scaled rail. Force the real
        // pixel height so centering — and the fit math below — use the
        // actual clipped boundary.
        railVp!.style.height = `${stageH}px`
        // offsetHeight alone undercounts the rail: the absolutely-positioned
        // fill/dot elements (.tl-fill::after sits below .tl-fill's own edge)
        // can extend past the in-flow content box, so scrollHeight — which
        // includes that overflow — is the true content height to fit.
        const railH = Math.max(tl!.offsetHeight, tl!.scrollHeight)
        // -6px extra buffer, and floor (not round) the scale factor — a
        // rounded-up k previously left the last node's bottom a hair past
        // the stage's clipped edge.
        const avail = stageH * 0.92 - 6
        let k = avail / railH
        if (k < 0.6) k = 0.6
        if (k > 1.35) k = 1.35
        k = Math.floor(k * 1000) / 1000
        tl!.style.transform = `scale(${k})`
        measureStops()
        // Scroll budget is per node, not a flat multiple of the stage: with a
        // fixed 1.4x the 12 stops here got ~105px each, about one wheel notch,
        // so a single flick could jump two stops and the height transition
        // would animate straight past the node in between. PER_NODE keeps each
        // stop a comfortable scroll apart however many nodes the page has.
        const PER_NODE = 170
        const scrollLen = Math.max(Math.round(stageH * 1.4), stops.length * PER_NODE)
        track!.style.height = `${stageH + scrollLen}px`
      } else {
        railVp!.style.height = ''
        track!.style.height = ''
        tl!.style.transform = ''
        // The unpinned rail snaps to the dots as well, so it needs the stops too.
        measureStops()
      }
    }

    function applyState(act: number) {
      if (act !== curCh) {
        curCh = act
        asides.forEach((a, i) => a.classList.toggle('on', i === act))
        const warm = act === 1
        fill!.classList.toggle('warm', warm)
        if (glow) glow.classList.toggle('warm', warm)
      }
    }

    if (RM) {
      fill.style.height = `${tl.scrollHeight}px`
      nodes.forEach((n) => n.classList.add('lit'))
      if (labCountEl) labCountEl.textContent = String(labTotal)
    }

    let ticking = false
    function frame() {
      ticking = false
      let act = 0
      if (pinned) {
        const denom = track!.offsetHeight - stage!.offsetHeight || 1
        let p = -track!.getBoundingClientRect().top / denom
        p = p < 0 ? 0 : p > 1 ? 1 : p
        const idx = stops.length ? stopIndexAt(p) : -1
        const revealY = idx >= 0 ? stops[idx] : p * (tl!.offsetHeight + 50)
        fill!.style.height = `${Math.min(revealY, tl!.offsetHeight).toFixed(1)}px`
        for (let i = 0; i < nodes.length; i++) {
          // Lit by index, so the pop fires on exactly the node the spark is on.
          const at =
            idx >= 0 ? i <= idx : nodes[i].offsetTop + nodes[i].offsetHeight * 0.5 < revealY
          nodes[i].classList.toggle('lit', at)
        }
        for (let g = 0; g < groups.length; g++) {
          if (groups[g].offsetTop < revealY) act = g
        }
      } else {
        const vh = window.innerHeight || document.documentElement.clientHeight
        const lineY = vh * 0.52
        const rTop = tl!.getBoundingClientRect().top
        // Where the reading line falls inside the rail, then snapped back to the
        // last dot it has passed — so the spark rests on a dot here too rather
        // than wherever the line happens to sit. -1 means it has not reached the
        // first dot yet, and the rail stays empty.
        const linePos = lineY - rTop
        let idx = -1
        for (let i = 0; i < stops.length; i++) if (stops[i] <= linePos) idx = i
        let fh = idx >= 0 ? stops[idx] : 0
        if (!stops.length) {
          fh = linePos
          if (fh < 0) fh = 0
        }
        if (fh > tl!.offsetHeight) fh = tl!.offsetHeight
        fill!.style.height = `${fh.toFixed(1)}px`
        for (let i = 0; i < nodes.length; i++) {
          const at = stops.length
            ? i <= idx
            : nodes[i].getBoundingClientRect().top + nodes[i].getBoundingClientRect().height * 0.5 < lineY
          nodes[i].classList.toggle('lit', at)
        }
        for (let g = 0; g < groups.length; g++) {
          if (groups[g].getBoundingClientRect().top < lineY) act = g
        }
      }
      if (labCountEl) {
        let n = 0
        for (let j = 0; j < labNodeEls.length; j++) if (labNodeEls[j].classList.contains('lit')) n++
        labCountEl.textContent = String(n)
      }
      applyState(act)
    }
    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(frame)
      }
    }
    function onResize() {
      layout()
      onScroll()
    }

    if (!RM) {
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize)
      layout()
      frame()
      const t1 = setTimeout(() => {
        layout()
        frame()
      }, 250)
      const t2 = setTimeout(() => {
        layout()
        frame()
      }, 800)
      return () => {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onResize)
        clearTimeout(t1)
        clearTimeout(t2)
        revealObserver?.disconnect()
      }
    }

    return () => {
      revealObserver?.disconnect()
    }
  }, [labTotal])

  return (
    <section className="jxr" data-screen-label="The journey" ref={sectionRef as React.RefObject<HTMLElement>}>
      <style jsx>{`
        .jxr {
          background: linear-gradient(180deg, #0e2740 0%, #0a1c30 52%, #0b2138 100%);
          color: #c6d2de;
          padding: 0;
          overflow: visible;
          --teal: #5bc0d8;
          --amber: #e8b53a;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
        }
        .jxr-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: clamp(64px, 7vw, 116px) clamp(20px, 4vw, 48px) clamp(80px, 8vw, 130px);
        }
        .jxr-head {
          text-align: center;
          max-width: 660px;
          margin: 0 auto;
        }
        .jxr :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          color: #eaf3f8;
          font-size: clamp(30px, 4.2vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .jxr :global(em) {
          font-style: normal;
          color: var(--teal);
        }
        .jxr-sub {
          font-size: clamp(16px, 1.5vw, 18px);
          color: #93a7bb;
          line-height: 1.6;
          max-width: 56ch;
          margin: 18px auto 0;
        }
        .jxr-legend {
          display: inline-flex;
          gap: 26px;
          margin: 22px auto 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
        }
        .jxr-legend b {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        .jxr-legend .sw {
          width: 11px;
          height: 11px;
          border-radius: 50%;
        }
        .lg-you {
          color: var(--teal);
        }
        .lg-you .sw {
          background: var(--teal);
          box-shadow: 0 0 8px rgba(91, 192, 216, 0.7);
        }
        .lg-lab {
          color: var(--amber);
        }
        .lg-lab .sw {
          background: var(--amber);
          box-shadow: 0 0 8px rgba(232, 181, 58, 0.7);
        }
        .jxr-scrollcue {
          display: block;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5f7d95;
          margin: 16px 0 0;
        }

        .jxr-track {
          position: relative;
        }
        .jxr-stage {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: clamp(36px, 5vw, 84px);
          align-items: stretch;
        }
        .jxr.pinned .jxr-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          /* Clips the rail, which is taller than the stage. overflow cannot be
             hidden on one axis and visible on the other, so it clips sideways
             too -- and the aside's viz sits flush against this left edge, which
             sliced the .pulse ring (inset:0 animating to scale(1.15), so ~10px
             proud of the 130px box) flat on its left. The padding moves the clip
             boundary out; the matching negative margin puts the content back
             where it was, so nothing shifts. */
          overflow: hidden;
          padding-left: 20px;
          margin-left: -20px;
        }

        .jxr-aside {
          position: relative;
          display: flex;
          align-items: center;
        }
        .aside-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          left: -40px;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 50%;
          filter: blur(46px);
          opacity: 0.5;
          transition: background 0.6s ease;
          background: radial-gradient(circle, rgba(91, 192, 216, 0.5), transparent 70%);
          pointer-events: none;
        }
        .aside-glow.warm {
          background: radial-gradient(circle, rgba(232, 181, 58, 0.42), transparent 70%);
        }
        .aside-stack {
          position: relative;
          width: 100%;
          min-height: 430px;
        }
        .ap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          opacity: 0;
          transform: translateY(12px);
          transition:
            opacity 0.55s ease,
            transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
          pointer-events: none;
        }
        .ap.on {
          opacity: 1;
          transform: none;
        }
        .ap-k {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin: 26px 0 0;
        }
        .ap-k::before {
          content: '';
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
          opacity: 0.92;
        }
        .ap0 .ap-k,
        .ap2 .ap-k {
          color: var(--teal);
        }
        .ap1 .ap-k {
          color: var(--amber);
        }
        .ap-h {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(24px, 2.6vw, 33px);
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: #eaf3f8;
          margin: 12px 0 0;
        }
        .ap-d {
          font-size: 15px;
          line-height: 1.6;
          color: #93a7bb;
          margin: 12px 0 0;
          max-width: 34ch;
        }
        .viz {
          position: relative;
          width: 130px;
          height: 130px;
        }
        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(120, 160, 190, 0.18);
        }
        .ring.spin::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--amber);
          border-right-color: rgba(232, 181, 58, 0.5);
          animation: jxspin 2.2s linear infinite;
        }
        @keyframes jxspin {
          to {
            transform: rotate(360deg);
          }
        }
        .ring-num {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 2px;
        }
        .ring-num .count {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 46px;
          line-height: 1;
          color: #eaf3f8;
        }
        .ring-den {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 19px;
          color: #c99a3a;
        }
        .pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid var(--teal);
          opacity: 0;
          animation: jxpulse 2.6s ease-out infinite;
        }
        .pulse.d2 {
          animation-delay: 1.3s;
        }
        @keyframes jxpulse {
          0% {
            transform: scale(0.55);
            opacity: 0.7;
          }
          80% {
            opacity: 0;
          }
          100% {
            transform: scale(1.15);
            opacity: 0;
          }
        }
        .viz-c {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 30px;
          color: var(--teal);
        }
        .viz-c span {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #7f95a8;
          margin-top: 3px;
        }
        .inf {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          color: var(--teal);
          animation: jxbreathe 3s ease-in-out infinite;
        }
        @keyframes jxbreathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        .rail-vp {
          position: relative;
        }
        .jxr.pinned .rail-vp {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .tl {
          position: relative;
          padding-left: 64px;
          max-width: 560px;
          transform-origin: center center;
        }
        .tl-rail {
          position: absolute;
          left: 24px;
          top: 6px;
          bottom: 8px;
          width: 2px;
          background: rgba(120, 160, 190, 0.15);
          border-radius: 2px;
        }
        .tl-fill {
          position: absolute;
          left: 24px;
          top: 6px;
          width: 2px;
          height: 0;
          border-radius: 2px;
          background: linear-gradient(#8ecae6, #5bc0d8 45%, #2e86c1);
          box-shadow: 0 0 14px rgba(91, 192, 216, 0.5);
          /* The fill only ever targets a dot position, in both the pinned and
             the unpinned rail, so this height transition is what renders the hop
             from one dot to the next as movement rather than a jump. */
          transition:
            height 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
            background 0.5s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .tl-fill {
            transition: none;
          }
        }
        .tl-fill.warm {
          background: linear-gradient(#f2cf6b, #e8b53a 45%, #c7961f);
          box-shadow: 0 0 14px rgba(232, 181, 58, 0.5);
        }
        .tl-fill::after {
          content: '';
          position: absolute;
          left: -4px;
          bottom: -5px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #dff4fa;
          box-shadow: 0 0 10px 3px rgba(143, 202, 230, 0.85);
          transition:
            background 0.5s ease,
            box-shadow 0.5s ease;
        }
        .tl-fill.warm::after {
          background: #fbe7bf;
          box-shadow: 0 0 10px 3px rgba(242, 207, 107, 0.85);
        }
        .tlg-label {
          display: none;
        }
        .tl-node {
          position: relative;
          padding: 15px 0;
        }
        .tlg[data-ch='1'] .tl-node {
          padding: 10px 0;
        }
        .tl-dot {
          position: absolute;
          left: -45px;
          top: 16px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #123049;
          border: 1.5px solid rgba(120, 160, 190, 0.4);
          transition:
            background 0.4s ease,
            border-color 0.4s ease,
            box-shadow 0.4s ease;
        }
        .tl-node.lit .tl-dot {
          animation: jxpop 0.5s ease;
        }
        @keyframes jxpop {
          0% {
            transform: scale(1);
          }
          42% {
            transform: scale(1.55);
          }
          100% {
            transform: scale(1);
          }
        }
        .tl-node.you.lit .tl-dot {
          background: var(--teal);
          border-color: var(--teal);
          box-shadow: 0 0 15px rgba(91, 192, 216, 0.85);
        }
        .tl-node.lab.lit .tl-dot {
          background: var(--amber);
          border-color: var(--amber);
          box-shadow: 0 0 15px rgba(232, 181, 58, 0.85);
        }
        .tl-node.big.lit .tl-dot {
          background: #eaf3f8;
          border-color: #eaf3f8;
          box-shadow: 0 0 16px rgba(238, 244, 248, 0.9);
        }
        .tl-node.gold.lit .tl-dot {
          background: var(--amber);
          border-color: var(--amber);
          box-shadow: 0 0 15px rgba(232, 181, 58, 0.85);
        }
        .tl-node.big .tl-dot {
          width: 20px;
          height: 20px;
          left: -47px;
          top: 15px;
        }
        .tl-node.inf .tl-dot {
          background: transparent;
          border-style: dashed;
        }
        .tl-node.inf.lit .tl-dot {
          background: transparent;
          border-color: var(--teal);
          box-shadow: none;
          animation: none;
        }
        .n-k {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 15.5px;
          letter-spacing: 0.03em;
          color: #eaf3f8;
        }
        .tl-node.lab .n-k {
          color: #f3ddaa;
        }
        .tl-node.gold .n-k {
          color: var(--amber);
        }
        .n-d {
          font-size: 14px;
          line-height: 1.5;
          color: #93a7bb;
          margin-top: 4px;
        }
        .n-t {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6f8698;
          margin-top: 7px;
        }
        .tl-node.lab {
          opacity: 0.5;
          transition: opacity 0.4s ease;
        }
        .tl-node.lab.lit {
          opacity: 1;
        }

        .jxr-foot {
          text-align: center;
          max-width: 64ch;
          margin: clamp(40px, 5vw, 72px) auto 0;
          font-size: 15px;
          color: #9aadc0;
          line-height: 1.6;
        }
        .jxr-foot :global(strong) {
          color: #eaf3f8;
          font-weight: 600;
        }
        /* A rich-text color mark wraps the bold word in <span style="color:…">;
           the rule above sets color directly on the nested <strong>, which
           beats the color it would inherit from the span — forcing e.g. the
           gold "Advanced" back to white. Let a colored span win. */
        .jxr-foot :global(span[style*='color'] strong) {
          color: inherit;
        }
        .jxr.revready [data-rev] {
          opacity: 0;
          transform: translateY(14px);
        }
        .jxr [data-rev] {
          transition:
            opacity 0.55s ease,
            transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .jxr [data-rev].in {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .jxr.revready [data-rev] {
            opacity: 1;
            transform: none;
          }
          .ring.spin::before,
          .pulse,
          .inf {
            animation: none;
          }
        }
        @media (max-width: 860px) {
          .jxr-stage {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .jxr-aside {
            display: none;
          }
          .tl {
            max-width: 600px;
            margin: 0 auto;
          }
          .tlg-label {
            display: block;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12.5px;
            font-weight: 600;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            margin: 34px 0 16px;
          }
          .tlg[data-ch='0'] .tlg-label,
          .tlg[data-ch='2'] .tlg-label {
            color: var(--teal);
          }
          .tlg[data-ch='1'] .tlg-label {
            color: var(--amber);
          }
        }
      `}</style>

      <div className="jxr-inner">
        <header className="jxr-head">
          {heading && (
            <div data-rev="">
              <RichText data={heading as any} enableGutter={false} enableProse={false} />
            </div>
          )}
          {sub && (
            <p className="jxr-sub" data-rev="">
              {sub}
            </p>
          )}
          <div className="jxr-legend" data-rev="">
            <b className="lg-you">
              <span className="sw" />
              {legendYourPartLabel}
            </b>
            <b className="lg-lab">
              <span className="sw" />
              {legendOurPartLabel}
            </b>
          </div>
          {scrollCueText && (
            <span className="jxr-scrollcue" data-rev="" aria-hidden="true">
              {scrollCueText}
            </span>
          )}
        </header>

        <div className="jxr-track" ref={trackRef}>
          <div className="jxr-stage" ref={stageRef}>
            <div className="jxr-aside">
              <div className="aside-glow" ref={glowRef} />
              <div className="aside-stack">
                <div className="ap ap0 on">
                  <div className="viz">
                    <div className="pulse" />
                    <div className="pulse d2" />
                    <div className="ring" />
                    <div className="viz-c">
                      {act0VizValue}
                      <span>{act0VizUnit}</span>
                    </div>
                  </div>
                  <p className="ap-k">{act0Label}</p>
                  <h3 className="ap-h">{act0Heading}</h3>
                  <p className="ap-d">{act0Body}</p>
                </div>
                <div className="ap ap1">
                  <div className="viz">
                    <div className="ring spin" />
                    <div className="ring-num">
                      <span className="count" ref={labCountRef}>
                        0
                      </span>
                      <span className="ring-den">/{labTotal}</span>
                    </div>
                  </div>
                  <p className="ap-k">{act1Label}</p>
                  <h3 className="ap-h">{act1Heading}</h3>
                  <p className="ap-d">{act1Body}</p>
                </div>
                <div className="ap ap2">
                  <div className="viz">
                    <div className="ring" />
                    <div className="inf">∞</div>
                  </div>
                  <p className="ap-k">{act2Label}</p>
                  <h3 className="ap-h">{act2Heading}</h3>
                  <p className="ap-d">{act2Body}</p>
                </div>
              </div>
            </div>

            <div className="rail-vp" ref={railVpRef}>
              <div className="tl" ref={tlRef}>
                <div className="tl-rail" aria-hidden="true" />
                <div className="tl-fill" aria-hidden="true" ref={fillRef} />

                <div className="tlg" data-ch="0">
                  <div className="tlg-label">{legendYourPartLabel}</div>
                  {yourPartRows.map((n, i) => (
                    <div className="tl-node you" data-rev="" key={i}>
                      <span className="tl-dot" />
                      <div className="tl-body">
                        <div className="n-k">{n.name}</div>
                        {n.desc && <div className="n-d">{n.desc}</div>}
                        {n.timestamp && <div className="n-t">{n.timestamp}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tlg" data-ch="1">
                  <div className="tlg-label">{act1Label}</div>
                  {labRows.map((n, i) => (
                    <div className="tl-node lab" data-rev="" key={i}>
                      <span className="tl-dot" />
                      <div className="tl-body">
                        <div className="n-k">{n.name}</div>
                        {n.desc && <div className="n-d">{n.desc}</div>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tlg" data-ch="2">
                  <div className="tlg-label">{act2Label}</div>
                  {ongoingRows.map((n, i) => (
                    <div className={['tl-node', n.kind || 'big'].join(' ')} data-rev="" key={i}>
                      <span className="tl-dot" />
                      <div className="tl-body">
                        <div className="n-k">{n.name}</div>
                        {n.desc && <div className="n-d">{n.desc}</div>}
                        {n.timestamp && <div className="n-t">{n.timestamp}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {footNote && (
          <div className="jxr-foot" data-rev="">
            <RichText data={footNote as any} enableGutter={false} enableProse={false} />
          </div>
        )}
      </div>
    </section>
  )
}
