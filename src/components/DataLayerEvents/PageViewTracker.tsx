'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { getOrCreateCheckoutId, pushEvent, mintEventId } from '@/lib/dataLayer'
import { captureFirstTouchAttribution } from '@/lib/klaviyoCheckout'
import { sendMetaCapiEvent } from '@/lib/meta/browser'
import { captureCheckoutAttribution } from '@/lib/checkoutApi'

export function PageViewTracker() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    captureFirstTouchAttribution()
    captureCheckoutAttribution()
    window.addEventListener('nb1:consent-resolved', captureCheckoutAttribution)

    if (prevPath.current === pathname) {
      return () => {
        window.removeEventListener('nb1:consent-resolved', captureCheckoutAttribution)
      }
    }
    prevPath.current = pathname

    const pvId = mintEventId()
    const segments = pathname.split('/').filter(Boolean)
    const pageLanguage = segments[0] || document.documentElement.lang || 'en'
    const pageContext = {
      page_location: window.location.href,
      page_title: document.title,
      page_referrer: document.referrer,
      page_language: pageLanguage,
    }
    pushEvent('page_view', {
      event_id: pvId,
      ...pageContext,
    })
    sendMetaCapiEvent('page_view', pvId)

    // The server marks pages containing the canonical first order component.
    // This works for every locale and avoids coupling analytics to URL copy.
    if (document.querySelector('[data-nb1-order-entry="true"]')) {
      pushEvent('start_order', {
        event_id: mintEventId(),
        related_event_id: pvId,
        checkout_id: getOrCreateCheckoutId({ startNewJourney: true }),
        ...pageContext,
      })
    }
    return () => {
      window.removeEventListener('nb1:consent-resolved', captureCheckoutAttribution)
    }
  }, [pathname])

  return null
}
