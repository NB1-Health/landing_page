import { beforeEach, describe, expect, it, vi } from 'vitest'

const { purgeCloudflareCacheTags, revalidatePath, revalidateTag } = vi.hoisted(() => ({
  purgeCloudflareCacheTags: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))
vi.mock('@/utilities/cloudflareCache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/cloudflareCache')>()),
  purgeCloudflareCacheTags,
}))

import { Pages } from '@/collections/Pages'
import {
  capturePagePublication,
  revalidateDelete as revalidateDeletedPage,
  revalidatePage,
} from '@/collections/Pages/hooks/revalidatePage'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('page publication revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    purgeCloudflareCacheTags.mockResolvedValue(false)
  })

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
          _status: { de: 'published', en: 'published' },
          slug: { de: 'neue-seite', en: 'new-page' },
          title: { de: 'Neue Seite', en: 'New page' },
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
    expect(revalidatePath).not.toHaveBeenCalledWith('/fr/new-page')
    expect(revalidateTag).toHaveBeenCalledWith('pages')
    expect(purgeCloudflareCacheTags).toHaveBeenCalledWith(['nb1-sitemaps'])
    expect(req.payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ req }))
  })

  it('does not leak the all-locales lookup onto the publish response', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: {
        findByID: vi
          .fn()
          .mockImplementationOnce(() => {
            req.locale = 'all'
            return Promise.resolve({
              id: 42,
              _status: { en: 'draft' },
              slug: { en: 'new-page' },
              title: { en: 'New page' },
            })
          })
          .mockImplementationOnce(() => {
            req.locale = 'all'
            return Promise.resolve({
              id: 42,
              _status: { en: 'published' },
              slug: { en: 'new-page' },
              title: { en: 'New page' },
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

  it('does not purge the edge for a draft autosave', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: { findByID: vi.fn(), logger },
      query: { draft: 'true' },
    }
    const doc = { id: 42, _status: 'draft', slug: 'draft-page' }

    await capturePagePublication({
      args: { data: { _status: 'draft' }, draft: true, id: 42 },
      operation: 'update',
      req,
    } as never)
    await expect(revalidatePage({ doc, previousDoc: doc, req } as never)).resolves.toBe(doc)

    expect(req.payload.findByID).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(purgeCloudflareCacheTags).not.toHaveBeenCalled()
  })

  it('invalidates a page when the individual unpublish action removes its live version', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi
          .fn()
          .mockResolvedValueOnce({
            id: 42,
            _status: { de: 'published', en: 'published' },
            slug: { de: 'alte-seite', en: 'old-page' },
            title: { de: 'Alte Seite', en: 'Old page' },
          })
          .mockResolvedValueOnce({
            id: 42,
            _status: { de: 'draft', en: 'published' },
            slug: { de: 'alte-seite', en: 'old-page' },
            title: { de: 'Alte Seite', en: 'Old page' },
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
    expect(revalidatePath).not.toHaveBeenCalledWith('/fr/old-page')
    expect(revalidateTag).toHaveBeenCalledWith('pages')
  })

  it('keeps the localized home path when English is already unpublished', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi.fn().mockImplementation(({ locale }) =>
          Promise.resolve(
            locale === 'en'
              ? { id: 42, slug: 'home' }
              : {
                  id: 42,
                  _status: { de: 'published', en: 'draft' },
                  slug: { de: 'startseite', en: 'home' },
                  title: { de: 'Startseite', en: 'Home' },
                },
          ),
        ),
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
      doc: { id: 42, _status: 'published', slug: 'startseite' },
      previousDoc: { id: 42, _status: 'published', slug: 'startseite' },
      req,
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/de')
    expect(revalidatePath).not.toHaveBeenCalledWith('/de/startseite')
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
    purgeCloudflareCacheTags.mockRejectedValue(new Error('Cloudflare is unavailable'))
    const req = {
      context: {},
      locale: 'en',
      payload: {
        findByID: vi.fn().mockResolvedValue({
          id: 42,
          _status: { en: 'published' },
          slug: { en: 'about-nb1' },
          title: { en: 'About NB1' },
        }),
        logger,
      },
      query: {},
    }
    const doc = { id: 42, _status: 'published', slug: 'about-nb1' }

    await expect(revalidatePage({ doc, previousDoc: null, req } as never)).resolves.toBe(doc)
    expect(logger.warn).toHaveBeenCalled()
  })

  it('purges the sitemap edge tag after a published page is deleted', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: { logger },
    }
    const doc = { id: 42, _status: 'published', slug: 'retired-page' }

    await expect(revalidateDeletedPage({ doc, req } as never)).resolves.toBe(doc)

    expect(revalidatePath).toHaveBeenCalledWith('/en/retired-page')
    expect(purgeCloudflareCacheTags).toHaveBeenCalledWith(['nb1-sitemaps'])
  })
})
