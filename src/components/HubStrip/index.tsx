import Link from 'next/link'
import React from 'react'

import type { HubLink } from '@/utilities/hubQueries'

type Props = {
  heading: string
  hubs: HubLink[]
}

/**
 * Links from the Journal index down to the three hubs (SEO-007 §11.1).
 *
 * Body content, not chrome. The footer block in §11.0 puts the hubs on every
 * page; this puts them in the editorial flow of the page that is *about* the
 * content, which is where a link carries the most weight and where a reader
 * looking for a topic actually looks.
 *
 * Deliberately NOT cards with excerpts. §11.2 is explicit that the Journal index
 * may surface content from the hubs but "every card links to the canonical URL
 * under its own hub. No content is duplicated onto /en/journal" — a link with a
 * name stays clearly on the safe side of that.
 *
 * Renders nothing when there are no hubs in this locale, rather than an empty
 * heading over blank space.
 */
export function HubStrip({ heading, hubs }: Props) {
  if (hubs.length === 0) return null

  return (
    <nav className="jr-hubs" aria-label={heading}>
      <h2 className="jr-hubs__title">{heading}</h2>
      <ul className="jr-hubs__list">
        {hubs.map((hub) => (
          <li key={hub.key}>
            <Link className="jr-hubs__link" href={hub.path}>
              {hub.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
