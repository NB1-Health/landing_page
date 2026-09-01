export type Ga4EventName =
  | 'page_view'
  | 'view_item_list'
  | 'view_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'

export interface EcomItem {
  item_id: string
  item_name?: string
  price?: number
  quantity?: number
}

export interface Ecommerce {
  currency?: string
  value?: number
  transaction_id?: string
  items?: EcomItem[]
}

export interface UserData {
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  city?: string
  province?: string
  zip?: string
  country?: string // 2-letter ISO
  /** Legacy/untrusted input. Mapping derives external_id only from normalized email. */
  external_id?: string
}

export interface RequestContext {
  ip?: string
  userAgent?: string
  fbp?: string
  fbc?: string
  sourceUrl?: string
}

export interface ServerEvent {
  event: Ga4EventName
  event_id: string
  event_time?: number
  actionSource?: 'website' | 'system_generated'
  ecommerce?: Ecommerce
  user: UserData
  context: RequestContext
  consent: boolean
}

/** Shape the browser sends to /api/meta/events */
export interface MetaEventPayload {
  event: Ga4EventName
  event_id: string
  ecommerce?: Ecommerce
  user?: UserData
  /** fbp cookie value */
  fbp?: string
  /** fbc cookie value (or built from fbclid) */
  fbc?: string
  sourceUrl?: string
  consent: boolean
}
