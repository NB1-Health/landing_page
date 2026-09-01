import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { appLocales } from '@/i18n/config'

/**
 * Invalidate everything Site Settings feeds when an editor saves it.
 *
 * Nothing did this before — no global in this project had a revalidate hook —
 * which meant a change here did not appear until the route's own ISR window
 * expired, and often not even then: `getCachedGlobal` wraps the read in
 * `unstable_cache`, whose entry lives until one of its tags is revalidated, not
 * until a timer runs out. Saving looked like it had silently failed.
 *
 * Two layers, and both are needed:
 *
 *  1. The tags `getCachedGlobal` registers — `global_site-settings` plus the
 *     per-locale variant it adds when a locale is passed. That clears the Data
 *     Cache entry.
 *  2. `revalidatePath` per locale, because clearing the Data Cache does not
 *     reliably regenerate already-statically-rendered ISR HTML when the data
 *     came from `unstable_cache` rather than a plain `fetch()`. The same note
 *     and the same remedy are in `Header/hooks/revalidateHeader.ts`.
 *
 * Layout scope rather than a list of Journal paths, because this global is read
 * in two unrelated places: the Journal routes (hero copy, article CTA, and the
 * header/footer choice for the index) and the root layout's Organization
 * JSON-LD, which renders on every page of the site. One layout-scoped call per
 * locale covers both without having to keep a path list in sync with the routes.
 */
export const revalidateSiteSettings: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  // Optional-chained, not because the logger is ever missing in production, but
  // because a hook must not be the reason a save fails. A caller that hands this
  // hook a partial `payload` — a test, a script, a job runner — should still get
  // the revalidation, and losing a log line is the right thing to lose.
  payload?.logger?.info?.('Revalidating site settings')

  // Guarded, which is origin/main's contribution: `revalidateTag` throws when it
  // runs outside a Next request, and a global can be written from a seed script
  // or a job as well as from the admin UI. Unguarded, a stale cache would become
  // a failed SAVE — much worse than the thing it was trying to fix.
  try {
    revalidateTag('global_site-settings')
    // The tag `getCachedGlobal` uses when called without a locale.
    revalidateTag('global_site-settings_default')

    appLocales.forEach((locale) => {
      revalidateTag(`global_site-settings_${locale}`)
      revalidatePath(`/${locale}`, 'layout')
    })
  } catch (error) {
    payload?.logger?.warn?.({ err: error }, 'Could not revalidate site settings')
  }

  return doc
}
