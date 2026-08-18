import { beforeEach, describe, expect, it, vi } from 'vitest'

const { buildServerEvent, sendMetaEvents } = vi.hoisted(() => ({
  buildServerEvent: vi.fn(() => ({ event_name: 'PageView' })),
  sendMetaEvents: vi.fn(async () => ({ sent: 1 })),
}))

vi.mock('@/lib/meta/server', () => ({ buildServerEvent, sendMetaEvents }))

import { POST } from '@/app/api/meta/events/route'

function request(event: string, consent = true): Request {
  return new Request('http://localhost/api/meta/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, event_id: 'event-1', consent }),
  })
}

describe('Meta server-event ownership', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    buildServerEvent.mockClear()
    sendMetaEvents.mockClear()
  })

  it('keeps the current Purchase sender until backend ownership is explicit', async () => {
    const response = await POST(request('purchase'))
    expect(response.status).toBe(200)
    expect(sendMetaEvents).toHaveBeenCalledOnce()
  })

  it('suppresses the landing Purchase sender after backend cutover', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PURCHASE_OWNER', 'backend')
    const response = await POST(request('purchase'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sent: 0, owner: 'backend' })
    expect(sendMetaEvents).not.toHaveBeenCalled()
  })

  it('keeps non-Purchase funnel events on the existing route', async () => {
    const response = await POST(request('page_view'))
    expect(response.status).toBe(200)
    expect(sendMetaEvents).toHaveBeenCalledOnce()
  })
})
