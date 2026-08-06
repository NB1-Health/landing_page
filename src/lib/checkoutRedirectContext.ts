import type { Nb1Item } from '@/lib/dataLayer'

const STORAGE_KEY = 'nb1_checkout_redirect_analytics'

export type CheckoutRedirectContext = {
  checkoutId: string
  planKey: string
  planSlug: string
  planTitle: string
  billingCycle: string
  language: string
  currency: string
  value: number
  shipping: number
  coupon?: string
  item: Nb1Item
}

export function persistCheckoutRedirectContext(context: CheckoutRedirectContext): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context))
  } catch {
    // Analytics persistence must never block checkout.
  }
}

export function readCheckoutRedirectContext(): CheckoutRedirectContext | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const context = JSON.parse(raw) as CheckoutRedirectContext
    if (
      !context ||
      typeof context.checkoutId !== 'string' ||
      typeof context.planSlug !== 'string' ||
      typeof context.billingCycle !== 'string' ||
      typeof context.currency !== 'string' ||
      typeof context.value !== 'number' ||
      !context.item
    ) {
      return null
    }
    return context
  } catch {
    return null
  }
}

export function consumeCheckoutRedirectContext(): CheckoutRedirectContext | null {
  const context = readCheckoutRedirectContext()
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Analytics cleanup must never block checkout.
  }
  return context
}
