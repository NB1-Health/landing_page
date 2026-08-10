const ATTRIBUTION_KEY = 'nb1_attr'
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000
const ATTRIBUTION_MAX_AGE_SECONDS = ATTRIBUTION_TTL_MS / 1000
const MAX_PROPERTY_LENGTH = 300
const MAX_URL_LENGTH = 500
const MAX_COOKIE_VALUE_LENGTH = 3800

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'fbclid',
  'gclid',
  'klar_source',
  'klar_adid',
] as const

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number]
type AttributionParams = Partial<Record<AttributionKey, string>>

export type FirstTouchAttribution = {
  v: 1
  ts: number
  landing_url: string
  referrer?: string
  params: AttributionParams
}

type KlaviyoValue = string | number | boolean | string[] | Record<string, unknown>
type KlaviyoProperties = Record<string, KlaviyoValue>

export type KlaviyoStartedCheckoutInput = {
  email: string
  checkoutId: string
  language: string
  currency: string
  cartValue: number
  coupon?: string
  item: Record<string, unknown>
}

export type KlaviyoCheckoutCompletedInput = KlaviyoStartedCheckoutInput & {
  eventId: string
  transactionId: string
  orderNumber?: string | null
  planSlug?: string
  billingCycle?: string
}

const startedCheckouts = new Set<string>()
const completedCheckouts = new Set<string>()
const STARTED_STORAGE_PREFIX = 'nb1_klaviyo_started:'
const COMPLETED_STORAGE_PREFIX = 'nb1_klaviyo_completed:'

function boundedString(value: unknown, maxLength = MAX_PROPERTY_LENGTH): string | undefined {
  if (typeof value !== 'string') return undefined
  const bounded = value.trim().slice(0, maxLength)
  return bounded || undefined
}

function sanitizeUrl(value: unknown, base?: string): string | undefined {
  const raw = boundedString(value, 2000)
  if (!raw) return undefined
  try {
    const url = new URL(raw, base)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined
    return `${url.origin}${url.pathname}`.slice(0, MAX_URL_LENGTH)
  } catch {
    return undefined
  }
}

function sanitizeParams(value: unknown): AttributionParams {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const source = value as Record<string, unknown>
  return Object.fromEntries(
    ATTRIBUTION_KEYS.flatMap((key) => {
      const property = boundedString(source[key])
      return property ? [[key, property]] : []
    }),
  )
}

function normalizeRecord(value: unknown): FirstTouchAttribution | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  const ts = Number(candidate.ts)
  const now = Date.now()
  if (
    !Number.isFinite(ts) ||
    ts <= 0 ||
    ts > now + 5 * 60 * 1000 ||
    now - ts > ATTRIBUTION_TTL_MS
  ) {
    return null
  }

  const params = sanitizeParams(candidate.params)
  const fallbackOrigin = typeof window === 'undefined' ? undefined : window.location.origin
  const landingUrl =
    sanitizeUrl(candidate.landing_url, fallbackOrigin) ??
    sanitizeUrl(candidate.landing_path, fallbackOrigin)
  const referrer = sanitizeUrl(candidate.referrer, fallbackOrigin)
  if (!landingUrl && !referrer && Object.keys(params).length === 0) return null

  return {
    v: 1,
    ts,
    landing_url: landingUrl ?? '',
    ...(referrer ? { referrer } : {}),
    params,
  }
}

function parseRecord(raw: string | null, encoded = false): FirstTouchAttribution | null {
  if (!raw) return null
  try {
    return normalizeRecord(JSON.parse(encoded ? decodeURIComponent(raw) : raw))
  } catch {
    return null
  }
}

function readCookie(): FirstTouchAttribution | null {
  if (typeof document === 'undefined') return null
  const prefix = `${ATTRIBUTION_KEY}=`
  const raw = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)
  return parseRecord(raw ?? null, true)
}

function readLocalRecord(): FirstTouchAttribution | null {
  if (typeof window === 'undefined') return null
  try {
    return parseRecord(window.localStorage.getItem(ATTRIBUTION_KEY))
  } catch {
    return null
  }
}

function currentRecord(): FirstTouchAttribution {
  const query = new URLSearchParams(window.location.search)
  const params = Object.fromEntries(
    ATTRIBUTION_KEYS.flatMap((key) => {
      const value = boundedString(query.get(key))
      return value ? [[key, value]] : []
    }),
  )
  return {
    v: 1,
    ts: Date.now(),
    landing_url:
      sanitizeUrl(window.location.href) ?? `${window.location.origin}${window.location.pathname}`,
    ...(sanitizeUrl(document.referrer, window.location.origin)
      ? { referrer: sanitizeUrl(document.referrer, window.location.origin) }
      : {}),
    params,
  }
}

