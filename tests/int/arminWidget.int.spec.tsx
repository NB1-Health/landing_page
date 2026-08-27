import { ArminWidget, openArminChat } from '@/components/ArminWidget'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Armin widget loading', () => {
  let container: HTMLDivElement
  let idleCallback: (() => void) | undefined
  let requestIdleCallback: ReturnType<typeof vi.fn>
  let root: Root

  beforeEach(() => {
    window.history.replaceState({}, '', '/en')
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')

    requestIdleCallback = vi.fn((callback: () => void) => {
      idleCallback = callback
      return 1
    })
    vi.stubGlobal('requestIdleCallback', requestIdleCallback)
    vi.stubGlobal('cancelIdleCallback', vi.fn())

    delete window.cx_armin
    delete window.__arminInitialized
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    document
      .querySelectorAll('[data-armin-widget], #cx-armin-chat-widget-v2')
      .forEach((node) => node.remove())
    delete window.cx_armin
    delete window.__arminInitialized
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('waits for page load and browser idle away from checkout', () => {
    act(() => root.render(<ArminWidget locale="en" />))

    expect(document.querySelector('[data-armin-widget]')).toBeNull()
    act(() => window.dispatchEvent(new Event('load')))
    expect(requestIdleCallback).toHaveBeenCalledOnce()
    expect(document.querySelector('[data-armin-widget]')).toBeNull()

    act(() => idleCallback?.())
    expect(document.querySelectorAll('[data-armin-widget]')).toHaveLength(1)
  })

  it('loads eagerly on localized checkout pages without adding duplicate scripts', () => {
    window.history.replaceState({}, '', '/de/bestellen-details?plan=core&cycle=monthly')
    const checkout = document.createElement('div')
    checkout.setAttribute('data-nb1-order-entry', 'true')
    document.body.appendChild(checkout)

    act(() => root.render(<ArminWidget key="de" locale="de" />))
    expect(document.querySelectorAll('[data-armin-widget]')).toHaveLength(1)
    expect(requestIdleCallback).not.toHaveBeenCalled()

    act(() => root.render(<ArminWidget key="en" locale="en" />))
    expect(document.querySelectorAll('[data-armin-widget]')).toHaveLength(1)
    checkout.remove()
  })

  it('opens the current vendor launcher without toggling an open panel closed', () => {
    const widgetRoot = document.createElement('div')
    widgetRoot.id = 'cx-armin-chat-widget-v2'
    const launcher = document.createElement('button')
    launcher.setAttribute('aria-label', 'Open chat')
    const clicked = vi.fn()
    launcher.addEventListener('click', clicked)
    widgetRoot.appendChild(launcher)
    document.body.appendChild(widgetRoot)

    openArminChat()
    expect(clicked).toHaveBeenCalledOnce()

    launcher.setAttribute('aria-label', 'Close chat')
    openArminChat()
    expect(clicked).toHaveBeenCalledOnce()
  })

  it('loads immediately and fulfills an open request made before the launcher is ready', async () => {
    const init = vi.fn()
    window.cx_armin = { init }
    act(() => root.render(<ArminWidget locale="en" />))

    openArminChat()
    const script = document.querySelector<HTMLScriptElement>('[data-armin-widget]')
    expect(script).not.toBeNull()
    expect(requestIdleCallback).not.toHaveBeenCalled()

    act(() => script?.dispatchEvent(new Event('load')))
    expect(init).toHaveBeenCalledOnce()

    const widgetRoot = document.createElement('div')
    widgetRoot.id = 'cx-armin-chat-widget-v2'
    const launcher = document.createElement('button')
    launcher.setAttribute('aria-label', 'Open chat')
    const clicked = vi.fn()
    launcher.addEventListener('click', clicked)
    widgetRoot.appendChild(launcher)

    await act(async () => {
      document.body.appendChild(widgetRoot)
      await Promise.resolve()
    })

    expect(clicked).toHaveBeenCalledOnce()
    expect(document.querySelectorAll('[data-armin-widget]')).toHaveLength(1)
  })
})
