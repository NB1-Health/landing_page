'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { SOURCE_ICONS } from './constants'
import { BLEND_INNER_SVG, BLEND_VIEWBOX, ROD_ICON_INNER, SCENE_INNER_SVG, SCENE_VIEWBOX } from './art'
import type { AppLocale } from '@/i18n/config'
import { getFormulaStrings } from './i18n'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined

type JobAdd = { condition?: string | null; strain?: string | null }
type JobMember = { name?: string | null; note?: string | null }
type Job = {
  name?: string | null
  sourceType?: 'sample' | 'quest' | null
  trigger?: string | null
  mode?: 'flex' | 'combo' | null
  leadName?: string | null
  leadNote?: string | null
  adds?: JobAdd[] | null
  comboCaption?: string | null
  members?: JobMember[] | null
}
type BlendRow = { name?: string | null; position?: number | null }

export type LabFormulaBlockType = {
  blockType?: 'labFormula'
  eyebrow?: string | null
  heading?: DefaultTypedEditorState | null
  lede?: string | null
  stage1Label?: string | null
  stage1Sub?: string | null
  liveCulturesLabel?: string | null
  liveCulturesText?: string | null
  prebioticsLabel?: string | null
  prebioticsText?: string | null
  combinedLabel?: string | null
  combinedText?: string | null
  stage2Label?: string | null
  stage2Heading?: string | null
  stage2Intro?: DefaultTypedEditorState | null
  jobsScopeLabel?: string | null
  jobsMoreLabel?: string | null
  jobsMoreMobileNote?: string | null
  workedDetailLabel?: string | null
  workedFootNote?: DefaultTypedEditorState | null
  jobs?: Job[] | null
  stage3Label?: string | null
  stage3Heading?: string | null
  stage3Intro?: string | null
  blendRows?: BlendRow[] | null
  notInBlendLabel?: string | null
  notInBlendNote?: string | null
  blendCaption?: DefaultTypedEditorState | null
  quoteText?: DefaultTypedEditorState | null
  quoteAuthorImage?: MediaLike
  quoteAuthorName?: string | null
  quoteAuthorInst?: string | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

const RodIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 34 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ROD_ICON_INNER }} />
)

