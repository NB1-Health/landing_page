import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { thumbClassName, type JournalCardData } from '@/utilities/journalCard'

type Props = {
  cards: JournalCardData[]
  heading: string
}

/**
 * "Keep reading" — the three-up related-articles strip at the foot of an
 * article. Deliberately leaner than the index card: the template shows only a
 * category label and a title here, no excerpt or read time.
 */
export const JournalRelated: React.FC<Props> = ({ cards, heading }) => {
  if (cards.length === 0) return null

  return (
    <section className="jr-related">
      <h2>{heading}</h2>
      <div className="jr-rel-grid">
        {cards.map((card) => (
          <Link className="jr-rel" href={card.href} key={card.id}>
            <div className={`${thumbClassName(card.categorySlug)} jr-ph`}>
              {card.image ? (
                <Image
                  alt={card.image.alt}
                  fill
                  sizes="(max-width: 880px) 100vw, 320px"
                  src={card.image.src}
                />
              ) : null}
            </div>
            <div className="jr-bd">
              {card.categoryTitle ? <span className="jr-c">{card.categoryTitle}</span> : null}
              <h3>{card.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
