'use client'

import React from 'react'
import type { RdCloseBlock as Props } from '@/payload-types'
import type { AppLocale } from '@/i18n/config'

// GENERATED from manifests/section-09.json + bindings/RdClose.json
// Styles copied verbatim from the mockup; bindings replace content only.
// Layout and breakpoints come from rd-tokens.css — the mockup's own stylesheet,
// ported by port_css.py, driven by the data-d / data-m attributes kept below.
//
// No state and no effects: this section has no interactions at all. It stays a
// client component only because RenderBlocks.client.tsx imports every block into
// one client bundle.

/** A destination. The field holds a SLUG and the locale is added here, so one
 * stored value is right in all nine. Anything already absolute — a url, mailto,
 * tel, #anchor or a /path — passes straight through, because an editor who
 * typed one meant it.
 *
 * WHY THIS IS HERE AT ALL. The stored value is `order`, and a bare slug in an
 * href is RELATIVE TO THE CURRENT PATH. This block is the closing CTA on the
 * homepage, which is the one page whose path has a single segment: there
 * `order` resolves to `/order` and the locale is lost. On `/en/the-protocol`
 * the same value resolves to `/en/order` and looks perfect, which is why it
 * went unnoticed.
 *
 * Same helper, same reasoning, as `liPath` / `sbPath` / `stPath` / `barPath` on
 * the newer blocks. The older blocks do not have one yet — measured on staging,
 * 33 bare links across five pages — and this fixes only this block, as asked.
 *
 * NOT a lookup, unlike the chrome's: `pages.slug` IS localized (en `order-v1`
 * is de `bestellen-v1`), and resolving that needs the database, which a client
 * component cannot reach. No redesign page has a translated slug today, so this
 * is correct now; `getLocalizedPagePath` is what it would need when one does.
 */
const closePath = (s?: string | null, locale?: string | null) => {
  const v = (s || '').trim()
  if (!v) return '#'
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(v)) return v
  return `/${locale || 'en'}/${v}`
}

export const RdClose: React.FC<Props & { locale?: AppLocale }> = ({ anchorId, heading, intro, cta, locale }) => (
    <section style={{
      background: "var(--nb1-dark-brown)",
      color: "var(--nb1-cool-grey)"
    }} className="rd-block rd-close" id={anchorId || undefined}>
      <div style={{
        maxWidth: "900px",
        margin: "0px auto",
        padding: "72px 20px",
        textAlign: "center"
      }} data-d="pad bigpad">
        <svg style={{
          height: "104px",
          width: "auto",
          color: "var(--nb1-cool-grey)",
          margin: "0px auto 34px",
          display: "block"
        }} viewBox="0 0 133 148" fill="none" aria-hidden="true">
          <circle cx="113.217" cy="19.472" r="8.62344" fill="currentColor" stroke="currentColor" strokeWidth="3.3381" />
          <circle cx="97.3616" cy="46.7327" r="6.95438" fill="currentColor" />
          <circle cx="97.3616" cy="46.7327" r="6.95438" stroke="currentColor" />
          <circle cx="66.2058" cy="46.7332" r="4.17263" fill="currentColor" />
          <circle cx="66.2058" cy="46.7332" r="4.17263" stroke="currentColor" />
          <circle cx="82.0623" cy="73.9939" r="4.17263" fill="currentColor" />
          <circle cx="82.0623" cy="73.9939" r="4.17263" stroke="currentColor" />
          <circle cx="66.4837" cy="101.255" r="6.95438" fill="currentColor" />
          <circle cx="66.4837" cy="101.255" r="6.95438" stroke="currentColor" />
          <circle cx="82.0618" cy="128.517" r="8.62344" fill="currentColor" stroke="currentColor" strokeWidth="3.3381" />
          <circle cx="113.495" cy="128.517" r="6.95438" fill="currentColor" />
          <circle cx="113.495" cy="128.517" r="6.95438" stroke="currentColor" />
          <circle cx="50.9065" cy="128.517" r="6.95438" fill="currentColor" />
          <circle cx="50.9065" cy="128.517" r="6.95438" stroke="currentColor" />
          <circle cx="19.4724" cy="128.516" r="4.17263" fill="currentColor" />
          <circle cx="19.4724" cy="128.516" r="4.17263" stroke="currentColor" />
          <circle cx="66.2057" cy="46.733" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="97.3609" cy="46.733" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="82.0621" cy="73.9947" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="66.2057" cy="101.255" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="50.9059" cy="128.517" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="19.4723" cy="128.517" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="82.0621" cy="128.517" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="113.496" cy="128.517" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
          <circle cx="113.496" cy="19.4723" r="19.055" stroke="currentColor" strokeWidth="0.834526" />
        </svg>
        <h2 style={{
          fontFamily: "var(--nb1-font-primary)",
          fontWeight: "400",
          fontSize: "clamp(34px, 6.4cqi, 64px)",
          lineHeight: "0.96",
          letterSpacing: "-0.025em"
        }}>{heading}</h2>
        <p style={{
          fontFamily: "var(--nb1-font-secondary)",
          fontSize: "clamp(16px, 4.4cqi, 19px)",
          lineHeight: "1.45",
          opacity: "0.8",
          marginTop: "20px"
        }}>{intro}</p>
        <div style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "32px"
        }}>
          <a style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "1.1em",
            fontFamily: "var(--nb1-font-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: "15px",
            background: "var(--cta)",
            color: "var(--nb1-black)",
            padding: "1.1em 1.7em",
            borderRadius: "999px",
            whiteSpace: "nowrap",
            flexShrink: "0"
          }} href={closePath(cta?.url, locale)}>
            <span>{cta?.label}</span>
            <span style={{
              fontSize: "1.05em",
              lineHeight: "1"
            }}>{"\u2197"}</span>
          </a>
        </div>
      </div>
    </section>
)

export const RdCloseComponent = RdClose

export default RdClose
