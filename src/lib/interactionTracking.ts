import type { PaymentType } from '@/lib/dataLayer'

export type PaymentAttemptReadiness = {
  paymentType: PaymentType
  stripeReady?: boolean
  elementsReady?: boolean
  cardElementReady?: boolean
  cardComplete?: boolean
  localPaymentFieldsValid?: boolean
  walletAuthorized?: boolean
}

/**
 * A payment-info event represents a valid attempt, not merely a button click.
 * Keep this provider-neutral so new payment methods can adopt the same boundary.
 */
export function isPaymentAttemptReady(input: PaymentAttemptReadiness): boolean {
  switch (input.paymentType) {
    case 'card':
      return Boolean(
        input.stripeReady &&
          input.elementsReady &&
          input.cardElementReady &&
          input.cardComplete,
      )
    case 'paypal':
    case 'klarna':
      return Boolean(input.stripeReady)
    case 'sepa':
      return Boolean(input.localPaymentFieldsValid)
    case 'apple_pay':
    case 'google_pay':
      return Boolean(input.walletAuthorized)
    default:
      return false
  }
}

export function resolveWalletPaymentType(
  providerValue: string | undefined,
): Extract<PaymentType, 'apple_pay' | 'google_pay' | 'card'> {
  if (providerValue === 'applePay' || providerValue === 'apple_pay') return 'apple_pay'
  if (providerValue === 'googlePay' || providerValue === 'google_pay') return 'google_pay'
  return 'card'
}

type NavigationClick = {
  button: number
  defaultPrevented: boolean
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/** Preserve browser behaviours such as open-in-new-tab and download/save link. */
export function isUnmodifiedPrimaryNavigation(event: NavigationClick): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}
