import { beforeEach, describe, expect, it, vi } from 'vitest'

const { purgeCloudflareCacheTags, revalidateTag } = vi.hoisted(() => ({
  purgeCloudflareCacheTags: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidateTag }))
vi.mock('@/utilities/cloudflareCache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/cloudflareCache')>()),
  purgeCloudflareCacheTags,
}))

import { revalidateDeletedMedia, revalidateMedia } from '@/collections/Media/hooks/revalidateMedia'

const logger = { warn: vi.fn() }

describe('media edge revalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    purgeCloudflareCacheTags.mockResolvedValue(false)
  })

  it.each([
    ['change', revalidateMedia],
    ['delete', revalidateDeletedMedia],
  ])('purges direct and optimized image variants after a media %s', async (_operation, hook) => {
    const doc = { id: 9, filename: 'updated-image.webp' }
    const req = { context: {}, payload: { logger } }

    await expect(hook({ doc, req } as never)).resolves.toBe(doc)

    expect(revalidateTag).toHaveBeenCalledWith('pages')
    expect(purgeCloudflareCacheTags).toHaveBeenCalledWith(['nb1-media'])
  })

  it('keeps a completed media update successful when Cloudflare is unavailable', async () => {
    purgeCloudflareCacheTags.mockRejectedValue(new Error('Cloudflare unavailable'))
    const doc = { id: 9, filename: 'updated-image.webp' }
    const req = { context: {}, payload: { logger } }

    await expect(revalidateMedia({ doc, req } as never)).resolves.toBe(doc)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Could not purge Cloudflare media cache',
    )
  })

  it('does not purge during operations that explicitly disable revalidation', async () => {
    const doc = { id: 9, filename: 'seed-image.webp' }
    const req = { context: { disableRevalidate: true }, payload: { logger } }

    await expect(revalidateMedia({ doc, req } as never)).resolves.toBe(doc)
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(purgeCloudflareCacheTags).not.toHaveBeenCalled()
  })
})
