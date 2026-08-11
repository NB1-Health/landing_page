import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { getPreviewTarget, verifyPreviewToken } from '@/utilities/preview'

describe('generated preview URL', () => {
  const secret = '0123456789abcdef0123456789abcdef'

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'http://localhost:3100')
    vi.stubEnv('NEXT_PUBLIC_PREVIEW_SECRET', secret)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('uses the localized route and never exposes the shared secret', () => {
    const generated = generatePreviewPath({
      collection: 'pages',
      req: { locale: 'de' } as never,
      slug: 'ueber-nb1',
    })!
    const url = new URL(generated)
    const target = getPreviewTarget({ collection: 'pages', locale: 'de', slug: 'ueber-nb1' })!

    expect(url.pathname).toBe('/de/next/preview')
    expect(url.searchParams.has('previewSecret')).toBe(false)
    expect(url.searchParams.has('timestamp')).toBe(false)
    expect(generated).not.toContain(secret)
    expect(
      verifyPreviewToken({
        secret,
        target,
        token: url.searchParams.get('token'),
      }),
    ).toBe(true)
  })

  it('keeps the iframe URL stable across autosaves', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 7, 10, 12, 0, 0))
    const args = {
      collection: 'pages' as const,
      req: { locale: 'de' } as never,
      slug: 'ueber-nb1',
    }

    const first = generatePreviewPath(args)
    vi.setSystemTime(Date.UTC(2027, 0, 1))
    const later = generatePreviewPath(args)

    expect(later).toBe(first)
  })

  it('fails closed with a weak secret or unsafe slug', () => {
    vi.stubEnv('NEXT_PUBLIC_PREVIEW_SECRET', 'too-short')
    expect(
      generatePreviewPath({ collection: 'pages', req: { locale: 'de' } as never, slug: 'page' }),
    ).toBeNull()
    vi.stubEnv('NEXT_PUBLIC_PREVIEW_SECRET', secret)
    expect(
      generatePreviewPath({
        collection: 'pages',
        req: { locale: 'de' } as never,
        slug: '../cms/admin',
      }),
    ).toBeNull()
  })
})
