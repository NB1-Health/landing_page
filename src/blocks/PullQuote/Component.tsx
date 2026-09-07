import React from 'react'

type Props = {
  quote?: string | null
  attribution?: string | null
  /** True when the quote repeats a sentence from the body. */
  duplicatesBody?: boolean | null
}

/**
 * Typographic emphasis, not attribution.
 *
 * When the text is lifted from the body — the normal case — the whole figure is
 * `aria-hidden`. A sighted reader gets the emphasis; a listening reader would
 * otherwise hear the same sentence twice a paragraph apart with nothing to
 * explain the repetition. Nothing is lost, because the words are still in the
 * prose above.
 *
 * With an attribution it stops being a repeat of the body and becomes a quotation
 * with a source, so it is exposed and marked up as a `<blockquote>` with
 * `<cite>`.
 */
export const PullQuoteComponent: React.FC<Props> = ({ quote, attribution, duplicatesBody }) => {
  if (!quote?.trim()) return null

  const cited = attribution?.trim()
  const hidden = duplicatesBody !== false && !cited

  return (
    <figure aria-hidden={hidden ? 'true' : undefined} className="jr-pull">
      <blockquote className="jr-pull__quote">{quote}</blockquote>
      {cited ? (
        <figcaption className="jr-pull__cite">
          <cite>{cited}</cite>
        </figcaption>
      ) : null}
    </figure>
  )
}
