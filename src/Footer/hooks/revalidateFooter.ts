import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { appLocales } from '@/i18n/config'
import { isChromeDraftSave } from '@/utilities/chromeDrafts'

const invalidateFooter = (doc: { id: number | string }, req: PayloadRequest) => {
  const { payload, context } = req

  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    revalidateTag(`footer_${doc.id}`)
    revalidateTag('footer_default')
    // Was only revalidating '/' and '/de' — missed en/fr/nl/ch/be/uk/uae,
    // so footer edits appeared stale on every other locale.
    revalidatePath('/', 'layout')
    appLocales.forEach((locale) => {
      revalidatePath(`/${locale}`, 'layout')
    })
  }

  return doc
}

export const revalidateFooter: CollectionAfterChangeHook = ({ doc, req }) =>
  isChromeDraftSave(req) ? doc : invalidateFooter(doc, req)

export const revalidateDeletedFooter: CollectionAfterDeleteHook = ({ doc, req }) =>
  invalidateFooter(doc, req)
