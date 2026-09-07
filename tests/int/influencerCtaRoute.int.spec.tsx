import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const { getLocalizedPagePath } = vi.hoisted(() => ({ getLocalizedPagePath: vi.fn() }))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: async () => ({
    find: async () => ({ docs: [{ id: 1 }] }),
    findByID: async () => ({
      id: 1,
      slug: 'test-creator',
      influencerName: 'Test Creator',
      heroHeadline: 'Meet {name}',
      giftQuote: 'An offer from {name}',
      offerHeadline: 'Join {name}',
      discountCode: 'TEST2',
      ctaLabel: 'Claim offer',
    }),
  }),
}))
vi.mock('@/utilities/authenticatedDraft', () => ({
  getAuthenticatedDraft: async () => ({ draft: false, user: null }),
}))
vi.mock('@/utilities/publishedLocaleAvailability', () => ({
  resolvePublishedLocaleSlugs: async () => ({}),
}))
vi.mock('@/utilities/localizedPagePath', () => ({ getLocalizedPagePath }))
vi.mock('@/utilities/getInfluencerTemplate', () => ({ getInfluencerTemplate: async () => null }))
vi.mock('@/Header/Component', () => ({ Header: () => null }))
vi.mock('@/Footer/Component', () => ({ Footer: () => null }))
vi.mock('@/components/Media', () => ({ Media: () => null }))
vi.mock('@/blocks/Outcomes/Component', () => ({ OutcomesComponent: () => null }))
vi.mock('@/blocks/yourPlanBlocks/Plans/Component', () => ({ YpPlansComponent: () => null }))
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))
vi.mock('@/app/(frontend)/[locale]/influencers/[slug]/InfluencerCta', () => ({
  InfluencerCta: ({ href, label }: { href: string; label: string }) => <a href={href}>{label}</a>,
}))

import InfluencerLanding from '@/app/(frontend)/[locale]/influencers/[slug]/page'

describe('influencer CTA destination', () => {
  it.each([
    ['en', '/en/order'],
    ['de', '/de/bestellen'],
  ])(
    'sends navigation, hero and final %s CTAs to the localized order page',
    async (locale, href) => {
      getLocalizedPagePath.mockReset().mockResolvedValue(href)
      const page = await InfluencerLanding({
        params: Promise.resolve({ locale, slug: 'test-creator' }),
      })
      const container = document.createElement('div')
      container.innerHTML = renderToStaticMarkup(page)

      expect(getLocalizedPagePath).toHaveBeenCalledWith('order', locale)
      expect(getLocalizedPagePath).toHaveBeenCalledWith('order-core', locale)
      expect(getLocalizedPagePath).toHaveBeenCalledWith('order-advanced', locale)
      expect(
        [...container.querySelectorAll('a')]
          .filter((link) => link.textContent === 'Claim offer')
          .map((link) => link.getAttribute('href')),
      ).toEqual([href, href, href])
    },
  )
})