function encodeCookieRecord(record: FirstTouchAttribution): string {
  const bounded: FirstTouchAttribution = { ...record, params: {} }
  let encoded = encodeURIComponent(JSON.stringify(bounded))
  if (encoded.length > MAX_COOKIE_VALUE_LENGTH && bounded.referrer) {
    delete bounded.referrer
    encoded = encodeURIComponent(JSON.stringify(bounded))
  }
  while (encoded.length > MAX_COOKIE_VALUE_LENGTH && bounded.landing_url) {
    bounded.landing_url = bounded.landing_url.slice(0, -1)
    encoded = encodeURIComponent(JSON.stringify(bounded))
  }
  for (const key of ATTRIBUTION_KEYS) {
    const value = record.params[key]
    if (!value) continue
    bounded.params[key] = value
    const candidate = encodeURIComponent(JSON.stringify(bounded))
    if (candidate.length > MAX_COOKIE_VALUE_LENGTH) {
      delete bounded.params[key]
    } else {
      encoded = candidate
    }
  }
  return encoded
}

function persistRecord(record: FirstTouchAttribution): void {
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(record))
  } catch {
    // The shared cookie still carries attribution when localStorage is unavailable.
  }

  try {
    const hostname = window.location.hostname.toLowerCase()
    const sharedDomain = hostname === 'nb1.com' || hostname.endsWith('.nb1.com')
    const secure = window.location.protocol === 'https:'
    document.cookie = [
      `${ATTRIBUTION_KEY}=${encodeCookieRecord(record)}`,
      'Path=/',
      `Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}`,
      'SameSite=Lax',
      ...(sharedDomain ? ['Domain=.nb1.com'] : []),
      ...(secure ? ['Secure'] : []),
    ].join('; ')
  } catch {
    // Attribution is best-effort and must never affect navigation or checkout.
  }
}

/**
 * Capture one first-attributable-touch record and mirror it between localStorage
 * and the parent-domain cookie shared by try.nb1.com and nb1.com. An initial
 * organic record can upgrade once; attributed records are never overwritten.
 */
export function captureFirstTouchAttribution(): FirstTouchAttribution | null {
  if (typeof window === 'undefined') return null
  const stored = [readCookie(), readLocalRecord()].filter(
    (record): record is FirstTouchAttribution => Boolean(record),
  )
  const oldest = (records: FirstTouchAttribution[]) =>
    records.sort(
      (a, b) => a.ts - b.ts || Object.keys(b.params).length - Object.keys(a.params).length,
    )[0]
  const attributed = oldest(stored.filter((record) => Object.keys(record.params).length > 0))
  const anonymous = oldest(stored)
  const current = currentRecord()
  const record =
    attributed ?? (Object.keys(current.params).length > 0 ? current : (anonymous ?? current))
  persistRecord(record)
  return record
}

export function getFirstTouchAttribution(): FirstTouchAttribution | null {
  return captureFirstTouchAttribution()
}

function paidChannel(params: AttributionParams): string | undefined {
  const source = params.utm_source?.toLowerCase() ?? ''
  const klarSource = params.klar_source?.toLowerCase() ?? ''
  if (
    params.fbclid ||
    klarSource === 'meta' ||
    ['meta', 'facebook', 'fb', 'ig', 'instagram', 'facebook.com', 'm.facebook.com'].includes(source)
  ) {
    return 'meta'
  }
  if (
    params.gclid ||
    ['google', 'adwords', 'googleads', 'youtube', 'gdn', 'dv360'].includes(source)
  ) {
    return 'google'
  }
  return source || params.utm_medium ? 'other' : undefined
}

function attributionProperties(): KlaviyoProperties {
  const attribution = getFirstTouchAttribution()
  if (!attribution) return {}
  const { params } = attribution
  const channel = paidChannel(params)
  return compactProperties({
    nb1_utm_source: params.utm_source,
    nb1_utm_medium: params.utm_medium,
    nb1_utm_campaign: params.utm_campaign,
    nb1_utm_content: params.utm_content,
    nb1_utm_term: params.utm_term,
    nb1_utm_id: params.utm_id,
    nb1_fbclid: params.fbclid,
    nb1_gclid: params.gclid,
    nb1_paid_channel: channel,
    nb1_meta_campaign_name: channel === 'meta' ? params.utm_campaign : undefined,
    nb1_meta_ad_name: channel === 'meta' ? params.utm_content : undefined,
    nb1_meta_adset_name: channel === 'meta' ? params.utm_term : undefined,
    nb1_meta_ad_id: channel === 'meta' ? params.klar_adid : undefined,
    nb1_meta_campaign_id: channel === 'meta' ? params.utm_id : undefined,
    nb1_first_landing_url: attribution.landing_url || undefined,
    nb1_first_referrer: attribution.referrer,
  })
}

function compactProperties(properties: Record<string, unknown>): KlaviyoProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => {
      if (typeof value === 'string') return Boolean(value)
      return (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        Array.isArray(value) ||
        Boolean(value)
      )
    }),
  ) as KlaviyoProperties
}

function readSession(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeSession(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // The in-memory set still deduplicates within this document.
  }
}

function removeSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

function normalizedEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null
}

