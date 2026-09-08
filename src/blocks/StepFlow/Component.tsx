import React from 'react'

type Step = {
  title?: string | null
  body?: string | null
  id?: string | null
}

type Props = {
  sectionTitle?: string | null
  steps?: Step[] | null
}

/**
 * A numbered sequence.
 *
 * An `<ol>`, so the numbers are structure rather than content: reordering steps
 * in the admin renumbers them, and a screen reader announces the position once
 * instead of reading a typed "3." on top of its own count.
 *
 * The counter is drawn by CSS from the list itself for the same reason.
 */
export const StepFlowComponent: React.FC<Props> = ({ sectionTitle, steps }) => {
  const items = (Array.isArray(steps) ? steps : []).filter((step) => step?.title?.trim())
  if (items.length === 0) return null

  return (
    <div className="jr-steps">
      {sectionTitle?.trim() ? <p className="jr-steps__title">{sectionTitle}</p> : null}

      <ol className="jr-steps__list">
        {items.map((step, index) => (
          <li className="jr-step" key={step.id ?? index}>
            <h3 className="jr-step__title">{step.title}</h3>
            {step.body?.trim() ? <p className="jr-step__body">{step.body}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  )
}
