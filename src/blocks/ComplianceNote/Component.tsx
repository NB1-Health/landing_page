import React from 'react'

import { resolveDisclaimer } from '@/utilities/contentLibrary'

type Props = {
  /** A record from the Disclaimers library. Wins over `text`. */
  disclaimer?: unknown
  /** Per-article override. Used only when no record is selected. */
  text?: string | null
  /** Bold lead-in fallback, translated. */
  label: string
  /** The standard wellness disclaimer, translated. */
  fallback: string
}

/**
 * Compliance wording, in whichever of the four treatments its record specifies.
 *
 * `note` is the default and the shape this block always had: a quiet rule-topped
 * paragraph with a bold lead-in. `health` is the condition notice — a titled
 * block, because at ~540 characters it is more than twice the length of a quiet
 * note and reads as alarming in the same treatment. `standard` and `fine` are
 * quieter still.
 *
 * The treatment is stored on the record, not inferred from length: a legal text
 * should not change how it renders because someone tightened the wording.
 */
export const ComplianceNoteComponent: React.FC<Props> = ({
  disclaimer,
  text: inlineText,
  label,
  fallback,
}) => {
  const resolved = resolveDisclaimer({ reference: disclaimer, inlineText })
  const body = resolved.text ?? fallback

  if (resolved.weight === 'health') {
    return (
      <div className="jr-notice">
        {resolved.label ?? label ? <h3>{resolved.label ?? label}</h3> : null}
        <p>{body}</p>
      </div>
    )
  }

  if (resolved.weight === 'standard') {
    return (
      <section className="jr-disclaimer">
        <h2>{resolved.label ?? label}</h2>
        <p>{body}</p>
      </section>
    )
  }

  // `note` and `fine` share the quiet inline treatment; `fine` only ever renders
  // inside a conversion block, which supplies its own container.
  return (
    <p className="jr-note">
      <b>{resolved.label ?? label}</b> {body}
    </p>
  )
}
