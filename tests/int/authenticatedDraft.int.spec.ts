import { beforeEach, describe, expect, it, vi } from 'vitest'

const { auth, draftMode, headers } = vi.hoisted(() => ({
  auth: vi.fn(),
  draftMode: vi.fn(),
  headers: vi.fn(async () => new Headers({ cookie: 'payload-token=session' })),
}))

vi.mock('next/headers', () => ({ draftMode, headers }))

import { getAuthenticatedDraft } from '@/utilities/authenticatedDraft'

describe('authenticated draft reads', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not authenticate or include drafts on a public request', async () => {
    draftMode.mockResolvedValue({ isEnabled: false })

    await expect(getAuthenticatedDraft({ auth } as never)).resolves.toEqual({
      draft: false,
      user: null,
    })
    expect(auth).not.toHaveBeenCalled()
  })

  it('includes drafts only while an admin Payload session is authenticated', async () => {
    const user = { collection: 'users', id: 7, role: 'admin' }
    draftMode.mockResolvedValue({ isEnabled: true })
    auth.mockResolvedValue({ user })

    await expect(getAuthenticatedDraft({ auth } as never)).resolves.toEqual({
      draft: true,
      user,
    })
    expect(auth).toHaveBeenCalledOnce()
  })

  it('does not expose draft mode to an authenticated agent-editor', async () => {
    draftMode.mockResolvedValue({ isEnabled: true })
    auth.mockResolvedValue({
      user: { collection: 'users', id: 8, role: 'agent-editor' },
    })

    await expect(getAuthenticatedDraft({ auth } as never)).resolves.toEqual({
      draft: false,
      user: null,
    })
  })

  it.each([
    ['logged-out session', () => auth.mockResolvedValue({ user: null })],
    ['expired session', () => auth.mockRejectedValue(new Error('Expired session'))],
  ])('treats a retained draft cookie as public for a %s', async (_label, arrange) => {
    draftMode.mockResolvedValue({ isEnabled: true })
    arrange()

    await expect(getAuthenticatedDraft({ auth } as never)).resolves.toEqual({
      draft: false,
      user: null,
    })
  })
})
