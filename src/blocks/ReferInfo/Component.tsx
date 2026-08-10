'use client'

import React, { useRef } from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'
import { useReveal } from '@/hooks/useReveal'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaLike = { url?: string | null; alt?: string | null } | string | null | undefined

type Step = {
  title?: string | null
  body?: DefaultTypedEditorState | null
}
type Eligibility = {
  type?: 'include' | 'exclude' | null
  text?: DefaultTypedEditorState | null
}

export type ReferInfoBlockType = {
  blockType?: 'referInfo'
  heading?: DefaultTypedEditorState | null
  media?: MediaLike
  steps?: Step[] | null
  eligibilityHeading?: string | null
  eligibility?: Eligibility[] | null
}

function imgUrl(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.url ? getMediaUrl(img.url) : ''
}
function imgAlt(img?: MediaLike): string {
  if (!img || typeof img === 'string') return ''
  return img.alt ?? ''
}

export const ReferInfoComponent: React.FC<ReferInfoBlockType> = ({
  heading,
  media,
  steps,
  eligibilityHeading,
  eligibility,
}) => {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, '[data-rv]')

  const mediaSrc = imgUrl(media)

  return (
    <section ref={ref} className="rf-sec" data-screen-label="How it works">
      <style jsx>{`
        .rf-sec {
          padding: clamp(56px, 7vw, 92px) 0;
          background: #fff;
        }
        .rfw {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 clamp(20px, 4vw, 32px);
        }

        .rf-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(30px, 5vw, 64px);
          align-items: center;
        }
        .rf-media :global(img) {
          display: block;
          width: 100%;
          height: clamp(300px, 36vw, 440px);
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 40px 76px -50px rgba(18, 49, 77, 0.46);
        }
        @media (max-width: 820px) {
          .rf-two {
            grid-template-columns: 1fr;
            gap: 26px;
          }
          .rf-media :global(img) {
            height: clamp(230px, 58vw, 320px);
          }
        }

        .rf-h2 :global(h2) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(26px, 3.4vw, 40px);
          line-height: 1.08;
          letter-spacing: -0.026em;
          color: #12314d;
          margin: 0;
          max-width: 22ch;
          text-wrap: balance;
        }
        .rf-h2 :global(h2 em) {
          font-style: italic;
          color: #0a8fb0;
        }

        .rf-steps {
          margin-top: 26px;
          counter-reset: rs;
          display: grid;
          gap: 0;
        }
        .rf-step {
          display: grid;
          grid-template-columns: 38px 1fr;
          gap: 16px;
          padding: 20px 0;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          align-items: start;
        }
        .rf-step:first-child {
          border-top: none;
          padding-top: 0;
        }
        .rf-step .n {
          counter-increment: rs;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid rgba(10, 143, 176, 0.34);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #0a8fb0;
          flex: none;
        }
        .rf-step .n::before {
          content: counter(rs);
        }
        .rf-step h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 17.5px;
          letter-spacing: -0.012em;
          color: #12314d;
          margin: 5px 0 0;
        }
        .rf-step .body :global(p) {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          margin: 7px 0 0;
          max-width: 46ch;
        }
        .rf-step .body :global(b),
        .rf-step .body :global(strong) {
          color: #12314d;
          font-weight: 600;
        }

        .rf-elig {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 18px;
          align-items: start;
          border: 1.5px solid rgba(10, 143, 176, 0.28);
          background: rgba(10, 143, 176, 0.08);
          border-radius: 16px;
          padding: clamp(20px, 2.4vw, 26px);
          margin-top: clamp(26px, 3vw, 34px);
        }
        .rf-elig .ic {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #fff;
          color: #0a8fb0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: none;
        }
        .rf-elig h3 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 17.5px;
          color: #12314d;
          margin: 3px 0 0;
        }
        .rf-elig ul {
          list-style: none;
          margin: 12px 0 0;
          padding: 0;
          display: grid;
          gap: 9px;
        }
        .rf-elig li {
          display: grid;
          grid-template-columns: 18px 1fr;
          gap: 11px;
          font-size: 14.5px;
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.7);
        }
        .rf-elig li .txt :global(b),
        .rf-elig li .txt :global(strong) {
          color: #12314d;
          font-weight: 600;
        }
        .rf-elig li .txt :global(p) {
          margin: 0;
          display: inline;
        }
        .rf-elig li .m {
          font-weight: 700;
          color: #0a8fb0;
        }
        .rf-elig li .x {
          font-weight: 700;
          color: #c4453c;
        }
      `}</style>

      <div className="rfw">
        <div className="rf-two">
          <div data-rv="">
            {heading && (
              <div className="rf-h2">
                <RichText data={heading} enableGutter={false} enableProse={false} />
              </div>
            )}

            {steps && steps.length > 0 && (
              <div className="rf-steps">
                {steps.map((s, i) => (
                  <div className="rf-step" key={i}>
                    <span className="n" />
                    <div>
                      <h3>{s.title}</h3>
                      {s.body && (
                        <div className="body">
                          <RichText data={s.body} enableGutter={false} enableProse={false} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mediaSrc && (
            <div className="rf-media" data-rv="">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaSrc} alt={imgAlt(media)} loading="lazy" />
            </div>
          )}
        </div>

        {eligibility && eligibility.length > 0 && (
          <div className="rf-elig" data-rv="">
            <span className="ic" aria-hidden="true">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </svg>
            </span>
            <div>
              {eligibilityHeading && <h3>{eligibilityHeading}</h3>}
              <ul>
                {eligibility.map((item, i) => {
                  const excluded = item.type === 'exclude'
                  return (
                    <li key={i}>
                      <span className={excluded ? 'x' : 'm'} aria-hidden="true">
                        {excluded ? '✕' : '✓'}
                      </span>
                      {item.text && (
                        <span className="txt">
                          <RichText data={item.text} enableGutter={false} enableProse={false} />
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
