import type { Ga4EventName, ServerEvent, Ecommerce, UserData, RequestContext } from './types'
import { hEmail, hPhone, hName, hCity, hState, hZip, hCountry } from './hash'

const EVENT_MAP: Record<Ga4EventName, string> = {
  page_view: 'PageView',
  view_item_list: 'ViewItemList',
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  remove_from_cart: 'RemoveFromCart',
  view_cart: 'ViewCart',
  begin_checkout: 'InitiateCheckout',
  add_shipping_info: 'AddShippingInfo',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
}

const prune = <T extends Record<string, unknown>>(o: T): T =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null),
  ) as T

function buildUserData(u: UserData, c: RequestContext) {
  return prune({
    em: hEmail(u.email),
    ph: hPhone(u.phone),
    fn: hName(u.first_name),
    ln: hName(u.last_name),
    ct: hCity(u.city),
    st: hState(u.province),
    zp: hZip(u.zip),
    country: hCountry(u.country),
    external_id: u.external_id?.trim() || hEmail(u.email),
    client_ip_address: c.ip,
    client_user_agent: c.userAgent,
    fbp: c.fbp,
    fbc: c.fbc,
  })
}

function buildCustomData(e?: Ecommerce) {
  if (!e) return undefined
  const contents = e.items?.map((i) => ({
    id: i.item_id,
    quantity: i.quantity ?? 1,
    item_price: i.price,
  }))
  return prune({
    currency: e.currency,
    value: e.value,
    content_type: contents?.length ? 'product' : undefined,
    content_ids: e.items?.map((i) => i.item_id),
    contents,
    num_items: e.items?.reduce((n, i) => n + (i.quantity ?? 1), 0),
    order_id: e.transaction_id,
  })
}

export function mapToMetaEvent(ev: ServerEvent) {
  return prune({
    event_name: EVENT_MAP[ev.event],
    event_time: ev.event_time ?? Math.floor(Date.now() / 1000),
    event_id: ev.event_id,
    action_source: ev.actionSource ?? 'website',
    event_source_url: ev.context.sourceUrl,
    user_data: buildUserData(ev.user, ev.context),
    custom_data: buildCustomData(ev.ecommerce),
  })
}
