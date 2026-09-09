import React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeaderClient } from '@/Header/Component.client'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  document.cookie = 'nb1_currency=; path=/; max-age=0'
})

describe('header currency preferences', () => {
  it('shows the locale default without creating a currency cookie on hydration', () => {
    document.cookie = 'nb1_currency=; path=/; max-age=0'
    render(<HeaderClient locale="en" initialCurrency="GBP" />)
    expect(document.cookie).not.toContain('nb1_currency=')
  })

  it('preserves a valid explicit preference', () => {
    document.cookie = 'nb1_currency=CHF; path=/'
    const { container } = render(<HeaderClient locale="en" initialCurrency="CHF" />)
    expect(document.cookie).toContain('nb1_currency=CHF')
    expect(container.textContent).toContain('CHF')
  })

  it('repairs an existing unsupported preference using the locale default', () => {
    document.cookie = 'nb1_currency=USD; path=/'
    render(<HeaderClient locale="en" initialCurrency="GBP" />)
    expect(document.cookie).toContain('nb1_currency=GBP')
  })
})
