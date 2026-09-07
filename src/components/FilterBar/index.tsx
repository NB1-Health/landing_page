'use client'

import React, { useEffect, useId, useState } from 'react'

import { formatCount } from '@/utilities/searchText'

export type FilterBarLabels = {
  /** Visually hidden label for the input. */
  label: string
  /** Already pluralised by the caller — see `placeholder` in the category page. */
  placeholder: string
  /** Singular form, e.g. "1 term". Optional: `other` covers a locale without one. */
  countOne?: string
  /** Plural form, e.g. "{count} terms" */
  countAll: string
  /** e.g. "{shown} of {total} terms" */
  countFiltered: string
  /** A real BCP-47 tag, for `Intl.PluralRules`. Our locale codes are not all valid. */
  htmlLang: string
}

type Props = {
  labels: FilterBarLabels
  /** Total number of entries on the page, for the count and the placeholder. */
  total: number
  /** How many currently match. Equal to `total` when the query is empty. */
  shown: number
  onQueryChange: (query: string) => void
  /** The alphabet rail, on the category page. Rendered inside the sticky bar. */
  children?: React.ReactNode
}

/**
 * The sticky filter bar shared by the lexicon category page and the index.
 *
 * Renders nothing until it has mounted, and that is the whole JavaScript-off
 * story. The designer brief §8 is explicit: "It must also work with JavaScript
 * switched off, which simply means the field is hidden and the full list shows."
 * A field that is present but inert would invite someone to type into it and
 * watch nothing happen — worse than no field. So the control only exists once it
 * can actually do something, and the rows it filters are server-rendered and
 * visible regardless.
 *
 * The count is `aria-live="polite"`: filtering changes what is on screen without
 * moving focus, so a screen-reader user gets no indication anything happened
 * unless the result count announces itself. Polite rather than assertive, or it
 * interrupts on every keystroke.
 *
 * Presentational only — it owns the input value and reports it upward. The
 * category page hides server-rendered rows in place; the index page swaps a grid
 * for a result list. Same control, two behaviours, and neither belongs in here.
 */
export function FilterBar({ labels, total, shown, onQueryChange, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [value, setValue] = useState('')
  const inputId = useId()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  // Pluralised rather than templated: at one term the old form read "1 terms",
  // which is the first thing anyone notices on a small category.
  const count = formatCount({
    shown,
    total,
    templates: {
      one: labels.countOne,
      other: labels.countAll,
      filtered: labels.countFiltered,
    },
    htmlLang: labels.htmlLang,
  })

  return (
    <div className="jr-filterbar">
      <div className="jr-filterbar__row">
        <div className="jr-filterbar__field">
          <label className="jr-sr-only" htmlFor={inputId}>
            {labels.label}
          </label>
          <input
            // `search` rather than `text`: it gives a clear affordance on
            // browsers that render one, and mobile keyboards adjust for it.
            autoComplete="off"
            id={inputId}
            onChange={(event) => {
              setValue(event.target.value)
              onQueryChange(event.target.value)
            }}
            placeholder={labels.placeholder.replace('{count}', String(total))}
            type="search"
            value={value}
          />
        </div>

        <div aria-live="polite" className="jr-filterbar__count">
          {count}
        </div>
      </div>

      {children}
    </div>
  )
}
