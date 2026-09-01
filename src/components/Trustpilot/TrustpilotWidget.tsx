'use client'

import React, { useEffect, useRef } from 'react'
import Script from 'next/script'
import {
  DEFAULT_TRUSTPILOT_VARIANT,
  TRUSTPILOT_BUSINESS_UNIT_ID,
  getTrustpilotConfig,
  type TrustpilotVariant,
} from './config'

// The bootstrap only auto-scans for .trustpilot-widget elements present when it
// loads, which misses anything mounted by a client-side navigation, so each
// instance re-runs the scan on itself.
type TrustpilotApi = { loadFromElement: (el: HTMLElement, async?: boolean) => void }

const BOOTSTRAP_SRC = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js'
const INIT_RETRY_MS = 100
const INIT_MAX_ATTEMPTS = 100

export type TrustpilotWidgetProps = {
  /** App locale (en, de, fr, nl, ch, be, uk, uae) — picks the localized source. */
  locale?: string | null
  /** Which TrustBox template to render. Defaults to the Micro Star used in the hero. */
  variant?: TrustpilotVariant
  /** TrustBox theme; must match the background it sits on. */
  theme?: 'light' | 'dark'
  /** Height passed to the TrustBox. Micro Star is 24px. */
  height?: string
  /** Class on the wrapper, so the caller owns width and spacing. */
  className?: string
  /**
   * Trustpilot-side type overrides. The TrustBox renders inside an iframe, so
   * page CSS cannot reach its text — these data attributes are the only lever.
   * Omitted from the DOM when unset so the template keeps its own defaults.
   */
  fontFamily?: string
  textColor?: string
}

/**
 * Reusable localized Trustpilot TrustBox. Callers size it via `className`; the
 * TrustBox itself is told width 100% and fills whatever box it is given.
 */
export const TrustpilotWidget: React.FC<TrustpilotWidgetProps> = ({
  locale,
  variant = DEFAULT_TRUSTPILOT_VARIANT,
  theme = 'light',
  height = '24px',
  className,
  fontFamily,
  textColor,
}) => {
  const tp = getTrustpilotConfig(locale, variant)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    // Poll rather than lean on the Script onLoad: with more than one widget on a
    // page only the first mount receives that callback.
    const init = () => {
      if (cancelled) return
      const api = (window as unknown as { Trustpilot?: TrustpilotApi }).Trustpilot
      if (api) {
        if (!el.querySelector('iframe')) api.loadFromElement(el, true)
        return
      }
      attempts += 1
      if (attempts < INIT_MAX_ATTEMPTS) timer = setTimeout(init, INIT_RETRY_MS)
    }

    init()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [tp.dataLocale, tp.token, tp.templateId, theme, fontFamily, textColor])

  return (
    <>
      <Script id="trustpilot-bootstrap" src={BOOTSTRAP_SRC} strategy="afterInteractive" />
      <div
        ref={ref}
        className={['trustpilot-widget', className].filter(Boolean).join(' ')}
        data-locale={tp.dataLocale}
        data-template-id={tp.templateId}
        data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
        data-style-height={height}
        data-style-width="100%"
        data-theme={theme}
        data-token={tp.token}
        {...(fontFamily ? { 'data-font-family': fontFamily } : {})}
        {...(textColor ? { 'data-text-color': textColor } : {})}
      >
        <a href={tp.reviewUrl} target="_blank" rel="noopener">
          Trustpilot
        </a>
      </div>
    </>
  )
}

export default TrustpilotWidget
