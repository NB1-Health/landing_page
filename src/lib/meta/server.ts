import { isMetaDeliveryEnabled, META, metaEndpoint } from './config'
import type { ServerEvent, MetaEventPayload } from './types'
import { mapToMetaEvent } from './map'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function sendMetaEvents(events: ServerEvent[]) {
  const allowed = events.filter((e) => e.consent)
  if (allowed.length === 0) return { sent: 0 }
  if (!isMetaDeliveryEnabled()) return { sent: 0, skipped: 'disabled' as const }

  const body = {
    data: allowed.map(mapToMetaEvent),
    access_token: META.accessToken,
    ...(META.testEventCode ? { test_event_code: META.testEventCode } : {}),
  }

  const res = await postWithRetry(metaEndpoint(), body)
  return { sent: allowed.length, response: res }
}

async function postWithRetry(url: string, body: unknown, attempt = 0): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.ok) return res.json()

  const text = await res.text()
  const retryable = res.status >= 500 || res.status === 429
  if (!retryable || attempt >= 4) {
    throw new Error(`Meta CAPI ${res.status}: ${text}`)
  }
  await sleep(2 ** attempt * 500)
  return postWithRetry(url, body, attempt + 1)
}

/** Extract request context from a Next.js route handler Request */
export function extractRequestContext(req: Request, sourceUrl?: string) {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  const ip = xff.split(',')[0].trim() || undefined
  const userAgent = req.headers.get('user-agent') ?? undefined
  return { ip, userAgent, sourceUrl }
}

/** Build a ServerEvent from a browser payload + server-extracted context */
export function buildServerEvent(
  payload: MetaEventPayload,
  req: Request,
): ServerEvent {
  const serverCtx = extractRequestContext(req, payload.sourceUrl)
  return {
    event: payload.event,
    event_id: payload.event_id,
    ecommerce: payload.ecommerce,
    user: payload.user ?? {},
    context: {
      ...serverCtx,
      // browser supplies fbp/fbc; server supplies ip/ua (more trustworthy)
      fbp: payload.fbp,
      fbc: payload.fbc,
      sourceUrl: payload.sourceUrl,
    },
    consent: payload.consent,
  }
}
