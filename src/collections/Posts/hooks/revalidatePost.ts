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
import {
  CLOUDFLARE_SITEMAP_CACHE_TAG,
  purgeCloudflareCacheTags,
} from '../../../utilities/cloudflareCache'

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

function getPostRevalidationTargets(
  currentSlugs: PublishedLocaleSlugs,
  previousSlugs: PublishedLocaleSlugs,
) {
  const archivePaths = new Set<string>()
  const paths = new Set<string>()
  const tags = new Set<string>()

  for (const locale of appLocales) {
    const slugs = [previousSlugs[locale], currentSlugs[locale]]
    for (const slug of slugs) {
      if (slug) paths.add(`/${locale}/posts/${slug}`)
    }
    if (slugs.some(Boolean)) {
      archivePaths.add(`/${locale}/posts`)
      tags.add(`posts-sitemap-${locale}`)
    }
  }

  return { archivePaths: [...archivePaths], paths: [...paths], tags: [...tags] }
}

async function invalidateTargets(
  req: PayloadRequest,
  targets: ReturnType<typeof getPostRevalidationTargets>,
) {
  for (const path of targets.paths) {
    try {
      revalidatePath(path)
      req.payload.logger.info(`Revalidated published post: ${path}`)
    } catch (error) {
      req.payload.logger.warn({ err: error, path }, 'Could not revalidate published post')
    }
  }

  for (const path of targets.archivePaths) {
    try {
      revalidatePath(path, 'layout')
      req.payload.logger.info(`Revalidated published post archive: ${path}`)
    } catch (error) {
      req.payload.logger.warn({ err: error, path }, 'Could not revalidate published post archive')
    }
  }

  for (const tag of targets.tags) {
    try {
      revalidateTag(tag)
    } catch (error) {
      req.payload.logger.warn({ err: error, tag }, 'Could not revalidate post sitemap')
    }
  }

  try {
    await purgeCloudflareCacheTags([CLOUDFLARE_SITEMAP_CACHE_TAG])
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not purge Cloudflare sitemap cache')
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

  await invalidateTargets(req, targets)
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc

  const state = readPublicationContext(req)
  const previousSlugs =
    state?.previousSlugs ?? publishedSlugFallback(doc?._status, doc?.slug, req.locale)
  const targets = getPostRevalidationTargets({}, previousSlugs)
  if (targets.paths.length === 0) return doc

  await invalidateTargets(req, targets)
  return doc
}
