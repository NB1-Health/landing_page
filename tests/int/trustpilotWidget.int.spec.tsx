import { getTrustpilotConfig, TRUSTPILOT_TEMPLATE_IDS } from '@/components/Trustpilot/config'
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

describe('Trustpilot locale sources', () => {
  it('serves the Italian TrustBox to the it locale', () => {
    const tp = getTrustpilotConfig('it', 'microStar')

    expect(tp.dataLocale).toBe('it-IT')
    expect(tp.token).toBe('30c9ffa2-327c-4a46-8f23-c6cdc41b069e')
    expect(tp.reviewUrl).toBe('https://it.trustpilot.com/review/nb1.com')
    expect(tp.templateId).toBe(TRUSTPILOT_TEMPLATE_IDS.microStar)
  })

  it('serves the Italian TrustScore line in the CloseBand slot', () => {
    const tp = getTrustpilotConfig('it', 'microTrustScore')

    expect(tp.dataLocale).toBe('it-IT')
    expect(tp.token).toBe('5106703c-7fe9-45e4-82d9-fa5917a6c66d')
    expect(tp.reviewUrl).toBe('https://it.trustpilot.com/review/nb1.com')
    expect(tp.templateId).toBe(TRUSTPILOT_TEMPLATE_IDS.microTrustScore)
  })

  it('pairs every locale token with its own data-locale', () => {
    // A token only renders under the locale it was issued for, so a per-variant
    // gap has to fall back as a whole rather than mixing the two.
    for (const variant of ['microStar', 'microTrustScore'] as const) {
      for (const locale of ['en', 'de', 'fr', 'nl', 'it', 'ch', 'be', 'uk', 'uae']) {
        const tp = getTrustpilotConfig(locale, variant)
        expect(tp.token, `${locale}/${variant}`).toBeTruthy()
        expect(tp.templateId).toBe(TRUSTPILOT_TEMPLATE_IDS[variant])
      }
    }
  })

  it('resolves a region locale through its parent language', () => {
    expect(getTrustpilotConfig('ch', 'microStar').dataLocale).toBe('de-DE')
    expect(getTrustpilotConfig('be', 'microStar').dataLocale).toBe('nl-NL')
  })

  it('falls back to English for an unknown locale', () => {
    expect(getTrustpilotConfig('xx', 'microStar').dataLocale).toBe('en-US')
    expect(getTrustpilotConfig(null, 'microStar').dataLocale).toBe('en-US')
  })
})
