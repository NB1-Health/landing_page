import React from 'react'
import { getServerCurrency } from '@/utilities/currency'
import { resolvePriceTokens } from '@/lib/plans/priceTokens'
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

export const PlanStickyBarComponent: React.FC<Props> = async ({ defaultPlanKey, plans, locale = 'en' }) => {
  const currency = await getServerCurrency(locale)

  const resolvedPlans = await Promise.all(
    (plans ?? []).map(async (plan) => ({
      ...plan,
      selectedLabel: await resolvePriceTokens(plan.selectedLabel, currency, locale),
      switchLinkText: await resolvePriceTokens(plan.switchLinkText, currency, locale),
      ctaText: await resolvePriceTokens(plan.ctaText, currency, locale),
    }))
  )

  return <PlanStickyBarClient defaultPlanKey={defaultPlanKey} plans={resolvedPlans} locale={locale} />
}
