'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePlanCtaTracking } from '@/lib/usePlanCtaTracking'

type PlanConfig = {
  planKey?: string | null
  selectedLabel?: string | null
  switchLinkText?: string | null
  switchToPlanKey?: string | null
  ctaText?: string | null
  ctaHref?: string | null
  ctaVariant?: 'advanced' | 'core' | null
}

type Props = {
  defaultPlanKey?: string | null
  plans?: PlanConfig[] | null
  locale?: string
}

export const PlanStickyBarClient: React.FC<Props> = ({ defaultPlanKey = 'advanced', plans, locale = 'en' }) => {
  const [activePlanKey, setActivePlanKey] = useState(defaultPlanKey ?? 'advanced')
  const [visible, setVisible] = useState(false)
  const lastScrollY = useRef(0)
  const trackPlanCta = usePlanCtaTracking(locale)

  useEffect(() => {
    const onPlanSelected = (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail?.key
      if (key) setActivePlanKey(key)
    }
    window.addEventListener('nb1:planselected', onPlanSelected)
    return () => window.removeEventListener('nb1:planselected', onPlanSelected)
  }, [])

  useEffect(() => {
    const THRESHOLD = 120

    const showBar = (show: boolean) => {
      setVisible(show)
      document.body.classList.toggle('nb1-sticky-active', show)
    }

    function onScroll() {
      const y = window.scrollY
      const delta = y - lastScrollY.current
      const isMobile = window.innerWidth <= 760

      if (y < THRESHOLD) {
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
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.body.classList.remove('nb1-sticky-active')
    }
  }, [])

  const plan = plans?.find(p => p.planKey === activePlanKey) ?? plans?.[0]
  if (!plan) return null

  const isAdvanced = (plan.ctaVariant ?? plan.planKey) === 'advanced'

  return (
    <>
      <div className={`nb1-psb${visible ? ' nb1-psb-show' : ''}`}>
        <style jsx>{`
          .nb1-psb {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 90;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
            padding: 14px 32px;
            background: #fff;
            border-top: 1px solid rgba(18, 49, 77, 0.12);
            box-shadow: 0 -4px 24px rgba(18, 49, 77, 0.08);
            transform: translateY(110%);
            transition: transform 0.4s cubic-bezier(0.16, 0.84, 0.44, 1);
            pointer-events: none;
          }
          .nb1-psb.nb1-psb-show {
            transform: translateY(0);
            pointer-events: auto;
          }
          .nb1-psb-left {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          .nb1-psb-prefix {
            color: rgba(18, 49, 77, 0.4);
            font-weight: 400;
          }
          .nb1-psb-name {
            font-weight: 700;
            color: #12314d;
          }
          .nb1-psb-dot {
            color: rgba(18, 49, 77, 0.25);
          }
          .nb1-psb-switch {
            font-size: 13px;
            color: #0a8fb0;
            font-weight: 600;
            background: none;
            border: none;
            padding: 0;
            cursor: pointer;
            font-family: inherit;
            text-decoration: underline;
            text-decoration-color: rgba(10, 143, 176, 0.3);
            text-underline-offset: 2px;
          }
          .nb1-psb-switch:hover {
            text-decoration-color: #0a8fb0;
          }
          .nb1-psb-cta {
            padding: 12px 26px;
            border-radius: 100px;
            font-weight: 700;
            font-size: 14px;
            white-space: nowrap;
            text-decoration: none;
            transition: background 0.18s, border-color 0.18s, transform 0.18s;
          }
          .nb1-psb-cta:hover {
            transform: translateY(-1px);
          }
          .nb1-psb-cta.advanced {
            background: #c6ff5b;
            color: #0e2740;
            border: 1.5px solid transparent;
          }
          .nb1-psb-cta.advanced:hover {
            background: #aaea42;
          }
          .nb1-psb-cta.core {
            background: transparent;
            color: #12314d;
            border: 1.5px solid rgba(18, 49, 77, 0.2);
          }
          .nb1-psb-cta.core:hover {
            border-color: #12314d;
          }
          @media (max-width: 560px) {
            .nb1-psb {
              padding: 11px 16px;
              gap: 10px;
            }
            .nb1-psb-cta {
              padding: 10px 16px;
              font-size: 13px;
            }
            .nb1-psb-left {
              font-size: 13px;
            }
          }
          @media (max-width: 400px) {
            .nb1-psb-prefix { display: none; }
            .nb1-psb-name { display: none; }
            .nb1-psb-dot { display: none; }
          }
        `}</style>

        <div className="nb1-psb-left">
          {plan.selectedLabel && (() => {
            const parts = plan.selectedLabel!.trim().split(' ')
            const prefix = parts.slice(0, -1).join(' ')
            const name = parts[parts.length - 1]
            return (
              <>
                {prefix && <span className="nb1-psb-prefix">{prefix}</span>}
                <span className="nb1-psb-name">{name}</span>
              </>
            )
          })()}
          {plan.switchLinkText && plan.switchToPlanKey && (
            <>
              <span className="nb1-psb-dot">·</span>
              <button
                type="button"
                className="nb1-psb-switch"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('nb1:selectplan', { detail: { key: plan.switchToPlanKey } }))
                }}
              >
                {plan.switchLinkText}
              </button>
            </>
          )}
        </div>

        {plan.ctaText && plan.ctaHref && (
          <a
            href={plan.ctaHref}
            className={`nb1-psb-cta ${isAdvanced ? 'advanced' : 'core'}`}
            onClick={(event) => trackPlanCta(event, plan.ctaHref!)}
          >
            {plan.ctaText}
          </a>
        )}
      </div>
    </>
  )
}
