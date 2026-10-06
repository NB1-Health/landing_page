import React from 'react'

import { RdFooterServer } from '@/components/RdChrome/FooterServer'

/**
 * Which redesign footer the Journal wears, in one place.
 *
 * ONE PLACE decides, for the whole branch: the index, the paginated pages,
 * every article, and the hub, pillar, term and research pages. They all render
 * this instead of <Footer>, with the same props they passed before.
 *
 * BY NAME, NOT BY ID — the sibling of components/JournalHeader, for the same
 * reason: staging numbers this document 2 and production numbers it 1, so a
 * hardcoded id is silently wrong in one of them. `isDefault` is no help either;
 * on staging it is on "Redesign footer", which is not the one in use.
 *
 * If the name does not resolve nothing renders, deliberately, and getRdChrome
 * logs what it searched for. So this name has to exist in every environment.
 *
 * WHAT THIS REPLACED. This used to read
 * `Site Settings -> Journal index page -> Redesign footer` and fall back to the
 * site <Footer> when empty — and it was empty everywhere, which is why the
 * journal kept the old footer after the new header went on. That picker is no
 * longer consulted. The field stays in the Site Settings config: removing it is
 * a schema change and a migration for something now simply unread, and it is
 * the obvious home if this should ever become an editorial choice again.
 *
 * `id` — the per-page and per-article site-footer choice — is no longer used,
 * and stays in the signature only so the nine call sites need not all change.
 */
const JOURNAL_RD_FOOTER_NAME = 'Footer - main'

export function JournalFooter({
  locale,
  id: _id,
}: {
  locale: string
  id?: string | null
}) {
  return <RdFooterServer name={JOURNAL_RD_FOOTER_NAME} locale={locale} />
}

export default JournalFooter
