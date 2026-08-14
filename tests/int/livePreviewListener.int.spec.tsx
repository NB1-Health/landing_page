import { LivePreviewListener } from '@/components/LivePreviewListener'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchDraft, ready, refresh } = vi.hoisted(() => ({
  fetchDraft: vi.fn(),
  ready: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@payloadcms/live-preview', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@payloadcms/live-preview')>()),
  ready,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const serverURL = window.location.origin

function sendLivePreviewUpdate(origin = serverURL) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        type: 'payload-live-preview',
        data: {},
      },
      origin,
    }),
  )
}

function sendDocumentUpdate(origin = serverURL) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'payload-document-event' },
      origin,
    }),
  )
}

describe('Payload live preview refreshes', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    vi.useFakeTimers()
    ready.mockReset()
    refresh.mockReset()
    fetchDraft.mockReset()
    fetchDraft.mockResolvedValue({
      json: async () => ({ updatedAt: '2026-08-05T12:00:00.000Z' }),
      ok: true,
    })
    vi.stubGlobal('fetch', fetchDraft)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () =>
      root.render(
        <LivePreviewListener
          collection="pages"
          documentId={42}
          locale="en"
          updatedAt="2026-08-05T12:00:00.000Z"
        />,
      ),
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('does not repeat the initial draft render during the Payload handshake', () => {
    expect(ready).toHaveBeenCalledOnce()
    expect(ready).toHaveBeenCalledWith({ serverURL })

    act(() => sendLivePreviewUpdate())

    expect(refresh).not.toHaveBeenCalled()
  })

  it('retries the ready handshake until Payload sends its baseline data', () => {
    expect(ready).toHaveBeenCalledOnce()

    act(() => vi.advanceTimersByTime(1_000))
    expect(ready).toHaveBeenCalledTimes(3)

    act(() => sendLivePreviewUpdate())
    act(() => vi.advanceTimersByTime(1_000))

    expect(ready).toHaveBeenCalledTimes(3)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('ignores Payload startup events and refreshes after a document save', () => {
    act(() => {
      sendLivePreviewUpdate()
      sendDocumentUpdate()
    })
    expect(refresh).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(0))
    act(() => sendDocumentUpdate())

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('rejects document events from another origin', () => {
    act(() => sendLivePreviewUpdate())
    act(() => vi.advanceTimersByTime(0))
    act(() => sendDocumentUpdate('https://untrusted.example'))

    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes when the saved draft timestamp changes even if Payload misses an event', async () => {
    fetchDraft.mockResolvedValueOnce({
      json: async () => ({ updatedAt: '2026-08-05T12:00:05.000Z' }),
      ok: true,
    })

    await act(async () => {
      vi.advanceTimersByTime(1_000)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(fetchDraft).toHaveBeenCalledWith(
      '/cms/api/pages/42?depth=0&draft=true&locale=en&select%5BupdatedAt%5D=true',
      { cache: 'no-store', credentials: 'include' },
    )
    expect(refresh).toHaveBeenCalledOnce()
  })
})
