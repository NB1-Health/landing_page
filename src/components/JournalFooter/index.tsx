import React from 'react'

import { RdFooterServer } from '@/components/RdChrome/FooterServer'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { isAppLocale } from '@/i18n/config'

/**
 * The Journal's footer: the redesign one, always.
 *
 * ONE PLACE decides, for the whole branch: the index, the paginated pages,
 * every article, and the hub, pillar, term and research pages. They all render
 * this instead of <Footer>, with the same props they passed before.
 *
 * HARD SET, 2026-10-06. This used to fall back to the site <Footer> whenever
 * `Site Settings -> Journal index page -> Redesign footer` was empty — and it
 * was empty in every environment, which is why the journal still wore the old
 * footer after the new header went on. "Empty means keep the old one" was a
 * sensible default while the redesign was optional; now that the journal is on
 * the redesign chrome it only produced a new header above an old footer.
 *
 * THE PICKER STILL WORKS, and still means something: it chooses WHICH redesign
 * footer the branch wears. Empty now means the one marked `isDefault`, which is
 * what RdFooterServer resolves when given no id — the same document every other
 * redesign page gets. What is gone is the route back to the site footer.
 *
 * To put the site footer back, this component is the one place to change.
 *
 * `id` — the per-page and per-article site-footer choice — is no longer used,
 * and is kept in the signature only so the nine call sites do not all have to
 * change. The redesign footer uses its own document by design: the picker names
 * one footer for the branch, which is the point of it.
 */
export async function JournalFooter({
  locale,
  id: _id,
}: {
  locale: string
  id?: string | null
}) {
  const appLocale = isAppLocale(locale) ? locale : 'en'
  const settings = await getCachedGlobal('site-settings', 0, appLocale)()
  const picked = (settings as { journal?: { rdFooter?: unknown } } | null)?.journal?.rdFooter

  // Depth 0, so a set relationship is an id rather than a document. Either is
  // accepted: a later depth change here should not silently fall back to the
  // default, which looks like "the setting did nothing".
  const rdId =
    typeof picked === 'number' || typeof picked === 'string'
      ? picked
      : picked && typeof picked === 'object' && 'id' in picked
        ? (picked as { id: number | string }).id
        : null

  // No id -> RdFooterServer resolves the rd-footer marked `isDefault`.
  return <RdFooterServer id={rdId !== '' ? rdId : null} locale={appLocale} />
}

export default JournalFooter
