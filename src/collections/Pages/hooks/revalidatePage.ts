import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'
import { isAppLocale } from '../../../i18n/config'
import {
  getPagePublicationLocales,
  getPageRevalidationTargets,
  readLocalizedPageSlugs,
  type LocalizedPageSlugs,
} from '../../../utilities/pagePublication'

const CONTEXT_KEY = 'pagePublication'

type PublicationContext = {
  isDraftSave: boolean
  previousSlugs?: LocalizedPageSlugs
  previouslyPublished?: boolean
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

async function findPublishedState(req: PayloadRequest, id: number | string) {
  const doc = await preserveRequestLocale(req, () =>
    req.payload.findByID({
      collection: 'pages',
      id,
      depth: 0,
      disableErrors: true,
      draft: false,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: true,
      req,
      select: { _status: true, slug: true },
    }),
  )

  return {
    published: doc?._status === 'published',
    slugs: readLocalizedPageSlugs(doc?.slug),
  }
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
    operationArgs.data?._status !== 'published'
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

    const previous = await findPublishedState(req, pageID)
    state.previouslyPublished = previous.published
    state.previousSlugs = previous.slugs
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
  const isDraftSave = state?.isDraftSave ?? (queryDraft && doc._status !== 'published')
  if (isDraftSave) return doc

  const currentlyPublished = doc._status === 'published'
  const previouslyPublished = state?.previouslyPublished ?? previousDoc?._status === 'published'
  if (!currentlyPublished && !previouslyPublished) return doc

  let currentSlugs = slugFallback(doc.slug, req.locale)
  if (currentlyPublished) {
    try {
      currentSlugs = (await findPublishedState(req, doc.id)).slugs
    } catch (error) {
      req.payload.logger.warn({ err: error }, 'Could not read current page slugs for revalidation')
    }
  }

  await invalidateTargets(
    req,
    getPageRevalidationTargets({
      currentSlugs: currentlyPublished ? currentSlugs : {},
      locales: getPagePublicationLocales(),
      previousSlugs: state?.previousSlugs ?? slugFallback(previousDoc?.slug, req.locale),
    }),
  )

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  const state = readPublicationContext(req)
  const previouslyPublished = state?.previouslyPublished ?? doc?._status === 'published'
  if (!previouslyPublished) return doc

  await invalidateTargets(
    req,
    getPageRevalidationTargets({
      locales: getPagePublicationLocales(),
      previousSlugs: state?.previousSlugs ?? slugFallback(doc?.slug, req.locale),
    }),
  )

  return doc
}
