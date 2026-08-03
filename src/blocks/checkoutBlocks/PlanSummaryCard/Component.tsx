import React from 'react'
import { PlanSummaryCardClient } from './Component.client'

type Bullet = { text?: string | null }

type Props = {
  sectionTitle?: string | null
  planVariant?: 'core' | 'advanced' | null
  cycleMonth?: 'monthly' | '1' | '4' | '12' | null
  planName?: string | null
  priceNote?: string | null
  switchLinkText?: string | null
  switchLinkHref?: string | null
  bullets?: Bullet[] | null
  primaryCtaText?: string | null
  primaryCtaHref?: string | null
  secondaryCtaText?: string | null
  secondaryCtaHref?: string | null
  ctaSubText?: string | null
  locale?: string
}

export const PlanSummaryCardComponent: React.FC<Props> = (props) => {
  return <PlanSummaryCardClient {...props} />
}
