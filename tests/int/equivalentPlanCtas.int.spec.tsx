import { EndCardComponent } from '@/blocks/checkoutBlocks/EndCard/Component'
import { ReinforceCtaComponent } from '@/blocks/checkoutBlocks/ReinforceCta/Component'
import { StickyCtaBarClient } from '@/blocks/checkoutBlocks/StickyCtaBar/Component.client'
import { clearCheckoutId } from '@/lib/dataLayer'
import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const planResponse = [
  {
    title: 'Core',
    month: 4,
    is_preferred: false,
    prices: { GBP: 99, EUR: 109 },
  },
  {
    title: 'Advanced',
    month: 4,
    is_preferred: true,
    prices: { GBP: 149, EUR: 159 },
  },
]

describe('equivalent plan CTA tracking', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    window.dataLayer = []
    window.sessionStorage.clear()
    clearCheckoutId()
    document.cookie = 'nb1_currency=GBP; path=/'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => planResponse,
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
  })

  it.each([
    {
      name: 'reinforce CTA',
      links: [
        { label: 'Continue with Core', plan: 'core', value: 99 },
        { label: 'Continue with Advanced', plan: 'advanced', value: 149 },
      ],
      renderSurface: () =>
        root.render(
          <ReinforceCtaComponent
            ctaText="Continue with Core"
            ctaHref="/order-cycle-core"
            ctaText2="Continue with Advanced"
            ctaHref2="/order-cycle-advanced"
            locale="en"
          />,
        ),
    },
    {
      name: 'end-card CTA',
      links: [
        { label: 'Start with Core', plan: 'core', value: 99 },
        { label: 'Start with Advanced', plan: 'advanced', value: 149 },
      ],
      renderSurface: () =>
        root.render(
          <EndCardComponent
            ctas={[
              {
                text: 'Start with Core',
                href: '/order-cycle-core',
                variant: 'core',
              },
              {
                text: 'Start with Advanced',
                href: '/order-cycle-advanced',
                variant: 'advanced',
              },
            ]}
            locale="en"
          />,
        ),
    },
    {
      name: 'sticky CTA',
      links: [
        { label: 'Keep going with Advanced', plan: 'advanced', value: 149 },
        { label: 'Switch to Core', plan: 'core', value: 99 },
      ],
      renderSurface: () =>
        root.render(
          <StickyCtaBarClient
            primaryCtaText="Keep going with Advanced"
            primaryCtaHref="/order-cycle-advanced"
            secondaryCtaText="Switch to Core"
            secondaryCtaHref="/order-cycle-core"
            locale="en"
          />,
        ),
    },
  ])('emits plan_selected from every $name link', async ({ links, renderSurface }) => {
    await act(async () => {
      renderSurface()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    for (const expected of links) {
      window.dataLayer = []
      const link = Array.from(container.querySelectorAll('a')).find(
        (candidate) => candidate.textContent === expected.label,
      )
      expect(link).toBeDefined()
      await act(async () => {
        link!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, cancelable: true }))
      })

      expect(window.dataLayer.find((entry) => entry.event === 'plan_selected')).toMatchObject({
        event_key: '120_plan_selected',
        checkout_id: expect.any(String),
        ecommerce: {
          currency: 'GBP',
          value: expected.value,
          items: [
            {
              item_id: `NB1-${expected.plan.toUpperCase()}-4`,
              item_name: `NB1 ${expected.plan === 'core' ? 'Core' : 'Advanced'} Plan`,
              item_variant: '4-Month Subscription',
              price: expected.value,
            },
          ],
        },
      })
    }
  })
})
