import type { Payload, PayloadRequest } from 'payload'

import { draftMode, headers } from 'next/headers'

export type AuthenticatedDraft = {
  draft: boolean
  user: PayloadRequest['user']
}

/**
 * A Next draft cookie requests preview mode, but it is not authorization.
 * Recheck the current Payload session for every server render before drafts are
 * included in a Local API query.
 */
export async function getAuthenticatedDraft(payload: Payload): Promise<AuthenticatedDraft> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return { draft: false, user: null }

  try {
    const { user } = await payload.auth({ headers: await headers() })
    return user ? { draft: true, user } : { draft: false, user: null }
  } catch {
    return { draft: false, user: null }
  }
}