export const LabFormulaComponent: React.FC<LabFormulaBlockType & { locale?: AppLocale }> = ({
  locale,
  eyebrow,
  heading,
  lede,
  stage1Label,
  stage1Sub,
  liveCulturesLabel,
  liveCulturesText,
  prebioticsLabel,
  prebioticsText,
  combinedLabel,
  combinedText,
  stage2Label,
  stage2Heading,
  stage2Intro,
  jobsScopeLabel,
  jobsMoreLabel,
  jobsMoreMobileNote,
  workedDetailLabel,
  workedFootNote,
  jobs,
  stage3Label,
  stage3Heading,
  stage3Intro,
  blendRows,
  notInBlendLabel,
  notInBlendNote,
  blendCaption,
  quoteText,
  quoteAuthorImage,
  quoteAuthorName,
  quoteAuthorInst,
}) => {
  const F = useMemo(() => getFormulaStrings(locale), [locale])
  // Inject the localized captions/labels into the verbatim art SVGs (same
  // string-replace approach as the comparison figure). The dose labels are
  // lower-cased to match the original axis styling.
  const sceneSvg = useMemo(
    () =>
      SCENE_INNER_SVG.replace('On its own, it washes through', F.sceneWashesThrough).replace(
        'Fed the right fibre, it stays and works',
        F.sceneStaysWorks,
      ),
    [F],
  )
  const blendSvg = useMemo(
    () =>
      BLEND_INNER_SVG.replace('>too much<', `>${F.doseTooMuch.toLowerCase()}<`)
        .replace('>right for you<', `>${F.doseRightForYou.toLowerCase()}<`)
        .replace('>too little<', `>${F.doseTooLittle.toLowerCase()}<`),
    [F],
  )
  // Keyed by the same closed source-type set as SOURCE_ICONS, so a job with no
  // sourceType set still lands on the sample pill.
  const sourceLabels = useMemo<Record<'sample' | 'quest', string>>(
    () => ({ sample: F.sourceSample, quest: F.sourceQuest }),
    [F],
  )
  const jobRows = useMemo(() => jobs ?? [], [jobs])
  const [selectedJob, setSelectedJob] = useState(0)
  const [displayedJob, setDisplayedJob] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    setFading(true)
    const t = setTimeout(() => {
      setDisplayedJob(selectedJob)
      setFading(false)
    }, 120)
    return () => clearTimeout(t)
  }, [selectedJob])

  const quoteRef = useRef<HTMLElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  useReveal(sectionRef, '.eyebrow, h2, .lede')
  useReveal(sectionRef, '.stage, .pillar', 'rvf')
  const [quoteVisible, setQuoteVisible] = useState(false)
  useEffect(() => {
    const el = quoteRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setQuoteVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setQuoteVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const job = jobRows[displayedJob]

  return (
    <section
      className="lab-formula"
      id="formula"
      style={{ background: '#F7F9FB', scrollMarginTop: 80 }}
      ref={sectionRef as React.RefObject<HTMLElement>}
    >
      <style jsx>{`
        .lab-formula {
          --card: #ffffff;
          --border: rgba(18, 49, 77, 0.1);
          --ink: #12314d;
          --ink-soft: rgba(18, 49, 77, 0.7);
          --ink-faint: rgba(18, 49, 77, 0.48);
          --accent: #0a8fb0;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          color: var(--ink);
          padding: 94px 0;
        }
        .wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 32px;
        }
        @media (max-width: 860px) {
          .wrap {
            padding: 0 22px;
          }
        }
        .eyebrow {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .eyebrow::before {
          content: '';
          width: 28px;
          height: 1.5px;
          background: var(--accent);
        }
        .lab-formula :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4.6vw, 52px);
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 0 0 14px;
          max-width: 17ch;
        }
        .lab-formula :global(em) {
          font-style: normal;
          color: var(--accent);
        }
        .lede {
          font-size: 17px;
          line-height: 1.6;
          color: var(--ink-soft);
          max-width: 60ch;
        }
        .frm-beats {
          position: relative;
          padding-left: 48px;
          margin-top: 22px;
        }
        .frm-beats::before {
          content: '';
          position: absolute;
          left: 17px;
          top: 4px;
          bottom: 10px;
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(10, 143, 176, 0.28) 5%, rgba(10, 143, 176, 0.28) 95%, transparent);
        }
        @media (max-width: 560px) {
          .frm-beats {
            padding-left: 38px !important;
          }
          .frm-beats::before {
            left: 13px;
          }
        }
        .plabel {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
          position: relative;
        }
        .plabel::before {
          content: '';
          width: 18px;
          height: 1.5px;
          background: var(--accent);
          display: inline-block;
        }
        .plabel .bn {
          font-variant-numeric: tabular-nums;
          opacity: 1;
          position: absolute;
          left: -48px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid rgba(10, 143, 176, 0.4);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 2px 9px -4px rgba(18, 49, 77, 0.22);
        }
        @media (max-width: 560px) {
          .plabel .bn {
            left: -38px;
            width: 28px;
            height: 28px;
            font-size: 11px;
            opacity: 0.85;
          }
        }
        .stage {
          margin-top: 30px;
        }
        .stage-sub {
          font-size: 14px;
          color: var(--ink-faint);
          margin-bottom: 6px;
        }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 26px 30px 24px;
          margin-top: 18px;
        }
        .scene {
          width: 100%;
          height: auto;
          display: block;
          max-width: 760px;
          margin: 4px auto 0;
          overflow: visible;
        }
        .eq-mobile {
          display: none;
        }
        .defs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 22px;
          margin-top: 6px;
        }
        .def-term {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .def-term :global(svg) {
          width: 22px;
          height: auto;
          color: #0a8fb0;
        }
        .def-term i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: none;
          display: inline-block;
        }
        .def.sum .def-term {
          color: var(--accent);
        }
        .def-text {
          font-size: 13px;
          line-height: 1.5;
          color: var(--ink-soft);
        }
        @media (max-width: 760px) {
          .defs {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        @media (max-width: 560px) {
          .scene,
          .defs {
            display: none;
          }
          .eq-mobile {
            display: block;
            margin-top: 16px;
          }
          .card {
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 0;
          }
        }
        .eq-mobile .ing {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 18px;
        }
        .eq-mobile .ing-vis {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .eq-mobile .ing-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .eq-mobile .ing-name .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--accent);
          flex: none;
        }
        .eq-mobile .ing-desc {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin-top: 7px;
        }
        .eq-mobile .ing-cap {
          font-size: 12.5px;
          color: var(--ink-faint);
          margin-top: 9px;
        }
        .eq-mobile .ing-cap.win {
          color: var(--accent);
        }
        .eq-mobile .op {
          text-align: center;
          font-size: 22px;
          color: var(--ink-faint);
          padding: 9px 0;
        }
        .eq-mobile .ing-syn {
          border-color: #cfe3ec;
          background: linear-gradient(180deg, #f3f9fc, #fff);
        }

        .pillar {
          margin-top: 48px;
          position: relative;
          border-top: 1px solid var(--border);
          padding-top: 48px;
        }
        /* Pillar sub-headings. Scoped through .lab-formula so it out-specifies
           the section-title h2 rule above (which would otherwise force these
           into the title size 30-52 and weight 600). Mockup pillar heading is
           clamp(24-32) at the browser-default bold 700. */
        .lab-formula :global(.ph) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0 0 10px;
          max-width: 22ch;
        }
        .pintro {
          font-size: 15px;
          line-height: 1.6;
          color: var(--ink-soft);
          max-width: 64ch;
        }
        .pintro :global(strong) {
          color: var(--ink);
          font-weight: 600;
        }
        .scope {
          margin-top: 22px;
        }
        .scope-l {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 11px;
        }
        .scope-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        @media (max-width: 560px) {
          .scope-tags {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding: 2px 2px 8px;
            margin: 0 -2px;
            /* Mockup scrolls the pills horizontally on mobile but hides the
               scrollbar (Firefox / IE-Edge / WebKit). */
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .scope-tags::-webkit-scrollbar {
            display: none;
          }
        }
        .scope-more {
          display: none;
          margin-top: 11px;
          font-size: 12.5px;
          color: var(--ink-faint);
        }
        @media (max-width: 560px) {
          .scope-more {
            display: block;
          }
          .jtag.more {
            display: none;
          }
        }
        .jtag {
          font: inherit;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--ink-soft);
          background: #eff3f6;
          border: 1px solid #e4ecf1;
          padding: 6px 13px;
          border-radius: 999px;
          cursor: pointer;
          transition:
            background 0.15s,
            border-color 0.15s,
            color 0.15s;
          white-space: nowrap;
        }
        .jtag:hover {
          border-color: #bfe0ef;
          color: var(--ink);
        }
        .jtag.on {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          font-weight: 600;
        }
        .jtag.more {
          background: none;
          border: 1px dashed #cfdde7;
          color: var(--ink-faint);
          cursor: default;
        }
        .worked {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px 24px 22px;
          margin-top: 14px;
          transition: opacity 0.18s;
        }
        .worked.fading {
          opacity: 0;
        }
        .worked-l {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 9px;
        }
        .worked-job {
          font-size: 18px;
          font-weight: 600;
        }
        .trigger {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px 10px;
          font-size: 13.5px;
          color: var(--ink-soft);
          line-height: 1.5;
          margin-top: 8px;
        }
        .src {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #15607a;
          background: #eaf4f9;
          border: 1px solid #d5e8f1;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .src :global(svg) {
          width: 11px;
          height: 11px;
        }
        .strain {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }
        .strain.anchor {
          margin-top: 20px;
        }
        :global(.rod) {
          flex: none;
          width: 30px;
          height: auto;
          margin-top: 1px;
          color: var(--accent);
        }
        .strain.cond :global(.rod) {
          width: 25px;
          color: #c2d6e2;
        }
        .s-name {
          display: block;
          font-size: 15px;
          font-weight: 600;
        }
        .strain.cond .s-name {
          font-size: 14px;
        }
        .s-note {
          display: block;
          font-size: 12.5px;
          color: var(--ink-faint);
          margin-top: 2px;
          line-height: 1.45;
        }
        .s-cond {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          color: #15607a;
          margin-bottom: 1px;
        }
        .worked-cap {
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-top: 18px;
          line-height: 1.5;
        }
        .flex-row {
          display: flex;
          gap: 22px 30px;
          margin-top: 15px;
          flex-wrap: wrap;
        }
        .flex-row .strain {
          flex: 1 1 200px;
        }
        .worked-foot {
          font-size: 13px;
          color: var(--ink-soft);
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eef3f7;
          line-height: 1.55;
        }
        .worked-foot :global(strong) {
          color: var(--ink);
          font-weight: 600;
        }

        .blend {
          margin-top: 22px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 24px 26px 20px;
        }
        .blend :global(svg.blend-svg) {
          width: 100%;
          height: auto;
          display: block;
        }
        .blend-bands {
          display: none;
        }
        @media (max-width: 560px) {
          .blend :global(svg.blend-svg) {
            display: none;
          }
          .blend-bands {
            display: block;
          }
        }
        .blend-cap {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin-top: 16px;
          max-width: 56ch;
        }
        .blend-cap :global(strong) {
          color: var(--ink);
          font-weight: 600;
        }
        .fscale {
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin: 2px 2px 18px;
        }
        .fscale .mid {
          color: var(--accent);
          font-weight: 600;
        }
        .frow {
          margin-bottom: 15px;
        }
        .frow-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .ftrack {
          position: relative;
          height: 10px;
          border-radius: 999px;
          background: #e1e8ee;
        }
        .fband {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 32%;
          width: 36%;
          background: #c5deea;
          border-radius: 999px;
        }
        .fmark {
          position: absolute;
          top: 50%;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #15607a;
          border: 2.5px solid #fff;
          box-shadow: 0 1px 4px rgba(14, 39, 56, 0.28);
          transform: translate(-50%, -50%);
        }
        .fnot-l {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin: 24px 0 14px;
          padding-top: 18px;
          border-top: 1px solid #e3e9ef;
        }
        .fnot-note {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--ink-faint);
        }

        .frm-quote {
          position: relative;
          margin-top: 46px;
          padding-top: 22px;
          margin-bottom: 44px;
        }
        .frm-quote::before {
          content: '\\201C';
          position: absolute;
          left: -4px;
          top: -14px;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 90px;
          line-height: 1;
          color: var(--accent);
          opacity: 0.15;
          pointer-events: none;
        }
        .frm-quote.reveal-ready {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.8s ease,
            transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .frm-quote.reveal-ready.in {
          opacity: 1;
          transform: none;
        }
        .frm-quote blockquote {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: clamp(18px, 2vw, 22px);
          line-height: 1.42;
          letter-spacing: -0.01em;
          color: var(--ink-soft);
          max-width: 42ch;
          margin: 0;
        }
        .frm-quote blockquote :global(strong) {
          color: var(--accent);
          font-weight: 600;
        }
        .frm-quote figcaption {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 18px;
        }
        .fq-av {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          flex: none;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.14);
        }
        .fq-av img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }
        .fq-name {
          font-size: 14.5px;
          font-weight: 700;
          color: var(--ink);
          display: block;
        }
        .fq-inst {
          font-size: 13px;
          color: var(--ink-faint);
          display: block;
        }
      `}</style>

      <div className="wrap">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {heading && <RichText data={heading as any} enableGutter={false} enableProse={false} />}
        {lede && <p className="lede">{lede}</p>}

        <div className="frm-beats">
          {/* 01 · First, the basics */}
          <div className="stage">
            <div className="plabel">
              <span className="bn">01</span>
              {stage1Label}
            </div>
            {stage1Sub && <p className="stage-sub">{stage1Sub}</p>}
            <div className="card">
              <svg
                className="scene"
                viewBox={SCENE_VIEWBOX}
                role="img"
                aria-label="A live culture washes through on its own; paired with the right prebiotic fibre, it stays and works"
                dangerouslySetInnerHTML={{ __html: sceneSvg }}
              />
              <div className="eq-mobile">
                <div className="ing">
                  <div className="ing-name">
                    <span className="dot" />
                    {liveCulturesLabel}
                  </div>
                  <div className="ing-desc">{liveCulturesText}</div>
                </div>
                <div className="op">+</div>
                <div className="ing">
                  <div className="ing-name">
                    <span className="dot" style={{ background: '#3E96BE' }} />
                    {prebioticsLabel}
                  </div>
                  <div className="ing-desc">{prebioticsText}</div>
                </div>
                <div className="op">=</div>
                <div className="ing ing-syn">
                  <div className="ing-name">
                    <span className="dot" />
                    {combinedLabel}
                  </div>
                  <div className="ing-desc">{combinedText}</div>
                </div>
              </div>
              <div className="defs">
                <div className="def">
                  <div className="def-term">
                    <RodIcon />
                    {liveCulturesLabel}
                  </div>
                  <div className="def-text">{liveCulturesText}</div>
                </div>
                <div className="def">
                  <div className="def-term">
                    <i style={{ width: 18, height: 3, borderRadius: 2, background: '#6FB8D6' }} />
                    {prebioticsLabel}
                  </div>
                  <div className="def-text">{prebioticsText}</div>
                </div>
                <div className="def sum">
                  <div className="def-term">
                    <i style={{ background: 'var(--accent)' }} />
                    {combinedLabel}
                  </div>
                  <div className="def-text">{combinedText}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 02 · The cultures, up close */}
          <div className="pillar" id="cultures">
            <div className="plabel">
              <span className="bn">02</span>
              {stage2Label}
            </div>
            {stage2Heading && <h2 className="ph">{stage2Heading}</h2>}
            {stage2Intro && (
              <div className="pintro">
                <RichText data={stage2Intro as any} enableGutter={false} enableProse={false} />
              </div>
            )}

            <div className="scope">
              {jobsScopeLabel && <div className="scope-l">{jobsScopeLabel}</div>}
              <div className="scope-tags">
                {jobRows.map((j, i) => (
                  <button
                    key={i}
                    type="button"
                    className={['jtag', i === selectedJob ? 'on' : ''].join(' ')}
                    onClick={() => setSelectedJob(i)}
                  >
                    {j.name}
                  </button>
                ))}
                {jobsMoreLabel && <span className="jtag more">{jobsMoreLabel}</span>}
              </div>
              {jobsMoreMobileNote && <div className="scope-more" aria-hidden="true">{jobsMoreMobileNote}</div>}
            </div>

            {job && (
              <div className={['worked', fading ? 'fading' : ''].join(' ')}>
                {workedDetailLabel && <div className="worked-l">{workedDetailLabel}</div>}
                <div className="worked-job">{job.name}</div>
                <div className="trigger">
                  <span className="src" dangerouslySetInnerHTML={{ __html: (SOURCE_ICONS[job.sourceType || 'sample'] || '') + sourceLabels[job.sourceType || 'sample'] }} />
                  {job.trigger}
                </div>

                {job.mode === 'combo' ? (
                  <>
                    {job.comboCaption && <div className="worked-cap">{job.comboCaption}</div>}
                    <div className="flex-row">
                      {(job.members ?? []).map((m, i) => (
                        <div className="strain" key={i}>
                          <RodIcon className="rod" />
                          <span>
                            <span className="s-name">{m.name}</span>
                            <span className="s-note">{m.note}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="strain anchor">
                      <RodIcon className="rod" />
                      <span>
                        <span className="s-name">{job.leadName}</span>
                        <span className="s-note">{job.leadNote}</span>
                      </span>
                    </div>
                    {job.adds && job.adds.length > 0 && (
                      <div className="flex-row">
                        {job.adds.map((a, i) => (
                          <div className="strain cond" key={i}>
                            <RodIcon className="rod" />
                            <span>
                              <span className="s-cond">{a.condition}</span>
                              <span className="s-name">{a.strain}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {workedFootNote && (
                  <div className="worked-foot">
                    <RichText data={workedFootNote as any} enableGutter={false} enableProse={false} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 03 · Precision prebiotics */}
          <div className="pillar" id="prebiotics">
            <div className="plabel">
              <span className="bn">03</span>
              {stage3Label}
            </div>
            {stage3Heading && <h2 className="ph">{stage3Heading}</h2>}
            {stage3Intro && <p className="pintro">{stage3Intro}</p>}

            <div className="blend">
              <svg className="blend-svg" viewBox={BLEND_VIEWBOX} aria-hidden="true" dangerouslySetInnerHTML={{ __html: blendSvg }} />
              <div className="blend-bands">
                <div className="fscale">
                  <span>{F.doseTooLittle}</span>
                  <span className="mid">{F.doseRightForYou}</span>
                  <span>{F.doseTooMuch}</span>
                </div>
                {(blendRows ?? []).map((row, i) => (
                  <div className="frow" key={i}>
                    <div className="frow-name">{row.name}</div>
                    <div className="ftrack">
                      <div className="fband" />
                      <div className="fmark" style={{ left: `${row.position}%` }} />
                    </div>
                  </div>
                ))}
                {notInBlendLabel && <div className="fnot-l">{notInBlendLabel}</div>}
                {notInBlendNote && <div className="fnot-note">{notInBlendNote}</div>}
              </div>
              {blendCaption && (
                <div className="blend-cap">
                  <RichText data={blendCaption as any} enableGutter={false} enableProse={false} />
                </div>
              )}
            </div>
          </div>

          {(quoteText || quoteAuthorName) && (
            <figure
              className={['frm-quote', 'reveal-ready', quoteVisible ? 'in' : ''].join(' ')}
              ref={quoteRef as React.RefObject<HTMLElement>}
            >
              <blockquote>{quoteText && <RichText data={quoteText as any} enableGutter={false} enableProse={false} />}</blockquote>
              <figcaption>
                {imgUrl(quoteAuthorImage) && (
                  <span className="fq-av">
                    <img src={imgUrl(quoteAuthorImage)} alt={imgAlt(quoteAuthorImage) || quoteAuthorName || ''} />
                  </span>
                )}
                <span>
                  <span className="fq-name">{quoteAuthorName}</span>
                  <span className="fq-inst">{quoteAuthorInst}</span>
                </span>
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
