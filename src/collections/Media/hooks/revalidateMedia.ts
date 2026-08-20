import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Media } from '../../../payload-types'
import { revalidatePages } from '../../../hooks/revalidatePages'
import {
  CLOUDFLARE_MEDIA_CACHE_TAG,
  purgeCloudflareCacheTags,
} from '../../../utilities/cloudflareCache'

async function invalidateMediaCache(req: PayloadRequest) {
  try {
    await purgeCloudflareCacheTags([CLOUDFLARE_MEDIA_CACHE_TAG])
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not purge Cloudflare media cache')
  }
}

export const revalidateMedia: CollectionAfterChangeHook<Media> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  revalidatePages({ doc, req })
  await invalidateMediaCache(req)
  return doc
}

export const revalidateDeletedMedia: CollectionAfterDeleteHook<Media> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  revalidatePages({ doc, req })
  await invalidateMediaCache(req)
  return doc
}
