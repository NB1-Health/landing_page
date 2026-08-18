'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import { ARCHETYPE_ICONS, RATIO_DEFS, TEAM_DEFS } from './constants'
import { ArchetypeData, ratioZone, renderRadarSvg, renderTeamsSvg, scoreNote, teamStatus, whatsShort } from './render'
import { BAND_LABELS, enumLabel } from '@/blocks/_shared/enumLabels'
import { getLRPStrings } from './i18n'
import type { AppLocale } from '@/i18n/config'

type RawSpeciesRow = { name?: string | null; percent?: number | null }
type SealRow = { number?: string | null; railLabel?: string | null; panelLabel?: string | null }
type ArchetypeRow = {
  patternId?: string | null
  name?: string | null
  card?: string | null
  density?: number | null
  score?: number | null
  band?: 'Excellent' | 'Needs work' | null
  stress?: boolean | null
  hold?: boolean | null
  teams?: {
    fibre?: number | null
    butyrate?: number | null
    crossFeeders?: number | null
    bifido?: number | null
    mucus?: number | null
    protein?: number | null
  } | null
  radar?: {
    health?: number | null
    diversity?: number | null
    metabolic?: number | null
    teamBalance?: number | null
    safety?: number | null
  } | null
  ratios?: {
    mainFuel?: number | null
    fermentation?: number | null
    gutLining?: number | null
    byproducts?: number | null
  } | null
  whats?: string | null
  focus?: DefaultTypedEditorState | null
}

export type LabReadingPanelBlockType = {
  blockType?: 'labReadingPanel'
  heading?: DefaultTypedEditorState | null
  leadIn?: DefaultTypedEditorState | null
  transitionText?: DefaultTypedEditorState | null
  rawSpeciesLabel?: string | null
  rawSpecies?: RawSpeciesRow[] | null
  rawMoreLabel?: string | null
  railLabel?: string | null
  tapHintTitle?: string | null
  tapHintSub?: string | null
  seals?: SealRow[] | null
  seeFullReadingLabel?: string | null
  seeFullReadingHint?: string | null
  tabTeamsLabel?: string | null
  tabRatiosLabel?: string | null
  tabBalanceLabel?: string | null
  teamsIntro?: string | null
  ratiosIntro?: string | null
  scoreIntro?: string | null
  archetypes?: ArchetypeRow[] | null
}

function toArchetypeData(row: ArchetypeRow): ArchetypeData {
  return {
    id: row.patternId || '',
    name: row.name || '',
    card: row.card || '',
    density: row.density ?? 1,
    score: row.score ?? 0,
    band: row.band || 'Needs work',
    stress: !!row.stress,
    hold: !!row.hold,
    teams: [
      row.teams?.fibre ?? 0,
      row.teams?.butyrate ?? 0,
      row.teams?.crossFeeders ?? 0,
      row.teams?.bifido ?? 0,
      row.teams?.mucus ?? 0,
      row.teams?.protein ?? 0,
    ],
    radar: [
      row.radar?.health ?? 0,
      row.radar?.diversity ?? 0,
      row.radar?.metabolic ?? 0,
      row.radar?.teamBalance ?? 0,
      row.radar?.safety ?? 0,
    ],
    ratios: [
      row.ratios?.mainFuel ?? 0,
      row.ratios?.fermentation ?? 0,
      row.ratios?.gutLining ?? 0,
      row.ratios?.byproducts ?? 0,
    ],
    whats: row.whats || '',
    focusHtml: '',
  }
}

type Tab = 'teams' | 'ratios' | 'score'

