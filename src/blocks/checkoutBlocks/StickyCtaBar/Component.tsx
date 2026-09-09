import React from 'react'
import { StickyCtaBarClient } from './Component.client'

type Props = {
  primaryCtaText?: string | null
  primaryCtaHref?: string | null
  secondaryCtaText?: string | null
  secondaryCtaHref?: string | null
  locale?: string
}

export const StickyCtaBarComponent: React.FC<Props> = (props) => <StickyCtaBarClient {...props} />
