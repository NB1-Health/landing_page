import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('shared browser plan requests', () => {
  it('shares in-flight requests and refreshes after the short cache expires', async () => {
    vi.resetModules()
    const { fetchPlansClient } = await import('@/lib/plans/clientUtils')
    let now = 1000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    let finish!: (value: unknown) => void
    const fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      }),
    )
    vi.stubGlobal('fetch', fetch)
    const first = fetchPlansClient()
    const second = fetchPlansClient()
    expect(first).toBe(second)
    expect(fetch).toHaveBeenCalledTimes(1)
    const plans = [{ title: 'Core', month: 1, prices: { EUR: 99 } }]
    finish({ ok: true, json: async () => plans })
    expect(await first).toEqual(plans)
    await fetchPlansClient()
    expect(fetch).toHaveBeenCalledTimes(1)
    now += 60_001
    fetch.mockResolvedValue({ ok: true, json: async () => plans })
    await fetchPlansClient()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('allows retry after an API failure', async () => {
    vi.resetModules()
    const { fetchPlansClient } = await import('@/lib/plans/clientUtils')
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
    vi.stubGlobal('fetch', fetch)
    await expect(fetchPlansClient()).rejects.toThrow('503')
    await expect(fetchPlansClient()).resolves.toEqual([])
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
