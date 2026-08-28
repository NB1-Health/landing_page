import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn() }))

vi.mock('next/cache', () => ({ revalidateTag: mocks.revalidateTag }))

import { revalidatePages } from '@/hooks/revalidatePages'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('populated page cache revalidation', () => {
  it('invalidates cached page graphs after a related document changes', () => {
    const doc = { id: 1 }

    expect(
      revalidatePages({
        doc,
        req: { context: {}, payload: { logger: { warn: vi.fn() } } } as never,
      }),
    ).toBe(doc)
    expect(mocks.revalidateTag).toHaveBeenCalledWith('pages')
  })

  it('respects disabled revalidation', () => {
    revalidatePages({
      doc: {},
      req: { context: { disableRevalidate: true } } as never,
    })

    expect(mocks.revalidateTag).not.toHaveBeenCalled()
  })

  it('does not fail a CMS write when Next cache invalidation is unavailable', () => {
    const warn = vi.fn()
    const doc = { id: 1 }
    mocks.revalidateTag.mockImplementationOnce(() => {
      throw new Error('missing incremental cache')
    })

    expect(
      revalidatePages({
        doc,
        req: { context: {}, payload: { logger: { warn } } } as never,
      }),
    ).toBe(doc)
    expect(warn).toHaveBeenCalledOnce()
  })
})
