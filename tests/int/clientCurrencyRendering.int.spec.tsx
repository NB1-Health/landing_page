import React, { act } from 'react'
import { createRoot, hydrateRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PriceTokensProvider, usePriceTokens } from '@/lib/plans/PriceTokensProvider'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { RenderHero } from '@/heros/RenderHero'
import { YpFaqComponent } from '@/blocks/yourPlanBlocks/Faq/Component'
import { YpStickyBuyComponent } from '@/blocks/yourPlanBlocks/StickyBuy/Component'
import { PlanSelectorClient } from '@/blocks/checkoutBlocks/PlanSelector/Component.client'
import { formatPrice, getClientCurrency, getDefaultCurrency } from '@/lib/plans/clientUtils'

vi.mock('@/components/RichText/converters', () => ({
  createJSXConverter:
    () =>
    ({ defaultConverters }: any) =>
      defaultConverters,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: vi.fn() }),
}))

const prices = [
  { title: 'Core', month: 1, is_preferred: true, prices: { EUR: 99, GBP: 89, CHF: 109, AED: 399 } },
  {
    title: 'Core',
    month: 4,
    is_preferred: false,
    prices: { EUR: 94, GBP: 84, CHF: 104, AED: 379 },
  },
  {
    title: 'Advanced',
    month: 1,
    is_preferred: false,
    prices: { EUR: 159, GBP: 149, CHF: 169, AED: 599 },
  },
]
const richText = (text: string): any => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [
      {
        type: 'paragraph',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        children: [
          { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' },
        ],
      },
    ],
  },
})
const rawFaq = {
  items: [
    { question: 'Monthly {{price:core:1}}?', answer: richText('Four months: {{price:core:4}}') },
  ],
}
const rawSticky = {
  leftKey: 'Core',
  leftValue: 'From {{price:core:1}}',
  ctaHref: '/order',
  locale: 'en',
}
const rawPlans = {
  plans: [
    {
      planKey: 'core' as const,
      name: 'Core',
      minNote: 'Monthly {{price:core:1}}',
      ctaText: 'Core',
    },
    {
      planKey: 'advanced' as const,
      name: 'Advanced',
      minNote: 'Monthly {{price:advanced:1}}',
      ctaText: 'Advanced',
    },
  ],
}
function Content() {
  const faq = usePriceTokens(rawFaq)
  const sticky = usePriceTokens(rawSticky)
  const plans = usePriceTokens(rawPlans)
  return (
    <>
      <LocaleSwitcher locale="en" />
      <RenderHero type="lowImpact" richText={richText('Hero {{(price:core:1-price:core:4)*4}}')} />
      <YpFaqComponent {...faq} />
      <YpStickyBuyComponent {...sticky} />
      <PlanSelectorClient {...plans} locale="en" />
      <input aria-label="Existing form input" defaultValue="" />
    </>
  )
}
function Page({ enabled = true, initialPrices = prices }) {
  return (
    <PriceTokensProvider locale="en" initialPrices={initialPrices} enabled={enabled}>
      <Content />
    </PriceTokensProvider>
  )
}

let container: HTMLDivElement
let root: Root | undefined
beforeEach(() => {
  document.cookie = 'nb1_currency=; path=/; max-age=0'
  sessionStorage.clear()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => prices }))
  container = document.createElement('div')
  document.body.appendChild(container)
})
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container.remove()
  document.cookie = 'nb1_currency=; path=/; max-age=0'
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function selectCurrency(currency: string) {
  document.cookie = `nb1_currency=${currency}; path=/`
  window.dispatchEvent(new CustomEvent('nb1:currencychange', { detail: currency }))
}

describe('cacheable currency rendering', () => {
  it('keeps the public price snapshot usable when the browser API request fails', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 120_000)
    vi.mocked(fetch).mockRejectedValue(new Error('API unavailable'))
    document.cookie = 'nb1_currency=CHF; path=/'
    root = createRoot(container)
    await act(async () => root!.render(<Page />))
    expect(container.textContent).toContain(`Monthly ${formatPrice(109, 'CHF', 'en')}?`)
    expect(container.textContent).not.toContain('{{price:')
  })

  it('does not request prices for a page without price tokens', async () => {
    root = createRoot(container)
    await act(async () =>
      root!.render(
        <PriceTokensProvider locale="en" initialPrices={[]} enabled={false}>
          <p>Plain content</p>
        </PriceTokensProvider>,
      ),
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('renders identical locale HTML for different preferences and hydrates to the saved currency', async () => {
    document.cookie = 'nb1_currency=CHF; path=/'
    const html = renderToString(<Page />)
    expect(html).toContain(formatPrice(89, 'GBP', 'en'))
    expect(html).not.toContain('{{price:')
    document.cookie = 'nb1_currency=EUR; path=/'
    expect(renderToString(<Page />)).toBe(html)
    document.cookie = 'nb1_currency=CHF; path=/'
    container.innerHTML = html
    const onRecoverableError = vi.fn()
    await act(async () => {
      root = hydrateRoot(container, <Page />, { onRecoverableError })
    })
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(container.textContent).toContain(formatPrice(109, 'CHF', 'en'))
    expect(container.querySelector('.payload-richtext')?.textContent).toContain(
      formatPrice(20, 'CHF', 'en'),
    )
  })

  it('updates hero, FAQ, sticky copy and plan notes without resetting user input or selected plan', async () => {
    root = createRoot(container)
    await act(async () => root!.render(<Page />))
    const input = container.querySelector('input')!
    input.value = 'keep this'
    await act(async () =>
      window.dispatchEvent(new CustomEvent('nb1:selectplan', { detail: { key: 'advanced' } })),
    )
    await act(async () => selectCurrency('CHF'))
    const text = container.textContent!
    expect(text).toContain(`Monthly ${formatPrice(109, 'CHF', 'en')}?`)
    expect(text).toContain(`Four months: ${formatPrice(104, 'CHF', 'en')}`)
    expect(text).toContain(`From ${formatPrice(109, 'CHF', 'en')}`)
    expect(text).toContain(`Monthly ${formatPrice(169, 'CHF', 'en')}`)
    expect(text).not.toContain('{{price:')
    expect(input.value).toBe('keep this')
    expect(container.querySelector('.nb1-ps-card.selected')?.textContent).toContain('Advanced')
    await act(async () => selectCurrency('EUR'))
    expect(container.textContent).toContain(`Monthly ${formatPrice(99, 'EUR', 'en')}?`)
  })

  it('uses locale defaults without creating a preference cookie', async () => {
    root = createRoot(container)
    await act(async () => root!.render(<Page />))
    expect(document.cookie).not.toContain('nb1_currency=')
    expect(getDefaultCurrency('ch')).toBe('CHF')
    expect(getDefaultCurrency('uae')).toBe('AED')
    document.cookie = 'not_nb1_currency=CHF; path=/'
    expect(getClientCurrency('en')).toBe('GBP')
    document.cookie = 'nb1_currency=GBP; path=/'
    expect(getClientCurrency('it')).toBe('EUR')
    document.cookie = 'not_nb1_currency=; path=/; max-age=0'
  })
})
