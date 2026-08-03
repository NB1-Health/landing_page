declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export const EVENT_REGISTRY = {
  page_view: { stage: 10, group: 'site', destinationEvent: 'page_view' },
  lead: { stage: 20, group: 'site', destinationEvent: 'lead' },
  start_order: { stage: 110, group: 'order', destinationEvent: 'start_order' },
  plan_selected: { stage: 120, group: 'order', destinationEvent: 'plan_selected' },
  add_to_cart: { stage: 130, group: 'order', destinationEvent: 'add_to_cart' },
  begin_checkout: { stage: 210, group: 'checkout', destinationEvent: 'begin_checkout' },
  email_submitted: {
    stage: 215,
    group: 'checkout',
    destinationEvent: 'email_submitted',
  },
  add_shipping_info: {
    stage: 220,
    group: 'checkout',
    destinationEvent: 'add_shipping_info',
  },
  add_payment_info: {
    stage: 230,
    group: 'checkout',
    destinationEvent: 'add_payment_info',
  },
  subscription_acquired: {
    stage: 310,
    group: 'acquisition',
    destinationEvent: 'purchase',
  },
  checkout_success_viewed: {
    stage: 320,
    group: 'acquisition',
    destinationEvent: 'checkout_success_viewed',
  },
  post_purchase_survey_viewed: {
    stage: 330,
    group: 'acquisition',
    destinationEvent: 'post_purchase_survey_viewed',
  },
  post_purchase_survey_answered: {
    stage: 340,
    group: 'acquisition',
    destinationEvent: 'post_purchase_survey_answered',
  },
} as const

export type CanonicalEvent = keyof typeof EVENT_REGISTRY
export type EventGroup = (typeof EVENT_REGISTRY)[CanonicalEvent]['group']

export type EventEnvelope = {
  event: (typeof EVENT_REGISTRY)[CanonicalEvent]['destinationEvent']
  canonical_event: CanonicalEvent
  event_stage: number
  event_group: EventGroup
  event_key: string
  schema_version: 1
  event_id: string
  occurred_at: string
  event_source: 'browser'
}

export type EventEnvelopeOptions = {
  eventId?: string
  occurredAt?: string
}

export function mintEventId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function buildEventEnvelope(
  canonicalEvent: CanonicalEvent,
  options: EventEnvelopeOptions = {},
): EventEnvelope {
  const definition = EVENT_REGISTRY[canonicalEvent]
  return {
    event: definition.destinationEvent,
    canonical_event: canonicalEvent,
    event_stage: definition.stage,
    event_group: definition.group,
    event_key: `${String(definition.stage).padStart(3, '0')}_${canonicalEvent}`,
    schema_version: 1,
    event_id: options.eventId ?? mintEventId(),
    occurred_at: options.occurredAt ?? new Date().toISOString(),
    event_source: 'browser',
  }
}

// Analytics-only, non-PII journey correlation. This is separate from Stripe
// IDs and the operational checkout idempotency key.
const CHECKOUT_ID_STORAGE_KEY = 'nb1_checkout_id'
const CHECKOUT_COMPLETED_STORAGE_KEY = 'nb1_checkout_completed'
const REDIRECT_PAYMENT_TYPE_STORAGE_KEY = 'nb1_redirect_payment_type'
let checkoutIdMemory: string | null = null

export type RedirectPaymentType = 'paypal' | 'klarna' | 'card'

export function markCheckoutCompleted(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CHECKOUT_COMPLETED_STORAGE_KEY, '1')
  } catch {
    // Completion state is an analytics lifecycle aid, never a checkout dependency.
  }
}

