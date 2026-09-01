import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { formatSourceLine, type RelatedCardData } from '@/utilities/relatedCard'
import { thumbClassName } from '@/utilities/journalCard'

/**
 * One card in a related strip.
 *
 * The whole card is the anchor, as in every preview — a card where only the title
 * is clickable gives a reader a 16px target inside a 220px box.
 *
 * The category word is not a link. It labels the card; making it a second link
 * inside the first is invalid markup and gives assistive technology two
 * overlapping targets for one object.
 */
function RelatedCard({ card }: { card: RelatedCardData }) {
  const source = formatSourceLine(card.journal, card.year)

  return (
    <Link className="jr-relcard" href={card.href}>
      <div className={thumbClassName(card.categorySlug ?? null)}>
        {card.image ? (
          <Image
            alt={card.image.alt ?? ''}
            height={card.image.height ?? 200}
            // Three across at 1180px, one across on a phone. Without this every
            // card downloads a desktop-width file to render at 340px.
            sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 360px"
            src={card.image.src}
            width={card.image.width ?? 320}
          />
        ) : null}
      </div>

      <div className="jr-relcard__bd">
        {card.category ? <span className="jr-relcard__cat">{card.category}</span> : null}
        {/* h3, because the strip's own heading is the h2. Three levels total,
            per Rule 1 — and a card title styled as a heading has to BE one. */}
        <h3 className="jr-relcard__h">{card.title}</h3>
        {source ? <span className="jr-relcard__meta">{source}</span> : null}
      </div>
    </Link>
  )
}

type Props = {
  heading: string
  cards: RelatedCardData[]
}

/**
 * A generated strip of related content.
 *
 * Used by the pillar (related topics, related research), the scientific article
 * (related reading) and all three lexicon types (read more). One component,
 * because the previews render all five with identical markup and the only real
 * differences are the heading and how many cards the query returns.
 *
 * The heading is an `<h2>`: the strip is a section of the page a reader may want
 * to jump to, not chrome, and on types with a contents rail it belongs in the rail.
 *
 * Renders nothing when the strip is empty, rather than a heading over blank
 * space. Every optional slot needs a defined empty state (designer brief §11) and
 * for this one the answer is that the space collapses.
 */
export function RelatedContent({ heading, cards }: Props) {
  if (cards.length === 0) return null

  return (
    <section className="jr-rel">
      <h2 className="jr-rel__title">{heading}</h2>
      <div className="jr-rel__grid">
        {cards.map((card) => (
          <RelatedCard card={card} key={card.id} />
        ))}
      </div>
    </section>
  )
}
