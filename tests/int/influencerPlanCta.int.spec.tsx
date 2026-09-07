import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  YpPlansClient,
  type YpPlansBlockType,
} from '@/blocks/yourPlanBlocks/Plans/Component.client'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/components/RichText', () => ({ default: () => null }))

const planCards: YpPlansBlockType['planCards'] = [
  {
    name: 'Core',
    planFamily: 'core',
    ctaLabel: 'Choose Core',
    ctaUrl: '/original-core',
    monthly: 'or {{price:core:1}} monthly',
  },
  {
    name: 'Advanced',
    planFamily: 'advanced',
    ctaLabel: 'Choose Advanced',
    ctaUrl: '/original-advanced',
  },
]
const comparison: YpPlansBlockType['comparison'] = {
  cards: planCards.map((card) => ({ ...card, ctaStyle: 'out' })),
}
const offer = {
  code: 'TEST2',
  sourceSlug: 'creator',
  errorLabel: 'Offer unavailable',
  orderHref: '/de/bestellen',
  coreHref: '/de/core-bestellen',
  advancedHref: '/de/advanced-bestellen',
}

describe('plan CTA influencer integration', () => {
  let container: HTMLDivElement, root: Root
  beforeEach(() => {
    push.mockReset()
    sessionStorage.clear()
    document.cookie = 'nb1_currency=EUR; path=/'
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { title: 'Core', month: 1, prices: { EUR: 99 } },
          { title: 'Core', month: 4, prices: { EUR: 94 } },
          { title: 'Advanced', month: 1, prices: { EUR: 159 } },
          { title: 'Advanced', month: 4, prices: { EUR: 149 } },
        ],
      }),
    )
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('preserves normal page links and monthly pricing without an influencer offer', async () => {
    await act(async () =>
      root.render(<YpPlansClient planCards={planCards} comparison={comparison} locale="en" />),
    )
    expect(
      [...container.querySelectorAll('.plan-card a')].map((a) => a.getAttribute('href')),
    ).toEqual(['/original-core', '/original-advanced'])
    expect(container.querySelector('.pc-price')?.textContent).toContain('99')
    expect(container.querySelector('.influencer-cta')).toBeNull()
  })

  it('uses four-month catalogue prices and saves the offer from cards AND comparison buttons', async () => {
    await act(async () =>
      root.render(
        <YpPlansClient
          planCards={planCards}
          comparison={comparison}
          influencerOffer={offer}
          locale="en"
        />,
      ),
    )
    expect(container.querySelector('.pc-price')?.textContent).toContain('94')
    expect(container.querySelector('.pc-monthly')?.textContent).toContain('99')
    expect(container.querySelector('.pc-monthly')?.textContent).not.toContain('{{')
    const buttons = container.querySelectorAll<HTMLButtonElement>('.influencer-cta')
    expect(buttons).toHaveLength(4)
    buttons.forEach((button, i) => {
      sessionStorage.clear()
      act(() => button.click())
      expect(JSON.parse(sessionStorage.getItem('nb1_influencer_offer') ?? 'null')).toMatchObject({
        code: 'TEST2',
        sourceSlug: 'creator',
      })
      expect(push).toHaveBeenLastCalledWith(i % 2 === 0 ? offer.coreHref : offer.advancedHref)
    })
  })
})
