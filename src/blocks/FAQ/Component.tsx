import React from 'react'
import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { getDictionary } from '@/i18n/getDictionary'

type Props = FAQBlockProps & {
  locale?: string
}

/**
 * FAQ inside an article body, as plain question-and-answer prose.
 *
 * This was a client-side accordion rendering `{isOpen && <answer>}`, which meant
 * every answer except the first was **absent from the HTML entirely** — not
 * hidden, not rendered. On a search-acquisition surface that is a real loss: the
 * answers are exactly the text worth indexing, and FAQ content is prime
 * featured-snippet material.
 *
 * Flattening it also drops the `'use client'` boundary and lets the article's own
 * `.jr-prose` rules do the styling, instead of `.art-card` / `.art-faq__*` from
 * article-template.css — a visual system the approved template does not use. The
 * template specifies no accordion, so nothing is lost by not having one.
 */
export const FAQBlockComponent: React.FC<Props> = ({ items, locale }) => {
  const dict = getDictionary(locale)

  if (!items?.length) return null

  return (
    <section>
      <h3>{dict.faq.heading}</h3>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <h4>{item.question}</h4>
          <RichText data={item.answer} enableGutter={false} enableProse={false} locale={locale} />
        </React.Fragment>
      ))}
    </section>
  )
}
