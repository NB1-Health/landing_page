import { KlaviyoPreviewStandIn } from '@/components/KlaviyoPreviewStandIn'
import { pushEventAndNavigate } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  document.documentElement.removeAttribute('data-nb1-preview')
  window.dataLayer = []
})

describe('draft Preview UI isolation', () => {
  it('navigates immediately without queuing a tracking event', () => {
    document.documentElement.dataset.nb1Preview = 'true'
    window.dataLayer = []
    const navigate = vi.fn()

    pushEventAndNavigate('plan_selected', { checkout_id: 'preview-checkout' }, navigate)

    expect(navigate).toHaveBeenCalledOnce()
    expect(window.dataLayer).toEqual([])
  })

  it('renders a deterministic disabled stand-in for external signup forms', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root: Root = createRoot(container)

    act(() => root.render(<KlaviyoPreviewStandIn />))

    const standIn = container.querySelector('[role="group"]')
    expect(standIn?.getAttribute('aria-disabled')).toBe('true')
    expect(standIn?.textContent).toContain('external Klaviyo form disabled')
    expect(standIn?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)

    act(() => root.unmount())
    container.remove()
  })
})
