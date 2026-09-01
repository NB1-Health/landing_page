import React from 'react'
import type { KeyTakeawaysBlock as KeyTakeawaysBlockProps } from '@/payload-types'
import { getDictionary } from '@/i18n/getDictionary'

type Props = KeyTakeawaysBlockProps & {
  locale?: string
}

/**
 * The brief's `.art-key` — the teal-tinted "Key takeaways" callout, good for
 * featured snippets, three to five lines.
 *
 * Restyled to `.jr-key` for the Journal article design. It previously rendered
 * with `.art-card` / `.art-list` from article-template.css, which is a different
 * visual system and looked wrong inside the new article layout. Only the markup
 * changed — the block's stored data is untouched, and this block is used by Posts
 * only, not Pages.
 *
 * The site-wide disclaimer that used to be appended here is gone: it is now its
 * own Compliance note block, so editors place it deliberately rather than having
 * it repeat under every takeaways list.
 */
export const KeyTakeawaysBlock: React.FC<Props> = ({ items, locale }) => {
  const dict = getDictionary(locale)

  if (!items?.length) return null

  return (
    <div className="jr-key">
      <h4>{dict.keyTakeaways.heading}</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.leadIn ? <b>{item.leadIn} </b> : null}
            {item.explanation}
          </li>
        ))}
      </ul>
    </div>
  )
}
