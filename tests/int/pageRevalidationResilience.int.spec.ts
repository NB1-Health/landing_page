import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))

import { capturePagePublication, revalidatePage } from '@/collections/Pages/hooks/revalidatePage'

describe('local publication without a Next cache context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the Payload save successful and relies on the ISR backstop', async () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('Next cache context is unavailable')
    })
    revalidateTag.mockImplementation(() => {
      throw new Error('Next cache context is unavailable')
    })
    const logger = { info: vi.fn(), warn: vi.fn() }
    const req = {
      context: {},
      locale: 'en',
      payload: {
        findByID: vi.fn().mockResolvedValue({
          id: 42,
          _status: 'published',
          slug: { en: 'about-nb1' },
        }),
        logger,
      },
      query: {},
    }
    const doc = { id: 42, _status: 'published', slug: 'about-nb1' }

    await expect(revalidatePage({ doc, previousDoc: null, req } as never)).resolves.toBe(doc)
    expect(revalidatePath).toHaveBeenCalledWith('/en/about-nb1')
    expect(revalidateTag).toHaveBeenCalledWith('pages-sitemap-en')
    expect(logger.warn).toHaveBeenCalled()
  })

  it('invalidates every explicit Page locale path after a locale publish', async () => {
    const logger = { info: vi.fn(), warn: vi.fn() }
    const findByID = vi
      .fn()
      .mockResolvedValueOnce({
        id: 42,
        _status: 'published',
        slug: { de: 'alte-seite', en: 'old-page' },
      })
      .mockResolvedValueOnce({
        id: 42,
        _status: 'published',
        slug: { de: 'neue-seite', en: 'new-page' },
      })
    const req = {
      context: {},
      locale: 'de',
      payload: { findByID, logger },
      query: {},
    }

    await capturePagePublication({
      args: { draft: false, id: 42, publishSpecificLocale: 'de' },
      operation: 'update',
      req,
    } as never)
    const doc = { id: 42, _status: 'published', slug: 'neue-seite' }
    await revalidatePage({
      doc,
      previousDoc: { id: 42, _status: 'published', slug: 'alte-seite' },
      req,
    } as never)

    expect(revalidatePath.mock.calls).toEqual([
      ['/en/old-page'],
      ['/en/new-page'],
      ['/de/alte-seite'],
      ['/de/neue-seite'],
    ])
    expect(revalidateTag.mock.calls).toEqual([['pages-sitemap-en'], ['pages-sitemap-de']])
  })
})