export function getOrCreateCheckoutId(
  options: { startNewJourney?: boolean } = {},
): string {
  if (options.startNewJourney && typeof window !== 'undefined') {
    try {
      if (window.sessionStorage.getItem(CHECKOUT_COMPLETED_STORAGE_KEY) === '1') {
        checkoutIdMemory = null
        window.sessionStorage.removeItem(CHECKOUT_ID_STORAGE_KEY)
        window.sessionStorage.removeItem(CHECKOUT_COMPLETED_STORAGE_KEY)
      }
    } catch {
      // Fall back to the current in-memory journey when storage is unavailable.
    }
  }

  if (checkoutIdMemory) return checkoutIdMemory

  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(CHECKOUT_ID_STORAGE_KEY)
      if (stored) {
        checkoutIdMemory = stored
        return stored
      }
    } catch {
      // Storage can be unavailable in strict privacy modes. The in-memory ID
      // still keeps one identity for the current document.
    }
  }

  checkoutIdMemory = mintEventId()
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(CHECKOUT_ID_STORAGE_KEY, checkoutIdMemory)
    } catch {
      // The base event must not depend on storage being available.
    }
  }
  return checkoutIdMemory
}

export function clearCheckoutId(): void {
  checkoutIdMemory = null
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(CHECKOUT_ID_STORAGE_KEY)
    } catch {
      // Nothing else is required when storage is unavailable.
    }
  }
}

export function setRedirectPaymentType(paymentType: RedirectPaymentType): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(REDIRECT_PAYMENT_TYPE_STORAGE_KEY, paymentType)
  } catch {
    // The return URL also carries this value; storage is an additional safeguard.
  }
}

export function consumeRedirectPaymentType(): RedirectPaymentType | null {
  if (typeof window === 'undefined') return null
  try {
    const paymentType = window.sessionStorage.getItem(REDIRECT_PAYMENT_TYPE_STORAGE_KEY)
    window.sessionStorage.removeItem(REDIRECT_PAYMENT_TYPE_STORAGE_KEY)
    return paymentType === 'paypal' || paymentType === 'klarna' || paymentType === 'card'
      ? paymentType
      : null
  } catch {
    return null
  }
}

export function resolveRedirectPaymentType(input: {
  storedPaymentType: RedirectPaymentType | null
  returnUrlPaymentType: string | null | undefined
  paypalSetupIntentId: string | null
  klarnaSetupIntentId: string | null
}): RedirectPaymentType | null {
  if (input.storedPaymentType) return input.storedPaymentType
  if (
    input.returnUrlPaymentType === 'paypal' ||
    input.returnUrlPaymentType === 'klarna' ||
    input.returnUrlPaymentType === 'card'
  ) {
    return input.returnUrlPaymentType
  }
  if (input.paypalSetupIntentId) return 'paypal'
  if (input.klarnaSetupIntentId) return 'klarna'
  return null
}

function isCanonicalEvent(event: string): event is CanonicalEvent {
  return Object.prototype.hasOwnProperty.call(EVENT_REGISTRY, event)
}

export function pushEvent(event: string, payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })

  if (isCanonicalEvent(event)) {
    const suppliedEventId =
      typeof payload.event_id === 'string' && payload.event_id ? payload.event_id : undefined
    window.dataLayer.push({
      ...payload,
      ...buildEventEnvelope(event, { eventId: suppliedEventId }),
    })
    return
  }

  // Keep existing non-V1 diagnostics (for example add_voucher_error)
  // functional while their registry/retention policy is decided separately.
  window.dataLayer.push({ event, event_id: mintEventId(), ...payload })
}

export type LeadSuccessContext = {
  leadType: string
  leadSource?: string
  formId?: string
  provider?: string
  providerSubmissionId?: string
  pageLanguage?: string
  eventId?: string
  email?: string
}

const leadSuccessTimes = new Map<string, number>()
const LEAD_IDENTITY_WAIT_MS = 250

export function resetLeadDedupe(): void {
  leadSuccessTimes.clear()
}

export function findSubmittedEmail(data: Record<string, unknown>): string | undefined {
  const emailEntry = Object.entries(data).find(
    ([name, value]) => name.toLowerCase().includes('email') && typeof value === 'string',
  )
  const email = emailEntry?.[1]
  return typeof email === 'string' && email.trim() ? email : undefined
}

