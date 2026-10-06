'use client'

import React from 'react'

import { localizedHref, mediaAlt, mediaUrl, type MediaLike } from '../_shared/utils'

type AlsoRead = {
  tag?: string | null
  label?: string | null
  url?: string | null
}

export type HelpHeroBlockType = {
  blockType?: 'helpHero'
  alsoRead?: AlsoRead | null
  eyebrow?: string | null
  heading?: string | null
  dek?: string | null
  image?: MediaLike
  imageCaption?: string | null
  locale?: string | null
}

export const HelpHeroComponent: React.FC<HelpHeroBlockType> = ({
  alsoRead,
  eyebrow,
  heading,
  dek,
  image,
  imageCaption,
  locale,
}) => {
  if (!heading) return null

  const alsoHref = localizedHref(alsoRead?.url, locale)
  const showAlso = Boolean(alsoRead?.label && alsoHref)
  const figureSrc = mediaUrl(image)

  return (
    <header className="hh" data-screen-label="Help header">
      <style jsx>{`
        /* 104px, not 40.
           These pages run on the redesign chrome (rdHeader 2 / rdFooter 1), and
           that header is position:sticky with margin-bottom:-64px — it pulls the
           next section up underneath itself on purpose, because a redesign hero
           is built to start behind it. This hero was built for the old static
           header and is not.
           Measured on staging before the change: the nav box ran 36 to 103 and
           .hh started at 39, so the h1 at 79 sat INSIDE the header. 40 + 64 is
           what clears it while keeping the original 40px of breathing room.
           Deliberately NOT in help-reskin.css: the overlap comes from the
           chrome, not from the reskin, so gating it behind HELP_RESKIN would
           leave the title under the header whenever that switch is off.
           No backticks in this comment — styled-jsx is a template literal and
           one would end the string. */
        .hh {
          background: #fff;
          padding: 104px 0 0;
        }
        /* HEAD_MAX from _shared/layout.ts — the header is centred in the
           viewport, not indented behind the contents rail. */
        .hh-head {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .hh-also {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          font-size: 13.5px;
          margin-bottom: 18px;
        }
        .hh-also .tag {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
        }
        .hh-also a {
          color: #0a8fb0;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .hh-also a:hover {
          color: #12314d;
        }

        .hh-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: ui-monospace, Menlo, monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a8fb0;
        }
        .hh-eyebrow::before {
          content: '';
          width: 22px;
          height: 1px;
          background: #0a8fb0;
        }

        .hh-h1 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4.2vw, 46px);
          line-height: 1.06;
          letter-spacing: -0.03em;
          color: #12314d;
          margin: 0;
          text-wrap: balance;
        }
        .hh-h1.after-eyebrow {
          margin-top: 12px;
        }

        .hh-dek {
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.7);
          margin: 16px 0 0;
          max-width: 56ch;
        }

        .hh-fig {
          max-width: 760px;
          margin: 30px auto 0;
          padding: 0 24px;
        }
        .hh-fig img {
          display: block;
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(18, 49, 77, 0.1);
        }
        .hh-fig figcaption {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.45);
          margin-top: 10px;
          text-align: center;
        }
      `}</style>

      <div className="hh-head">
        {showAlso && (
          <p className="hh-also">
            {alsoRead?.tag && <span className="tag">{alsoRead.tag}</span>}
            <a href={alsoHref}>{alsoRead?.label}</a>
          </p>
        )}
        {eyebrow && <span className="hh-eyebrow">{eyebrow}</span>}
        <h1 className={`hh-h1${eyebrow ? ' after-eyebrow' : ''}`}>{heading}</h1>
        {dek && <p className="hh-dek">{dek}</p>}
      </div>

      {figureSrc && (
        <figure className="hh-fig">
          <img src={figureSrc} alt={mediaAlt(image, heading)} />
          {imageCaption && <figcaption>{imageCaption}</figcaption>}
        </figure>
      )}
    </header>
  )
}
