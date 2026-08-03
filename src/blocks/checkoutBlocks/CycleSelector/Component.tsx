import React from 'react'
import { CycleSelectorClient } from './Component.client'
import { getLocalizedPagePath } from '@/utilities/localizedPagePath'

type FaqItem = {
  question?: string | null
  answer?: string | null
}

type Props = {
  planName?: string | null
  switchLinkLabel?: string | null
  switchLinkHref?: string | null
  planFamily?: 'core' | 'advanced' | null
  // New 1-month-standard tab labels.
  flexTabLabel?: string | null
  commitTabLabel?: string | null
  flexNoteLabel?: string | null
  // Retired fields — still spread through for schema compatibility, no longer rendered.
  showMonthlyOption?: boolean | null
  monthlyRate?: string | null
  monthlyCheckoutHref?: string | null
  yourPlanLabel?: string | null
  bestValueLabel?: string | null
  preferFlexibleLabel?: string | null
  chooseFlexiblePrefix?: string | null
  continuePrefix?: string | null
  cancelAnytimeLabel?: string | null
  billedMonthlyShortLabel?: string | null
  guaranteeItems?: { text?: string | null }[] | null
  faqTitle?: string | null
  faqItems?: FaqItem[] | null
  locale?: string
}

export const CycleSelectorComponent: React.FC<Props> = async (props) => {
  // Checkout links are code-generated; resolve the locale-specific slug of the
  // order-details page so they don't bounce through the query-dropping
  // cross-locale redirect (en slug ≠ localized slug, e.g. de `bestellen-details`).
  const checkoutBasePath = await getLocalizedPagePath('order-details', props.locale ?? 'en')
  return <CycleSelectorClient {...props} checkoutBasePath={checkoutBasePath} />
}