async function primeLeadIdentity(email: string): Promise<void> {
  if (typeof window === 'undefined' || window.__nb1Consent?.targeted_advertising !== true) return

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      primeEnhancedUserData({ email }).then(() => undefined).catch(() => undefined),
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, LEAD_IDENTITY_WAIT_MS)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function trackLeadSuccess(context: LeadSuccessContext): Promise<boolean> {
  const now = Date.now()
  const dedupeKey = context.providerSubmissionId
    ? `${context.provider ?? 'provider'}:${context.providerSubmissionId}`
    : [
        context.provider ?? 'provider',
        context.formId ?? 'form',
        context.leadSource ?? 'source',
      ].join(':')
  const previous = leadSuccessTimes.get(dedupeKey)
  if (previous !== undefined && now - previous <= 1000) return false
  leadSuccessTimes.set(dedupeKey, now)

  if (context.email) await primeLeadIdentity(context.email)

  void pushEventWithUser(
    'lead',
    {
      ...(context.eventId ? { event_id: context.eventId } : {}),
      lead_type: context.leadType,
      ...(context.leadSource ? { lead_source: context.leadSource } : {}),
      ...(context.formId ? { form_id: context.formId } : {}),
      ...(context.provider ? { provider: context.provider } : {}),
      ...(context.providerSubmissionId
        ? { provider_submission_id: context.providerSubmissionId }
        : {}),
      ...(context.pageLanguage ? { page_language: context.pageLanguage } : {}),
    },
    {
      email: context.email,
    },
  )
  return true
}

export type EventNavigationOptions = {
  timeoutMs?: number
}

export function pushEventAndNavigate(
  event: CanonicalEvent,
  payload: Record<string, unknown>,
  navigate: () => void,
  options: EventNavigationOptions = {},
): void {
  if (typeof window === 'undefined') {
    navigate()
    return
  }

  const timeoutMs = options.timeoutMs ?? 750
  let completed = false
  const complete = () => {
    if (completed) return
    completed = true
    clearTimeout(timeoutId)
    navigate()
  }

  const timeoutId = setTimeout(complete, timeoutMs)
  pushEvent(event, {
    ...payload,
    eventCallback: complete,
    eventTimeout: timeoutMs,
  })
}

/* ─── Enhanced Conversions (client-side hashing) ──────────────────────────
   Server hashing lives in lib/meta/hash.ts (node:crypto) and can't run in the
   browser, so we hash here with the Web Crypto API. Hashed values are safe to
   put on the dataLayer; postal_code / city / country stay unhashed per the
   Enhanced Conversions spec. */

const enhancedUserDataHashPromises = new Map<string, Promise<string>>()
const enhancedUserDataHashes = new Map<string, string>()

async function sha256Hex(input: string): Promise<string> {
  const resolved = enhancedUserDataHashes.get(input)
  if (resolved) return resolved

  const pending = enhancedUserDataHashPromises.get(input)
  if (pending) return pending

  const hashPromise = crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(input))
    .then((buf) => {
      const hash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      enhancedUserDataHashes.set(input, hash)
      return hash
    })
    .catch((error) => {
      enhancedUserDataHashPromises.delete(input)
      throw error
    })

  enhancedUserDataHashPromises.set(input, hashPromise)
  return hashPromise
}

const normBasic = (v: string) => v.trim().toLowerCase()
const normPhone = (v: string) => v.replace(/\D/g, '').replace(/^0+/, '') // digits only, drop leading zeros

export type EcUserFields = {
  userId?: string // stable, non-PII (e.g. external_id)
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  address?: string // street line(s)
  postalCode?: string
  city?: string
  country?: string // ISO-3166 alpha-2, e.g. "DE"
}

