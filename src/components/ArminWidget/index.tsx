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
const WIDGET_ROOT_ID = 'cx-armin-chat-widget-v2'
const CHECKOUT_SELECTOR = '[data-nb1-order-entry="true"]'

// Languages the widget understands (per its init docs). Anything else → let the widget fall back to
// its own browser-language detection (i.e. don't pass `language` at all).
const SUPPORTED_LANGS = new Set([
  'en',
  'fr',
  'es',
  'de',
  'it',
  'pt',
  'nl',
  'ru',
  'ja',
  'zh',
  'ar',
  'hi',
  'ko',
  'tr',
  'pl',
  'sv',
  'da',
  'fi',
  'no',
  'cs',
  'hu',
  'th',
  'vi',
  'uk',
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

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

let loadWidgetNow: (() => void) | null = null
let openRequested = false
let launcherObserver: MutationObserver | null = null
let launcherTimeout: number | null = null

function openLauncher(): boolean {
  const root = document.getElementById(WIDGET_ROOT_ID)
  const launcher = root?.querySelector<HTMLButtonElement>(
    'button[aria-label="Open chat"], button[aria-label="Close chat"]',
  )
  if (!launcher) return false

  // The current widget changes this label when its panel is open. Avoid turning an "open" action
  // into a toggle that closes an already-open conversation.
  if (launcher.getAttribute('aria-label') !== 'Close chat') launcher.click()
  return true
}

function stopWatchingForLauncher() {
  launcherObserver?.disconnect()
  launcherObserver = null
  if (launcherTimeout !== null) window.clearTimeout(launcherTimeout)
  launcherTimeout = null
}

function watchForLauncher() {
  if (!openRequested) return
  if (openLauncher()) {
    openRequested = false
    stopWatchingForLauncher()
    return
  }
  if (launcherObserver) return

  launcherObserver = new MutationObserver(() => {
    if (!openRequested || openLauncher()) {
      openRequested = false
      stopWatchingForLauncher()
    }
  })
  launcherObserver.observe(document.getElementById(WIDGET_ROOT_ID) ?? document.body, {
    childList: true,
    subtree: true,
  })
  launcherTimeout = window.setTimeout(() => {
    openRequested = false
    stopWatchingForLauncher()
  }, 10_000)
}

function isCheckoutPage() {
  return document.querySelector(CHECKOUT_SELECTOR) !== null
}

/**
 * Open the armin chat panel programmatically.
 *
 * The public `window.cx_armin` runtime exposes only `init` and `updateConfig` (verified against
 * cxwidget.chatarmin.com/index.js) — there is NO `open()` method — so we open the panel by clicking
 * its launcher inside `#cx-armin-chat-widget-v2`. If the widget is still loading, remember the
 * request and open it as soon as its launcher mounts.
 */
export function openArminChat(): void {
  if (typeof window === 'undefined') return
  if (openLauncher()) {
    openRequested = false
    return
  }

  openRequested = true
  if (window.__arminInitialized) watchForLauncher()
  loadWidgetNow?.()
}

export function ArminWidget({ locale = 'en', user = null }: Props) {
  useEffect(() => {
    let active = true
    let idleHandle: number | null = null
    let timeoutHandle: number | null = null
    let windowLoadListener: (() => void) | null = null
    let scriptWithListener: HTMLScriptElement | null = null

    const cancelDeferredLoad = () => {
      const idleWindow = window as IdleWindow
      if (windowLoadListener) window.removeEventListener('load', windowLoadListener)
      if (idleHandle !== null) idleWindow.cancelIdleCallback?.(idleHandle)
      if (timeoutHandle !== null) window.clearTimeout(timeoutHandle)
      windowLoadListener = null
      idleHandle = null
      timeoutHandle = null
    }

    const init = () => {
      if (!active || !window.cx_armin) return
      if (!window.__arminInitialized) {
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
      if (openRequested) watchForLauncher()
    }

    const load = () => {
      if (!active) return
      cancelDeferredLoad()

      // Reuse the tag across route/layout renders rather than downloading the widget twice.
      const existing = document.querySelector<HTMLScriptElement>('script[data-armin-widget="true"]')
      if (existing) {
        if (window.cx_armin) init()
        else {
          scriptWithListener = existing
          existing.addEventListener('load', init, { once: true })
        }
        return
      }

      const script = document.createElement('script')
      script.src = WIDGET_SRC
      script.async = true
      script.setAttribute('data-armin-widget', 'true')
      script.addEventListener('load', init, { once: true })
      scriptWithListener = script
      document.body.appendChild(script)
    }

    const scheduleIdleLoad = () => {
      const idleWindow = window as IdleWindow
      if (idleWindow.requestIdleCallback) {
        idleHandle = idleWindow.requestIdleCallback(load, { timeout: 4_000 })
      }
      else timeoutHandle = window.setTimeout(load, 0)
    }

    loadWidgetNow = load

    // The server renders the checkout marker for every localized order slug, before the dynamic
    // checkout client hydrates. Everywhere else this 4+ MB widget can wait for load and idle time.
    if (openRequested || isCheckoutPage()) load()
    else if (document.readyState === 'complete') scheduleIdleLoad()
    else {
      windowLoadListener = scheduleIdleLoad
      window.addEventListener('load', windowLoadListener, { once: true })
    }

    return () => {
      active = false
      cancelDeferredLoad()
      if (scriptWithListener) scriptWithListener.removeEventListener('load', init)
      if (loadWidgetNow === load) loadWidgetNow = null
      openRequested = false
      stopWatchingForLauncher()
      // The widget mounts into <body> outside React and intentionally persists across route changes.
    }
  }, [locale, user])

  return null
}

export default ArminWidget
