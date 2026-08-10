import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))

import { Pages } from '@/collections/Pages'
import { capturePagePublication, revalidatePage } from '@/collections/Pages/hooks/revalidatePage'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('page publication revalidation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables non-locale-aware bulk editing', () => {
    expect(Pages.disableBulkEdit).toBe(true)
  })

  it('does not mistake Payload bulk publish for a draft save', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi.fn().mockResolvedValue({
          id: 42,
          _status: 'published',
          slug: { de: 'neue-seite', en: 'new-page' },
        }),
        logger,
      },
      query: { draft: 'true' },
    }

    await capturePagePublication({
      args: { data: { _status: 'published' }, draft: true },
      operation: 'update',
      req,
    } as never)
    await revalidatePage({
      doc: { id: 42, _status: 'published', slug: 'neue-seite' },
      previousDoc: { id: 42, _status: 'draft', slug: 'neue-seite' },
      req,
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/en/new-page')
    expect(revalidatePath).toHaveBeenCalledWith('/de/neue-seite')
    expect(revalidatePath).toHaveBeenCalledWith('/fr/new-page')
    expect(req.payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ req }))
  })

  it('does not leak the all-locales lookup onto the publish response', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: {
        findByID: vi.fn().mockImplementation(() => {
          req.locale = 'all'
          return Promise.resolve({
            id: 42,
            _status: 'published',
            slug: { en: 'new-page' },
          })
        }),
        logger,
      },
      query: {},
    }

    await capturePagePublication({
      args: { data: { _status: 'published' }, id: 42 },
      operation: 'update',
      req,
    } as never)
    await revalidatePage({
      doc: { id: 42, _status: 'published', slug: 'new-page' },
      previousDoc: { id: 42, _status: 'draft', slug: 'new-page' },
      req,
    } as never)

    expect(req.locale).toBe('en')
  })

  it('invalidates a page when the individual unpublish action removes its live version', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi.fn().mockResolvedValue({
          id: 42,
          _status: 'published',
          slug: { de: 'alte-seite', en: 'old-page' },
        }),
        logger,
      },
      query: {},
    }

    await capturePagePublication({
      args: { data: { _status: 'draft' }, id: 42 },
      operation: 'update',
      req,
    } as never)
    await revalidatePage({
      doc: { id: 42, _status: 'draft', slug: 'alte-seite' },
      previousDoc: { id: 42, _status: 'published', slug: 'alte-seite' },
      req,
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/de/alte-seite')
    expect(revalidatePath).toHaveBeenCalledWith('/fr/old-page')
  })

  it('uses previousDoc if the pre-operation publication lookup fails', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: { findByID: vi.fn().mockRejectedValue(new Error('database unavailable')), logger },
      query: {},
    }

    await capturePagePublication({
      args: { data: { _status: 'draft' }, id: 42 },
      operation: 'update',
      req,
    } as never)
    await revalidatePage({
      doc: { id: 42, _status: 'draft', slug: 'renamed-page' },
      previousDoc: { id: 42, _status: 'published', slug: 'old-page' },
      req,
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/en/old-page')
    expect(logger.warn).toHaveBeenCalled()
  })

  it('preserves a successful publish when cache APIs are unavailable', async () => {
    revalidatePath.mockImplementation(() => {
      throw new Error('Next cache context is unavailable')
    })
    revalidateTag.mockImplementation(() => {
      throw new Error('Next cache context is unavailable')
    })
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
    expect(logger.warn).toHaveBeenCalled()
  })
})
