import { LivePreviewListener } from '@/components/LivePreviewListener'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { ready, refresh } = vi.hoisted(() => ({
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

function sendLivePreviewUpdate(
  update?: {
    entitySlug: string
    id: number | string
    operation: 'create' | 'update'
    updatedAt: string
  },
  origin = serverURL,
) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: {
        type: 'payload-live-preview',
        data: {},
        externallyUpdatedRelationship: update,
      },
      origin,
    }),
  )
}

describe('Payload live preview refreshes', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    ready.mockReset()
    refresh.mockReset()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => root.render(<LivePreviewListener />))
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('does not repeat the initial draft render during the Payload handshake', () => {
    expect(ready).toHaveBeenCalledOnce()
    expect(ready).toHaveBeenCalledWith({ serverURL })

    act(() => {
      sendLivePreviewUpdate()
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'payload-document-event' },
          origin: serverURL,
        }),
      )
    })

    expect(refresh).not.toHaveBeenCalled()
  })

  it('refreshes once when the first message is already a saved update', () => {
    const update = {
      entitySlug: 'pages',
      id: 42,
      operation: 'update' as const,
      updatedAt: '2026-08-05T12:00:00.000Z',
    }

    act(() => {
      sendLivePreviewUpdate(update)
      sendLivePreviewUpdate(update)
    })

    expect(refresh).toHaveBeenCalledOnce()
  })

  it('refreshes once per saved document update and rejects duplicates or other origins', () => {
    const firstUpdate = {
      entitySlug: 'pages',
      id: 42,
      operation: 'update' as const,
      updatedAt: '2026-08-05T12:00:00.000Z',
    }

    act(() => {
      sendLivePreviewUpdate()
      sendLivePreviewUpdate(firstUpdate, 'https://untrusted.example')
      sendLivePreviewUpdate(firstUpdate)
      sendLivePreviewUpdate(firstUpdate)
    })
    expect(refresh).toHaveBeenCalledOnce()

    act(() => {
      sendLivePreviewUpdate({
        ...firstUpdate,
        updatedAt: '2026-08-05T12:00:05.000Z',
      })
    })
    expect(refresh).toHaveBeenCalledTimes(2)
  })
})
