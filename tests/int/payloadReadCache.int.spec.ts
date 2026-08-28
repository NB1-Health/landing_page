import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const cache = new Map<string, unknown>()
  const findGlobal = vi.fn()
  const getPayload = vi.fn()
  const revalidatePath = vi.fn()
  const revalidateTag = vi.fn()
  const unstableCache = vi.fn(
    (callback: (...args: unknown[]) => Promise<unknown>, keyParts: string[]) =>
      async (...args: unknown[]) => {
        const key = JSON.stringify([keyParts, args])
        if (cache.has(key)) return cache.get(key)
        const value = await callback(...args)
        cache.set(key, value)
        return value
      },
  )

  return { cache, findGlobal, getPayload, revalidatePath, revalidateTag, unstableCache }
})

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
  unstable_cache: mocks.unstableCache,
}))

import { SiteSettings } from '@/globals/SiteSettings'
import { getSiteSettings } from '@/utilities/getSiteSettings'

beforeEach(() => {
  mocks.cache.clear()
  vi.clearAllMocks()
  mocks.getPayload.mockResolvedValue({ findGlobal: mocks.findGlobal })
})

describe('site settings Payload cache', () => {
  it('caches published reads by locale and bypasses the cache for preview', async () => {
    mocks.findGlobal.mockResolvedValue({ organizationJsonLd: { '@type': 'Organization' } })

    await getSiteSettings('en', false)
    await getSiteSettings('en', false)
    await getSiteSettings('en', true)
    await getSiteSettings('en', true)

    expect(mocks.findGlobal).toHaveBeenCalledTimes(3)
    expect(mocks.findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', overrideAccess: false }),
    )
  })

  it('invalidates the cache and every locale layout after an edit', async () => {
    const hook = SiteSettings.hooks?.afterChange?.[0]
    expect(typeof hook).toBe('function')

    if (typeof hook === 'function') {
      await hook({ doc: {}, req: { context: {}, payload: { logger: { warn: vi.fn() } } } } as never)
    }

    expect(mocks.revalidateTag).toHaveBeenCalledWith('global_site-settings')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/en', 'layout')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/uae', 'layout')
  })

  it('does not fail a CMS save when Next cache invalidation is unavailable', async () => {
    const hook = SiteSettings.hooks?.afterChange?.[0]
    const warn = vi.fn()
    mocks.revalidateTag.mockImplementationOnce(() => {
      throw new Error('missing incremental cache')
    })

    const result =
      typeof hook === 'function'
        ? await hook({ doc: {}, req: { context: {}, payload: { logger: { warn } } } } as never)
        : undefined

    expect(result).toEqual({})
    expect(warn).toHaveBeenCalledOnce()
  })
})
