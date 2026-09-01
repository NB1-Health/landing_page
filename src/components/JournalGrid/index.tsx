'use client'

import React, { useMemo, useState } from 'react'

import { JournalCard, type JournalCardLabels } from '@/components/JournalCard'
import { cardTopic, type JournalCardData } from '@/utilities/journalCard'
import type { JournalTopic } from '@/utilities/journalQueries'

const ALL = 'all'

type Props = {
  cards: JournalCardData[]
  featured: JournalCardData | null
  topics: JournalTopic[]
  labels: JournalCardLabels & { allTopics: string; empty: string }
}

/**
 * Topic filter + card grid.
 *
 * This is a client component so chips filter instantly, but every card is still
 * present in the server-rendered HTML (the initial state is "all"), so crawlers
 * and no-JS visitors see the full list.
 *
 * The chips are `<button>`s and carry no URL — no href, no query parameter, no
 * hash. That is required, not incidental: TICKET-SEO-007 §10 rules out crawlable
 * category URLs here because `/journal/category/gut-health` would compete with
 * `/en/microbiome/gut-health`, a pillar page built to rank for that exact term.
 * If linkable chips are ever wanted, §10 permits a `#hash` fragment only, which
 * does not create a new URL.
 *
 * The featured card participates in filtering, matching the approved template
 * where the filter targets every `[data-topic]` in the body.
 */
export const JournalGrid: React.FC<Props> = ({ cards, featured, topics, labels }) => {
  const [active, setActive] = useState<string>(ALL)

  const visibleCards = useMemo(
    () => (active === ALL ? cards : cards.filter((card) => cardTopic(card) === active)),
    [active, cards],
  )

  const visibleFeatured =
    featured && (active === ALL || cardTopic(featured) === active) ? featured : null

  const isEmpty = !visibleFeatured && visibleCards.length === 0

  const cardLabels: JournalCardLabels = {
    minRead: labels.minRead,
    imagePlaceholder: labels.imagePlaceholder,
    featured: labels.featured,
    readArticle: labels.readArticle,
  }

  return (
    <>
      {topics.length > 0 && (
        <div className="jr-filter" role="group">
          <button
            aria-pressed={active === ALL}
            className={active === ALL ? 'jr-chip is-active' : 'jr-chip'}
            onClick={() => setActive(ALL)}
            type="button"
          >
            {labels.allTopics}
          </button>
          {topics.map((topic) => (
            <button
              aria-pressed={active === topic.slug}
              className={active === topic.slug ? 'jr-chip is-active' : 'jr-chip'}
              key={topic.slug}
              onClick={() => setActive(topic.slug)}
              type="button"
            >
              {topic.title}
            </button>
          ))}
        </div>
      )}

      {visibleFeatured && (
        <JournalCard card={visibleFeatured} labels={cardLabels} priority variant="featured" />
      )}

      {visibleCards.length > 0 && (
        <div className="jr-grid">
          {visibleCards.map((card, index) => (
            <JournalCard
              card={card}
              key={card.id}
              labels={cardLabels}
              // Only the first row is above the fold on a desktop viewport.
              priority={!visibleFeatured && index < 3}
            />
          ))}
        </div>
      )}

      {isEmpty && <div className="jr-empty">{labels.empty}</div>}
    </>
  )
}