/** Build the hashed `user_data` object (undefined if nothing usable / no crypto). */
export async function buildEnhancedUserData(
  f: EcUserFields,
): Promise<Record<string, unknown> | undefined> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return undefined
  const phoneDigits = f.phone ? normPhone(f.phone) : ''
  const [email, phone, fn, ln, addr] = await Promise.all([
    f.email?.trim() ? sha256Hex(normBasic(f.email)) : undefined,
    phoneDigits ? sha256Hex(phoneDigits) : undefined,
    f.firstName?.trim() ? sha256Hex(normBasic(f.firstName)) : undefined,
    f.lastName?.trim() ? sha256Hex(normBasic(f.lastName)) : undefined,
    f.address?.trim() ? sha256Hex(normBasic(f.address)) : undefined,
  ])

  const address: Record<string, unknown> = {}
  if (fn) address.sha256_first_name = fn
  if (ln) address.sha256_last_name = ln
  if (addr) address.sha256_address = addr
  if (f.postalCode?.trim()) address.postal_code = f.postalCode.trim()
  if (f.city?.trim()) address.city = f.city.trim()
  if (f.country?.trim()) address.country = f.country.trim()

  const user_data: Record<string, unknown> = {}
  if (email) user_data.sha256_email_address = email
  if (phone) user_data.sha256_phone_number = phone
  if (Object.keys(address).length) user_data.address = address

  return Object.keys(user_data).length ? user_data : undefined
}

function cachedHash(
  value: string | undefined,
  normalize: (input: string) => string,
): string | undefined {
  if (!value?.trim()) return undefined
  return enhancedUserDataHashes.get(normalize(value))
}

function buildCachedEnhancedUserData(
  f: EcUserFields,
): Record<string, unknown> | undefined {
  const email = cachedHash(f.email, normBasic)
  const phone = f.phone ? enhancedUserDataHashes.get(normPhone(f.phone)) : undefined
  const fn = cachedHash(f.firstName, normBasic)
  const ln = cachedHash(f.lastName, normBasic)
  const addr = cachedHash(f.address, normBasic)

  const address: Record<string, unknown> = {}
  if (fn) address.sha256_first_name = fn
  if (ln) address.sha256_last_name = ln
  if (addr) address.sha256_address = addr
  if (f.postalCode?.trim()) address.postal_code = f.postalCode.trim()
  if (f.city?.trim()) address.city = f.city.trim()
  if (f.country?.trim()) address.country = f.country.trim()

  const user_data: Record<string, unknown> = {}
  if (email) user_data.sha256_email_address = email
  if (phone) user_data.sha256_phone_number = phone
  if (Object.keys(address).length) user_data.address = address
  return Object.keys(user_data).length ? user_data : undefined
}

export function primeEnhancedUserData(
  fields: EcUserFields,
): Promise<Record<string, unknown> | undefined> {
  return buildEnhancedUserData(fields)
}

export function resetEnhancedUserDataCache(): void {
  enhancedUserDataHashPromises.clear()
  enhancedUserDataHashes.clear()
}

/** Push a GA4 event that also carries Enhanced Conversions `user_data`
 *  (+ `user_id` when a stable id is available). Safe to fire-and-forget. */
export async function pushEventWithUser(
  event: string,
  payload: Record<string, unknown>,
  fields: EcUserFields,
): Promise<void> {
  const hasIdentityConsent =
    typeof window !== 'undefined' && window.__nb1Consent?.targeted_advertising === true
  if (!hasIdentityConsent) {
    pushEvent(event, payload)
    return
  }

  const user_data = buildCachedEnhancedUserData(fields)
  const email_sha256 = cachedHash(fields.email, normBasic)
  pushEvent(event, {
    ...payload,
    ...(fields.userId ? { user_id: fields.userId } : {}),
    ...(email_sha256 ? { email_sha256 } : {}),
    ...(user_data ? { user_data } : {}),
  })

  try {
    await primeEnhancedUserData(fields)
  } catch {
    // Optional matching must never delay or suppress the canonical base event.
  }
}

export type PaymentType = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'klarna' | 'sepa'
export type PaymentFlow = 'inline' | 'wallet' | 'redirect'

export type SubscriptionAcquiredInput = {
  checkoutId: string
  eventId: string
  transactionId: string
  externalId?: string
  paymentType: PaymentType
  paymentFlow: PaymentFlow
  currency: string
  value: number
  shipping?: number
  coupon?: string
  item: Record<string, unknown>
  user: EcUserFields
}

