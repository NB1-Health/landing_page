import React from 'react'
import { connection } from 'next/server'

import { getCachedRdHeader } from '@/utilities/getRdChrome'
import { resolveCurrency } from '@/utilities/currency'
import type { LocalizedDocument } from '@/Header/localizedDocument'
import RdHeader from './Header'

/**
 * Why the wrapper.
 *
 * rd-tokens.css rescopes the mockup's `#nb1home` to `.rd-block`, and port_css.py
 * emits two forms of every rule: `.rd-block X` for a DESCENDANT and
 * `.rd-block:is(X)` for the element itself. A block satisfies both, because the
 * block root IS the `.rd-block` and everything the rules target sits inside it.
 *
 * The chrome does not. Putting `rd-block` on the <nav> satisfies the `:is()`
 * form — which is why `nav[data-over="1"]{background:transparent}` worked — but
 * every DESCENDANT rule needs an ancestor carrying the class:
 * `.rd-block nav[data-over="1"] [data-m="logodark"]{display:none}` is the logo
 * swap, and with the class on the nav itself it matches nothing. The header
 * shipped showing the dark logo on a dark hero for exactly that reason.
 *
 * `display: contents` is what makes this safe: the wrapper is a selector anchor
 * and nothing else. It generates no box, so the sticky nav still resolves
 * against the real page flow — a wrapper with a box would become the nav's
 * containing block, and a sticky element cannot travel inside a container its
 * own height.
 */
const SCOPE: React.CSSProperties = { display: 'contents' }


/**
 * Server wrapper for the redesign header.
 *
 * The client component takes the document's FIELDS, not an id, so the fetch
 * happens here — the same split the live header uses (`Header/Component.tsx`
 * fetches, `Component.client.tsx` renders).
 *
 * `connection()` before the fetch, and `initialCurrency` resolved from the
 * locale, both mirror the live header: the currency has to be the locale's
 * default on the server so the markup React hydrates against matches, with the
 * visitor's own preference applied after mount by useLocaleCurrency.
 */
export async function RdHeaderServer({
  locale,
  id,
  localizedDocument,
}: {
  locale: string
  id?: string | number | null
  localizedDocument?: LocalizedDocument | null
}) {
  await connection()
  const data = await getCachedRdHeader(id, locale)()
  if (!data) return null

  return (
    <div className="rd-block" style={SCOPE}>
      <RdHeader
        {...(data as never)}
        locale={locale}
        initialCurrency={resolveCurrency(undefined, locale)}
        localizedDocument={localizedDocument ?? null}
      />
    </div>
  )
}

export default RdHeaderServer
