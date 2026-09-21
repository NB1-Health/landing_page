'use client'

import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

import { helpAnchor } from '../_shared/utils'

export type HelpCalloutBlockType = {
  blockType?: 'helpCallout'
  reserveTocSpace?: boolean | null
  variant?: ('info' | 'quiet') | null
  heading?: string | null
  showInNav?: boolean | null
  anchor?: string | null
  body?: DefaultTypedEditorState | null
  locale?: string | null
}

/**
 * A callout panel standing on its own between blocks.
 *
 * When "Show in the contents rail" is on, the heading is an `h2` carrying
 * `data-help-heading` — the whole contract with `Help: On-page Nav` — and the
 * panel gets the wider top margin a section break wants. Otherwise the heading
 * is an `h4`, invisible to the rail. Either way it is styled as a callout
 * heading, not a section title, matching the mockup.
 */
export const HelpCalloutComponent: React.FC<HelpCalloutBlockType> = ({
  reserveTocSpace,
  variant,
  heading,
  showInNav,
  anchor,
  body,
  locale,
}) => {
  if (!body) return null

  const withRail = reserveTocSpace !== false
  const inNav = Boolean(showInNav && heading)
  const id = inNav ? helpAnchor(anchor, heading, 0) : undefined

  return (
    <section
      className={`hc ${inNav ? 'nav' : 'plain'}`}
      data-help-article=""
      data-screen-label={heading || 'Help callout'}
    >
      <style jsx>{`
        .hc {
          background: #fff;
        }
        .hc.nav {
          padding: 48px 0 0;
        }
        /* 44px is the mockup's gap between the article header and the body
           (.faq-wrap margin-top), and matches HelpSteps' own top padding. */
        .hc.plain {
          padding: 44px 0 0;
        }
        /* Must match HelpSteps' .hs-wrap — see _shared/layout.ts. */
        .hc-wrap {
          max-width: 820px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        @media (min-width: 1000px) {
          .hc-wrap {
            padding-left: 0;
            padding-right: 0;
          }
          .hc-wrap.with-rail {
            padding-left: 238px;
          }
        }

        .hc-panel {
          background: rgba(10, 143, 176, 0.08);
          border: 1px solid rgba(10, 143, 176, 0.22);
          border-radius: 14px;
          padding: 18px 20px;
        }
        .hc-panel.quiet {
          background: #f7f9fb;
          border-color: rgba(18, 49, 77, 0.1);
        }
        /* Rendered by this component, so plain selectors — only the rich-text
           children below need :global. */
        .hc-panel h2,
        .hc-panel h4 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14.5px;
          line-height: 1.35;
          letter-spacing: 0;
          color: #12314d;
          margin: 0 0 6px;
          scroll-margin-top: 96px;
        }
        .hc-panel :global(p) {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          margin: 0;
        }
        .hc-panel :global(p + p) {
          margin-top: 8px;
        }
        .hc-panel :global(ul),
        .hc-panel :global(ol) {
          margin: 6px 0 0;
          padding-left: 18px;
        }
        .hc-panel :global(ul) {
          list-style: disc;
        }
        .hc-panel :global(ol) {
          list-style: decimal;
        }
        .hc-panel :global(li) {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(18, 49, 77, 0.7);
          margin: 0 0 4px;
        }
        .hc-panel :global(strong),
        .hc-panel :global(b) {
          color: #12314d;
        }
        .hc-panel :global(a) {
          color: #0a8fb0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>

      <div className={`hc-wrap${withRail ? ' with-rail' : ''}`}>
        <div className={`hc-panel${variant === 'quiet' ? ' quiet' : ''}`}>
          {heading &&
            (inNav ? (
              <h2 id={id} data-help-heading="">
                {heading}
              </h2>
            ) : (
              <h4>{heading}</h4>
            ))}
          <RichText data={body} locale={locale || undefined} enableGutter={false} enableProse={false} />
        </div>
      </div>
    </section>
  )
}