function emailToken(email: string): string {
  let hash = 2166136261
  for (let index = 0; index < email.length; index += 1) {
    hash ^= email.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function checkoutUrl(): string {
  return sanitizeUrl(window.location.href) ?? `${window.location.origin}${window.location.pathname}`
}

function itemProperties(item: Record<string, unknown>): KlaviyoProperties {
  return compactProperties({
    item_id: item.item_id,
    item_name: item.item_name,
    item_variant: item.item_variant,
    item_category: item.item_category,
    quantity: item.quantity,
  })
}

function clearDedupe(set: Set<string>, id: string, storageKey: string): void {
  set.delete(id)
  removeSession(storageKey)
}

function catchFailed(value: unknown, onFailure: () => void): void {
  if (value === false) {
    onFailure()
    return
  }
  if (!value || typeof value !== 'object' || !('then' in value)) return
  void Promise.resolve(value as unknown).then((result: unknown) => {
    if (result === false) onFailure()
  }, onFailure)
}

function identifyThenTrack(
  profile: KlaviyoProperties,
  eventName: string,
  eventProperties: KlaviyoProperties,
  onFailure: () => void,
): boolean {
  if (typeof window === 'undefined' || !window.klaviyo) return false
  let failedSynchronously = false
  const fail = () => {
    failedSynchronously = true
    onFailure()
  }
  try {
    let trackStarted = false
    const track = (identified?: unknown) => {
      if (trackStarted) return
      if (identified === false) {
        fail()
        return
      }
      trackStarted = true
      try {
        if (typeof window.klaviyo.track === 'function') {
          catchFailed(
            window.klaviyo.track(eventName, eventProperties, (result: unknown) => {
              if (result === false) fail()
            }),
            fail,
          )
        } else if (typeof window.klaviyo.push === 'function') {
          window.klaviyo.push([
            'track',
            eventName,
            eventProperties,
            (result: unknown) => {
              if (result === false) fail()
            },
          ])
        } else {
          fail()
        }
      } catch {
        fail()
      }
    }

    if (typeof window.klaviyo.identify === 'function') {
      catchFailed(window.klaviyo.identify(profile, track), fail)
    } else if (typeof window.klaviyo.push === 'function') {
      window.klaviyo.push(['identify', profile, track])
    } else {
      return false
    }
    return !failedSynchronously
  } catch {
    fail()
    return false
  }
}

export function trackKlaviyoStartedCheckout(input: KlaviyoStartedCheckoutInput): boolean {
  if (typeof window === 'undefined') return false
  const email = normalizedEmail(input.email)
  if (!email || !input.checkoutId) return false
  const identityKey = `${input.checkoutId}:${emailToken(email)}`
  const storageKey = `${STARTED_STORAGE_PREFIX}${identityKey}`
  if (startedCheckouts.has(identityKey) || readSession(storageKey)) return false

  const eventProperties = compactProperties({
    $event_id: `started_checkout:${identityKey}`,
    checkout_id: input.checkoutId,
    checkout_url: checkoutUrl(),
    page_language: input.language,
    currency: input.currency,
    cart_value: input.cartValue,
    coupon: input.coupon,
    ...itemProperties(input.item),
    ...attributionProperties(),
  })
  const profile = compactProperties({
    email,
    language: input.language,
    ...attributionProperties(),
  })

  startedCheckouts.add(identityKey)
  writeSession(storageKey)
  const tracked = identifyThenTrack(profile, 'Started Checkout', eventProperties, () =>
    clearDedupe(startedCheckouts, identityKey, storageKey),
  )
  if (!tracked) clearDedupe(startedCheckouts, identityKey, storageKey)
  return tracked
}

export function trackKlaviyoCheckoutCompleted(input: KlaviyoCheckoutCompletedInput): boolean {
  if (typeof window === 'undefined') return false
  const email = normalizedEmail(input.email)
  if (!email || !input.transactionId) return false
  const storageKey = `${COMPLETED_STORAGE_PREFIX}${input.transactionId}`
  if (completedCheckouts.has(input.transactionId) || readSession(storageKey)) return false

  const eventProperties = compactProperties({
    $event_id: input.eventId,
    checkout_id: input.checkoutId,
    transaction_id: input.transactionId,
    order_number: input.orderNumber,
    plan_slug: input.planSlug,
    billing_cycle: input.billingCycle,
    checkout_url: checkoutUrl(),
    page_language: input.language,
    currency: input.currency,
    cart_value: input.cartValue,
    coupon: input.coupon,
    ...itemProperties(input.item),
    ...attributionProperties(),
  })
  const profile = compactProperties({
    email,
    language: input.language,
    ...attributionProperties(),
  })

  completedCheckouts.add(input.transactionId)
  writeSession(storageKey)
  const tracked = identifyThenTrack(profile, 'Checkout Completed', eventProperties, () =>
    clearDedupe(completedCheckouts, input.transactionId, storageKey),
  )
  if (!tracked) clearDedupe(completedCheckouts, input.transactionId, storageKey)
  return tracked
}

export function resetKlaviyoCheckoutTracking(): void {
  startedCheckouts.clear()
  completedCheckouts.clear()
}
