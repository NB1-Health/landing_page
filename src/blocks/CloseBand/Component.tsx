'use client'

import React, { useEffect, useRef, useState } from 'react'
import RichText from '@/components/RichText'
import TrustpilotWidget from '@/components/Trustpilot/TrustpilotWidget'

type Props = {
  heading?: any
  subheading?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  locale?: string | null
}

export const CloseBandComponent: React.FC<Props> = ({ heading, subheading, ctaLabel, ctaHref, locale }) => {
  const rawHref = ctaHref || ''
  const localizedHref =
    rawHref && locale && !rawHref.startsWith(`/${locale}`)
      ? `/${locale}${rawHref.startsWith('/') ? '' : '/'}${rawHref}`
      : rawHref || '#'
  const secRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = secRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style jsx>{`
        .cb-wrap {
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #103049 0%, #0B2238 60%, #081A2B 100%);
        }
        .cb-wrap::after {
          content: '';
          position: absolute;
          left: 50%; top: -30%;
          width: 120%; height: 130%;
          transform: translateX(-50%);
          pointer-events: none;
          background: radial-gradient(46% 42% at 50% 0%, rgba(20,178,216,.18), transparent 66%);
        }
        .cb-in {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
          padding: 100px 32px;
          text-align: center;
        }
        @media (max-width: 680px) { .cb-in { padding: 68px 22px; } }

        .cb-heading :global(p) {
          font-family: 'Instrument Sans', 'Inter', sans-serif;
          font-weight: 600;
          font-size: clamp(40px, 5.6vw, 68px);
          line-height: 1.0;
          letter-spacing: -0.04em;
          color: #fff;
          margin: 0;
        }
        .cb-heading :global(em) { font-style: normal; color: #13A6CC; }

        .cb-sub {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(255,255,255,.72);
          margin: 20px auto 34px;
          max-width: 460px;
        }

        .cb-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', -apple-system, sans-serif;
          font-weight: 700;
          font-size: 16px;
          border-radius: 100px;
          padding: 16px 30px;
          background: #C6FF5B;
          color: #12314D;
          text-decoration: none;
          transition: background .15s ease, transform .15s ease;
        }
        .cb-cta:hover { background: #b8f04e; transform: translateY(-1px); }

        /* Final reassurance under the CTA. The TrustBox fills whatever width it
           is given, so the wrapper is sized to the content and centred; nudge the
           width if a longer locale wraps the score onto a second line. */
        .cb-tp { width: 240px; height: 20px; margin: 26px auto 0; line-height: 0; }

        .r-up {
          opacity: 0; transform: translateY(20px);
          transition: opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1);
        }
        .r-up.in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) { .r-up { opacity: 1; transform: none; transition: none; } }
      `}</style>

      <section ref={secRef} className="cb-wrap" data-screen-label="Close">
        <div className="cb-in">
          {heading && (
            <div className={`cb-heading r-up${visible ? ' in' : ''}`}>
              <RichText data={heading} enableGutter={false} enableProse={false} />
            </div>
          )}
          {subheading && (
            <p className={`cb-sub r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.1s' }}>
              {subheading}
            </p>
          )}
          {ctaLabel && (
            <a
              href={localizedHref}
              className={`cb-cta r-up${visible ? ' in' : ''}`}
              style={{ transitionDelay: '0.18s' }}
            >
              {ctaLabel}
            </a>
          )}

          <div className={`cb-tp r-up${visible ? ' in' : ''}`} style={{ transitionDelay: '0.24s' }}>
            <TrustpilotWidget locale={locale} variant="microTrustScore" theme="dark" height="20px" />
          </div>
        </div>
      </section>
    </>
  )
}
