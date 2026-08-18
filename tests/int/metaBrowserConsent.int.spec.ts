import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendMetaCapiEvent } from '@/lib/meta/browser'

describe('Meta browser-to-server consent timing', () => {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(null, { status: 200 }),
  )

  beforeEach(() => {
    fetchMock.mockClear()
    vi.stubGlobal('fetch', fetchMock)
    window.__nb1Consent = { analytics: false, targeted_advertising: false }
    window.__nb1ConsentResolved = false
    window.history.replaceState({}, '', '/checkout?client_secret=do-not-send')
  })

  it('keeps the original event queued until consent resolves granted', async () => {
    const pending = sendMetaCapiEvent('begin_checkout', 'event-1')
    await Promise.resolve()
    expect(fetchMock).not.toHaveBeenCalled()

    window.__nb1Consent = { analytics: true, targeted_advertising: true }
    window.__nb1ConsentResolved = true
    window.dispatchEvent(new Event('nb1:consent-resolved'))
    await pending

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toMatchObject({
      event: 'begin_checkout',
      event_id: 'event-1',
      sourceUrl: expect.stringMatching(/\/checkout$/),
      consent: true,
    })
  })

  it('drops the queued server copy when consent resolves denied', async () => {
    const pending = sendMetaCapiEvent('page_view', 'event-2')
    window.__nb1ConsentResolved = true
    window.dispatchEvent(new Event('nb1:consent-resolved'))
    await pending

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
