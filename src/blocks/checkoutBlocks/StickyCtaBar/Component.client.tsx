'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePlanCtaTracking } from '@/lib/usePlanCtaTracking'

type Props = {
  primaryCtaText?: string | null
  primaryCtaHref?: string | null
  secondaryCtaText?: string | null
  secondaryCtaHref?: string | null
  locale?: string
}

export const StickyCtaBarClient: React.FC<Props> = ({
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  locale = 'en',
}) => {
  const [visible, setVisible] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const trackPlanCta = usePlanCtaTracking(locale)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const showBar = (show: boolean) => { setVisible(show); document.body.classList.toggle('nb1-sticky-active', show) }

    function onScroll() {
      const y = window.scrollY
      const delta = y - lastScrollY.current
      const isMobile = window.innerWidth <= 760
      const pastSentinel = sentinel?.getBoundingClientRect().bottom ?? 0 < 0

      if (!pastSentinel) {
        showBar(false)
      } else if (isMobile && delta < 0) {
        showBar(false)
      } else {
        showBar(true)
      }

      lastScrollY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); document.body.classList.remove('nb1-sticky-active') }
  }, [])

  return (
    <>
      <div ref={sentinelRef} style={{ height: 0, pointerEvents: 'none' }} aria-hidden="true" />
      <div className={`nb1-sticky${visible ? ' nb1-sticky-show' : ''}`}>
        <style jsx>{`
          .nb1-sticky { position:fixed; left:0; right:0; bottom:0; z-index:90; display:flex; gap:18px; align-items:center; justify-content:center; padding:12px 24px; background:rgba(255,255,255,0.9); backdrop-filter:blur(16px); border-top:1px solid rgba(18,49,77,0.1); transform:translateY(110%); transition:transform 0.4s cubic-bezier(0.16,0.84,0.44,1); pointer-events:none; }
          .nb1-sticky.nb1-sticky-show { transform:translateY(0); pointer-events:auto; }
          .nb1-sticky-go { padding:12px 26px; border-radius:100px; font-weight:700; font-size:14px; background:#c6ff5b; color:#0e2740; white-space:nowrap; text-decoration:none; transition:background 0.18s; }
          .nb1-sticky-go:hover { background:#aaea42; }
          .nb1-sticky-alt { padding:12px 24px; border-radius:100px; font-weight:600; font-size:14px; background:transparent; border:1.5px solid rgba(18,49,77,0.1); color:#12314d; white-space:nowrap; text-decoration:none; transition:border-color 0.18s; }
          .nb1-sticky-alt:hover { border-color:#12314d; }
          @media (max-width:560px) { .nb1-sticky { gap:12px; padding:11px 16px; } .nb1-sticky-go { padding:11px 18px; font-size:13px; } .nb1-sticky-alt { padding:11px 14px; font-size:12.5px; } }
        `}</style>
        {primaryCtaHref && primaryCtaText && (
          <a
            href={primaryCtaHref}
            className="nb1-sticky-go"
            onClick={(event) => trackPlanCta(event, primaryCtaHref)}
          >
            {primaryCtaText}
          </a>
        )}
        {secondaryCtaHref && secondaryCtaText && (
          <a
            href={secondaryCtaHref}
            className="nb1-sticky-alt"
            onClick={(event) => trackPlanCta(event, secondaryCtaHref)}
          >
            {secondaryCtaText}
          </a>
        )}
      </div>
    </>
  )
}
