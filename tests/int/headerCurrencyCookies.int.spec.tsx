import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeaderClient } from '@/Header/Component.client'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: vi.fn() }),
}))

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  document.cookie = 'nb1_currency=; path=/; max-age=0'
})

describe('header currency preferences', () => {
  it('shows the locale default without creating a currency cookie on hydration', () => {
    document.cookie = 'nb1_currency=; path=/; max-age=0'
    act(() => root.render(<HeaderClient locale="en" initialCurrency="GBP" />))
    expect(document.cookie).not.toContain('nb1_currency=')
  })

  it('preserves a valid explicit preference', () => {
    document.cookie = 'nb1_currency=CHF; path=/'
    act(() => root.render(<HeaderClient locale="en" initialCurrency="CHF" />))
    expect(document.cookie).toContain('nb1_currency=CHF')
    expect(container.textContent).toContain('CHF')
  })

  it('repairs an existing unsupported preference using the locale default', () => {
    document.cookie = 'nb1_currency=USD; path=/'
    act(() => root.render(<HeaderClient locale="en" initialCurrency="GBP" />))
    expect(document.cookie).toContain('nb1_currency=GBP')
  })
})
