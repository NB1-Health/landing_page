import type { CommercialIdentity } from './commercialIdentity'

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
  checkout_id?: string | null
  attribution?: Partial<Record<
    | 'utm_source'
    | 'utm_medium'
    | 'utm_campaign'
    | 'utm_content'
    | 'utm_term'
    | 'gclid'
    | 'gbraid'
    | 'wbraid'
    | 'fbclid',
    string
  >>
  tracking_context?: CommercialIdentity
}

const UTM_ATTRIBUTION_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
] as const
const ADVERTISING_ATTRIBUTION_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid'] as const
const ATTRIBUTION_STORAGE_KEY = 'nb1_checkout_attribution'

function permittedAttribution(
  valueFor: (key: string) => unknown,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = valueFor(key)
      return typeof value === 'string' && value ? [[key, value.slice(0, 256)]] : []
    }),
  )
}

function readStoredAttribution(): Record<string, unknown> {
  let stored: Record<string, unknown> = {}
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed
  } catch {
    try {
      window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }
  return stored
}

function storeAttribution(attribution: Record<string, string>): void {
  try {
    if (Object.keys(attribution).length) {
      window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution))
    } else {
      window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

/** Capture campaign context when it is present, before navigation removes it. */
export function captureCheckoutAttribution(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const stored = readStoredAttribution()
  const consentResolved = window.__nb1ConsentResolved === true
  const advertisingConsent =
    consentResolved && window.__nb1Consent?.targeted_advertising === true
  const storedAdvertising = permittedAttribution(
    (key) => stored[key],
    ADVERTISING_ATTRIBUTION_KEYS,
  )
  storeAttribution({
    ...permittedAttribution((key) => stored[key], UTM_ATTRIBUTION_KEYS),
    ...permittedAttribution((key) => params.get(key), UTM_ATTRIBUTION_KEYS),
    // Previously consented IDs stay inert during Ketch's brief unresolved state. They are exposed
    // only after consent resolves true, and removed as soon as it resolves false.
    ...(!consentResolved ? storedAdvertising : {}),
    ...(advertisingConsent ? storedAdvertising : {}),
    ...(advertisingConsent
      ? permittedAttribution((key) => params.get(key), ADVERTISING_ATTRIBUTION_KEYS)
      : {}),
  })
}

export function getPermittedCheckoutAttribution(): CheckoutConfirmIn['attribution'] {
  if (typeof window === 'undefined') return {}
  captureCheckoutAttribution()
  const stored = readStoredAttribution()
  const advertisingConsent =
    window.__nb1ConsentResolved === true &&
    window.__nb1Consent?.targeted_advertising === true
  return {
    ...permittedAttribution((key) => stored[key], UTM_ATTRIBUTION_KEYS),
    ...(advertisingConsent
      ? permittedAttribution((key) => stored[key], ADVERTISING_ATTRIBUTION_KEYS)
      : {}),
  }
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
  purchase_uuid: string
  customer_uuid: string
  ev_value: number | null
  max_value: number | null
  value_currency: string | null
  plan_term: number
  commercial_value_policy_version: string
  referral_code: string | null
  referral_share_url: string | null
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
 * Turn a backend error body's `detail` into a human-readable string.
 *
 * Business errors send `detail` as a plain string ("Coupon expired"), but
 * FastAPI request-validation errors (HTTP 422) send it as an array of
 * `{ loc, msg, type }` objects. Passing that array straight into `new Error()`
 * coerces it to "[object Object],[object Object],…", which then surfaces in the
 * checkout UI. Flatten the array to its `msg` fields instead, and fall back to
 * a generic message when `detail` is missing or an unexpected shape.
 */
function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) =>
        typeof d === 'string'
          ? d
          : d && typeof d === 'object' && 'msg' in d
            ? String((d as { msg: unknown }).msg)
            : '',
      )
      .filter(Boolean)
    if (msgs.length) return msgs.join(', ')
  }
  return fallback
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
    throw Object.assign(new Error(detailToMessage(err?.detail, 'Payment intent failed')), { code: 'payment_intent_failed' })
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
    throw Object.assign(new Error(detailToMessage(err?.detail, 'Checkout confirm failed')), { code: 'confirm_failed' })
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
