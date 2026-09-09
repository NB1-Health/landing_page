import React from 'react'
import { PlanStickyBarClient } from './Component.client'

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

export const PlanStickyBarComponent: React.FC<Props> = (props) => <PlanStickyBarClient {...props} />
