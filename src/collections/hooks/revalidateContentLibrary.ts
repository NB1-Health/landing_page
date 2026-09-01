import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

/**
 * Bust the keyed content library's cache.
 *
 * `libraryQueries.ts` reads `Disclaimers` and `ConversionBlocks` through
 * `unstable_cache` tagged `content-library`. That call has no `revalidate`
 * option, which means the entry never expires on its own — so without this hook
 * an edited disclaimer would be written to the database and never appear on a
 * page again. These records are read on every term and article render and change
 * a few times a year, which is exactly the shape that wants an indefinite cache
 * plus explicit invalidation.
 *
 * One tag for the whole library rather than per key. The per-key tags are still
 * attached on the read side, but busting them individually would mean deriving
 * the key from the document — and the key is editable, so a renamed record would
 * clear the new key and leave the old one cached. The library is a handful of
 * rows; clearing all of it is cheaper than getting that wrong.
 *
 * Not a page-path invalidation: these records appear on every page on the site,
 * so there is no bounded list of paths to clear. The tag is what makes that
 * tractable.
 */
function bust(logger: { warn: (...args: unknown[]) => void }) {
  try {
    revalidateTag('content-library')
  } catch (error) {
    // Outside a Next request — a seed script or a migration. The data is already
    // written, and there is no render cache to clear in that context.
    logger.warn({ err: error }, 'Could not revalidate the content library cache')
  }
}

export const revalidateContentLibrary: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc
  bust(req.payload.logger)
  return doc
}

/**
 * A deleted record has to clear the cache too — otherwise the page keeps
 * rendering a disclaimer that no longer exists, which for a compliance notice is
 * the worst of the three states.
 */
export const revalidateContentLibraryDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc
  bust(req.payload.logger)
  return doc
}
