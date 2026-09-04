'use client'

import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import RichText from '@/components/RichText'

import { localizedHref } from '../_shared/utils'

export type HelpCtaBlockType = {
  blockType?: 'helpCta'
  heading?: string | null
  body?: string | null
  fine?: DefaultTypedEditorState | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  locale?: string | null
}

export const HelpCtaComponent: React.FC<HelpCtaBlockType> = ({
  heading,
  body,
  fine,
  ctaLabel,
  ctaUrl,
  locale,
}) => {
  if (!heading) return null

  const href = localizedHref(ctaUrl, locale)

  return (
    <section className="hc" data-screen-label="Help CTA">
      <style jsx>{`
        .hc {
          background: #fff;
          padding: 0 24px;
        }
        .hc-card {
          max-width: 1000px;
          margin: 56px auto 90px;
          background: #0e2740;
          border-radius: 20px;
          padding: 40px;
          color: #fff;
          display: flex;
          flex-wrap: wrap;
          gap: 22px 40px;
          align-items: center;
          justify-content: space-between;
        }
        @media (max-width: 880px) {
          .hc-card {
            margin: 46px auto 70px;
            padding: 28px;
          }
        }

        .hc-card h2 {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
          color: #fff;
        }
        .hc-body {
          font-size: 14.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.72);
          margin: 0;
          max-width: 420px;
        }
        .hc-fine :global(p) {
          font-size: 12.5px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.55);
          margin: 2px 0 0;
        }
        .hc-fine :global(a) {
          color: #5bc0d8;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .hc-btn {
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 26px;
          border-radius: 100px;
          background: #c6ff5b;
          color: #12314d;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s ease;
        }
        .hc-btn:hover {
          background: #aaea42;
        }
        @media (prefers-reduced-motion: reduce) {
          .hc-btn {
            transition: none;
          }
        }
      `}</style>

      <div className="hc-card">
        <div>
          <h2>{heading}</h2>
          {body && <p className="hc-body">{body}</p>}
          {fine && (
            <div className="hc-fine">
              <RichText
                data={fine}
                locale={locale || undefined}
                enableGutter={false}
                enableProse={false}
              />
            </div>
          )}
        </div>
        {ctaLabel && href && (
          <a className="hc-btn" href={href}>
            {ctaLabel}
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </section>
  )
}
