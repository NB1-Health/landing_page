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

type CodeChip = {
  label?: string | null
  value?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}

/** A frame in the flow strip, or an example in the grey guide panel. */
type Figurine = {
  image?: MediaLike
  label?: string | null
}

type Step = {
  title?: string | null
  anchor?: string | null
  body?: DefaultTypedEditorState | null
  flow?: Figurine[] | null
  codes?: CodeChip[] | null
  /** Superseded by `codes`; still rendered for articles seeded before it existed. */
  code?: CodeChip | null
  media?: MediaLike
  mediaCaption?: string | null
  mediaPosition?: ('above' | 'below') | null
  mediaWidth?: ('full' | 'medium' | 'small') | null
  mediaPlaceholder?: string | null
  notes?: Note[] | null
  guide?: Figurine[] | null
  subnote?: string | null
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

/** Inline max-width for a step figure. `full` leaves the column width alone. */
const FIGURE_WIDTH: Record<string, string | undefined> = {
  small: '190px',
  medium: '300px',
}

/**
 * The numbered body of a help article.
 *
 * Step numbers come from a CSS counter on `.hs-steps h2`, so reordering the
 * array in the CMS renumbers everything and nothing is ever hand-numbered.
 * Each `h2` carries `data-help-heading` — that attribute is the contract with
 * the `Help: On-page Nav` block, which builds its list from it.
 *
 * Parts of a step render in one fixed order (see the block config): flow strip,
 * photo-if-above, body, code chips, photo-if-below, callouts, example guide,
 * sub-note.
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
        /* The mockup's .faq-plain — a parts list under the lead line. Quieter
           and tighter than a list inside a step body. */
        .hs-lead :global(ul),
        .hs-lead :global(ol) {
          margin: 0 0 28px;
          padding-left: 20px;
        }
        .hs-lead :global(ul) {
          list-style: disc;
        }
        .hs-lead :global(ol) {
          list-style: decimal;
        }
        .hs-lead :global(li) {
          font-size: 15px;
          line-height: 1.6;
          font-weight: 400;
          color: rgba(18, 49, 77, 0.7);
          margin: 0 0 6px;
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

        /* ---- flow strip ---- */
        .hs-flow {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin: 18px 0;
        }
        .hs-flow .fi {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 92px;
        }
        .hs-flow .fi img {
          display: block;
          width: 92px;
          height: auto;
          border-radius: 8px;
          border: 1px solid rgba(18, 49, 77, 0.1);
        }
        .hs-flow .lbl {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.3;
          color: rgba(18, 49, 77, 0.45);
        }

        /* ---- example guide ---- */
        .hs-guide {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          background: #f7fafc;
          border: 1px solid rgba(18, 49, 77, 0.1);
          border-radius: 12px;
          padding: 16px 18px;
          margin: 18px 0;
        }
        .hs-guide .d {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 84px;
        }
        .hs-guide .d img {
          display: block;
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .hs-guide .lbl {
          font-family: ui-monospace, Menlo, monospace;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.3;
          color: rgba(18, 49, 77, 0.45);
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

        /* ---- sub-note ---- */
        .hs-subnote {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(18, 49, 77, 0.55);
          margin: 6px 0 0;
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

            // Legacy single chip first, then the array — an article that has
            // both (there should be none) reads left to right in that order.
            const legacyChip =
              step.code && (step.code.value || step.code.linkLabel) ? [step.code] : []
            const chips: CodeChip[] = [...legacyChip, ...(step.codes || [])]
            const codeLink = chips.find((c) => c.linkLabel && localizedHref(c.linkUrl, locale))
            const codeHref = localizedHref(codeLink?.linkUrl, locale)
            const showCode = chips.some((c) => c.value) || Boolean(codeLink)

            const stepSrc = mediaUrl(step.media)
            const showFigure = Boolean(stepSrc || step.mediaPlaceholder)
            const figureWidth = FIGURE_WIDTH[step.mediaWidth || 'full']
            const figureAbove = step.mediaPosition === 'above'

            const flow = (step.flow || []).filter((f) => mediaUrl(f.image) || f.label)
            const guide = (step.guide || []).filter((g) => mediaUrl(g.image) || g.label)

            const figure = showFigure ? (
              <figure className="hs-img" style={figureWidth ? { maxWidth: figureWidth } : undefined}>
                {stepSrc ? (
                  <img src={stepSrc} alt={mediaAlt(step.media, step.title || '')} />
                ) : (
                  <div className="ph">{step.mediaPlaceholder}</div>
                )}
                {step.mediaCaption && <figcaption>{step.mediaCaption}</figcaption>}
              </figure>
            ) : null

            return (
              <React.Fragment key={id || i}>
                <h2 id={id} data-help-heading="">
                  {step.title}
                </h2>

                {flow.length > 0 && (
                  <div className="hs-flow">
                    {flow.map((frame, f) => {
                      const src = mediaUrl(frame.image)
                      return (
                        <div className="fi" key={`${id}-flow-${f}`}>
                          {src && <img src={src} alt={mediaAlt(frame.image, frame.label || '')} />}
                          {frame.label && <div className="lbl">{frame.label}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {figureAbove && figure}

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
                    {chips.map((chip, c) =>
                      chip.value ? (
                        <div className="box" key={`${id}-code-${c}`}>
                          {chip.label && <div className="k">{chip.label}</div>}
                          <div className="v">{chip.value}</div>
                        </div>
                      ) : null,
                    )}
                    {codeLink && codeHref && (
                      <a href={codeHref}>
                        {codeLink.linkLabel}
                        <span aria-hidden="true">→</span>
                      </a>
                    )}
                  </div>
                )}

                {!figureAbove && figure}

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

                {guide.length > 0 && (
                  <div className="hs-guide">
                    {guide.map((example, g) => {
                      const src = mediaUrl(example.image)
                      return (
                        <div className="d" key={`${id}-guide-${g}`}>
                          {src && (
                            <img src={src} alt={mediaAlt(example.image, example.label || '')} />
                          )}
                          {example.label && <div className="lbl">{example.label}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {step.subnote && <p className="hs-subnote">{step.subnote}</p>}
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
