import { PageViewTracker } from '@/components/DataLayerEvents/PageViewTracker'
import { clearCheckoutId } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let pathname = '/de/bestellen'

const sendMetaCapiEvent = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

vi.mock('@/lib/meta/browser', () => ({
  sendMetaCapiEvent: (...args: unknown[]) => sendMetaCapiEvent(...args),
}))

describe('public route event boundaries', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    pathname = '/de/bestellen'
    window.dataLayer = []
    sessionStorage.clear()
    clearCheckoutId()
    sendMetaCapiEvent.mockReset()
    document.title = 'NB1 Order'
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('emits page_view and metadata-driven start_order once for a canonical order page', async () => {
    await act(async () => {
      root.render(
        <>
          <article data-nb1-order-entry="true" />
          <PageViewTracker />
        </>,
      )
    })

    expect(window.dataLayer.filter((entry) => entry.event === 'page_view')).toHaveLength(1)
    expect(window.dataLayer.filter((entry) => entry.event === 'start_order')).toHaveLength(1)

    const pageView = window.dataLayer.find((entry) => entry.event === 'page_view')
    const startOrder = window.dataLayer.find((entry) => entry.event === 'start_order')

    expect(pageView).toMatchObject({
      canonical_event: 'page_view',
      event_key: '010_page_view',
      page_language: 'de',
    })
    expect(startOrder).toMatchObject({
      canonical_event: 'start_order',
      event_key: '110_start_order',
      page_language: 'de',
      related_event_id: pageView?.event_id,
      checkout_id: expect.any(String),
    })
    expect(sendMetaCapiEvent).toHaveBeenCalledWith('page_view', pageView?.event_id)

    await act(async () => {
      root.render(
        <>
          <article data-nb1-order-entry="true" />
          <PageViewTracker />
        </>,
      )
    })
    expect(window.dataLayer.filter((entry) => entry.event === 'page_view')).toHaveLength(1)
    expect(window.dataLayer.filter((entry) => entry.event === 'start_order')).toHaveLength(1)
  })

  it('emits a new page view after a real route change without inventing start_order', async () => {
    await act(async () => {
      root.render(
        <>
          <article />
          <PageViewTracker />
        </>,
      )
    })
    expect(window.dataLayer.filter((entry) => entry.event === 'page_view')).toHaveLength(1)

    pathname = '/fr/recherche'
    await act(async () => {
      root.render(
        <>
          <article />
          <PageViewTracker />
        </>,
      )
    })
    expect(window.dataLayer.filter((entry) => entry.event === 'page_view')).toHaveLength(2)
    expect(window.dataLayer.filter((entry) => entry.event === 'start_order')).toHaveLength(0)
    expect(window.dataLayer.at(-1)).toMatchObject({
      event: 'page_view',
      page_language: 'fr',
    })
  })
})
