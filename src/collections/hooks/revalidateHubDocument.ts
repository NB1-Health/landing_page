import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeOperationHook,
  PayloadRequest,
} from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { appLocales, type AppLocale } from '@/i18n/config'
import {
  isPublishedForActiveLocale,
  resolvePublishedLocaleSlugs,
  type PublicationCollection,
  type PublishedLocaleSlugs,
} from '@/utilities/publishedLocaleAvailability'

/**
 * Cache invalidation for any collection whose URL is `locale + hub.slug + slug`.
 *
 * Extracted from `revalidatePillar`, which was the only one of these that existed
 * — so saving a lexicon term or a scientific article invalidated nothing at all:
 * not its own page, not the hub that lists it, not the sitemap it belongs in. The
 * pillar hook's own comment says the shape has to hold for 408 articles and
 * thousands of terms, which is the argument for extracting it rather than pasting
 * it twice more.
 *
 * `Pillars` still uses its own copy. This is a faithful extraction, but faithful
 * is a claim `tsc` cannot check, and swapping the one working hook in the same
 * change that adds two new ones would make a regression hard to attribute.
 * Migrating it is a separate step.
 */

/**
 * Narrowed from `PublicationCollection` rather than declared independently.
 *
 * The first version of this file declared its own union, and `tsc` rejected it:
 * `resolvePublishedLocaleSlugs` only accepted `pages | posts | pillars`. That was
 * the guardrail working — `publishedLocaleAvailability` keeps a
 * `HAS_LOCALIZED_SLUG` map that has to stay in step with each collection's field
 * config, and its comment says a new collection should have to declare itself
 * there rather than inherit an assumption. Widening that union and adding both
 * entries was the fix; casting here would have silenced the one check that
 * catches a slug whose localization was never declared, which fails silently by
 * reporting the document as published nowhere.
 */
export type HubDocumentCollection = Extract<
  PublicationCollection,
  'pillars' | 'scientific-articles' | 'lexicon-terms'
>

type Config = {
  collection: HubDocumentCollection
  /**
   * Where the before-hook parks its state on `req.context`. Distinct per
   * collection so a cascade — a save that triggers another save — cannot read the
   * wrong document's captured slugs.
   */
  contextKey: string
  /**
   * Cache tags to bust on any change.
   *
   * For lexicon terms, `lexicon-terms` alone reaches the category browse page,
   * the index counts, the example terms AND the search-index endpoint, because
   * every one of those `unstable_cache` entries carries it. That is deliberate:
   * one tag on the write side beats four, each with its own chance of being
   * forgotten when a fifth reader is added.
   */
  tags: string[]
}

type PublicationContext = {
  isDraftSave: boolean
  previousSlugs?: PublishedLocaleSlugs
}

/**
 * The hub's slug in every locale.
 *
 * The document's URL needs the hub slug for the locale being invalidated, and the
 * document itself does not carry it. Read directly rather than through
 * `getCachedHubBySlug`: that wraps `unstable_cache`, which is unavailable outside
 * a Next request, and these hooks also run from seed scripts.
 */
async function hubSlugsByLocale(
  req: PayloadRequest,
  hubId: number | string,
): Promise<Partial<Record<AppLocale, string>>> {
  const slugs: Partial<Record<AppLocale, string>> = {}

  try {
    const hub = await req.payload.findByID({
      collection: 'hubs',
      id: hubId,
      depth: 0,
      disableErrors: true,
      locale: 'all',
      overrideAccess: true,
      req,
    })

    const raw = (hub as unknown as { slug?: unknown } | null)?.slug
    if (raw && typeof raw === 'object') {
      for (const locale of appLocales) {
        const value = (raw as Record<string, unknown>)[locale]
        if (typeof value === 'string' && value.trim()) slugs[locale] = value.trim()
      }
    }
  } catch (error) {
    req.payload.logger.warn({ err: error }, 'Could not read hub slugs for revalidation')
  }

  return slugs
}

