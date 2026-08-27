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
    const token = signPreviewTarget({ secret, target })
    return new NextRequest(
      `http://localhost:3000/de/next/preview?collection=pages&slug=ueber-nb1&token=${token}`,
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
  })

  it('enables the exact draft target for an authenticated admin', async () => {
    auth.mockResolvedValue({
      permissions: {},
      user: { collection: 'users', id: 1, role: 'admin' },
    })

    await expect(GET(request(), { params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    )
    expect(enable).toHaveBeenCalledOnce()
    expect(redirect).toHaveBeenCalledWith('/de/ueber-nb1')
  })

  it('rejects an agent-editor even with a valid signed preview link', async () => {
    auth.mockResolvedValue({
      permissions: {},
      user: { collection: 'users', id: 2, role: 'agent-editor' },
    })

    const response = await GET(request(), { params: Promise.resolve({ locale: 'de' }) })

    expect(response.status).toBe(403)
    expect(disable).toHaveBeenCalledOnce()
    expect(enable).not.toHaveBeenCalled()
  })

  it('normalizes a translated home slug to the locale root', async () => {
    auth.mockResolvedValue({
      permissions: {},
      user: { collection: 'users', id: 1, role: 'admin' },
    })
    find.mockResolvedValue({ docs: [{ id: 42, slug: 'startseite' }] })
    findByID.mockResolvedValue({ id: 42, slug: 'home' })
    const homeTarget = getPreviewTarget({ collection: 'pages', locale: 'de', slug: 'startseite' })!
    const token = signPreviewTarget({ secret, target: homeTarget })
    const req = new NextRequest(
      `http://localhost:3000/de/next/preview?collection=pages&slug=startseite&token=${token}`,
    )

    await expect(GET(req, { params: Promise.resolve({ locale: 'de' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    )
    expect(redirect).toHaveBeenCalledWith('/de')
  })

  it('rejects arbitrary targets before enabling draft mode', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost:3000/de/next/preview?collection=pages&slug=../cms/admin&token=bad',
      ),
      { params: Promise.resolve({ locale: 'de' }) },
    )

    expect(response.status).toBe(403)
    expect(auth).not.toHaveBeenCalled()
    expect(enable).not.toHaveBeenCalled()
  })

  it('disables an existing draft cookie when session authentication fails', async () => {
    auth.mockRejectedValue(new Error('Expired session'))

    const response = await GET(request(), { params: Promise.resolve({ locale: 'de' }) })

    expect(response.status).toBe(403)
    expect(disable).toHaveBeenCalledOnce()
    expect(enable).not.toHaveBeenCalled()
  })
})
