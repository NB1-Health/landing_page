import { describe, expect, it } from 'vitest'

import { pageBlocks } from '@/collections/Pages'
import {
  allowedBlockSlugsByPageType,
  getAllowedBlockSlugs,
  pageTypeOptions,
} from '@/collections/Pages/pageTypes'

describe('Payload page editorial structure', () => {
  it('keeps every existing block available and grouped in legacy mode', () => {
    expect(pageBlocks).toHaveLength(89)
    expect(new Set(pageBlocks.map(({ slug }) => slug))).toHaveLength(89)
    expect(pageBlocks.every((block) => typeof block.admin?.group === 'string')).toBe(true)
    expect(getAllowedBlockSlugs('legacy')).toBe(true)
  })

  it('constrains the approved Legal and Contact pilots', () => {
    expect(pageTypeOptions.map(({ value }) => value)).toEqual(['legacy', 'legal', 'contact'])
    expect(allowedBlockSlugsByPageType.legal).toEqual(['legalDoc'])
    expect(allowedBlockSlugsByPageType.contact).toEqual(['contactPage'])
    expect(getAllowedBlockSlugs('not-a-page-type')).toBe(true)
  })
})
