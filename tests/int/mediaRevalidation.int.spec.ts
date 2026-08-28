import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }))

vi.mock('next/cache', () => ({ revalidateTag }))

import { revalidateDeletedMedia, revalidateMedia } from '@/collections/Media/hooks/revalidateMedia'

const logger = { warn: vi.fn() }

describe('media page-cache revalidation', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['change', revalidateMedia],
    ['delete', revalidateDeletedMedia],
  ])('invalidates populated page data after a media %s', async (_operation, hook) => {
    const doc = { id: 9, filename: 'updated-image.webp' }
    const req = { context: {}, payload: { logger } }

    expect(hook({ doc, req } as never)).toBe(doc)

    expect(revalidateTag).toHaveBeenCalledWith('pages')
  })

  it('does not invalidate during operations that explicitly disable revalidation', async () => {
    const doc = { id: 9, filename: 'seed-image.webp' }
    const req = { context: { disableRevalidate: true }, payload: { logger } }

    expect(revalidateMedia({ doc, req } as never)).toBe(doc)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
