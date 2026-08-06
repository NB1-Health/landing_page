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
  const localValues = new Map<string, string>()

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => localValues.clear(),
        getItem: (key: string) => localValues.get(key) ?? null,
        removeItem: (key: string) => void localValues.delete(key),
        setItem: (key: string, value: string) => void localValues.set(key, String(value)),
      },
    })
    pathname = '/de/bestellen'
    window.dataLayer = []
    window.localStorage.clear()
    document.cookie = 'nb1_attr=; Path=/; Max-Age=0'
    sessionStorage.clear()
    clearCheckoutId()
    sendMetaCapiEvent.mockReset()
    document.title = 'NB1 Order'
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    if (root) act(() => root.unmount())
    container?.remove()
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
    expect(JSON.parse(window.localStorage.getItem('nb1_attr') ?? '{}')).toMatchObject({
      v: 1,
      landing_url: expect.stringContaining('/'),
      params: {},
    })

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
