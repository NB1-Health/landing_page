import { describe, expect, it, vi } from 'vitest'

vi.mock('@/utilities/getURL', () => ({
  getServerSideURL: () => 'https://nb1.example',
}))

import { generateMeta } from '@/utilities/generateMeta'

describe('Page canonical metadata identity', () => {
  it.each([
    ['translated home', 'startseite', 'https://nb1.example/de'],
    ['ordinary page whose translated slug is home', 'home', 'https://nb1.example/de/home'],
  ])('uses the derived canonical for Open Graph on a %s', async (_label, slug, canonicalURL) => {
    const metadata = await generateMeta({
      canonicalURL,
      doc: { slug },
      locale: 'de',
    })

    expect(metadata.alternates?.canonical).toBe(canonicalURL)
    expect(metadata.openGraph?.url).toBe(canonicalURL)
  })
})
