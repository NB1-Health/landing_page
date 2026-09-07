import React from 'react'

export type EvidenceLabels = {
  /** Column heading, e.g. "Strength of evidence". */
  strength: string
  claim: string
  note: string
  /** Level 1–5, translated. Indexed by the stored value. */
  levels: Record<'1' | '2' | '3' | '4' | '5', string>
}

type Row = {
  claim?: string | null
  strength?: string | null
  note?: string | null
  id?: string | null
}

type Props = {
  sectionTitle?: string | null
  rows?: Row[] | null
  caption?: string | null
  labels: EvidenceLabels
}

const MAX = 5

/**
 * Five dots, of which `filled` are on.
 *
 * `aria-hidden` because the dots are decoration: the cell already carries the
 * level in words. Without that, a screen reader reads five list items of nothing,
 * or — worse, if the dots were text characters — "black circle black circle
 * white circle".
 */
function Dots({ filled }: { filled: number }) {
  return (
    <span aria-hidden="true" className="jr-dots">
      {Array.from({ length: MAX }, (_, index) => (
        <span className={index < filled ? 'jr-dot jr-dot--on' : 'jr-dot'} key={index} />
      ))}
    </span>
  )
}

function toLevel(value: unknown): '1' | '2' | '3' | '4' | '5' | null {
  const raw = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : ''
  return raw === '1' || raw === '2' || raw === '3' || raw === '4' || raw === '5' ? raw : null
}

export const EvidenceTableComponent: React.FC<Props> = ({
  sectionTitle,
  rows,
  caption,
  labels,
}) => {
  const items = (Array.isArray(rows) ? rows : []).filter((row) => row?.claim?.trim())
  if (items.length === 0) return null

  return (
    <div className="jr-ev">
      {sectionTitle?.trim() ? <p className="jr-ev__title">{sectionTitle}</p> : null}

      {/* Reuses the article's existing scroll container. The prose column is
          680px and three columns rarely fit on a phone; without this the whole
          page scrolls sideways instead of the table. */}
      <div className="jr-table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{labels.claim}</th>
              <th scope="col">{labels.strength}</th>
              <th scope="col">{labels.note}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const level = toLevel(row.strength)

              return (
                <tr key={row.id ?? index}>
                  <th scope="row">{row.claim}</th>
                  <td>
                    {level ? (
                      <span className="jr-ev__rating">
                        <Dots filled={Number(level)} />
                        {/* The rating in words, for anyone not looking at the
                            dots — and the only version that survives a
                            stylesheet failing to load. */}
                        <span className="jr-ev__level">{labels.levels[level]}</span>
                      </span>
                    ) : null}
                  </td>
                  <td>{row.note?.trim() ? row.note : null}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {caption?.trim() ? <p className="jr-table-caption">{caption}</p> : null}
    </div>
  )
}
