'use client'

import React, { useMemo, useRef, useState } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { useProtocolReveal } from '@/hooks/useProtocolReveal'
import { ProtocolCountUp } from '@/components/ProtocolCountUp'
import type { AppLocale } from '@/i18n/config'
import { getLibraryStrings } from './i18n'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined
type CategoryKey = 'strains' | 'fibres' | 'vitamins' | 'actives'
type Category = { key?: CategoryKey | null; familyLabel?: string | null; pillLabel?: string | null }
type Face = { image?: MediaLike; name?: string | null }
type Item = { name?: string | null; category?: CategoryKey | null; type?: string | null }

export type ProtocolLibraryBlockType = {
  blockType?: 'protocolLibrary'
  categories?: Category[] | null
  vettedText?: DefaultTypedEditorState | null
  vettedFaces?: Face[] | null
  footLine?: DefaultTypedEditorState | null
  toggleLabelClosed?: string | null
  toggleLabelOpen?: string | null
  allPillLabel?: string | null
  searchPlaceholder?: string | null
  searchAriaLabel?: string | null
  emptyText?: string | null
  items?: Item[] | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

export const ProtocolLibraryComponent: React.FC<ProtocolLibraryBlockType & { locale?: AppLocale }> = ({
  locale,
  categories,
  vettedText,
  vettedFaces,
  footLine,
  toggleLabelClosed,
  toggleLabelOpen,
  allPillLabel,
  searchPlaceholder,
  searchAriaLabel,
  emptyText,
  items,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  useProtocolReveal(sectionRef, '[data-rv]')

  const T = getLibraryStrings(locale)
  const cats = categories ?? []
  const list = items ?? []
  const faces = (vettedFaces ?? []).filter((f) => imgUrl(f?.image))

  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | CategoryKey>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { strains: 0, fibres: 0, vitamins: 0, actives: 0 }
    list.forEach((it) => {
      if (it.category) c[it.category] = (c[it.category] ?? 0) + 1
    })
    return c
  }, [list])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((it) => {
      const matchesFilter = filter === 'all' || it.category === filter
      const matchesQuery = !q || `${it.name ?? ''} ${it.type ?? ''}`.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [list, filter, query])

  return (
    <section className="plb-sec" id="library" ref={sectionRef}>
      <style jsx>{`
        .plb-sec {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          padding: 0 0 88px;
          background: #f6f9fc;
        }
        .plb-sec :global(*) {
          transition: none !important;
        }
        .pr-wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 20px;
        }

        :global(html.pr-rv-on) .plb-sec [data-rv] {
          opacity: 0;
          transform: translateY(15px);
        }
        :global(html.pr-rv-on) .plb-sec [data-rv].in {
          opacity: 1;
          transform: none;
          transition:
            opacity 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
            transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
        }

        .pl-palette {
          margin-top: 0;
          background: #edf2f7;
          border: 1px solid #e1e9f0;
          border-radius: 20px;
          padding: 30px 34px;
        }
        .pl-row {
          display: flex;
          align-items: flex-end;
          gap: 48px;
          flex-wrap: wrap;
          padding-bottom: 26px;
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .pl-count {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 0.82;
          font-size: clamp(60px, 8vw, 104px);
          color: #12314d;
        }
        .pl-count small {
          display: block;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
          font-weight: 600;
          margin-top: 14px;
        }
        .pl-fams {
          display: flex;
          flex-wrap: wrap;
          gap: 22px 44px;
          padding-bottom: 6px;
        }
        .pl-pf :global(b) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-size: 30px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #0a8fb0;
        }
        .pl-pf span {
          display: block;
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 4px;
          line-height: 1.35;
        }
        .pl-vetted-mini {
          margin-left: auto;
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 11px;
          max-width: 250px;
        }
        .pl-vm-faces {
          display: flex;
          flex: none;
        }
        .pl-vm-faces img {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 2px solid #edf2f7;
          margin-left: -9px;
          box-shadow: 0 3px 8px -6px rgba(18, 49, 77, 0.55);
        }
        .pl-vm-faces img:first-child {
          margin-left: 0;
        }
        .pl-vm-txt {
          font-size: 11.5px;
          line-height: 1.4;
          color: rgba(18, 49, 77, 0.55);
        }
        .pl-vm-txt :global(b),
        .pl-vm-txt :global(strong) {
          display: block;
          color: #12314d;
          font-weight: 600;
          font-size: 12.5px;
          letter-spacing: -0.005em;
        }
        .pl-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          flex-wrap: wrap;
          margin-top: 24px;
        }
        .pl-line {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          max-width: 64ch;
          margin: 0;
        }
        .pl-line :global(b),
        .pl-line :global(strong) {
          color: #12314d;
          font-weight: 600;
        }
        .pl-btn {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14.5px;
          color: #fff;
          background: #12314d;
          border: none;
          border-radius: 100px;
          padding: 13px 22px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          transition:
            background 0.16s,
            gap 0.16s;
        }
        .pl-btn:hover {
          background: #0e2740;
          gap: 12px;
        }
        .pl-tgl {
          display: inline-block;
          transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pl-btn[aria-expanded='true'] .pl-tgl {
          transform: rotate(180deg);
        }

        .pl-panel {
          margin-top: 16px;
          background: #fff;
          border: 1px solid #e4ebf1;
          border-radius: 20px;
          padding: 26px 28px;
          box-shadow: 0 30px 70px -54px rgba(14, 39, 56, 0.5);
        }
        .pl-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .pl-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pl-pill {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          padding: 9px 16px;
          border-radius: 100px;
          border: 1px solid rgba(18, 49, 77, 0.1);
          background: transparent;
          color: rgba(18, 49, 77, 0.7);
          cursor: pointer;
          transition: 0.16s;
          white-space: nowrap;
        }
        .pl-pill:hover {
          border-color: #0a8fb0;
          color: #0a8fb0;
        }
        .pl-pill[aria-pressed='true'] {
          background: #12314d;
          border-color: #12314d;
          color: #fff;
        }
        .pl-search {
          position: relative;
        }
        .pl-search input {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-size: 14px;
          padding: 10px 16px 10px 38px;
          border-radius: 100px;
          border: 1px solid rgba(18, 49, 77, 0.1);
          background: #f1f4f7;
          width: 220px;
          color: #12314d;
          outline: none;
          transition: 0.16s;
        }
        .pl-search input:focus {
          border-color: #0a8fb0;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(10, 143, 176, 0.08);
        }
        .pl-search :global(svg) {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(18, 49, 77, 0.4);
        }
        .pl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 10px;
        }
        .pl-card {
          position: relative;
          background: #fff;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 14px;
          padding: 14px 16px;
          overflow: hidden;
          transition:
            transform 0.16s,
            border-color 0.16s,
            box-shadow 0.16s;
        }
        .pl-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #0a8fb0;
        }
        .pl-card.strains::before {
          background: #0a8fb0;
        }
        .pl-card.fibres::before {
          background: #4fa98c;
        }
        .pl-card.vitamins::before {
          background: #c99a3b;
        }
        .pl-card.actives::before {
          background: #7c6fc4;
        }
        .pl-card:hover {
          border-color: rgba(18, 49, 77, 0.2);
          box-shadow: 0 8px 24px -14px rgba(14, 39, 64, 0.4);
          transform: translateY(-2px);
        }
        .pl-card .cn {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14.5px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: #12314d;
        }
        .pl-card .ct {
          font-size: 12px;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 6px;
          letter-spacing: 0.02em;
        }
        .pl-empty {
          padding: 44px 0;
          text-align: center;
          color: rgba(18, 49, 77, 0.4);
          font-size: 15px;
        }

        @media (max-width: 640px) {
          .pl-palette {
            padding: 24px 20px;
          }
          .pl-row {
            gap: 28px;
          }
          .pl-fams {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px 18px;
            flex-basis: 100%;
          }
          .pl-vetted-mini {
            margin: 16px 0 0;
            max-width: none;
            flex-basis: 100%;
          }
          .pl-foot {
            flex-direction: column;
            align-items: flex-start;
          }
          .pl-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .pl-card {
            padding: 12px;
          }
          .pl-card .cn {
            font-size: 13px;
          }
          .pl-search {
            flex: 1;
          }
          .pl-search input {
            width: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-tgl {
            transition: none;
          }
        }
      `}</style>

      <div className="pr-wrap">
        <div className="pl-palette" data-rv="">
          <div className="pl-row">
            <div className="pl-count">
              <ProtocolCountUp value={String(list.length)} />
              <small>{T.componentsOnFile}</small>
            </div>
            <div className="pl-fams">
              {cats.map((cat, i) => (
                <div className="pl-pf" key={i}>
                  <ProtocolCountUp value={cat.key ? String(counts[cat.key] ?? 0) : '0'} as="b" />
                  <span>{cat.familyLabel}</span>
                </div>
              ))}
            </div>
            {faces.length > 0 && (
              <div className="pl-vetted-mini">
                <div className="pl-vm-faces">
                  {faces.map((f, i) => (
                    <img key={i} src={imgUrl(f.image)} alt={imgAlt(f.image) || f.name || ''} />
                  ))}
                </div>
                {vettedText && (
                  <div className="pl-vm-txt">
                    <RichText data={vettedText as any} enableGutter={false} enableProse={false} />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="pl-foot">
            {footLine && (
              <div className="pl-line">
                <RichText data={footLine as any} enableGutter={false} enableProse={false} />
              </div>
            )}
            <button className="pl-btn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? toggleLabelOpen : toggleLabelClosed} <span className="pl-tgl">↓</span>
            </button>
          </div>
        </div>

        {open && (
          <div className="pl-panel">
            <div className="pl-bar">
              <div className="pl-filters" role="group" aria-label="Filter components">
                <button className="pl-pill" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                  {allPillLabel} {list.length}
                </button>
                {cats.map((cat, i) => (
                  <button
                    className="pl-pill"
                    key={i}
                    aria-pressed={filter === cat.key}
                    onClick={() => cat.key && setFilter(cat.key)}
                  >
                    {cat.pillLabel}
                  </button>
                ))}
              </div>
              <div className="pl-search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="M21 21l-4.3-4.3"></path>
                </svg>
                <input
                  type="search"
                  placeholder={searchPlaceholder || undefined}
                  aria-label={searchAriaLabel || undefined}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            {visible.length > 0 ? (
              <div className="pl-grid">
                {visible.map((it, i) => (
                  <div className={['pl-card', it.category || ''].join(' ')} key={i}>
                    <div className="cn">{it.name}</div>
                    <div className="ct">{it.type}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pl-empty">{emptyText}</div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