function readHubId(doc: unknown): number | string | null {
  const hub = (doc as { hub?: unknown } | null)?.hub
  if (typeof hub === 'number' || typeof hub === 'string') return hub
  if (hub && typeof hub === 'object' && 'id' in hub) {
    const id = (hub as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return null
}

export function createHubDocumentRevalidation(config: Config): {
  capture: CollectionBeforeOperationHook
  afterChange: CollectionAfterChangeHook
  afterDelete: CollectionAfterDeleteHook
} {
  const { collection, contextKey, tags } = config

  async function invalidate(
    req: PayloadRequest,
    doc: unknown,
    previousSlugs: PublishedLocaleSlugs,
    currentSlugs: PublishedLocaleSlugs,
  ) {
    // Tags first, and unconditionally. They are what actually matters: every
    // browse page in this tree is `force-dynamic` and reads `unstable_cache`d
    // queries, so the stale thing is the query result, not the rendered route.
    // Done before the hub lookup so a document with no resolvable hub — which
    // makes the paths below unbuildable — still clears the data caches.
    for (const tag of tags) {
      try {
        revalidateTag(tag)
      } catch {
        // Outside a Next request (a seed script). The paths below report the
        // same condition once, so this stays silent rather than logging per tag.
      }
    }

    const hubId = readHubId(doc)
    if (!hubId) return

    const hubSlugs = await hubSlugsByLocale(req, hubId)
    const paths = new Set<string>()

    for (const locale of appLocales) {
      const hubSlug = hubSlugs[locale]
      if (!hubSlug) continue

      // Both the old and the new slug: a rename has to clear the URL that is
      // about to stop existing as well as the one that just started.
      for (const slug of [previousSlugs[locale], currentSlugs[locale]]) {
        if (slug) paths.add(`/${locale}/${hubSlug}/${slug}`)
      }

      // The hub lists this document, so publishing one changes a page belonging
      // to a different document. That fan-out is why this cannot be a list of the
      // document's own paths.
      if (previousSlugs[locale] || currentSlugs[locale]) {
        paths.add(`/${locale}/${hubSlug}`)
      }
    }

    for (const path of paths) {
      try {
        revalidatePath(path)
        req.payload.logger.info(`Revalidated ${path}`)
      } catch (error) {
        // Outside a Next request — a seed script, say — `revalidatePath` throws.
        // The data is already written; warn and carry on rather than failing the
        // save.
        req.payload.logger.warn({ err: error }, `Could not revalidate ${path}`)
      }
    }
  }

  /**
   * Remember the live locale/slug pairs before an update or deletion.
   *
   * Without this, renaming a document leaves the OLD URL cached and serving it
   * forever — `doc` after the change no longer knows what the slug used to be.
   */
  const capture: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
    if (req.context.disableRevalidate) return
    if (!['create', 'update', 'restoreVersion', 'delete'].includes(operation)) return

    const operationArgs = args as {
      data?: { _status?: unknown }
      draft?: boolean
      id?: number | string
    }

    // An autosave that leaves the document a draft changes nothing a visitor can
    // see, so it should not invalidate anything.
    const isDraftSave =
      operationArgs.id != null &&
      operationArgs.draft === true &&
      !isPublishedForActiveLocale(operationArgs.data?._status, req.locale)

    const state: PublicationContext = { isDraftSave }
    req.context[contextKey] = state

    if (state.isDraftSave || !operationArgs.id) return

    try {
      state.previousSlugs = await resolvePublishedLocaleSlugs({
        collection,
        id: operationArgs.id,
        req,
      })
    } catch (error) {
      req.payload.logger.warn({ err: error }, `Could not read previous ${collection} slugs`)
    }
  }

  const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
    if (req.context.disableRevalidate) return doc

    const state = req.context[contextKey] as PublicationContext | undefined
    if (state?.isDraftSave) return doc

    const currentSlugs = await resolvePublishedLocaleSlugs({
      collection,
      id: (doc as { id: number | string }).id,
      req,
    })

    await invalidate(req, doc, state?.previousSlugs ?? {}, currentSlugs)

    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    if (req.context.disableRevalidate) return doc

    const state = req.context[contextKey] as PublicationContext | undefined
    await invalidate(req, doc, state?.previousSlugs ?? {}, {})

    return doc
  }

  return { capture, afterChange, afterDelete }
}
