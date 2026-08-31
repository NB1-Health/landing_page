import type { Payload, PayloadRequest } from 'payload'

import { draftMode, headers } from 'next/headers'

import { isAdminOrEditor } from '@/access/roles'

export type AuthenticatedDraft = {
  draft: boolean
  user: PayloadRequest['user']
}

/** A draft cookie requests preview mode; the current Payload session authorizes it. */
export async function getAuthenticatedDraft(payload: Payload): Promise<AuthenticatedDraft> {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return { draft: false, user: null }

  try {
    const { user } = await payload.auth({ headers: await headers() })
    return isAdminOrEditor(user) ? { draft: true, user } : { draft: false, user: null }
  } catch {
    return { draft: false, user: null }
  }
}
