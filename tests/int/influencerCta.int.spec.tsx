import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { storeInfluencerOffer } = vi.hoisted(() => ({
  storeInfluencerOffer: vi.fn(),
}))
const navigation = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('@/lib/influencerOffer', () => ({ storeInfluencerOffer }))
vi.mock('next/navigation', () => ({ useRouter: () => navigation }))

import { InfluencerCta } from '@/app/(frontend)/[locale]/influencers/[slug]/InfluencerCta'

describe('InfluencerCta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storeInfluencerOffer.mockReturnValue({
      code: '20OFF',
      sourceSlug: 'creator-name',
      storedAt: Date.now(),
    })
  })

  it('stores the offer before navigating to the clean plan URL', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() =>
      root.render(
        <InfluencerCta
          code="20OFF"
          errorLabel="Offer unavailable"
          href="/en/your-plan"
          label="Claim offer"
          sourceSlug="creator-name"
        />,
      ),
    )

    const button = container.querySelector<HTMLButtonElement>('button')
    if (!button) throw new Error('CTA button missing')
    expect(button.textContent).toBe('Claim offer')

    act(() => button.click())
    expect(storeInfluencerOffer).toHaveBeenCalledWith({
      code: '20OFF',
      sourceSlug: 'creator-name',
    })
    expect(navigation.push).toHaveBeenCalledWith('/en/your-plan')

    act(() => root.unmount())
    container.remove()
  })

  it('stays on the landing page and warns when browser storage is unavailable', () => {
    storeInfluencerOffer.mockReturnValueOnce(null)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() =>
      root.render(
        <InfluencerCta
          code="20OFF"
          errorLabel="Offer unavailable"
          href="/en/your-plan"
          label="Claim offer"
          sourceSlug="creator-name"
        />,
      ),
    )

    act(() => container.querySelector<HTMLButtonElement>('button')?.click())

    expect(navigation.push).not.toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Offer unavailable')

    act(() => root.unmount())
    container.remove()
  })
})
