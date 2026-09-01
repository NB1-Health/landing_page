/**
 * Resolving a library record against a block's inline override.
 *
 * Both `ComplianceNote` and `CtaBlock` now accept either a reference to a record
 * or their own copy, and both must apply the same precedence: record, then
 * inline, then the translated default. Written once because two renderers each
 * deciding the order is how they end up disagreeing — and the disagreement would
 * show as legal wording that is right on some pages and stale on others, which is
 * the exact failure the library exists to prevent.
 *
 * The relationship arrives populated at depth 1 or as a bare id at depth 0, so
 * every read is guarded and a bare id resolves to nothing rather than throwing.
 */

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** A trimmed non-empty string, or null. Empty and whitespace are both "unset". */
export function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** First non-empty value, in the order given. */
export function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    const found = text(value)
    if (found) return found
  }
  return null
}

export type DisclaimerWeight = 'note' | 'standard' | 'health' | 'fine'

export type ResolvedDisclaimer = {
  label: string | null
  text: string | null
  weight: DisclaimerWeight
}

function weight(value: unknown): DisclaimerWeight {
  return value === 'standard' || value === 'health' || value === 'fine' ? value : 'note'
}

export function resolveDisclaimer({
  reference,
  inlineText,
}: {
  reference: unknown
  inlineText: unknown
}): ResolvedDisclaimer {
  const doc = record(reference)

  return {
    label: text(doc?.label),
    // The record wins outright — including over inline copy left behind from
    // before a record was selected. The block config hides the override when a
    // record is chosen, but old documents still carry the old value.
    text: doc ? firstText(doc.text) : text(inlineText),
    // Inline copy has no record, so it gets the quiet treatment it always had.
    weight: doc ? weight(doc.weight) : 'note',
  }
}

export type ResolvedConversionBlock = {
  heading: string | null
  /** Optional italic line above the body. Only one record in the set has one. */
  lede: string | null
  body: string | null
  buttonLabel: string | null
  href: string | null
  /** Fine print, resolved from the linked Disclaimers record. */
  fine: string | null
}

export function resolveConversionBlock({
  reference,
  inlineBody,
  inlineHref,
}: {
  reference: unknown
  inlineBody: unknown
  inlineHref: unknown
}): ResolvedConversionBlock {
  const doc = record(reference)

  if (doc) {
    return {
      heading: text(doc.heading),
      lede: text(doc.lede),
      body: text(doc.body),
      buttonLabel: text(doc.buttonLabel),
      href: text(doc.href),
      // A reference, never typed into the CTA. Every conversion block in the
      // previews carries fine print and every one of them pulls it from the
      // disclaimer library — which is what keeps one legal edit from needing five.
      fine: text(record(doc.disclaimer)?.text),
    }
  }

  return {
    heading: null,
    lede: null,
    body: text(inlineBody),
    buttonLabel: null,
    href: text(inlineHref),
    fine: null,
  }
}

/**
 * A stored site path turned into an href.
 *
 * Stored without the locale (`/order`) so one record serves all eight markets.
 * An absolute URL passes through so a market can point somewhere else entirely,
 * and a value that already carries the locale is left alone rather than doubled —
 * the same rules as `resolveCtaHref` in `journalCopy.ts`, which handles the
 * Journal's own CTA.
 */
export function localizeHref(raw: string | null, locale: string, fallback: string): string {
  const value = raw ?? fallback
  if (/^https?:\/\//i.test(value)) return value

  const path = value.startsWith('/') ? value : `/${value}`
  if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return path

  return `/${locale}${path}`
}
