const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

export type CheckoutPaymentIntentIn = {
  plan_slug: string
  currency?: string
  shipping_option?: string
  discount_code?: string | null
  customer_email: string
  customer_name?: string | null
  customer_phone?: string | null
  idempotency_key?: string | null
  payment_method_type?: string | null
}

export type CheckoutPaymentIntentOut = {
  client_secret: string
  setup_intent_id: string
  customer_id: string
  amount: number
  currency: string
  plan_id: string
  plan_slug: string
  shipping_option: string
  discount_code: string | null
  discount_code_valid: boolean
}

export type PublicShippingAddressIn = {
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  city: string
  state?: string | null
  postal_code: string
  country: string
  country_code: string
}

export type BillingAddressIn = {
  address_type?: 'individual' | 'company' | null
  first_name: string
  last_name: string
  company_name?: string | null
  tax_id?: string | null
  registration_number?: string | null
  email?: string | null
  phone?: string | null
  address_line1: string
  address_line2?: string | null
  city: string
  state?: string | null
  postal_code: string
  country: string
}

export type CheckoutConfirmIn = {
  setup_intent_id: string
  shipping_address: PublicShippingAddressIn
  billing_address: BillingAddressIn
  idempotency_key?: string | null
}

export type CheckoutConfirmOut = {
  status: string
  subscription_id: string
  user_id: string
  user_email: string
  plan_id: string
  plan_slug: string
  plan_title: string
  included_stool_kit: boolean
  billing_status: string
  billing_started_at: string | null
  sample_return_deadline_at: string | null
  password_setup_email_sent: boolean
  order_number: string | null
  event_id: string
  external_id: string
}

export type PostPurchaseSurveyAnswerIn = {
  question_key: string
  question_version: number
  answer_type: string
  answer_code: string
  answer_detail_code?: string
  answer_text?: string
  client_event_id?: string
  answered_at?: string
  metadata?: Record<string, unknown>
}

export type PostPurchaseSurveyResponseIn = {
  user_id: string
  transaction_id: string
  survey_key: string
  survey_version: number
  survey_placement: string
  page_language?: string
  checkout_id?: string
  related_event_id?: string
  response_source: 'customer_reported'
  context?: Record<string, unknown>
  completed_at?: string
  answers: PostPurchaseSurveyAnswerIn[]
}

/**
 * Build the Error thrown for a failed checkout request.
 *
 * Business errors send `detail` as a customer-safe plain string ("Coupon expired")
 * and that string is shown to the shopper as-is. FastAPI request-validation errors
 * (HTTP 422) send `detail` as an array of `{ loc, msg, type }` objects whose `msg`
 * values are raw English Pydantic output, with the same message repeated for every
 * failing field. Joining and displaying them produced the "same error shown four
 * times below Add discount code" bug (ClickUp 86cb3cftj), so array details are only
 * logged for debugging; the thrown error carries the generic fallback message and
 * `validation: true`, which the checkout form uses to show a localized message
 * instead of `err.message`.
 */
export type CheckoutApiError = Error & { code: string; validation: boolean }

function toCheckoutError(detail: unknown, fallback: string, code: string): CheckoutApiError {
  const validation = Array.isArray(detail)
  if (validation) console.error(`[checkoutApi] backend validation error (${code}):`, detail)
  const message = typeof detail === 'string' && detail.trim() ? detail : fallback
  return Object.assign(new Error(message), { code, validation })
}

export async function checkoutPaymentIntent(
  params: CheckoutPaymentIntentIn,
): Promise<CheckoutPaymentIntentOut> {
  const res = await fetch(`${BACKEND}/subscriptions/public/checkout/payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw toCheckoutError(err?.detail, 'Payment intent failed', 'payment_intent_failed')
  }
  return res.json()
}

export async function checkoutConfirm(
  params: CheckoutConfirmIn,
): Promise<CheckoutConfirmOut> {
  const res = await fetch(`${BACKEND}/subscriptions/public/checkout/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw toCheckoutError(err?.detail, 'Checkout confirm failed', 'confirm_failed')
  }
  return res.json()
}

/**
 * Best-effort persistence for the post-purchase attribution survey. The backend
 * is idempotent by survey/question and client event ID, so retries are safe.
 * Never throws: saving a survey answer must not interrupt checkout confirmation.
 */
export async function persistPostPurchaseSurveyResponse(
  params: PostPurchaseSurveyResponseIn,
): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/post-purchase-surveys/public/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(params),
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

export interface CheckoutConfirmMetaSidecar {
  consent: boolean
  fbp?: string
  fbc?: string
  currency?: string
  value?: number
  item_id?: string
  item_name?: string
}

/**
 * Same as checkoutConfirm but routes through our Next.js proxy so the
 * purchase Meta CAPI event fires server-to-server before the response
 * returns to the browser.
 */
export async function checkoutConfirmProxy(
  params: CheckoutConfirmIn,
  meta: CheckoutConfirmMetaSidecar,
): Promise<CheckoutConfirmOut> {
  const res = await fetch('/api/checkout/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ ...params, _meta: meta }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw toCheckoutError(err?.detail, 'Checkout confirm failed', 'confirm_failed')
  }
  return res.json()
}

/**
 * Fire-and-forget: record the visitor's UI language on their Klaviyo profile via the
 * PUBLIC (unauthenticated) backend endpoint — the guest has no login, so the profile is
 * identified by their checkout email. Sent at checkout so `language` lands on the same
 * Klaviyo profile as order_number / plan_title. Never throws: analytics must not block checkout.
 */
export async function trackLanguagePublic(email: string, language: string): Promise<void> {
  if (!email || !language) return
  try {
    await fetch(`${BACKEND}/klaviyo/events/track-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        event_name: 'changed_language',
        email,
        language,
        promote_to_profile: true,
      }),
    })
  } catch {
    /* best-effort analytics — ignore network errors */
  }
}
