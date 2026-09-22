import React from 'react'

import { getCachedRdFooter } from '@/utilities/getRdChrome'
import RdFooter from './Footer'

/** See HeaderServer for why this wrapper exists and why it is display:contents. */
const SCOPE: React.CSSProperties = { display: 'contents' }

/** Server wrapper for the redesign footer — see HeaderServer for the split. */
export async function RdFooterServer({
  locale,
  id,
}: {
  locale: string
  id?: string | number | null
}) {
  const data = await getCachedRdFooter(id, locale)()
  if (!data) return null
  return (
    <div className="rd-block" style={SCOPE}>
      <RdFooter {...(data as never)} />
    </div>
  )
}

export default RdFooterServer
