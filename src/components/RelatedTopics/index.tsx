import React from 'react'

import { JournalCard } from '@/components/JournalCard'
import type { JournalCardData } from '@/utilities/journalCard'

type Props = {
  heading: string
  cards: JournalCardData[]
  labels: {
    minRead: string
    imagePlaceholder: string
    featured: string
    readArticle: string
  }
}

/**
 * The "Related topics" strip at the foot of a pillar.
 *
 * Reuses `JournalCard`, so the strip is visibly the same object as the hub
 * listing and the Journal grid. A third card treatment for the third context
 * would be inconsistency for its own sake.
 *
 * Its heading is an H2, which puts it in the contents rail alongside the body
 * sections — correct, because it is a section of the page a reader may want to
 * jump to, not chrome.
 *
 * Renders nothing when the hub has no siblings yet, rather than a heading over
 * empty space.
 */
export function RelatedTopics({ heading, cards, labels }: Props) {
  if (cards.length === 0) return null

  return (
    <section className="jr-rel">
      <h2 className="jr-rel__title">{heading}</h2>
      <div className="jr-rel__grid">
        {cards.map((card) => (
          // Never `priority`: this sits below the article, well past the fold,
          // and marking it would compete with the hero for the same bandwidth.
          <JournalCard card={card} key={card.id} labels={labels} />
        ))}
      </div>
    </section>
  )
}
