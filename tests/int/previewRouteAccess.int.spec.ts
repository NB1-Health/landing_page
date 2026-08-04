import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPreviewTarget, signPreviewTarget } from '@/utilities/preview'

const { auth, disable, enable, find, findByID, redirect } = vi.hoisted(() => ({
  auth: vi.fn(),
  disable: vi.fn(),
  enable: vi.fn(),
  find: vi.fn(),
  findByID: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    auth,
    find,
    findByID,
    logger: { error: vi.fn() },
  })),
}))
vi.mock('next/headers', () => ({
  draftMode: vi.fn(async () => ({ disable, enable })),
}))
vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@payload-config', () => ({ default: Promise.resolve({}) }))

import { GET } from '@/app/(frontend)/[locale]/next/preview/route'

describe('preview route access', () => {
  const secret = '0123456789abcdef0123456789abcdef'
  const target = getPreviewTarget({ collection: 'pages', locale: 'de', slug: 'ueber-nb1' })!

  function request() {
    const timestamp = Math.floor(Date.now() / 1000)
    const token = signPreviewTarget({ secret, target, timestamp })
    return new NextRequest(
      `http://localhost:3000/de/next/preview?collection=pages&slug=ueber-nb1&timestamp=${timestamp}&token=${token}`,
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('PREVIEW_SECRET', secret)
    find.mockResolvedValue({ docs: [] })
    findByID.mockResolvedValue(null)
  })

  it('rejects a signed link when no Payload user is authenticated', async () => {
    auth.mockResolvedValue({ permissions: {}, user: null })

    const response = await GET(request(), { params: Promise.resolve({ locale: 'de' }) })

    expect(response.status).toBe(403)
    expect(disable).toHaveBeenCalledOnce()
    expect(enable).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('enables the exact draft target for an authenticated Payload user', async () => {
    auth.mockResolvedValue({ permissions: {}, user: { collection: 'users', id: 1 } })

    await expect(GET(request(), { params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    )
    expect(enable).toHaveBeenCalledOnce()
    expect(redirect).toHaveBeenCalledWith('/de/ueber-nb1')
  })

  it('normalizes a translated home slug to the locale root', async () => {
    auth.mockResolvedValue({ permissions: {}, user: { collection: 'users', id: 1 } })
    find.mockResolvedValue({ docs: [{ id: 42, slug: 'startseite' }] })
    findByID.mockResolvedValue({ id: 42, slug: 'home' })
    const homeTarget = getPreviewTarget({ collection: 'pages', locale: 'de', slug: 'startseite' })!
    const timestamp = Math.floor(Date.now() / 1000)
    const token = signPreviewTarget({ secret, target: homeTarget, timestamp })
    const req = new NextRequest(
      `http://localhost:3000/de/next/preview?collection=pages&slug=startseite&timestamp=${timestamp}&token=${token}`,
    )

    await expect(GET(req, { params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    )
    expect(redirect).toHaveBeenCalledWith('/de')
  })

  it('rejects an arbitrary path before attempting authentication', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/de/next/preview?collection=pages&slug=../cms/admin&timestamp=1&token=bad',
      ),
      { params: Promise.resolve({ locale: 'de' }) },
    )

    expect(response.status).toBe(403)
    expect(auth).not.toHaveBeenCalled()
  })

  it('disables an existing draft cookie when session authentication fails', async () => {
    auth.mockRejectedValue(new Error('Expired session'))

    const response = await GET(request(), { params: Promise.resolve({ locale: 'de' }) })

    expect(response.status).toBe(403)
    expect(disable).toHaveBeenCalledOnce()
    expect(enable).not.toHaveBeenCalled()
  })
})
