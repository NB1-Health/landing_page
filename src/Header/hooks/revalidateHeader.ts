import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { appLocales } from '@/i18n/config'
import { isChromeDraftSave } from '@/utilities/chromeDrafts'

const invalidateHeader = (doc: { id: number | string }, req: PayloadRequest) => {
  const { payload, context } = req

  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header ${doc.id}`)

    revalidateTag(`header_${doc.id}`)
    // Always bust the "default header" cache too, not just when this doc is
    // the default: saving any header can change which one Payload resolves
    // as default (see enforceSingleDefault), and pages with no explicit
    // header relationship read from the header_default tag, not header_${id}.
    revalidateTag('header_default')
    // revalidateTag only busts the Data Cache entry — it doesn't reliably
    // force already-statically-generated (ISR) route HTML to regenerate when
    // the data came from unstable_cache rather than a plain fetch(). Uses the
    // same concrete-literal-path-per-locale pattern already proven to work
    // in revalidatePage.ts (a dynamic '/[locale]' pattern is not reliable
    // here), covering every locale.
    appLocales.forEach((locale) => {
      revalidatePath(`/${locale}`, 'layout')
    })
  }

  return doc
}

export const revalidateHeader: CollectionAfterChangeHook = ({ doc, req }) =>
  isChromeDraftSave(req) ? doc : invalidateHeader(doc, req)

export const revalidateDeletedHeader: CollectionAfterDeleteHook = ({ doc, req }) =>
  invalidateHeader(doc, req)
