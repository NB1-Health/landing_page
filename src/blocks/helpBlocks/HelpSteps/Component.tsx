'use client'

import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

import { helpAnchor, localizedHref, mediaAlt, mediaUrl, type MediaLike } from '../_shared/utils'

type Note = {
  variant?: ('info' | 'quiet') | null
  title?: string | null
  body?: DefaultTypedEditorState | null
}

type Step = {
  title?: string | null
  anchor?: string | null
  body?: DefaultTypedEditorState | null
  code?: {
    label?: string | null
    value?: string | null
    linkLabel?: string | null
    linkUrl?: string | null
  } | null
  media?: MediaLike
  mediaCaption?: string | null
  mediaPlaceholder?: string | null
  notes?: Note[] | null
}

export type HelpStepsBlockType = {
  blockType?: 'helpSteps'
  reserveTocSpace?: boolean | null
  introImage?: MediaLike
  introImageCaption?: string | null
  intro?: DefaultTypedEditorState | null
  steps?: Step[] | null
  outro?: { doneText?: string | null; note?: DefaultTypedEditorState | null } | null
  locale?: string | null
}

/**
 * The numbered body of a help article.
 *
 * Step numbers come from a CSS counter on `.hs-steps h2`, so reordering the
 * array in the CMS renumbers everything and nothing is ever hand-numbered.
 * Each `h2` carries `data-help-heading` — that attribute is the contract with
 * the `Help: On-page Nav` block, which builds its list from it.
 */
