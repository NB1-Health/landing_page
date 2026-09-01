import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'
import { appLocales, isAppLocale } from '../../../i18n/config'
import {
  isPublishedForActiveLocale,
  resolvePublishedLocaleSlugs,
  type PublishedLocaleSlugs,
} from '../../../utilities/publishedLocaleAvailability'

const CONTEXT_KEY = 'postPublication'

type PublicationContext = {
  isDraftSave: boolean
  previousSlugs?: PublishedLocaleSlugs
}

function readPublicationContext(req: PayloadRequest): PublicationContext | undefined {
  return req.context[CONTEXT_KEY] as PublicationContext | undefined
}

function publishedSlugFallback(
  status: unknown,
  slug: unknown,
  locale: unknown,
): PublishedLocaleSlugs {
  if (
    !isPublishedForActiveLocale(status, locale) ||
    typeof locale !== 'string' ||
    !isAppLocale(locale) ||
    typeof slug !== 'string' ||
    slug.length === 0
  ) {
    return {}
  }

  return { [locale]: slug }
}

async function preserveRequestLocale<T>(req: PayloadRequest, operation: () => Promise<T>) {
  const locale = req.locale
  try {
    return await operation()
  } finally {
    req.locale = locale
  }
}

/** Remember the live locale/slug pairs before an update or deletion. */
export const capturePostPublication: CollectionBeforeOperationHook<'posts'> = async ({
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
  const isDraftSave =
    operationArgs.id != null &&
    operationArgs.draft === true &&
    !isPublishedForActiveLocale(operationArgs.data?._status, req.locale)
  const state: PublicationContext = { isDraftSave }

  req.context[CONTEXT_KEY] = state
  if (state.isDraftSave || !operationArgs.id) return

  try {
    let postID = operationArgs.id
    if (operation === 'restoreVersion') {
      const version = await preserveRequestLocale(req, () =>
        req.payload.findVersionByID({
          collection: 'posts',
          id: String(operationArgs.id),
          depth: 0,
          fallbackLocale: false,
          locale: 'all',
          overrideAccess: true,
          req,
        }),
      )
      const parent = version.parent as unknown
      postID =
        typeof parent === 'object' && parent !== null
          ? (parent as { id: number | string }).id
          : (parent as number | string)
    }

    state.previousSlugs = await resolvePublishedLocaleSlugs({
      collection: 'posts',
      id: postID,
      req,
    })
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not read previous post slugs for revalidation')
  }
}

/**
 * A path to invalidate. `type` is passed straight to `revalidatePath`; it is
 * required for dynamic route patterns (e.g. `/en/journal/page/[pageNumber]`),
 * where Next.js needs to know it is looking at a page file rather than a
 * literal URL.
 */
type RevalidationPath = { path: string; type?: 'page' | 'layout' }

function getPostRevalidationTargets(
  currentSlugs: PublishedLocaleSlugs,
  previousSlugs: PublishedLocaleSlugs,
) {
  const paths = new Map<string, RevalidationPath>()
  const tags = new Set<string>()

  const addPath = (path: string, type?: 'page' | 'layout') => {
    paths.set(`${path}::${type ?? ''}`, { path, type })
  }

  for (const locale of appLocales) {
    const slugs = [previousSlugs[locale], currentSlugs[locale]]
    for (const slug of slugs) {
      if (slug) addPath(`/${locale}/journal/${slug}`)
    }

    if (slugs.some(Boolean)) {
      tags.add(`posts-sitemap-${locale}`)

      // The Journal index and its paginated pages are statically rendered
      // (`force-static` + `revalidate 600` on the index, `revalidate 600` on
      // the paginated route). Without invalidating them here, a freshly
      // published article's card does not appear on the index for up to ten
      // minutes — the single-source-of-truth drift this content system exists
      // to prevent. The article page itself was already handled above.
      addPath(`/${locale}/journal`)
      addPath(`/${locale}/journal/page/[pageNumber]`, 'page')

      // No category-archive targets: those routes were removed per
      // TICKET-SEO-007 §10, which requires the topic chips to carry no URL so
      // they cannot compete with the Microbiome pillars for the same terms.
      // Filtering is client-side, so a category change needs no invalidation
      // beyond the index above.
    }
  }

  return { paths: [...paths.values()], tags: [...tags] }
}

function invalidateTargets(
  req: PayloadRequest,
  targets: ReturnType<typeof getPostRevalidationTargets>,
) {
  for (const { path, type } of targets.paths) {
    try {
      if (type) revalidatePath(path, type)
      else revalidatePath(path)
      req.payload.logger.info(`Revalidated published post: ${path}`)
    } catch (error) {
      req.payload.logger.warn({ err: error, path }, 'Could not revalidate published post')
    }
  }

  for (const tag of targets.tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      req.payload.logger.warn({ err: error, tag }, 'Could not revalidate post sitemap')
    }
  }
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
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
    currentSlugs = await resolvePublishedLocaleSlugs({ collection: 'posts', id: doc.id, req })
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not read current post slugs for revalidation')
  }

  const previousSlugs =
    state?.previousSlugs ??
    publishedSlugFallback(previousDoc?._status, previousDoc?.slug, req.locale)
  const targets = getPostRevalidationTargets(currentSlugs, previousSlugs)
  if (targets.paths.length === 0) return doc

  invalidateTargets(req, targets)
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  const state = readPublicationContext(req)
  const previousSlugs =
    state?.previousSlugs ?? publishedSlugFallback(doc?._status, doc?.slug, req.locale)
  const targets = getPostRevalidationTargets({}, previousSlugs)
  if (targets.paths.length === 0) return doc

  invalidateTargets(req, targets)
  return doc
}
