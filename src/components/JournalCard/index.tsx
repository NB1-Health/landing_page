import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { thumbClassName, type JournalCardData } from '@/utilities/journalCard'

export type JournalCardLabels = {
  minRead: string
  imagePlaceholder: string
  featured: string
  readArticle: string
}

type Props = {
  card: JournalCardData
  labels: JournalCardLabels
  /** `featured` renders the wide hero card in the single featured slot. */
  variant?: 'grid' | 'featured'
  /** Set on the one above-the-fold image so it is not lazy-loaded. */
  priority?: boolean
}

/**
 * No 'use client' here on purpose — this has no client-only APIs, so it works
 * both server-rendered and inside the client-side JournalGrid.
 */
function Thumb({
  card,
  labels,
  priority,
  sizes,
}: {
  card: JournalCardData
  labels: JournalCardLabels
  priority?: boolean
  sizes: string
}) {
  return (
    <div className={thumbClassName(card.categorySlug)}>
      {card.image ? (
        <Image
          alt={card.image.alt}
          fill
          priority={priority}
          sizes={sizes}
          src={card.image.src}
        />
      ) : (
        // The category gradient shows through; the label only appears when
        // there is genuinely no cover image to render.
        <span className="jr-ph">{labels.imagePlaceholder}</span>
      )}
    </div>
  )
}

export const JournalCard: React.FC<Props> = ({
  card,
  labels,
  variant = 'grid',
  priority = false,
}) => {
  if (variant === 'featured') {
    return (
      <Link className="jr-feat" data-topic={card.categorySlug ?? ''} href={card.href}>
        <Thumb card={card} labels={labels} priority={priority} sizes="(max-width: 880px) 100vw, 55vw" />
        <div className="jr-feat__body">
          <span className="jr-cat">
            {card.categoryTitle ? `${card.categoryTitle} · ` : ''}
            {labels.featured}
          </span>
          <h2>{card.title}</h2>
          {card.excerpt ? <p>{card.excerpt}</p> : null}
          <span className="jr-readmore">{labels.readArticle} &rarr;</span>
        </div>
      </Link>
    )
  }

  return (
    <Link className="jr-card" data-topic={card.categorySlug ?? ''} href={card.href}>
      <Thumb
        card={card}
        labels={labels}
        priority={priority}
        sizes="(max-width: 560px) 100vw, (max-width: 880px) 50vw, 33vw"
      />
      <div className="jr-card__body">
        {card.categoryTitle ? <span className="jr-cat">{card.categoryTitle}</span> : null}
        <h3>{card.title}</h3>
        {card.excerpt ? <p>{card.excerpt}</p> : null}
        {card.readTime ? (
          <span className="jr-readtime">
            {card.readTime} {labels.minRead}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
