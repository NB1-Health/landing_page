import React from 'react'
import { YpStickyBuyClient, type YpStickyBuyBlockType } from './Component.client'

export const YpStickyBuyComponent: React.FC<YpStickyBuyBlockType & { locale?: string }> = (props) => (
  <YpStickyBuyClient {...props} />
)
