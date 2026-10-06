import React from 'react'

import { RdFooterServer } from '@/components/RdChrome/FooterServer'
import { Footer } from '@/Footer/Component'
import { journalReskinEnabled } from '@/utilities/journalReskin'

/**
 * Which footer the Journal wears, in one place.
 *
 * ONE PLACE decides, for the whole branch: the index, the paginated pages,
 * every article, and the hub, pillar, term and research pages. They all render
 * this instead of <Footer>, with the same props they passed before.
 *
 * NOW BEHIND THE SWITCH. `JOURNAL_RESKIN` used to cover the journal's content
 * styling and nothing else, on the reasoning that a styling flag should not be
 * moving the site's navigation. That reasoning was wrong in one direction: with
 * the flag off, the journal rendered its ORIGINAL content under the REDESIGN's
 * footer — a combination that was never designed and that nobody asked for. A
 * switch that leaves the page half-reskinned is not a switch.
 *
 * So the rule is now the plain one: the redesign does not touch the old chrome.
 * Flag on, the journal wears the redesign footer; flag off, it wears the site
 * footer it always had, with the logo and the navy ground that come with it.
 *
 * BY NAME, NOT BY ID, on the redesign side — the sibling of
 * components/JournalHeader, for the same reason: staging numbers this document
 * 2 and production numbers it 1, so a hardcoded id is silently wrong in one of
 * them. `isDefault` is no help either; on staging it is on "Redesign footer",
 * which is not the one in use.
 *
 * If the name does not resolve nothing renders, deliberately, and getRdChrome
 * logs what it searched for. So this name has to exist in every environment.
 *
 * `id` is the per-page and per-article site-footer choice. It is read again
 * now — it is what the old footer needs — which is why it was kept in the
 * signature when it was briefly unused.
 */
const JOURNAL_RD_FOOTER_NAME = 'Footer - main'

export function JournalFooter({ locale, id }: { locale: string; id?: string | null }) {
  if (!journalReskinEnabled()) return <Footer locale={locale} id={id} />

  return <RdFooterServer name={JOURNAL_RD_FOOTER_NAME} locale={locale} />
}

export default JournalFooter