export const LabReadingPanelComponent: React.FC<LabReadingPanelBlockType & { locale?: AppLocale }> = ({
  locale,
  heading,
  leadIn,
  transitionText,
  rawSpeciesLabel,
  rawSpecies,
  rawMoreLabel,
  railLabel,
  tapHintTitle,
  tapHintSub,
  seals,
  seeFullReadingLabel,
  seeFullReadingHint,
  tabTeamsLabel,
  tabRatiosLabel,
  tabBalanceLabel,
  teamsIntro,
  ratiosIntro,
  scoreIntro,
  archetypes,
}) => {
  const rows = useMemo(() => archetypes ?? [], [archetypes])
  const data = useMemo(() => rows.map(toArchetypeData), [rows])
  const focusNodes = useMemo(() => rows.map((r) => r.focus ?? null), [rows])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('teams')
  const [gateOpen, setGateOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tabStickTop, setTabStickTop] = useState<number | undefined>(undefined)

  const panelRef = useRef<HTMLElement | null>(null)
  const sheetHeadRef = useRef<HTMLDivElement | null>(null)
  const detailRef = useRef<HTMLDivElement | null>(null)
  const scrimRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  useReveal(sectionRef, '.hd, .mi8-lede, .mi8-raw, .mi8-transition')

  const current = data[selectedIndex]
  const displayed = data[displayIndex] ?? current
  const S = useMemo(() => getLRPStrings(locale), [locale])
  const teamsSvgMarkup = useMemo(() => (displayed ? renderTeamsSvg(displayed) : ''), [displayed])
  const radarSvgMarkup = useMemo(() => (displayed ? renderRadarSvg(displayed, S) : ''), [displayed, S])

  useEffect(() => {
    setFading(true)
    const t = setTimeout(() => {
      setDisplayIndex(selectedIndex)
      setFading(false)
    }, 110)
    return () => clearTimeout(t)
  }, [selectedIndex])

  const syncTabsTop = useCallback(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.matchMedia('(max-width:820px)').matches
    if (isMobile && sheetHeadRef.current) {
      setTabStickTop(sheetHeadRef.current.offsetHeight)
    } else {
      setTabStickTop(undefined)
    }
  }, [])

  useEffect(() => {
    syncTabsTop()
    window.addEventListener('resize', syncTabsTop)
    const mq = window.matchMedia('(max-width:820px)')
    const onChange = (ev: MediaQueryListEvent) => {
      if (!ev.matches) {
        setSheetOpen(false)
        document.body.classList.remove('mi8-locked')
      }
      syncTabsTop()
    }
    mq.addEventListener?.('change', onChange)
    return () => {
      window.removeEventListener('resize', syncTabsTop)
      mq.removeEventListener?.('change', onChange)
    }
  }, [syncTabsTop])

  const selectArch = useCallback(
    (i: number) => {
      const n = data.length
      if (n === 0) return
      const next = ((i % n) + n) % n
      setSelectedIndex(next)
      syncTabsTop()
    },
    [data.length, syncTabsTop],
  )

  const openSheet = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia('(max-width:820px)').matches) return
    setSheetOpen(true)
    document.body.classList.add('mi8-locked')
    if (panelRef.current) panelRef.current.scrollTop = 0
    syncTabsTop()
  }, [syncTabsTop])

  const closeSheet = useCallback(() => {
    setSheetOpen(false)
    document.body.classList.remove('mi8-locked')
  }, [])

  useEffect(() => {
    return () => {
      document.body.classList.remove('mi8-locked')
    }
  }, [])

  const handleTabClick = useCallback(
    (tab: Tab) => {
      setActiveTab(tab)
      if (typeof window === 'undefined') return
      if (window.matchMedia('(max-width:820px)').matches) {
        requestAnimationFrame(() => {
          const panelEl = panelRef.current
          const detailEl = detailRef.current
          const sheetHead = sheetHeadRef.current
          if (!panelEl || !detailEl || !sheetHead) return
          const pr = panelEl.getBoundingClientRect()
          const dr = detailEl.getBoundingClientRect()
          const tabStickEl = panelEl.querySelector('.tab-stick') as HTMLElement | null
          const stick = sheetHead.offsetHeight + (tabStickEl?.offsetHeight || 0)
          panelEl.scrollTop += dr.top - pr.top - stick
        })
      }
    },
    [],
  )

  const toggleGate = useCallback(() => {
    setGateOpen((open) => {
      const next = !open
      if (next) setActiveTab('score')
      return next
    })
  }, [])

  // Swipe-down-to-dismiss on the mobile sheet header.
  useEffect(() => {
    const head = sheetHeadRef.current
    const panel = panelRef.current
    if (!head || !panel) return
    let startY = 0
    let dy = 0
    let dragging = false
    let h = 600

    const isMobile = () => window.matchMedia('(max-width:820px)').matches

    const onStart = (e: TouchEvent) => {
      if (!isMobile() || panel.scrollTop > 0) return
      const t = e.touches[0]
      startY = t.clientY
      dy = 0
      dragging = true
      h = panel.offsetHeight || 600
      panel.style.transition = 'none'
    }
    const onMove = (e: TouchEvent) => {
      if (!dragging) return
      const t = e.touches[0]
      dy = t.clientY - startY
      if (dy < 0) dy = 0
      if (dy > 0) {
        panel.style.transform = `translateY(${dy}px)`
        if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0, 1 - dy / h))
        if (e.cancelable) e.preventDefault()
      }
    }
    const onEnd = () => {
      if (!dragging) return
      dragging = false
      panel.style.transition = ''
      if (scrimRef.current) scrimRef.current.style.opacity = ''
      if (dy > 120) closeSheet()
      panel.style.transform = ''
    }

    head.addEventListener('touchstart', onStart, { passive: true })
    head.addEventListener('touchmove', onMove, { passive: false })
    head.addEventListener('touchend', onEnd)
    head.addEventListener('touchcancel', onEnd)
    return () => {
      head.removeEventListener('touchstart', onStart)
      head.removeEventListener('touchmove', onMove)
      head.removeEventListener('touchend', onEnd)
      head.removeEventListener('touchcancel', onEnd)
    }
  }, [closeSheet])

  if (data.length === 0 || !current) return null

  const chipIsExcellent = current.band === 'Excellent'

  return (
    <section
      className={['mi8', 'instrument', sheetOpen ? 'sheet-open' : ''].join(' ')}
      id="reading"
      data-screen-label="Your reading"
      style={{ background: '#F3F6F9', scrollMarginTop: 84 }}
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <style jsx>{`
        .mi8 {
          --bg: #f3f6f9;
          --card: #ffffff;
          --border: rgba(18, 49, 77, 0.1);
          --ink: #12314d;
          --ink-soft: rgba(18, 49, 77, 0.7);
          --ink-faint: rgba(18, 49, 77, 0.48);
          --t1: #0e2740;
          --t2: #15607a;
          --t3: #0a8fb0;
          --t4: #3e96be;
          --t5: #6fb8d6;
          --t6: #a9d6e8;
          --accent: #0a8fb0;
          --low: #b0832b;
          --high: #d6584a;
          --inrange: #9bb0be;
          color: var(--ink);
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          padding: 94px 0;
        }
        .wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .hd :global(h1) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(32px, 4.4vw, 52px);
          line-height: 1.04;
          letter-spacing: -0.03em;
          max-width: 20ch;
        }
        .hd :global(em) {
          font-style: normal;
          color: var(--t3);
        }
        .mi8-intro {
          display: flex;
          flex-direction: column;
          max-width: 720px;
          margin: 30px 0 64px;
        }
        .mi8-lede {
          order: 1;
          margin: 0;
          /* Body copy is Inter in the mockup (the block root defaults to
             Instrument Sans, which the em would otherwise inherit). */
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(17px, 1.95vw, 21px);
          line-height: 1.55;
          color: var(--ink-soft);
          text-wrap: pretty;
        }
        .mi8-lede :global(em) {
          font-style: normal;
          color: var(--ink);
          font-weight: 500;
        }
        .mi8-raw {
          order: 2;
          margin: 80px 0 76px;
        }
        .mi8-transition {
          order: 3;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: clamp(17px, 1.95vw, 21px);
          line-height: 1.55;
          color: var(--ink-soft);
          text-wrap: pretty;
        }
        .mi8-transition :global(strong) {
          color: var(--ink);
          font-weight: 600;
        }
        .mi8-raw-k {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }
        .mi8-raw-box {
          background: #eaeff4;
          border: 1px solid #e0e7ed;
          border-radius: 16px;
          padding: 16px 20px 14px;
        }
        .mi8-raw-list {
          display: grid;
          grid-template-columns: 1fr;
          -webkit-mask-image: linear-gradient(#000 66%, transparent);
          mask-image: linear-gradient(#000 66%, transparent);
        }
        .mi8-raw-list .rr {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 6px 0;
        }
        .mi8-raw-list .rr i {
          font-style: italic;
          font-size: 14px;
          color: var(--ink-soft);
        }
        .mi8-raw-list .rr b {
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          color: var(--ink-faint);
        }
        .mi8-raw-more {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--ink-faint);
          text-align: center;
          margin-top: 10px;
        }
        @media (max-width: 820px) {
          .mi8-intro {
            margin: 22px 0 44px;
          }
          .mi8-raw {
            margin: 26px 0 28px;
          }
        }

        .board {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          margin-top: 26px;
          align-items: stretch;
        }
        @media (min-width: 821px) {
          .mi8.instrument .board {
            background: var(--card);
            border: 1px solid #e4ebf1;
            border-radius: 24px;
            box-shadow: 0 42px 84px -54px rgba(14, 39, 56, 0.45);
            padding: 0;
            gap: 0;
            overflow: hidden;
          }
          .mi8.instrument .rail {
            padding: 24px 22px;
            border-right: 1px solid #ebeff3;
            background: #f7fafc;
          }
          .mi8.instrument .cards {
            gap: 4px;
          }
          .mi8.instrument :global(.card) {
            background: transparent;
            border: 1px solid transparent;
            border-radius: 10px;
            box-shadow: none;
          }
          .mi8.instrument :global(.card:hover) {
            background: #eef4f8;
            transform: none;
          }
          .mi8.instrument :global(.card.active) {
            background: #e3eff6;
            border-color: transparent;
            box-shadow: none;
          }
          .mi8.instrument .panel {
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: transparent;
            padding: 26px 30px;
          }
          .rail {
            display: flex;
            flex-direction: column;
          }
          .cards {
            flex: 1 1 auto;
          }
          :global(.card) {
            flex: 1 1 auto;
          }
          .panel {
            display: flex;
            flex-direction: column;
          }
          .summary {
            flex: none;
          }
          .pat-eyebrow {
            display: block;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 7px;
          }
          .tabs {
            flex: none;
          }
          .detail {
            flex: none;
            height: 314px;
          }
          .panel .seals {
            margin-top: auto;
          }
          .module {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .seals {
            flex: none;
          }
        }

        .rail-head {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }
        .cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        :global(.mi8 .card) {
          text-align: left;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 13px;
          padding: 11px 13px;
          cursor: pointer;
          font: inherit;
          color: inherit;
          display: flex;
          align-items: center;
          gap: 13px;
          transition:
            border-color 0.15s,
            box-shadow 0.15s,
            transform 0.15s;
          width: 100%;
        }
        :global(.mi8 .card:hover) {
          border-color: #bfe0ef;
          transform: translateX(2px);
        }
        :global(.mi8 .card.active) {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.12);
        }
        :global(.mi8 .card-ico) {
          flex: none;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #e7eef4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #34607d;
        }
        :global(.mi8 .card-ico svg) {
          width: 23px;
          height: 23px;
          display: block;
        }
        :global(.mi8 .card.active .card-ico) {
          background: #d8e8f1;
          color: var(--accent);
        }
        :global(.mi8 .card-tx) {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        :global(.mi8 .card-name) {
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.2;
        }
        :global(.mi8 .card-feel) {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--accent);
          line-height: 1.25;
        }
        :global(.mi8 .card-chev) {
          flex: none;
          display: none;
          font-size: 21px;
          line-height: 1;
          color: var(--ink-faint);
          padding-right: 2px;
        }
        .seals.seals-rail {
          display: none;
        }

        .panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px 26px;
        }
        .summary {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 14px 22px;
          padding-bottom: 2px;
        }
        .pat-name {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 22px;
          line-height: 1.12;
          letter-spacing: -0.01em;
          margin-bottom: 8px;
        }
        .pat-whats {
          font-size: 13.5px;
          color: var(--ink-soft);
          line-height: 1.5;
        }
        /* Hidden on mobile only. This used to be an unconditional
           display:none, which — sitting after the min-width:821px block above —
           also killed the desktop rule, hiding the eyebrow everywhere. */
        @media (max-width: 820px) {
          .pat-eyebrow {
            display: none;
          }
        }
        .block-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin: 0 0 7px;
        }
        .focus {
          font-size: 13px;
          color: var(--ink);
          line-height: 1.5;
          margin-top: 13px;
        }
        .focus :global(strong) {
          color: var(--accent);
        }
        .tabs {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          width: 100%;
          gap: 4px;
          background: #eaf0f4;
          padding: 5px;
          border-radius: 12px;
          margin: 20px 0 18px;
        }
        .tab {
          padding: 10px 22px;
          border-radius: 8px;
          font: inherit;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink-soft);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: 0.15s;
        }
        .tab.active {
          background: #fff;
          color: var(--accent);
          box-shadow: 0 1px 3px rgba(14, 39, 56, 0.13);
        }
        .tab-stick {
          display: contents;
        }
        .detail {
          min-height: 312px;
        }
        .m-sub {
          font-size: 13px;
          color: var(--ink-faint);
          margin-bottom: 14px;
          max-width: 70ch;
        }
        .module {
          display: none;
        }
        .module.shown {
          display: block;
        }
        .grid {
          display: grid;
          grid-template-columns: 0.82fr 1.18fr;
          gap: 22px;
          align-items: center;
        }
        .field :global(svg) {
          width: 100%;
          height: auto;
          overflow: visible;
          max-height: 196px;
          transition: opacity 0.22s;
        }
        .fading {
          opacity: 0;
        }
        .key-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 9px;
          padding: 6px 2px;
          border-bottom: 1px solid #eef3f7;
        }
        .key-row:last-child {
          border-bottom: none;
        }
        .swatch {
          width: 30px;
          height: 18px;
          position: relative;
        }
        .swatch i {
          position: absolute;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }
        .swatch i:nth-child(1) {
          left: 0;
          width: 7px;
          height: 7px;
          opacity: 0.55;
        }
        .swatch i:nth-child(2) {
          left: 9px;
          width: 11px;
          height: 11px;
        }
        .swatch i:nth-child(3) {
          left: 20px;
          width: 8px;
          height: 8px;
          opacity: 0.8;
        }
        .k-tx {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .k-name {
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.22;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .k-sub {
          font-size: 10.5px;
          color: var(--ink-faint);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .k-pct {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
          font-size: 15px;
          min-width: 42px;
          text-align: right;
        }
        .k-pct small {
          font-size: 10px;
          font-weight: 500;
          color: var(--ink-faint);
        }
        .k-stat {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 999px;
          white-space: nowrap;
          min-width: 60px;
          text-align: center;
        }
        .s-in {
          background: rgba(10, 143, 176, 0.13);
          color: #0a8fb0;
        }
        .s-low {
          background: #f7efd8;
          color: var(--low);
        }
        .s-high {
          background: #f7e2db;
          color: var(--high);
        }
        .ratios {
          display: flex;
          flex-direction: column;
          gap: 11px;
          transition: opacity 0.22s;
        }
        .ratio-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
          gap: 12px;
        }
        .ratio-name {
          font-size: 13.5px;
          font-weight: 600;
          white-space: nowrap;
        }
        .ratio-state {
          font-size: 12px;
          font-weight: 600;
          text-align: right;
        }
        .r-good {
          color: var(--accent);
        }
        .r-mid {
          color: var(--low);
        }
        .r-bad {
          color: var(--high);
        }
        .track {
          position: relative;
          height: 8px;
          border-radius: 999px;
          background: #e6edf2;
        }
        .track .rfill {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          border-radius: 999px;
          opacity: 0.34;
        }
        .ratio-band {
          position: absolute;
          top: 0;
          bottom: 0;
          right: 0;
          width: 40%;
          background: rgba(10, 143, 176, 0.13);
          border-radius: 0 999px 999px 0;
        }
        .marker {
          position: absolute;
          top: 50%;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid var(--accent);
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 6px -1px rgba(14, 39, 56, 0.25);
        }
        .poles {
          display: flex;
          justify-content: space-between;
          margin-top: 7px;
          font-size: 11px;
          color: var(--ink-faint);
        }
        .score {
          background: #ecf2f7;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 26px 30px;
          color: var(--ink);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 26px;
          align-items: center;
        }
        .score-num {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 68px;
          line-height: 0.9;
          letter-spacing: -0.02em;
        }
        .score-num span {
          font-size: 24px;
          color: var(--ink-faint);
        }
        .score-band {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 12px;
          border-radius: 999px;
          margin-top: 13px;
        }
        .score-note {
          font-size: 13px;
          color: var(--ink-soft);
          margin-top: 15px;
          max-width: 30ch;
          line-height: 1.5;
        }
        .score-note :global(b) {
          color: var(--accent);
          font-weight: 600;
        }
        .radar-wrap {
          justify-self: end;
          width: 100%;
          max-width: 330px;
        }
        .radar-wrap :global(svg) {
          width: 100%;
          height: auto;
          overflow: visible;
          transition: opacity 0.22s;
        }
        .seals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--border);
        }
        .seal-n {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 24px;
          letter-spacing: -0.02em;
          color: var(--accent);
          line-height: 1;
          display: block;
        }
        .seal-l {
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--ink-soft);
          margin-top: 6px;
          display: block;
        }
        .pat-head {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 2px 0 12px;
        }
        .pat-head .pat-ico {
          width: 46px;
          height: 46px;
          flex: none;
          border-radius: 12px;
          display: grid;
          place-items: center;
          color: var(--accent);
          background: rgba(10, 143, 176, 0.09);
          border: 1px solid rgba(10, 143, 176, 0.18);
        }
        .pat-head .pat-ico :global(svg) {
          width: 27px;
          height: 27px;
        }
        .pat-head .pat-name {
          margin: 0;
        }
        .pat-result {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px 20px;
          margin-top: 6px;
          padding: 17px 22px;
          background: #eef4f9;
          border: 1px solid var(--border);
          border-radius: 14px;
        }
        .pr-score {
          display: flex;
          align-items: baseline;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1;
          color: #8798a8;
          flex: none;
        }
        .pr-num {
          font-size: 29px;
        }
        .pr-den {
          font-size: 15px;
          color: #9fb0bd;
          margin-left: 1px;
        }
        .pr-chip {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          padding: 6px 13px;
          border-radius: 999px;
          flex: none;
        }
        .pr-note {
          flex: 1 1 16ch;
          min-width: 16ch;
          font-size: 14.5px;
          line-height: 1.5;
          color: var(--ink-soft);
        }
        .pr-note :global(b) {
          color: var(--ink);
          font-weight: 700;
        }
        .mi8-seam {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          text-align: center;
          background: none;
          border: none;
          border-top: 1px solid var(--border);
          margin-top: 18px;
          padding: 15px 2px;
          cursor: pointer;
          font: inherit;
          color: var(--ink);
        }
        .mi8-seam[aria-expanded='true'] {
          border-bottom: 1px solid var(--border);
        }
        .mi8-seam .ms-l {
          font-size: 15px;
          font-weight: 600;
          color: var(--accent);
        }
        .mi8-seam .ms-hint {
          font-size: 13px;
          font-weight: 500;
          color: var(--ink-faint);
        }
        .mi8-seam .ms-chev {
          margin-left: 1px;
          color: var(--accent);
          transition: transform 0.25s ease;
          display: flex;
        }
        .mi8-seam[aria-expanded='true'] .ms-chev {
          transform: rotate(180deg);
        }
        .mi8-seam:hover .ms-l {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .mi8-gate {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.32s ease;
        }
        .mi8-gate.open {
          grid-template-rows: 1fr;
        }
        .mi8-gate-in {
          overflow: hidden;
          min-height: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .mi8-gate {
            transition: none;
          }
        }

        @media (max-width: 820px) {
          .board {
            grid-template-columns: 1fr !important;
            gap: 18px;
          }
          .mi8 {
            overflow-x: hidden;
          }
          .wrap {
            padding: 0 16px;
          }
          .rail-head {
            margin-bottom: 10px;
          }
          .cards {
            display: flex;
            flex-direction: column;
            gap: 9px;
            overflow: visible;
            margin: 0;
            padding: 0;
          }
          :global(.mi8 .card) {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 13px;
            width: auto;
            min-width: 0;
            position: relative;
            padding: 11px 13px;
          }
          :global(.mi8 .card-chev) {
            display: flex;
            align-items: center;
          }
          :global(.mi8 .card-ico) {
            width: 44px;
            height: 44px;
          }
          :global(.mi8 .card-name) {
            font-size: 14px;
            line-height: 1.25;
          }
          :global(.mi8 .card-feel) {
            font-size: 13px;
            line-height: 1.3;
          }
          .panel {
            padding: 20px 18px;
          }
          .summary {
            grid-template-columns: 1fr;
            gap: 13px;
          }
          .pat-name {
            font-size: 21px;
          }
          .pat-whats {
            font-size: 14px;
          }
          .focus {
            font-size: 14px;
          }
          .tab-stick {
            display: block;
            position: sticky;
            top: 8px;
            z-index: 6;
            background: var(--card);
            margin: 0 -18px;
            padding: 14px 18px 12px;
          }
          .tabs {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: 1fr;
            width: 100%;
            margin: 0;
          }
          .tab {
            padding: 12px 0;
            font-size: 14px;
          }
          .detail {
            min-height: 0;
          }
          .m-sub {
            font-size: 13.5px;
            margin-bottom: 16px;
          }
          .grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .field :global(svg) {
            max-height: 230px;
          }
          .key-row {
            padding: 10px 2px;
            gap: 11px;
          }
          .k-name {
            font-size: 14px;
          }
          .k-sub {
            font-size: 12px;
          }
          .k-pct {
            font-size: 16.5px;
          }
          .k-stat {
            min-width: 66px;
            font-size: 11px;
          }
          .ratios {
            gap: 18px;
          }
          .ratio-top {
            flex-direction: column;
            align-items: flex-start;
            gap: 3px;
            margin-bottom: 9px;
          }
          .ratio-name {
            font-size: 14.5px;
            white-space: normal;
          }
          .ratio-state {
            font-size: 12.5px;
            text-align: left;
          }
          .poles {
            font-size: 11.5px;
            margin-top: 8px;
          }
          .score {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 18px;
            padding: 30px 24px;
          }
          .score-num {
            font-size: 62px;
          }
          .score-note {
            margin-left: auto;
            margin-right: auto;
            font-size: 14px;
          }
          .radar-wrap {
            justify-self: center;
            max-width: 310px;
          }
          .seals {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }
        }
        @media (max-width: 480px) {
          .wrap {
            padding: 0 14px;
          }
          .seals {
            grid-template-columns: 1fr;
            gap: 13px;
          }
          .score-num {
            font-size: 56px;
          }
        }

        .sheet-head {
          display: none;
        }
        .sheet-scrim {
          display: none;
        }
        .tap-hint {
          display: none;
        }
        @media (max-width: 820px) {
          :global(body.mi8-locked) {
            overflow: hidden;
          }
          .rail-head {
            display: none;
          }
          .tap-hint {
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin: 0 0 13px;
          }
          .tap-hint b {
            font-family: 'Instrument Sans', 'Inter', sans-serif;
            font-weight: 600;
            font-size: 15px;
            letter-spacing: -0.01em;
            color: var(--ink);
          }
          .tap-hint em {
            font-style: normal;
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--accent);
          }
          .panel {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            top: auto;
            height: 90vh;
            z-index: 9500;
            border: none;
            border-radius: 20px 20px 0 0;
            padding: 0 18px calc(20px + env(safe-area-inset-bottom));
            overflow-y: auto;
            transform: translateY(100%);
            transition: transform 0.36s cubic-bezier(0.32, 0.72, 0, 1);
            box-shadow: 0 -16px 50px -16px rgba(12, 30, 52, 0.4);
          }
          .mi8.sheet-open .panel {
            transform: translateY(0);
          }
          .detail {
            min-height: calc(90vh - 100px);
          }
          .sheet-scrim {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 9400;
            background: rgba(8, 18, 30, 0.42);
            opacity: 0;
            visibility: hidden;
            transition:
              opacity 0.34s,
              visibility 0.34s;
          }
          .mi8.sheet-open .sheet-scrim {
            opacity: 1;
            visibility: visible;
          }
          .sheet-head {
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            z-index: 7;
            box-sizing: border-box;
            background: var(--card);
            margin: 0 -18px;
            padding: 8px 16px 12px;
            border-bottom: 1px solid var(--border);
            border-radius: 20px 20px 0 0;
          }
          .sheet-grab {
            width: 38px;
            height: 5px;
            border-radius: 99px;
            background: #d7dee4;
            align-self: center;
            margin: 0 0 9px;
            flex: none;
          }
          .sheet-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
          }
          .sheet-title {
            flex: 1;
            min-width: 0;
            font-family: 'Instrument Sans', 'Inter', sans-serif;
            font-weight: 600;
            font-size: 14.5px;
            line-height: 1.2;
            letter-spacing: -0.01em;
            color: var(--ink);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .summary .pat-name {
            display: none;
          }
          .summary .pat-head {
            display: none;
          }
          .summary .pat-eyebrow {
            display: block;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--accent);
            margin-bottom: 6px;
          }
          .pat-result {
            padding: 15px 18px;
          }
          .pr-num {
            font-size: 26px;
          }
          .sheet-nav {
            display: flex;
            align-items: center;
            gap: 3px;
            flex: none;
          }
          .sheet-prev,
          .sheet-next {
            width: 32px;
            height: 32px;
            border: none;
            background: none;
            border-radius: 8px;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            font-size: 25px;
            color: var(--accent);
          }
          .sheet-prev:active,
          .sheet-next:active {
            background: #eaf0f4;
          }
          .sheet-count {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.02em;
            color: var(--ink-soft);
            min-width: 26px;
            text-align: center;
          }
          .summary {
            padding-top: 18px;
          }
          .panel .seals {
            display: none;
          }
          .seals.seals-rail {
            display: block;
            margin-top: 22px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
          }
          .seals-head {
            font-family: 'Instrument Sans', 'Inter', sans-serif;
            font-weight: 600;
            font-size: 15px;
            letter-spacing: -0.01em;
            color: var(--ink);
            margin: 0 0 13px;
          }
          .seals-list {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 13px;
          }
          .seals-list li {
            display: grid;
            grid-template-columns: 58px 1fr;
            align-items: baseline;
            column-gap: 13px;
          }
          .seals-list .seal-n {
            font-size: 20px;
            font-variant-numeric: tabular-nums;
          }
          .seals-list .seal-l {
            font-size: 12.5px;
            line-height: 1.45;
          }
        }
      `}</style>

      <div className="wrap">
        <header className="hd">{heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}</header>

        <div className="mi8-intro">
          {leadIn && (
            <div className="mi8-lede">
              <RichText data={leadIn as any} enableGutter={false} enableProse={false} />
            </div>
          )}
          {transitionText && (
            <div className="mi8-transition">
              <RichText data={transitionText as any} enableGutter={false} enableProse={false} />
            </div>
          )}
          {(rawSpecies?.length ?? 0) > 0 && (
            <div className="mi8-raw">
              {rawSpeciesLabel && <div className="mi8-raw-k">{rawSpeciesLabel}</div>}
              <div className="mi8-raw-box">
                <div className="mi8-raw-list" aria-hidden="true">
                  {rawSpecies?.map((sp, i) => (
                    <div className="rr" key={i}>
                      <i>{sp.name}</i>
                      <b>{sp.percent}%</b>
                    </div>
                  ))}
                </div>
                {rawMoreLabel && <div className="mi8-raw-more">{rawMoreLabel}</div>}
              </div>
            </div>
          )}
        </div>

        <div className="board">
          <aside className="rail">
            {railLabel && <div className="rail-head">{railLabel}</div>}
            {(tapHintTitle || tapHintSub) && (
              <p className="tap-hint" aria-hidden="true">
                <b>{tapHintTitle}</b>
                <em>{tapHintSub}</em>
              </p>
            )}
            <div className="cards">
              {rows.map((row, i) => (
                <button
                  key={i}
                  type="button"
                  className={['card', i === selectedIndex ? 'active' : ''].join(' ')}
                  onClick={() => {
                    selectArch(i)
                    openSheet()
                  }}
                >
                  <span
                    className="card-ico"
                    dangerouslySetInnerHTML={{ __html: (row.patternId && ARCHETYPE_ICONS[row.patternId]) || '' }}
                  />
                  <span className="card-tx">
                    <span className="card-name">{row.name}</span>
                    <span className="card-feel">{(row.card || '').toLowerCase()}</span>
                  </span>
                  <span className="card-chev" aria-hidden="true">
                    &rsaquo;
                  </span>
                </button>
              ))}
            </div>
            {seals && seals.length > 0 && (
              <div className="seals seals-rail">
                <h4 className="seals-head">{S.sealsHead}</h4>
                <ul className="seals-list">
                  {seals.map((s, i) => (
                    <li key={i}>
                      <span className="seal-n">{s.number}</span>
                      <span className="seal-l">{s.railLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <div className="sheet-scrim" ref={scrimRef} onClick={closeSheet} aria-hidden="true" />

          <section className="panel" ref={panelRef}>
            <div className="sheet-head" ref={sheetHeadRef}>
              <span className="sheet-grab" aria-hidden="true" />
              <div className="sheet-bar">
                <div className="sheet-title">{current.name}</div>
                <div className="sheet-nav">
                  <button type="button" className="sheet-prev" aria-label="Previous pattern" onClick={() => selectArch(selectedIndex - 1)}>
                    ‹
                  </button>
                  <span className="sheet-count">
                    {selectedIndex + 1}/{rows.length}
                  </span>
                  <button type="button" className="sheet-next" aria-label="Next pattern" onClick={() => selectArch(selectedIndex + 1)}>
                    ›
                  </button>
                </div>
              </div>
            </div>

            <div className="summary">
              <div>
                <div className="pat-eyebrow">{current.card}</div>
                <div className="pat-head">
                  <span className="pat-ico" dangerouslySetInnerHTML={{ __html: (current.id && ARCHETYPE_ICONS[current.id]) || '' }} />
                  <div className="pat-htx">
                    <div className="pat-name">{current.name}</div>
                  </div>
                </div>
                <div className="pat-whats">{whatsShort(current.whats)}</div>
              </div>
              <div>
                <div className="block-label">{S.focusLabel}</div>
                <div className="focus">
                  {focusNodes[selectedIndex] && (
                    <RichText data={focusNodes[selectedIndex] as any} enableGutter={false} enableProse={false} />
                  )}
                </div>
              </div>
              <div className="pat-result">
                <div className="pr-score">
                  <span className="pr-num">{current.score.toFixed(0)}</span>
                  <span className="pr-den">/100</span>
                </div>
                <div
                  className="pr-chip"
                  style={
                    chipIsExcellent
                      ? { background: 'rgba(10,143,176,.12)', color: '#0A8FB0' }
                      : { background: 'rgba(176,131,43,.14)', color: '#9A6B1E' }
                  }
                >
                  {enumLabel(BAND_LABELS, current.band, locale)}
                </div>
                <div className="pr-note" dangerouslySetInnerHTML={{ __html: scoreNote(current, S) }} />
              </div>
            </div>

            <button
              className="mi8-seam"
              type="button"
              aria-expanded={gateOpen}
              aria-controls="mi8gate"
              onClick={toggleGate}
            >
              <span className="ms-l">{seeFullReadingLabel}</span>
              <span className="ms-hint">{seeFullReadingHint}</span>
              <span className="ms-chev" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </span>
            </button>

            <div id="mi8gate" className={['mi8-gate', gateOpen ? 'open' : ''].join(' ')}>
              <div className="mi8-gate-in">
                <div className="tab-stick" style={tabStickTop !== undefined ? { top: tabStickTop } : undefined}>
                  <div className="tabs">
                    <button type="button" className={['tab', activeTab === 'teams' ? 'active' : ''].join(' ')} onClick={() => handleTabClick('teams')}>
                      {tabTeamsLabel}
                    </button>
                    <button type="button" className={['tab', activeTab === 'ratios' ? 'active' : ''].join(' ')} onClick={() => handleTabClick('ratios')}>
                      {tabRatiosLabel}
                    </button>
                    <button type="button" className={['tab', activeTab === 'score' ? 'active' : ''].join(' ')} onClick={() => handleTabClick('score')}>
                      {tabBalanceLabel}
                    </button>
                  </div>
                </div>

                <div className="detail" ref={detailRef}>
                  <div className={['module', 'module-teams', activeTab === 'teams' ? 'shown' : ''].join(' ')}>
                    {teamsIntro && <p className="m-sub">{teamsIntro}</p>}
                    <div className="grid">
                      <div className={['field', fading ? 'fading' : ''].join(' ')}>
                        <svg viewBox="0 0 460 360" role="img" aria-label="Microbe population for the selected pattern">
                          <defs dangerouslySetInnerHTML={{ __html: '<filter id="mi8soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>' }} />
                          <g dangerouslySetInnerHTML={{ __html: teamsSvgMarkup }} />
                        </svg>
                      </div>
                      <div className="key">
                        {TEAM_DEFS.map((t, i) => {
                          const st = teamStatus(displayed.teams[i], t, S)
                          return (
                            <div className="key-row" key={i}>
                              <span className="swatch">
                                <i style={{ background: `var(${t.cssVar})` }} />
                                <i style={{ background: `var(${t.cssVar})` }} />
                                <i style={{ background: `var(${t.cssVar})` }} />
                              </span>
                              <span className="k-tx">
                                <span className="k-name">{S.teams[i].name}</span>
                                <span className="k-sub">{S.teams[i].sub}</span>
                              </span>
                              <span className="k-pct">
                                {displayed.teams[i].toFixed(1)}
                                <small>%</small>
                              </span>
                              <span className={['k-stat', st.cls].join(' ')}>{st.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className={['module', 'module-ratios', activeTab === 'ratios' ? 'shown' : ''].join(' ')}>
                    {ratiosIntro && <p className="m-sub">{ratiosIntro}</p>}
                    <div className={['ratios', fading ? 'fading' : ''].join(' ')}>
                      {RATIO_DEFS.map((_ratio, i) => {
                        const pos = displayed.ratios[i]
                        const zone = ratioZone(pos, S)
                        const r = S.ratios[i]
                        return (
                          <div className="ratio" key={i}>
                            <div className="ratio-top">
                              <span className="ratio-name">{r.name}</span>
                              <span className={['ratio-state', zone.cls].join(' ')}>
                                {zone.key === 'In range' ? r.good : zone.key === 'Watch' ? S.borderline : r.bad} · {zone.label}
                              </span>
                            </div>
                            <div className="track">
                              <div className="ratio-band" />
                              <div className="rfill" style={{ width: `${pos}%`, background: zone.colorVar }} />
                              <div className="marker" style={{ left: `${pos}%`, borderColor: zone.colorVar }} />
                            </div>
                            <div className="poles">
                              <span>{r.bad}</span>
                              <span>{r.good}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className={['module', 'module-score', activeTab === 'score' ? 'shown' : ''].join(' ')}>
                    {scoreIntro && <p className="m-sub">{scoreIntro}</p>}
                    <div className="score">
                      <div>
                        <div className="score-num">
                          {displayed.score.toFixed(0)}
                          <span>/100</span>
                        </div>
                        <div
                          className="score-band"
                          style={
                            displayed.band === 'Excellent'
                              ? { background: 'rgba(10,143,176,.12)', color: '#0A8FB0' }
                              : { background: 'rgba(176,131,43,.14)', color: '#9A6B1E' }
                          }
                        >
                          {enumLabel(BAND_LABELS, displayed.band, locale)}
                        </div>
                        <div className="score-note" dangerouslySetInnerHTML={{ __html: scoreNote(displayed, S) }} />
                      </div>
                      <div className={['radar-wrap', fading ? 'fading' : ''].join(' ')}>
                        <svg viewBox="0 0 430 300" role="img" aria-label="Five-pillar score profile" dangerouslySetInnerHTML={{ __html: radarSvgMarkup }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {seals && seals.length > 0 && (
              <div className="seals">
                {seals.map((s, i) => (
                  <div key={i}>
                    <span className="seal-n">{s.number}</span>
                    <span className="seal-l">{s.panelLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
