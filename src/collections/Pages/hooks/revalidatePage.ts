import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'
import { isAppLocale, type AppLocale } from '../../../i18n/config'
import {
  getPageRevalidationTargets,
  readLocalizedPageSlugs,
  type LocalizedPageSlugs,
} from '../../../utilities/pagePublication'
import {
  isPublishedForActiveLocale,
  resolvePublishedLocaleSlugs,
} from '../../../utilities/publishedLocaleAvailability'

const CONTEXT_KEY = 'pagePublication'

type PublicationContext = {
  isDraftSave: boolean
  previousSlugs?: LocalizedPageSlugs
}

function readPublicationContext(req: PayloadRequest): PublicationContext | undefined {
  return req.context[CONTEXT_KEY] as PublicationContext | undefined
}

function slugFallback(slug: unknown, locale: unknown): LocalizedPageSlugs {
  if (typeof locale === 'string' && isAppLocale(locale) && typeof slug === 'string') {
    return { [locale]: slug }
  }
  return readLocalizedPageSlugs(slug)
}

async function preserveRequestLocale<T>(req: PayloadRequest, operation: () => Promise<T>) {
  const locale = req.locale
  try {
    return await operation()
  } finally {
    req.locale = locale
  }
}

function publishedSlugFallback(status: unknown, slug: unknown, locale: unknown) {
  return isPublishedForActiveLocale(status, locale) ? slugFallback(slug, locale) : {}
}

function publicationLocales(...slugSets: LocalizedPageSlugs[]) {
  const locales = new Set<AppLocale>()
  for (const slugs of slugSets) {
    for (const locale of Object.keys(slugs)) {
      if (isAppLocale(locale)) locales.add(locale)
    }
  }
  return [...locales]
}

/** Remember the live slugs so both old and new paths can be invalidated. */
export const capturePagePublication: CollectionBeforeOperationHook<'pages'> = async ({
  args,
  operation,
  req,
}) => {
  if (req.context.disableRevalidate) return
  if (!['create', 'update', 'restoreVersion', 'delete'].includes(operation)) return

  const operationArgs = args as {
    data?: { _status?: unknown }
    draft?: boolean
    id?: number | string
  }
  // Payload bulk Publish also sends draft=true. Published status is what
  // distinguishes it from autosave and Save Draft.
  const isDraftSave =
    operationArgs.id != null &&
    operationArgs.draft === true &&
    !isPublishedForActiveLocale(operationArgs.data?._status, req.locale)
  const state: PublicationContext = {
    isDraftSave,
  }

  req.context[CONTEXT_KEY] = state
  if (state.isDraftSave || !operationArgs.id) return

  try {
    let pageID = operationArgs.id
    if (operation === 'restoreVersion') {
      const version = await preserveRequestLocale(req, () =>
        req.payload.findVersionByID({
          collection: 'pages',
          id: String(operationArgs.id),
          depth: 0,
          fallbackLocale: false,
          locale: 'all',
          overrideAccess: true,
          req,
        }),
      )
      const parent = version.parent as unknown
      pageID =
        typeof parent === 'object' && parent !== null
          ? (parent as { id: number | string }).id
          : (parent as number | string)
    }

    state.previousSlugs = await resolvePublishedLocaleSlugs({
      collection: 'pages',
      id: pageID,
      req,
    })
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not read previous page slugs for revalidation')
  }
}

async function invalidateTargets(
  req: PayloadRequest,
  targets: ReturnType<typeof getPageRevalidationTargets>,
) {
  for (const path of targets.paths) {
    try {
      revalidatePath(path)
      req.payload.logger.info(`Revalidated published page: ${path}`)
    } catch (error) {
      req.payload.logger.warn({ err: error, path }, 'Could not revalidate published page')
    }
  }

  for (const tag of targets.tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      req.payload.logger.warn({ err: error, tag }, 'Could not revalidate page sitemap')
    }
  }
}

export const revalidatePage: CollectionAfterChangeHook<Page> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context.disableRevalidate) return doc

  const state = readPublicationContext(req)
  const queryDraft = req.query?.draft === true || req.query?.draft === 'true'
  const isDraftSave =
    state?.isDraftSave ?? (queryDraft && !isPublishedForActiveLocale(doc._status, req.locale))
  if (isDraftSave) return doc

  let currentSlugs = publishedSlugFallback(doc._status, doc.slug, req.locale)
  try {
    currentSlugs = await resolvePublishedLocaleSlugs({ collection: 'pages', id: doc.id, req })
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not read current page slugs for revalidation')
  }

  const previousSlugs =
    state?.previousSlugs ??
    publishedSlugFallback(previousDoc?._status, previousDoc?.slug, req.locale)
  const locales = publicationLocales(previousSlugs, currentSlugs)
  if (locales.length === 0) return doc

  await invalidateTargets(
    req,
    getPageRevalidationTargets({
      currentSlugs,
      locales,
      previousSlugs,
    }),
  )

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  const state = readPublicationContext(req)
  const previousSlugs =
    state?.previousSlugs ?? publishedSlugFallback(doc?._status, doc?.slug, req.locale)
  const locales = publicationLocales(previousSlugs)
  if (locales.length === 0) return doc

  await invalidateTargets(
    req,
    getPageRevalidationTargets({
      locales,
      previousSlugs,
    }),
  )

  return doc
}
