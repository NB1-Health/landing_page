'use client'

import React, { useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { useProtocolReveal } from '@/hooks/useProtocolReveal'
import { ProtocolCountUp } from '@/components/ProtocolCountUp'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined
type Face = { image?: MediaLike; name?: string | null }
type Stat = { value?: string | null; label?: string | null }

export type ProtocolCredStripBlockType = {
  blockType?: 'protocolCredStrip'
  faces?: Face[] | null
  headline?: string | null
  body?: DefaultTypedEditorState | null
  stats?: Stat[] | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

export const ProtocolCredStripComponent: React.FC<ProtocolCredStripBlockType> = ({ faces, headline, body, stats }) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  useProtocolReveal(sectionRef, '[data-rv]')

  const faceList = (faces ?? []).filter((f) => imgUrl(f?.image))
  // Top row is always 3; the bottom row takes whatever is left, so 7 faces read
  // as a row of 3 above a row of 4. Unbounded slice so a doc that predates the
  // current maxRows still renders every face rather than silently dropping some.
  const rows = [faceList.slice(0, 3), faceList.slice(3)].filter((r) => r.length > 0)
  // A bottom row longer than the top one flips the stagger -- see the CSS.
  const hasWideBottom = rows.length === 2 && rows[1].length > rows[0].length
  const statList = stats ?? []

  return (
    <section className="pcs-sec" ref={sectionRef}>
      <style jsx>{`
        .pcs-sec {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #fff;
          padding: 40px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          border-bottom: 1px solid rgba(18, 49, 77, 0.1);
        }
        .pr-wrap {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .pcs-in {
          display: flex;
          align-items: center;
          gap: 34px;
        }

        :global(html.pr-rv-on) .pcs-sec [data-rv] {
          opacity: 0;
          transform: translateY(15px);
        }
        :global(html.pr-rv-on) .pcs-sec [data-rv].in {
          opacity: 1;
          transform: none;
          transition:
            opacity 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
            transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
        }

        .pcs-faces {
          display: flex;
          flex-direction: column;
          flex: none;
        }
        .pcs-faces .fr {
          display: flex;
        }
        .pcs-faces .fr + .fr {
          margin-top: -9px;
          margin-left: 19px;
        }
        /* When the bottom row is the longer one, the wider row anchors left and
           the top row is nudged half an avatar step (26px advance / 2) to the
           right instead, so its first face sits in the gap between the bottom
           row's first two rather than the bottom row overhanging to the right. */
        .pcs-faces.is-wide-bottom .fr:first-child {
          margin-left: 13px;
        }
        .pcs-faces.is-wide-bottom .fr + .fr {
          margin-left: 0;
        }
        .pcs-faces img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 2.5px solid #fff;
          box-shadow: 0 4px 11px -6px rgba(18, 49, 77, 0.55);
          margin-left: -12px;
        }
        .pcs-faces .fr img:first-child {
          margin-left: 0;
        }
        .pcs-body {
          flex: 1;
          min-width: 0;
        }
        .pcs-h {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 18px;
          line-height: 1.25;
          letter-spacing: -0.01em;
          color: #12314d;
        }
        .pcs-p {
          font-size: 12.5px;
          line-height: 1.5;
          color: rgba(18, 49, 77, 0.55);
          margin-top: 6px;
        }
        .pcs-p :global(b),
        .pcs-p :global(strong) {
          color: #12314d;
          font-weight: 600;
        }
        .pcs-stats {
          display: flex;
          gap: 30px;
          flex: none;
          padding-left: 34px;
          border-left: 1px solid rgba(18, 49, 77, 0.1);
        }
        .pcs-stats :global(b) {
          display: block;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 25px;
          letter-spacing: -0.02em;
          color: #0a8fb0;
          line-height: 1;
        }
        .pcs-stats span {
          font-size: 11px;
          color: rgba(18, 49, 77, 0.55);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        @media (max-width: 860px) {
          .pcs-in {
            flex-wrap: wrap;
            gap: 20px 26px;
          }
          .pcs-body {
            flex-basis: calc(100% - 200px);
          }
          .pcs-stats {
            border-left: none;
            padding-left: 0;
            width: 100%;
            gap: 26px;
          }
        }
        @media (max-width: 520px) {
          .pcs-body {
            flex-basis: 100%;
          }
        }
      `}</style>

      <div className="pr-wrap">
        <div className="pcs-in" data-rv="">
          {rows.length > 0 && (
            <div className={`pcs-faces${hasWideBottom ? ' is-wide-bottom' : ''}`}>
              {rows.map((row, ri) => (
                <div className="fr" key={ri}>
                  {row.map((f, fi) => (
                    <img key={fi} src={imgUrl(f.image)} alt={imgAlt(f.image) || f.name || ''} />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="pcs-body">
            {headline && <div className="pcs-h">{headline}</div>}
            {body && (
              <div className="pcs-p">
                <RichText data={body as any} enableGutter={false} enableProse={false} />
              </div>
            )}
          </div>
          <div className="pcs-stats">
            {statList.map((s, i) => (
              <div key={i}>
                <ProtocolCountUp value={s.value} as="b" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
