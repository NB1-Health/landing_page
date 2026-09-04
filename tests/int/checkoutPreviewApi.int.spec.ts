import { CHECKOUT_PREVIEW_TIMEOUT_MS, checkoutPreview } from '@/lib/checkoutApi'
import { afterEach, describe, expect, it, vi } from 'vitest'

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

describe('checkout preview API client', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends the unlimited-use test offer and forwards cancellation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        discount_code: '20OFF',
        discount_code_valid: true,
        promo_discount: 19.8,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()

    await expect(
      checkoutPreview(
        {
          plan_slug: 'NB1-CORE-4',
          currency: 'EUR',
          shipping_option: 'standard',
          discount_code: '20OFF',
          lang: 'en',
        },
        controller.signal,
      ),
    ).resolves.toMatchObject({ discount_code: '20OFF', discount_code_valid: true })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/subscriptions\/public\/checkout\/preview$/),
      expect.objectContaining({
        method: 'POST',
        signal: expect.anything(),
        body: JSON.stringify({
          plan_slug: 'NB1-CORE-4',
          currency: 'EUR',
          shipping_option: 'standard',
          discount_code: '20OFF',
          lang: 'en',
        }),
      }),
    )
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal)
  })

  it('times out a preview that never returns', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal
            signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
          }),
      ),
    )

    const preview = checkoutPreview({ plan_slug: 'NB1-CORE-4', discount_code: '20OFF' })
    const rejected = expect(preview).rejects.toMatchObject({
      message: 'Discount validation timed out',
      name: 'TimeoutError',
    })
    await vi.advanceTimersByTimeAsync(CHECKOUT_PREVIEW_TIMEOUT_MS)
    await rejected
  })

  it('preserves a customer-safe backend error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ detail: 'Coupon expired' }, false)))

    await expect(checkoutPreview({ plan_slug: 'NB1-CORE-4' })).rejects.toMatchObject({
      code: 'preview_failed',
      message: 'Coupon expired',
      validation: false,
    })
  })

  it('hides raw request-validation details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(response({ detail: [{ msg: 'raw backend validation text' }] }, false)),
    )

    await expect(checkoutPreview({})).rejects.toMatchObject({
      code: 'preview_failed',
      message: 'Discount validation failed',
      validation: true,
    })
  })
})
