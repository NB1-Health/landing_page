import Link from 'next/link'
import React from 'react'

import type { JournalArticleCtaCopy } from '@/utilities/journalCopy'

type Props = {
  cta: JournalArticleCtaCopy
  /** Optional fine print, resolved from a Disclaimers record. */
  fine?: string | null
}

/**
 * The dark conversion panel that closes every article. Copy and target come from
 * Site Settings, with the shipped translation as the fallback, so this is never
 * hardcoded per article.
 *
 * The title is a `<p>`, not an `<h2>`. Rule 2 of the designer brief: a marketing
 * line must be visually distinct from the article's section titles and must never
 * read as part of its structure. It was also being collected by the contents rail
 * while it was a heading — the pillar preview carries a comment about exactly that
 * mistake.
 */
export const JournalArticleCta: React.FC<Props> = ({ cta, fine }) => {
  return (
    <div className="jr-cta">
      <div>
        <p className="jr-cta__title">{cta.heading}</p>
        <p>{cta.body}</p>
        {fine?.trim() ? <p className="jr-cta__fine">{fine}</p> : null}
      </div>
      <Link href={cta.href}>{cta.label}</Link>
    </div>
  )
}
