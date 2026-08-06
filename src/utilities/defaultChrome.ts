import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
} from 'payload'

import { isChromeDraftSave } from '@/utilities/chromeDrafts'

type ChromeCollection = 'footers' | 'headers'

export function createDefaultChromeHooks(collection: ChromeCollection, label: 'Footer' | 'Header') {
  const findOtherPublishedDefaults = (
    req: Parameters<CollectionAfterChangeHook>[0]['req'],
    id?: number,
  ) =>
    req.payload.find({
      collection,
      draft: false,
      where: {
        and: [
          { _status: { equals: 'published' } },
          { isDefault: { equals: true } },
          ...(id === undefined ? [] : [{ id: { not_equals: id } }]),
        ],
      },
      limit: 100,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      req,
    })

  const requirePublishedReplacement = async (
    req: Parameters<CollectionAfterChangeHook>[0]['req'],
    id: number,
  ) => {
    const others = await findOtherPublishedDefaults(req, id)
    if (others.docs.length === 0) {
      throw new APIError(
        `Publish another ${label} as the site default before removing this default.`,
        409,
        null,
        true,
      )
    }
  }

  /** Prevent a default switch from superseding another document's pending draft. */
  const protectExistingDefaultDraft: CollectionBeforeChangeHook = async ({
    data,
    originalDoc,
    req,
  }) => {
    if (isChromeDraftSave(req)) return data

    const status = data._status ?? originalDoc?._status
    const isDefault = data.isDefault ?? originalDoc?.isDefault

    if (status !== 'published' || !isDefault) {
      const current = originalDoc?.id
        ? await req.payload.findByID({
            collection,
            id: originalDoc.id,
            draft: false,
            depth: 0,
            disableErrors: true,
            overrideAccess: true,
            req,
          })
        : null

      if (current?._status === 'published' && current.isDefault) {
        await requirePublishedReplacement(req, current.id)
      }
    }

    if (status !== 'published' || !isDefault) {
      return data
    }

    const others = await findOtherPublishedDefaults(req, originalDoc?.id)

    for (const other of others.docs) {
      const latest = await req.payload.findByID({
        collection,
        id: other.id,
        draft: true,
        depth: 0,
        overrideAccess: true,
        req,
      })

      if (latest._status === 'draft') {
        throw new APIError(
          `The current default ${label}, "${other.name}", has unpublished changes. Publish or discard those changes before switching the default.`,
          409,
          null,
          true,
        )
      }
    }

    return data
  }

  const protectDefaultDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
    const current = await req.payload.findByID({
      collection,
      id,
      draft: false,
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
      req,
    })

    if (current?._status === 'published' && current.isDefault) {
      await requirePublishedReplacement(req, current.id)
    }
  }

  /** Keep the published default unique without changing it during draft saves. */
  const enforceSingleDefault: CollectionAfterChangeHook = async ({ doc, req }) => {
    if (isChromeDraftSave(req) || doc._status !== 'published') return doc
    if (!doc.isDefault) return doc

    const others = await findOtherPublishedDefaults(req, doc.id)

    for (const other of others.docs) {
      await req.payload.update({
        collection,
        id: other.id,
        data: { _status: 'published', isDefault: false },
        draft: false,
        overrideAccess: true,
        req,
      })
    }

    return doc
  }

  return { enforceSingleDefault, protectDefaultDelete, protectExistingDefaultDraft }
}
