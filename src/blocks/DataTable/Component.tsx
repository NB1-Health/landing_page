import React from 'react'
import type { DataTableBlock as DataTableBlockProps } from '@/payload-types'
import { getDictionary } from '@/i18n/getDictionary'

type Props = DataTableBlockProps & {
  locale?: string
}

/**
 * Tabular content inside an article body.
 *
 * "Table" is on the brief's allowed block list and the approved template already
 * styles `table`/`th`/`td`, so this renders a plain table and lets `.jr-prose`
 * style it — rather than `.art-table` from article-template.css, which is a
 * different visual system.
 *
 * The comparison highlight and glossary term column survive as small `jr-`
 * modifiers reusing the existing teal tint, instead of introducing new accents.
 * The wrapper scrolls horizontally: the prose column is 680px and a comparison
 * table is routinely wider, so without it the whole page scrolls sideways.
 */
export const DataTableBlockComponent: React.FC<Props> = ({
  sectionTitle,
  variant,
  columnHeaders,
  rows,
  highlightColumn,
  caption,
  locale,
}) => {
  const dict = getDictionary(locale)

  if (!rows?.length) return null

  const resolvedHeaders =
    variant === 'glossary' && (!columnHeaders || columnHeaders.length === 0)
      ? [
          { label: dict.dataTable.glossary.termHeader },
          { label: dict.dataTable.glossary.definitionHeader },
        ]
      : columnHeaders || []

  const normalizedHeaders = resolvedHeaders.map((header) => header?.label || '')
  const highlightIndex =
    variant === 'comparison' && Number.isInteger(highlightColumn) ? Number(highlightColumn) : null

  return (
    <>
      {sectionTitle ? <h3>{sectionTitle}</h3> : null}

      <div className="jr-table-wrap">
        <table>
          <thead>
            <tr>
              {normalizedHeaders.map((header, index) => {
                const isAccent =
                  variant === 'glossary' || (variant === 'comparison' && highlightIndex === index)

                return (
                  <th className={isAccent ? 'jr-cell--accent' : undefined} key={index}>
                    {header}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {(row?.cells || []).map((cell, cellIndex) => {
                  const isAccent = variant === 'comparison' && highlightIndex === cellIndex
                  // In a glossary the first column is the term being defined.
                  const isTerm = variant === 'glossary' && cellIndex === 0

                  return (
                    <td className={isAccent ? 'jr-cell--accent' : undefined} key={cellIndex}>
                      {isTerm ? <b>{cell?.value}</b> : cell?.value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {caption ? <p className="jr-table-caption">{caption}</p> : null}
    </>
  )
}
