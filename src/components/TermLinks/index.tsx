import Link from 'next/link'
import React from 'react'

export type TermLink = {
  name: string
  href: string
  /** Species names are italic — designer brief §7 slot 3. */
  italic?: boolean
}

type Props = {
  heading: string
  terms: TermLink[]
}

/**
 * "Related terms" — slot 7 on a lexicon term. Exactly five, generated.
 *
 * A row of links, not cards. The brief is explicit ("Compact row of links, not
 * cards") and the reason is density: at 2,400 terms this strip appears on every
 * one of them, and five cards would add a screen of height to a page that is only
 * 800 words long.
 *
 * `<ul>` rather than a bare row of anchors, so a screen reader announces "list,
 * 5 items" instead of five unrelated links, and so the count is available without
 * counting.
 */
export function TermLinks({ heading, terms }: Props) {
  if (terms.length === 0) return null

  return (
    <section className="jr-related">
      <h2 className="jr-rel__title">{heading}</h2>
      <ul className="jr-xlinks">
        {terms.map((term) => (
          <li key={term.href}>
            <Link href={term.href}>{term.italic ? <em>{term.name}</em> : term.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
