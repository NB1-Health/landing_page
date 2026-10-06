import React from 'react'

import { RdHeaderServer } from '@/components/RdChrome/HeaderServer'
import type { LocalizedDocument } from '@/Header/localizedDocument'

/**
 * Which redesign header the Journal wears, in one place.
 *
 * BY NAME, NOT BY ID, because the ids are not the same between environments:
 * staging numbers this document 2 and production numbers it 1. A hardcoded id
 * is wrong in one of them whichever number is chosen, and wrong SILENTLY —
 * every rd-header renders perfectly well, so the page looks fine and wears the
 * wrong chrome. The name is the stable identifier, and it says what it is.
 *
 * Nor can this lean on `isDefault`: measured on staging, that flag sits on an
 * rd-header no page uses, whose `transparent` and `lightText` are still null.
 * That was the first version of this file and it was wrong.
 *
 * IF THE NAME DOES NOT RESOLVE, NOTHING RENDERS. There is no fallback on
 * purpose — falling back to the default would put the wrong header on the page
 * and look fine, which is the failure this exists to avoid. getRdChrome logs
 * the collection and the string it searched for, so a missing header is one log
 * line from its cause. The cost is that this name must exist in EVERY
 * environment the journal is served from.
 */
const JOURNAL_RD_HEADER_NAME = 'Header - solid'

export function JournalHeader({
  locale,
  localizedDocument,
}: {
  locale: string
  localizedDocument?: LocalizedDocument | null
}) {
  return (
    <RdHeaderServer
      locale={locale}
      name={JOURNAL_RD_HEADER_NAME}
      localizedDocument={localizedDocument ?? null}
    />
  )
}

export default JournalHeader
