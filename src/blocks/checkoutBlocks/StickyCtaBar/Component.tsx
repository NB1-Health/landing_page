import React from 'react'
import { getServerCurrency } from '@/utilities/currency'
import { resolvePriceTokens } from '@/lib/plans/priceTokens'
import { StickyCtaBarClient } from './Component.client'

type Props = {
  primaryCtaText?: string | null
  primaryCtaHref?: string | null
  secondaryCtaText?: string | null
  secondaryCtaHref?: string | null
  locale?: string
}

export const StickyCtaBarComponent: React.FC<Props> = async ({
  primaryCtaText,
  primaryCtaHref,
  secondaryCtaText,
  secondaryCtaHref,
  locale = 'en',
}) => {
  const currency = await getServerCurrency(locale)

  const [resolvedPrimary, resolvedSecondary] = await Promise.all([
    resolvePriceTokens(primaryCtaText, currency, locale),
    resolvePriceTokens(secondaryCtaText, currency, locale),
  ])

  return (
    <StickyCtaBarClient
      primaryCtaText={resolvedPrimary}
      primaryCtaHref={primaryCtaHref}
      secondaryCtaText={resolvedSecondary}
      secondaryCtaHref={secondaryCtaHref}
      locale={locale}
    />
  )
}