const acquisitionEventIds = new Map<string, string>()
const successViews = new Set<string>()
const postPurchaseSurveyViews = new Set<string>()
const postPurchaseSurveyAnswers = new Map<string, string>()
const ACQUISITION_STORAGE_PREFIX = 'nb1_acquisition_event:'
const PAYMENT_ATTEMPT_STORAGE_PREFIX = 'nb1_payment_attempt:'
const POST_PURCHASE_SURVEY_VIEW_STORAGE_PREFIX = 'nb1_pps_view_event:'
const POST_PURCHASE_SURVEY_ANSWER_STORAGE_PREFIX = 'nb1_pps_answer_event:'

function readSessionValue(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSessionValue(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // In-memory state keeps the current document consistent when storage is unavailable.
  }
}

export function resetCheckoutTracking(): void {
  acquisitionEventIds.clear()
  successViews.clear()
  postPurchaseSurveyViews.clear()
  postPurchaseSurveyAnswers.clear()
}

export function nextPaymentAttempt(checkoutId: string): number {
  const key = `${PAYMENT_ATTEMPT_STORAGE_PREFIX}${checkoutId}`
  const current = Number(readSessionValue(key) ?? '0')
  const next = Number.isFinite(current) ? current + 1 : 1
  writeSessionValue(key, String(next))
  return next
}

export function trackSubscriptionAcquired(input: SubscriptionAcquiredInput): string {
  const storageKey = `${ACQUISITION_STORAGE_PREFIX}${input.transactionId}`
  const existing = acquisitionEventIds.get(input.transactionId) ?? readSessionValue(storageKey)
  if (existing) return existing

  acquisitionEventIds.set(input.transactionId, input.eventId)
  writeSessionValue(storageKey, input.eventId)
  void pushEventWithUser(
    'subscription_acquired',
    {
      event_id: input.eventId,
      checkout_id: input.checkoutId,
      transaction_id: input.transactionId,
      ...(input.externalId ? { external_id: input.externalId } : {}),
      payment_type: input.paymentType,
      payment_flow: input.paymentFlow,
      confirmation_source: 'checkout_confirm',
      signal_quality: 'confirmed',
      ecommerce: {
        transaction_id: input.transactionId,
        currency: input.currency,
        value: input.value,
        ...(input.shipping !== undefined ? { shipping: input.shipping } : {}),
        ...(input.coupon ? { coupon: input.coupon } : {}),
        items: [input.item],
      },
    },
    input.user,
  )
  return input.eventId
}

export type CheckoutSuccessViewedInput = {
  checkoutId: string
  acquisitionEventId: string
  transactionId: string
}

export function trackCheckoutSuccessViewed(input: CheckoutSuccessViewedInput): boolean {
  if (successViews.has(input.acquisitionEventId)) return false
  successViews.add(input.acquisitionEventId)
  pushEvent('checkout_success_viewed', {
    checkout_id: input.checkoutId,
    transaction_id: input.transactionId,
    related_event_id: input.acquisitionEventId,
  })
  return true
}

export type PostPurchaseSurveyContext = {
  checkoutId: string
  acquisitionEventId: string
  transactionId: string
  customerId: string
  externalId?: string
  orderNumber?: string | null
  email?: string
  pageLanguage: string
  surveyKey: string
  surveyVersion: number
  surveyPlacement: string
}

function postPurchaseSurveyInstanceKey(input: PostPurchaseSurveyContext): string {
  return `${input.transactionId}:${input.surveyKey}:${input.surveyVersion}:${input.surveyPlacement}`
}

function consentApprovedSurveyIdentity(
  input: Pick<PostPurchaseSurveyContext, 'customerId' | 'externalId'>,
): Record<string, string> {
  const hasIdentityConsent =
    typeof window !== 'undefined' && window.__nb1Consent?.targeted_advertising === true
  if (!hasIdentityConsent) return {}
  return {
    customer_id: input.customerId,
    ...(input.externalId ? { external_id: input.externalId } : {}),
  }
}

function postPurchaseSurveyPayload(input: PostPurchaseSurveyContext): Record<string, unknown> {
  return {
    checkout_id: input.checkoutId,
    transaction_id: input.transactionId,
    related_event_id: input.acquisitionEventId,
    ...(input.orderNumber ? { order_number: input.orderNumber } : {}),
    survey_key: input.surveyKey,
    survey_version: input.surveyVersion,
    survey_placement: input.surveyPlacement,
    page_language: input.pageLanguage,
    ...consentApprovedSurveyIdentity(input),
  }
}

