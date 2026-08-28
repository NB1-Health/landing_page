'use client'

import React from 'react'
import RichText from '@/components/RichText'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getDictionary } from '@/i18n/getDictionary'

const X_ICON = `<path d="M4.6 4.6l6.8 6.8M11.4 4.6l-6.8 6.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`

type Row = {
  label?: string | null
  themValue?: string | null
  usValue?: string | null
  usIconSvg?: string | null
}

type Props = {
  heading?: any
  nb1Logo?: {
    url?: string | null
    updatedAt?: string | null
    width?: number | null
    height?: number | null
  } | null
  rows?: Row[] | null
  theyLabel?: string | null
  locale?: string
}

export const TwoModelsComponent: React.FC<Props> = ({ heading, nb1Logo, rows, theyLabel, locale }) => {
  const dict = getDictionary(locale)
  const logoUrl = nb1Logo?.url ? getMediaUrl(nb1Logo.url, nb1Logo.updatedAt) : null
  const rowCount = rows?.length ?? 0

  return (
    <>
      <style jsx>{`
        .ctbl-sec {
          position: relative;
          overflow: hidden;
          background: #F3F6F8;
        }
        .ctbl-in {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 64px 32px 84px;
        }
        .ctbl-head {
          max-width: 560px;
          margin-bottom: 30px;
        }
        .ctbl-head :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(28px, 3.2vw, 44px);
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: #12314D;
          margin: 0;
        }
        .ctbl-head :global(h2 em) {
          display: block;
          font-style: normal;
          font-weight: 600;
          color: #0A8FB0;
        }

        /* grid */
        .ctbl {
          position: relative;
          max-width: 680px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.78fr 1fr 1.12fr;
        }
        /* NB1 highlighted panel */
        .ct-panel {
          position: relative;
          grid-column: 3;
          grid-row: 2 / span ${rowCount};
          z-index: 0;
          background: linear-gradient(180deg, #FFFFFF 0%, #F5FBFC 100%);
          border-radius: 14px;
          box-shadow: 0 20px 44px -28px rgba(18,49,77,.30), 0 8px 22px -12px rgba(20,150,184,.18), inset 0 1px 0 rgba(255,255,255,.9);
        }
        .ct-panel::before {
          content: '';
          position: absolute;
          left: 0; right: 0; top: 0;
          height: 2px;
          border-radius: 14px 14px 0 0;
          background: linear-gradient(90deg, #0A8FB0, #2FB4CE);
        }
        .ctc {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          min-height: 64px;
        }
        /* header row */
        .ct-h {
          grid-row: 1;
          align-self: end;
          padding-bottom: 12px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .ct-h-them {
          grid-column: 2;
          padding-left: 24px;
          color: rgba(18,49,77,.40);
        }
        .ct-h-us {
          grid-column: 3;
          padding-left: 22px;
          color: #0A8FB0;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        /* label col */
        .ct-lbl {
          grid-column: 1;
          padding: 0 20px 0 4px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(18,49,77,.70);
        }
        /* them col */
        .ct-them {
          grid-column: 2;
          gap: 12px;
          padding: 0 24px;
          color: rgba(18,49,77,.50);
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: -0.01em;
        }
        /* us col */
        .ct-us {
          grid-column: 3;
          gap: 12px;
          padding: 0 22px;
          color: #12314D;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: -0.01em;
        }
        /* dividers */
        .ct-lbl.div,
        .ct-them.div {
          border-bottom: 1px solid rgba(18,49,77,.10);
        }
        .ct-us.div {
          border-bottom: 1px solid rgba(18,49,77,.07);
        }
        /* icons */
        .ct-ico {
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
        }
        .ct-ico :global(svg) {
          width: 16px;
          height: 16px;
          display: block;
        }
        .ct-them .ct-ico {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(18,49,77,.06);
          color: rgba(18,49,77,.40);
        }
        .ct-them .ct-ico :global(svg) {
          width: 13px;
          height: 13px;
        }
        .ct-us .ct-ico {
          background: rgba(20,150,184,.11);
          color: #0A8FB0;
        }

        /* mobile */
        @media (max-width: 820px) {
          .ctbl-sec {
            min-height: 86vh;
            display: flex;
            align-items: center;
          }
          .ctbl-in {
            padding: 56px 14px;
            width: 100%;
          }
          .ctbl {
            grid-template-columns: 0.66fr 1fr 1.06fr;
            max-width: none;
          }
          .ct-panel {
            border-radius: 11px;
          }
          .ct-h {
            display: flex;
            align-items: flex-end;
            padding-bottom: 11px;
            font-size: 9.5px;
            letter-spacing: 0.05em;
          }
          .ct-h-them {
            padding-left: 11px;
          }
          .ct-h-us {
            padding-left: 13px;
            font-size: 11px;
          }
          .ctc {
            min-height: 0;
          }
          .ct-lbl {
            padding: 0 7px 0 1px;
            font-size: 10px;
            letter-spacing: 0.03em;
            text-transform: none;
          }
          .ct-them,
          .ct-us {
            gap: 0;
            font-size: 12.5px;
            line-height: 1.3;
            padding: 12px 9px;
            border-bottom: 1px solid rgba(18,49,77,.10);
          }
          .ct-them {
            padding-left: 11px;
          }
          .ct-us {
            padding-left: 13px;
            flex-direction: column;
            align-items: flex-start;
            gap: 7px;
          }
          .ct-them .ct-ico {
            display: none;
          }
          .ct-us .ct-ico {
            width: 26px;
            height: 26px;
            border-radius: 8px;
          }
          .ct-us .ct-ico :global(svg) {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>

      <section className="ctbl-sec" data-screen-label="Two models">
        <div className="ctbl-in">

          {heading && (
            <div className="ctbl-head">
              <RichText data={heading} enableGutter={false} enableProse={false} />
            </div>
          )}

          {rows && rows.length > 0 && (
            <div className="ctbl">
              <div className="ct-panel" />

              <div className="ctc ct-h ct-h-them">{theyLabel || dict.twoModels.theyLabel}</div>
              <div className="ctc ct-h ct-h-us">
                {logoUrl
                  ? <img
                      src={logoUrl}
                      alt="NB1"
                      width={nb1Logo?.width ?? undefined}
                      height={nb1Logo?.height ?? undefined}
                      loading="lazy"
                      decoding="async"
                      style={{ height: '24px', width: 'auto', display: 'block' }}
                    />
                  : 'NB¹'}
              </div>

              {rows.map((row, i) => {
                const isLast = i === rows.length - 1
                const divClass = isLast ? '' : ' div'
                const gridRow = i + 2

                return (
                  <React.Fragment key={i}>
                    <div className={`ctc ct-lbl${divClass}`} style={{ gridRow }}>{row.label}</div>

                    <div className={`ctc ct-them${divClass}`} style={{ gridRow }}>
                      <span className="ct-ico">
                        <svg viewBox="0 0 16 16" fill="none" dangerouslySetInnerHTML={{ __html: X_ICON }} />
                      </span>
                      {row.themValue}
                    </div>

                    <div className={`ctc ct-us${divClass}`} style={{ gridRow }}>
                      {row.usIconSvg && (
                        <span className="ct-ico">
                          <svg viewBox="0 0 16 16" fill="none" dangerouslySetInnerHTML={{ __html: row.usIconSvg }} />
                        </span>
                      )}
                      {row.usValue}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          )}

        </div>
      </section>
    </>
  )
}