export const HelpStepsComponent: React.FC<HelpStepsBlockType> = ({
  reserveTocSpace,
  introImage,
  introImageCaption,
  intro,
  steps,
  outro,
  locale,
}) => {
  if (!steps?.length) return null

  const introSrc = mediaUrl(introImage)
  const withRail = reserveTocSpace !== false
  const richLocale = locale || undefined

  return (
    <section className="hs" data-help-article="" data-screen-label="Help steps">
      <style jsx>{`
        .hs {
          background: #fff;
          padding: 44px 0 0;
        }
        /* ARTICLE_MAX / GUTTER from _shared/layout.ts. The column is centred in
           the viewport; .with-rail indents it so the fixed contents rail sits
           in the left gutter. Keep these numbers in step with HelpNav. */
        .hs-wrap {
          max-width: 820px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        @media (min-width: 1000px) {
          .hs-wrap {
            padding-left: 0;
            padding-right: 0;
          }
          .hs-wrap.with-rail {
            padding-left: 238px;
          }
        }

        /* ---- shared prose ---- */
        .hs-lead :global(p) {
          font-size: 18px;
          line-height: 1.6;
          color: #12314d;
          font-weight: 500;
          margin: 0 0 8px;
        }
        .hs-body :global(p) {
          font-size: 16px;
          line-height: 1.72;
          color: #33475b;
          margin: 0 0 16px;
        }
        .hs-body :global(a),
        .hs-lead :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .hs-body :global(ul),
        .hs-body :global(ol) {
          margin: 0 0 16px;
          padding-left: 22px;
        }
        .hs-body :global(ul) {
          list-style: disc;
        }
        .hs-body :global(ol) {
          list-style: decimal;
        }
        .hs-body :global(li) {
          font-size: 15.5px;
          line-height: 1.65;
          color: #33475b;
          margin: 0 0 8px;
        }
        .hs-body :global(li > ul),
        .hs-body :global(li > ol) {
          margin: 8px 0;
        }
        .hs-body :global(li > p) {
          margin: 12px 0 6px;
        }
        .hs-body :global(li > p:first-of-type) {
          margin-top: 8px;
        }
        /* h4 is the template's .faq-subhead — a sub-heading inside a step
           that must not appear in the contents rail. */
        .hs-body :global(h4) {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 600;
          font-size: 15.5px;
          color: #12314d;
          margin: 16px 0 6px;
        }
        .hs-body :global(code) {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 14px;
          background: rgba(10, 143, 176, 0.08);
          color: #0a8fb0;
          border-radius: 5px;
          padding: 2px 7px;
        }

        /* ---- steps ---- */
        .hs-steps {
          counter-reset: hsstep;
          margin-top: 8px;
        }
        .hs-steps h2 {
          counter-increment: hsstep;
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: #12314d;
          margin: 44px 0 14px;
          padding-top: 28px;
          border-top: 1px solid rgba(18, 49, 77, 0.1);
          scroll-margin-top: 96px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .hs-steps h2:first-of-type {
          border-top: none;
          padding-top: 0;
          margin-top: 6px;
        }
        .hs-steps h2::before {
          content: counter(hsstep);
          flex: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid rgba(10, 143, 176, 0.32);
          color: #0a8fb0;
          font-family: ui-monospace, Menlo, monospace;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ---- code chip ---- */
        .hs-code {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin: 18px 0;
        }
        .hs-code .box {
          background: #f7fafc;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .hs-code .k {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(18, 49, 77, 0.4);
        }
        .hs-code .v {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 15px;
          font-weight: 600;
          color: #0a8fb0;
          margin-top: 6px;
        }
        .hs-code a {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #0a8fb0;
          font-weight: 600;
          font-size: 14.5px;
          text-decoration: none;
        }
        .hs-code a:hover {
          color: #12314d;
        }

        /* ---- figures ---- */
        .hs-img {
          margin: 20px 0;
        }
        .hs-img.intro {
          margin: 0 0 40px;
        }
        .hs-img img {
          display: block;
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(18, 49, 77, 0.1);
        }
        .hs-img .ph {
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          background: #eef2f5;
          border: 1px solid rgba(18, 49, 77, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 24px;
          color: rgba(18, 49, 77, 0.45);
          font-family: ui-monospace, Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .hs-img figcaption {
          font-size: 12.5px;
          color: rgba(18, 49, 77, 0.45);
          margin-top: 8px;
        }

        /* ---- callouts ---- */
        .hs-note {
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(10, 143, 176, 0.22);
          border-radius: 14px;
          padding: 18px 20px;
          margin: 22px 0;
        }
        .hs-note.quiet {
          background: #f7f9fb;
          border-color: rgba(18, 49, 77, 0.1);
        }
        .hs-note h4 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14.5px;
          color: #12314d;
          margin: 0 0 6px;
        }
        .hs-note :global(p) {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          margin: 0;
        }
        .hs-note :global(strong),
        .hs-note :global(b) {
          color: #12314d;
        }
        .hs-note :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ---- closing ---- */
        .hs-done {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 700;
          font-size: 19px;
          color: #12314d;
          margin: 32px 0 0;
        }
        .hs-outro :global(p) {
          font-size: 16px;
          line-height: 1.72;
          color: #33475b;
          margin: 16px 0 0;
        }
        .hs-outro :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      <div className={`hs-wrap${withRail ? ' with-rail' : ''}`}>
        {introSrc && (
          <figure className="hs-img intro">
            <img src={introSrc} alt={mediaAlt(introImage, introImageCaption || '')} />
            {introImageCaption && <figcaption>{introImageCaption}</figcaption>}
          </figure>
        )}

        {intro && (
          <div className="hs-lead">
            <RichText data={intro} locale={richLocale} enableGutter={false} enableProse={false} />
          </div>
        )}

        <div className="hs-steps">
          {steps.map((step, i) => {
            const id = helpAnchor(step.anchor, step.title, i)
            const codeHref = localizedHref(step.code?.linkUrl, locale)
            const showCode = Boolean(step.code?.value || (step.code?.linkLabel && codeHref))
            const stepSrc = mediaUrl(step.media)
            const showFigure = Boolean(stepSrc || step.mediaPlaceholder)

            return (
              <React.Fragment key={id || i}>
                <h2 id={id} data-help-heading="">
                  {step.title}
                </h2>

                {step.body && (
                  <div className="hs-body">
                    <RichText
                      data={step.body}
                      locale={richLocale}
                      enableGutter={false}
                      enableProse={false}
                    />
                  </div>
                )}

                {showCode && (
                  <div className="hs-code">
                    {step.code?.value && (
                      <div className="box">
                        {step.code?.label && <div className="k">{step.code.label}</div>}
                        <div className="v">{step.code.value}</div>
                      </div>
                    )}
                    {step.code?.linkLabel && codeHref && (
                      <a href={codeHref}>
                        {step.code.linkLabel}
                        <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </div>
                )}

                {showFigure && (
                  <figure className="hs-img">
                    {stepSrc ? (
                      <img src={stepSrc} alt={mediaAlt(step.media, step.title || '')} />
                    ) : (
                      <div className="ph">{step.mediaPlaceholder}</div>
                    )}
                    {step.mediaCaption && <figcaption>{step.mediaCaption}</figcaption>}
                  </figure>
                )}

                {(step.notes || []).map((note, n) =>
                  note.title || note.body ? (
                    <div
                      className={`hs-note${note.variant === 'quiet' ? ' quiet' : ''}`}
                      key={`${id}-note-${n}`}
                    >
                      {note.title && <h4>{note.title}</h4>}
                      {note.body && (
                        <RichText
                          data={note.body}
                          locale={richLocale}
                          enableGutter={false}
                          enableProse={false}
                        />
                      )}
                    </div>
                  ) : null,
                )}
              </React.Fragment>
            )
          })}

          {outro?.doneText && <p className="hs-done">{outro.doneText}</p>}
          {outro?.note && (
            <div className="hs-outro">
              <RichText
                data={outro.note}
                locale={richLocale}
                enableGutter={false}
                enableProse={false}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
