import React from 'react'

import { RdHeaderServer } from '@/components/RdChrome/HeaderServer'
import { Header } from '@/Header/Component'
import { journalReskinEnabled } from '@/utilities/journalReskin'

type LocalizedDocument = React.ComponentProps<typeof RdHeaderServer>['localizedDocument']

/**
 * Which header the Journal wears, in one place. The sibling of
 * components/JournalFooter — see that file for why this is resolved by name
 * rather than by id, and why the switch now covers the chrome.
 *
 * `id` is the per-page site-header choice, passed straight through to the old
 * header when the switch is off.
 */
const JOURNAL_RD_HEADER_NAME = 'Header - solid'

export function JournalHeader({
  locale,
  localizedDocument,
  id,
}: {
  locale: string
  localizedDocument?: LocalizedDocument | null
  id?: string | null
}) {
  if (!journalReskinEnabled()) {
    return <Header locale={locale} id={id} localizedDocument={localizedDocument ?? null} />
  }

  return (
    <RdHeaderServer
      locale={locale}
      name={JOURNAL_RD_HEADER_NAME}
      localizedDocument={localizedDocument ?? null}
    />
  )
}

export default JournalHeader
