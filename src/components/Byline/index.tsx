import React from 'react'

import type { AuthorDisplay } from '@/utilities/authorDisplay'

export type BylineLabels = {
  by: string
  reviewedBy: string
  lastReviewed: string
}

type Props = {
  author: AuthorDisplay | null
  reviewer: AuthorDisplay | null
  /** Already formatted for the locale. */
  reviewedAt: string | null
  labels: BylineLabels
}

/**
 * The author line — slot 5 on a pillar, slot 4 on a scientific article.
 *
 * Three segments, each optional, separated by a dot: who wrote it, who reviewed
 * it, and when it was last reviewed. Designed once for *an* author (designer
 * brief §4): the details live in one record and render identically everywhere, so
 * a change of job title is one edit rather than a sweep.
 *
 * On health content this line is the E-E-A-T signal, which is why credentials and
 * affiliation are here rather than only in the author box at the foot — a reader
 * deciding whether to trust the page decides before they scroll.
 *
 * Renders nothing at all when there is no author and nothing to say. An empty
 * bordered strip claims a byline exists.
 */
export function Byline({ author, reviewer, reviewedAt, labels }: Props) {
  const hasReview = Boolean(reviewer || reviewedAt)
  if (!author && !hasReview) return null

  return (
    <div className="jr-byline">
      {author ? (
        <span>
          {labels.by} <b>{author.name}</b>
          {author.credentials ? `, ${author.credentials}` : ''}
          {author.roleTitle ? <span className="jr-byline__role">{author.roleTitle}</span> : null}
          {author.affiliation ? (
            <span className="jr-byline__role">{author.affiliation}</span>
          ) : null}
        </span>
      ) : null}

      {author && hasReview ? <span aria-hidden="true" className="jr-dot" /> : null}

      {reviewer ? (
        <span>
          {labels.reviewedBy} <b>{reviewer.name}</b>
          {reviewer.credentials ? `, ${reviewer.credentials}` : ''}
        </span>
      ) : null}

      {reviewer && reviewedAt ? <span aria-hidden="true" className="jr-dot" /> : null}

      {reviewedAt ? (
        <span>
          {labels.lastReviewed} <b>{reviewedAt}</b>
        </span>
      ) : null}
    </div>
  )
}
