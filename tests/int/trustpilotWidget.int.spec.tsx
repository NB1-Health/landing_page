import { TrustpilotWidget } from '@/components/Trustpilot/TrustpilotWidget'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/script', () => ({ default: () => null }))

type TrustpilotWindow = Window & {
  Trustpilot?: { loadFromElement: ReturnType<typeof vi.fn> }
}

describe('Trustpilot widget initialization', () => {
  let container: HTMLDivElement
  let root: Root
  const trustpilotWindow = window as TrustpilotWindow

  beforeEach(() => {
    vi.useFakeTimers()
    delete trustpilotWindow.Trustpilot
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    delete trustpilotWindow.Trustpilot
    vi.useRealTimers()
  })

  it('does not initialize a widget that the bootstrap auto-scan already loaded', () => {
    act(() => root.render(<TrustpilotWidget locale="en" />))

    const widget = container.querySelector<HTMLElement>('.trustpilot-widget')!
    widget.appendChild(document.createElement('iframe'))
    const loadFromElement = vi.fn()
    trustpilotWindow.Trustpilot = { loadFromElement }

    act(() => vi.advanceTimersByTime(100))

    expect(loadFromElement).not.toHaveBeenCalled()
  })

  it('still initializes widgets mounted after the bootstrap scan', () => {
    act(() => root.render(<TrustpilotWidget locale="en" />))

    const widget = container.querySelector<HTMLElement>('.trustpilot-widget')!
    const loadFromElement = vi.fn()
    trustpilotWindow.Trustpilot = { loadFromElement }

    act(() => vi.advanceTimersByTime(100))

    expect(loadFromElement).toHaveBeenCalledOnce()
    expect(loadFromElement).toHaveBeenCalledWith(widget, true)
  })
})
