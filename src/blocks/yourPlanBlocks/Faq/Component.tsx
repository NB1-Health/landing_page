import React from 'react'
import { YpFaqClient, type YpFaqBlockType } from './Component.client'

export const YpFaqComponent: React.FC<YpFaqBlockType & { locale?: string }> = (props) => (
  <YpFaqClient {...props} />
)
