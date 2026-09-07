import React from 'react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { YpPlansClient } from './Component.client'
import type { InfluencerPlanOffer } from './Component.client'

type BgColorPreset = 'cream' | 'paper' | 'off' | 'navy' | 'navyDeep' | 'teal' | 'custom'
type BgType = 'color' | 'image'
type MediaLike = { url?: string | null; alt?: string | null } | null

type PlanCard = {
  featured?: boolean | null
  badge?: string | null
  name?: string | null
  tag?: string | null
  planFamily?: 'core' | 'advanced' | null
  monthly?: string | null
  commit?: string | null
  listLabel?: string | null
  listItems?: { text?: string | null }[] | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  ctaStyle?: 'out' | 'cta' | null
}

type CellValue = boolean | string | { v?: string | null; sub?: string | null }

type CompareRow = {
  id?: string | null
  text?: string | null
  cell?: 'checkbox' | 'oneLine' | 'twoLine' | null
}

type CompareSection = {
  id?: string | null
  title?: string | null
  rows?: CompareRow[] | null
}

type CompareCard = {
  id?: string | null
  label?: string | null
  planFamily?: 'core' | 'advanced' | null
  highlight?: boolean | null
  features?: Record<string, CellValue> | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  ctaStyle?: 'out' | 'lime' | null
}

type Comparison = {
  toggleLabelClosed?: string | null
  toggleLabelOpen?: string | null
  sections?: CompareSection[] | null
  cards?: CompareCard[] | null
}

type GuaranteeItem = {
  icon?: 'clock' | 'cycle' | 'capsule' | 'none' | null
  title?: string | null
  body?: string | null
}

export type YpPlansBlockType = {
  influencerOffer?: InfluencerPlanOffer
  blockType?: 'ypPlans'
  backgroundColor?: BgColorPreset | null
  backgroundColorCustom?: string | null
  backgroundType?: BgType | null
  backgroundImage?: MediaLike
  grain?: boolean | null
  eyebrow?: string | null
  heading?: DefaultTypedEditorState | null
  lede?: DefaultTypedEditorState | null
  planCards?: PlanCard[] | null
  showComparison?: boolean | null
  comparison?: Comparison | null
  guaranteeItems?: GuaranteeItem[] | null
  locale?: string
}

export const YpPlansComponent: React.FC<YpPlansBlockType> = (props) => {
  return <YpPlansClient {...props} />
}
