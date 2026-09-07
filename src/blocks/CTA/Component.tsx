import React from 'react'
import Link from 'next/link'

import { getDictionary } from '@/i18n/getDictionary'
import { localizeHref, resolveConversionBlock } from '@/utilities/contentLibrary'

type Props = {
  /** A record from the Conversion blocks library. Wins over the inline fields. */
  conversionBlock?: unknown
  body?: string | null
  buttonUrl?: string | null
  /**
   * Full-width when explicitly false. The preview treats inline as a boolean
   * attribute on the mount point and full-width as the default shape; here the
   * block only ever appears mid-body, so inline is the default and this is the
   * escape hatch.
   */
  inline?: boolean
  locale?: string
}

/**
 * An editor-placed CTA mid-article.
 *
 * Uses the same `.jr-cta` panel as the one that closes every article, in its
 * lighter `--inline` variant. Reusing the palette keeps the page reading as one
 * system; going lighter avoids two identical full-weight dark panels on the same
 * page, which reads as a mistake rather than a decision.
 */
export const CtaBlockComponent: React.FC<Props> = ({
  conversionBlock,
  body,
  buttonUrl,
  inline,
  locale,
}) => {
  const safeLocale = locale || 'en'
  const dict = getDictionary(safeLocale)

  const resolved = resolveConversionBlock({
    reference: conversionBlock,
    inlineBody: body,
    inlineHref: buttonUrl,
  })

  // Nothing to say and nowhere to go: render nothing rather than an empty dark
  // panel with a button to /order.
  if (!resolved.body) return null

  const href = localizeHref(resolved.href, safeLocale, '/order')

  return (
    <div className={inline === false ? 'jr-cta' : 'jr-cta jr-cta--inline'}>
      <div>
        {/* A paragraph, not a heading — Rule 2, and it kept the marketing line
            out of the contents rail. */}
        <p className="jr-cta__title">{resolved.heading ?? dict.cta.heading}</p>
        {resolved.lede ? (
          <p>
            <em>{resolved.lede}</em>
          </p>
        ) : null}
        <p>{resolved.body}</p>
        {resolved.fine ? <p className="jr-cta__fine">{resolved.fine}</p> : null}
      </div>
      <Link href={href}>{resolved.buttonLabel ?? dict.cta.buttonText}</Link>
    </div>
  )
}