export function trackPostPurchaseSurveyViewed(input: PostPurchaseSurveyContext): boolean {
  const instanceKey = postPurchaseSurveyInstanceKey(input)
  const storageKey = `${POST_PURCHASE_SURVEY_VIEW_STORAGE_PREFIX}${instanceKey}`
  if (postPurchaseSurveyViews.has(instanceKey) || readSessionValue(storageKey)) return false
  postPurchaseSurveyViews.add(instanceKey)
  const eventId = mintEventId()
  writeSessionValue(storageKey, eventId)

  void pushEventWithUser(
    'post_purchase_survey_viewed',
    {
      event_id: eventId,
      ...postPurchaseSurveyPayload(input),
    },
    {
      userId: input.externalId,
      email: input.email,
    },
  )
  return true
}

export type PostPurchaseSurveyAnsweredInput = PostPurchaseSurveyContext & {
  eventId?: string
  questionKey: string
  questionVersion: number
  answerType: string
  answerCode: string
  answerDetailCode?: string
  hasFreeText: boolean
  persistenceStatus?: 'client_only' | 'backend_requested'
}

function postPurchaseSurveyAnswerKey(input: PostPurchaseSurveyAnsweredInput): string {
  return `${postPurchaseSurveyInstanceKey(input)}:${input.questionKey}:${input.questionVersion}`
}

export function trackPostPurchaseSurveyAnswered(input: PostPurchaseSurveyAnsweredInput): string {
  const answerKey = postPurchaseSurveyAnswerKey(input)
  const storageKey = `${POST_PURCHASE_SURVEY_ANSWER_STORAGE_PREFIX}${answerKey}`
  const existing = postPurchaseSurveyAnswers.get(answerKey) ?? readSessionValue(storageKey)
  if (existing) return existing

  const eventId = input.eventId ?? mintEventId()
  postPurchaseSurveyAnswers.set(answerKey, eventId)
  writeSessionValue(storageKey, eventId)
  void pushEventWithUser(
    'post_purchase_survey_answered',
    {
      event_id: eventId,
      ...postPurchaseSurveyPayload(input),
      question_key: input.questionKey,
      question_version: input.questionVersion,
      answer_type: input.answerType,
      answer_code: input.answerCode,
      ...(input.answerDetailCode ? { answer_detail_code: input.answerDetailCode } : {}),
      has_free_text: input.hasFreeText,
      response_source: 'customer_reported',
      persistence_status: input.persistenceStatus ?? 'client_only',
    },
    {
      userId: input.externalId,
      email: input.email,
    },
  )
  return eventId
}

export type Nb1Item = {
  item_id: string
  item_name: string
  item_brand: string
  item_category: string
  item_category2: string
  item_variant: string
  price: number
  quantity: number
  discount?: number
}

export type Nb1ItemOptions = {
  planTitle?: string
  monthNum?: number
  discount?: number
}

export function buildNb1Item(
  planKey: string,
  cycleKey: string,
  monthlyPrice: number | string,
  options: Nb1ItemOptions = {},
): Nb1Item {
  const price = typeof monthlyPrice === 'string' ? parseFloat(monthlyPrice) : monthlyPrice
  const monthNum = options.monthNum ?? (cycleKey === 'monthly' ? 1 : Number(cycleKey))
  const planTitle = options.planTitle ?? (planKey === 'advanced' ? 'Advanced' : 'Core')
  const item: Nb1Item = {
    item_id: `NB1-${planKey.toUpperCase()}-${monthNum}`,
    item_name: `NB1 ${planTitle} Plan`,
    item_brand: 'NB1',
    item_category: 'Personalised Supplements',
    item_category2: 'Subscription',
    item_variant: `${monthNum}-Month Subscription`,
    price,
    quantity: 1,
  }
  if (options.discount != null && options.discount > 0) item.discount = options.discount
  return item
}
