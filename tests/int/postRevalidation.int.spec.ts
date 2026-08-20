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

import {
  capturePostPublication,
  revalidateDelete as revalidateDeletedPost,
  revalidatePost,
} from '@/collections/Posts/hooks/revalidatePost'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('post publication revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    purgeCloudflareCacheTags.mockResolvedValue(false)
  })

  it('revalidates the exact locales published by Payload', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi
          .fn()
          .mockResolvedValueOnce({
            _status: { de: 'draft', en: 'published' },
            slug: 'gut-health-basics',
            title: { de: 'Darmgesundheit', en: 'Gut health basics' },
          })
          .mockResolvedValueOnce({
            _status: { de: 'published', en: 'published', fr: 'published' },
            slug: 'gut-health-basics',
            title: { de: 'Darmgesundheit', en: 'Gut health basics' },
          }),
        logger,
      },
      query: { draft: 'true' },
    }

    await capturePostPublication({
      args: { data: { _status: 'published' }, draft: true, id: 7 },
      operation: 'update',
      req,
    } as never)
    await revalidatePost({
      doc: { id: 7, _status: 'published', slug: 'gut-health-basics' },
      previousDoc: { id: 7, _status: 'draft', slug: 'gut-health-basics' },
      req,
    } as never)

    expect(revalidatePath).toHaveBeenCalledWith('/de/posts/gut-health-basics')
    expect(revalidatePath).toHaveBeenCalledWith('/en/posts/gut-health-basics')
    expect(revalidatePath).toHaveBeenCalledWith('/de/posts', 'layout')
    expect(revalidatePath).toHaveBeenCalledWith('/en/posts', 'layout')
    expect(revalidatePath).not.toHaveBeenCalledWith('/fr/posts/gut-health-basics')
    expect(revalidateTag).toHaveBeenCalledWith('posts-sitemap-de')
    expect(purgeCloudflareCacheTags).toHaveBeenCalledWith(['nb1-sitemaps'])
  })

  it('does not revalidate a draft autosave', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: { findByID: vi.fn(), logger },
      query: { draft: 'true' },
    }
    const doc = { id: 7, _status: 'draft', slug: 'gut-health-basics' }

    await capturePostPublication({
      args: { data: { _status: 'draft' }, draft: true, id: 7 },
      operation: 'update',
      req,
    } as never)
    await expect(revalidatePost({ doc, previousDoc: doc, req } as never)).resolves.toBe(doc)

    expect(req.payload.findByID).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(purgeCloudflareCacheTags).not.toHaveBeenCalled()
  })

  it('purges the sitemap edge tag after a published post is deleted', async () => {
    const req = {
      context: {},
      locale: 'en',
      payload: { logger },
    }
    const doc = { id: 7, _status: 'published', slug: 'retired-post' }

    await expect(revalidateDeletedPost({ doc, req } as never)).resolves.toBe(doc)

    expect(revalidatePath).toHaveBeenCalledWith('/en/posts/retired-post')
    expect(revalidatePath).toHaveBeenCalledWith('/en/posts', 'layout')
    expect(purgeCloudflareCacheTags).toHaveBeenCalledWith(['nb1-sitemaps'])
  })
})
