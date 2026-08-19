'use client'

import React, { useEffect, useRef } from 'react'
import Script from 'next/script'
import {
  TRUSTPILOT_BUSINESS_UNIT_ID,
  TRUSTPILOT_TEMPLATE_ID,
  getTrustpilotConfig,
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
  /** TrustBox theme; must match the background it sits on. */
  theme?: 'light' | 'dark'
  /** Height passed to the TrustBox. Micro Star is 24px. */
  height?: string
  /** Class on the wrapper, so the caller owns width and spacing. */
  className?: string
}

/**
 * Reusable localized Trustpilot TrustBox. Callers size it via `className`; the
 * TrustBox itself is told width 100% and fills whatever box it is given.
 */
export const TrustpilotWidget: React.FC<TrustpilotWidgetProps> = ({
  locale,
  theme = 'light',
  height = '24px',
  className,
}) => {
  const tp = getTrustpilotConfig(locale)
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
        api.loadFromElement(el, true)
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
  }, [tp.dataLocale, tp.token, theme])

  return (
    <>
      <Script id="trustpilot-bootstrap" src={BOOTSTRAP_SRC} strategy="afterInteractive" />
      <div
        ref={ref}
        className={['trustpilot-widget', className].filter(Boolean).join(' ')}
        data-locale={tp.dataLocale}
        data-template-id={TRUSTPILOT_TEMPLATE_ID}
        data-businessunit-id={TRUSTPILOT_BUSINESS_UNIT_ID}
        data-style-height={height}
        data-style-width="100%"
        data-theme={theme}
        data-token={tp.token}
      >
        <a href={tp.reviewUrl} target="_blank" rel="noopener">
          Trustpilot
        </a>
      </div>
    </>
  )
}

export default TrustpilotWidget
