import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Media } from '../../../payload-types'
import { revalidatePages } from '../../../hooks/revalidatePages'

export const revalidateMedia: CollectionAfterChangeHook<Media> = ({ doc, req }) =>
  revalidatePages({ doc, req })

export const revalidateDeletedMedia: CollectionAfterDeleteHook<Media> = ({ doc, req }) =>
  revalidatePages({ doc, req })
