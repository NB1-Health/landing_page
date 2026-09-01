import Link from 'next/link'
import React from 'react'

import type { BreadcrumbRung } from '@/utilities/journalTrail'

type Props = {
  rungs: BreadcrumbRung[]
  className?: string
}

/**
 * The visible breadcrumb trail.
 *
 * Server-rendered on purpose: SEO-007 §5 requires the trail to be present in the
 * raw HTML response, not injected into the DOM afterwards, because with flat URLs
 * it is the only place the Journal hierarchy is stated.
 *
 * Takes the same `BreadcrumbRung[]` that `buildBreadcrumbSchema` serialises, so
 * the rendered text and the JSON-LD `name` values cannot drift — §5 calls that
 * mismatch a P1 defect.
 *
 * The final rung is the current page: rendered as text with `aria-current`, never
 * a link, per §5.
 */
export const Breadcrumb: React.FC<Props> = ({ rungs, className = 'jr-crumb' }) => {
  if (rungs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      {rungs.map((rung, index) => {
        const isLast = index === rungs.length - 1

        return (
          <React.Fragment key={`${rung.path}-${index}`}>
            {index > 0 ? (
              <span aria-hidden="true" className="jr-sep">
                /
              </span>
            ) : null}
            {isLast ? (
              <span aria-current="page">{rung.name}</span>
            ) : (
              <Link href={rung.path}>{rung.name}</Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
