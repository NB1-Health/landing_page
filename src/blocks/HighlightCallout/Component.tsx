import React from 'react'

type Props = {
  title?: string | null
  body?: string | null
  tone?: string | null
}

/**
 * An in-body emphasis panel.
 *
 * `<aside>` rather than a `<div>`: the content is related to the surrounding
 * prose but tangential to it, which is exactly what the element means, and it
 * gives assistive technology a landmark to skip or jump to.
 *
 * Unknown tone values fall back to `info` rather than rendering an unstyled
 * panel — a select can end up holding anything after a config change or an API
 * import.
 */
export const HighlightCalloutComponent: React.FC<Props> = ({ title, body, tone }) => {
  if (!body?.trim()) return null

  const isCaution = tone === 'caution'

  return (
    <aside className={isCaution ? 'jr-call jr-call--caution' : 'jr-call'}>
      {title?.trim() ? <p className="jr-call__title">{title}</p> : null}
      <p className="jr-call__body">{body}</p>
    </aside>
  )
}
