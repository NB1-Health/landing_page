'use client'

import { useEffect } from 'react'

type ChatwootUser = {
  id: string
  email?: string
  name?: string
  avatar_url?: string
}

type Props = {
  locale?: string
  user?: ChatwootUser | null
}

declare global {
  interface Window {
    chatwootSettings?: {
      hideMessageBubble?: boolean
      position?: 'left' | 'right'
      locale?: string
      type?: 'standard' | 'expanded_bubble'
    }
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void
    }
    $chatwoot?: {
      setUser: (
        identifier: string,
        attributes: {
          email?: string
          name?: string
          avatar_url?: string
        },
      ) => void
      reset?: () => void
    }
    __chatwootInitialized?: boolean
  }
}

export function ChatwootWidget({ locale = 'en', user = null }: Props) {
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com'
    const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN

    if (!websiteToken) {
      console.warn('Chatwoot: missing NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN environment variable.')
      return
    }

    window.chatwootSettings = {
      hideMessageBubble: false,
      position: 'right',
      locale,
      type: 'standard',
    }

    const runChatwoot = () => {
      if (!window.chatwootSDK || window.__chatwootInitialized) return

      window.chatwootSDK.run({
        websiteToken,
        baseUrl,
      })

      window.__chatwootInitialized = true
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-chatwoot-sdk="true"]',
    )

    if (existingScript) {
      if (window.chatwootSDK) {
        runChatwoot()
      } else {
        existingScript.addEventListener('load', runChatwoot, { once: true })
      }
    } else {
      const script = document.createElement('script')
      script.src = `${baseUrl}/packs/js/sdk.js`
      script.async = true
      script.defer = true
      script.setAttribute('data-chatwoot-sdk', 'true')
      script.addEventListener('load', runChatwoot, { once: true })
      document.head.appendChild(script)
    }

    // Z-index budget:
    //   Modals (scientist/report): 300–1000
    //   Sticky bars (yp-sticky, checkout bars): 55
    //   Chatwoot bubble: 54 — sits below sticky bars so it never overlaps them
    //   Chatwoot widget window: 200 — above sticky bars but below site modals
    const BUBBLE_Z = '54'
    const WIDGET_Z = '200'
    const BUBBLE_BOTTOM_DEFAULT = '20px'

    // Below this width Chatwoot expands the widget window to fullscreen
    // (top: 0), which would otherwise render underneath the site header
    // (.nb1-nav, z-index 9000, position fixed/sticky) — same breakpoint and
    // height as the header itself (see Header/Component.client.tsx).
    const MOBILE_BREAKPOINT = 860
    const HEADER_HEIGHT_MOBILE = 68

    const getStickyBar = () =>
      document.querySelector<HTMLElement>('.yp-sticky, .nb1-sticky-cta, .nb1-plan-sticky')

    const applyStyles = () => {
      const bubble = document.querySelector<HTMLElement>('.woot-widget-bubble')
      const widget = document.querySelector<HTMLElement>('.woot-widget-holder, #woot-widget-wrapper')

      if (!bubble) return false

      bubble.style.setProperty('z-index', BUBBLE_Z, 'important')
      if (widget) {
        widget.style.setProperty('z-index', WIDGET_Z, 'important')

        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          widget.style.setProperty('top', `${HEADER_HEIGHT_MOBILE}px`, 'important')
          widget.style.setProperty('height', `calc(100% - ${HEADER_HEIGHT_MOBILE}px)`, 'important')
        } else {
          widget.style.removeProperty('top')
          widget.style.removeProperty('height')
        }
      }

      const bar = getStickyBar()
      const barVisible = bar?.classList.contains('show')
      const barHeight = barVisible && bar ? bar.offsetHeight : 0
      bubble.style.setProperty(
        'bottom',
        barHeight > 0 ? `${barHeight + 12}px` : BUBBLE_BOTTOM_DEFAULT,
        'important',
      )
      return true
    }

    // Poll until both the bubble and sticky bar are in the DOM, then observe
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let mutationObs: MutationObserver | null = null
    let pollTimeout: ReturnType<typeof setTimeout> | null = null

    const startObserver = () => {
      if (mutationObs) return // already observing
      const bar = getStickyBar()
      if (!bar) return
      mutationObs = new MutationObserver(applyStyles)
      mutationObs.observe(bar, { attributes: true, attributeFilter: ['class'] })
    }

    pollInterval = setInterval(() => {
      const bubbleFound = applyStyles()
      if (bubbleFound) startObserver()
      // Keep polling until both bubble and bar are wired up
      if (bubbleFound && getStickyBar()) {
        if (pollInterval) clearInterval(pollInterval)
        pollInterval = null
      }
    }, 300)

    pollTimeout = setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval)
    }, 12000)

    // Re-apply on scroll — catches cases where the bar slides in during scroll
    window.addEventListener('scroll', applyStyles, { passive: true })
    // Re-apply on resize — toggles the mobile top-offset on orientation change / window resize
    window.addEventListener('resize', applyStyles)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (pollTimeout) clearTimeout(pollTimeout)
      mutationObs?.disconnect()
      window.removeEventListener('scroll', applyStyles)
      window.removeEventListener('resize', applyStyles)
    }
  }, [locale])

  useEffect(() => {
    const setUserInfo = () => {
      if (!user || !window.$chatwoot) return

      window.$chatwoot.setUser(user.id, {
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      })
    }

    if (window.$chatwoot) {
      setUserInfo()
    } else {
      window.addEventListener('chatwoot:ready', setUserInfo)
      return () => {
        window.removeEventListener('chatwoot:ready', setUserInfo)
      }
    }
  }, [user])

  return null
}

export default ChatwootWidget
