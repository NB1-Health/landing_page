'use client'

import { useEffect } from 'react'

type ArminUser = {
  email?: string
  name?: string
  company?: string
}

type Props = {
  locale?: string
  user?: ArminUser | null
}

// armin.cx (chatarmin) chat widget. Widget id is public (not a secret); overridable via env.
const WIDGET_ID = process.env.NEXT_PUBLIC_ARMIN_WIDGET_ID || 'widget_XnwrHfEPievV'
const WIDGET_SRC = 'https://cxwidget.chatarmin.com/index.js'

// Languages the widget understands (per its init docs). Anything else → let the widget fall back to
// its own browser-language detection (i.e. don't pass `language` at all).
const SUPPORTED_LANGS = new Set([
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 'ar', 'hi', 'ko',
  'tr', 'pl', 'sv', 'da', 'fi', 'no', 'cs', 'hu', 'th', 'vi', 'uk',
])

declare global {
  interface Window {
    cx_armin?: {
      init: (config: Record<string, unknown>) => void
      updateConfig?: (config: Record<string, unknown>) => void
    }
    __arminInitialized?: boolean
  }
}

/**
 * Open the armin chat panel programmatically.
 *
 * The public `window.cx_armin` runtime exposes only `init` and `updateConfig` (verified against
 * cxwidget.chatarmin.com/index.js) — there is NO `open()` method — so we open the panel by clicking
 * its launcher inside `#cx-armin-widget-root`. A native click bubbles to the widget's React handler
 * (React attaches its listeners on that root container), so it toggles the panel open. Best-effort:
 * silently no-ops if the widget hasn't mounted yet.
 */
export function openArminChat(): void {
  if (typeof window === 'undefined') return
  const root = document.getElementById('cx-armin-widget-root')
  if (!root) return
  const launcher =
    root.querySelector<HTMLElement>('[class*="launcher"]') ||
    root.querySelector<HTMLElement>('button, [role="button"]') ||
    root.querySelector<HTMLElement>('img')
  launcher?.click()
}

export function ArminWidget({ locale = 'en', user = null }: Props) {
  useEffect(() => {
    const init = () => {
      if (!window.cx_armin || window.__arminInitialized) return
      const lang = SUPPORTED_LANGS.has(locale) ? locale : undefined
      window.cx_armin.init({
        widgetId: WIDGET_ID,
        analytics: { enabled: true },
        style: { zIndex: 999 },
        ...(lang ? { language: lang } : {}),
        ...(user?.email
          ? { user: { email: user.email, name: user.name, company: user.company } }
          : {}),
      })
      window.__arminInitialized = true
    }

    // Load the widget script once, then init on load. Reuse the tag if it's already there (a
    // second layout render must not inject a duplicate script).
    const existing = document.querySelector<HTMLScriptElement>('script[data-armin-widget="true"]')
    if (existing) {
      if (window.cx_armin) init()
      else existing.addEventListener('load', init, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = WIDGET_SRC
    script.async = true
    script.setAttribute('data-armin-widget', 'true')
    script.addEventListener('load', init, { once: true })
    document.body.appendChild(script)

    // The widget mounts into <body> outside React and must persist across route changes, so the
    // script is intentionally left in place on unmount — same lifecycle the Chatwoot script had.
  }, [locale, user])

  return null
}

export default ArminWidget
