'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const CheckoutFormClient = dynamic(() =>
  import('./Component.client').then((module) => module.CheckoutFormClient),
)

type Props = { backHref?: string | null; locale?: string }

export const CheckoutFormComponent: React.FC<Props> = (props) => {
  return <CheckoutFormClient backHref={props.backHref} locale={props.locale} />
}
