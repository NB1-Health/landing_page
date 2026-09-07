'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

import { FilterBar, type FilterBarLabels } from '@/components/FilterBar'
import { foldForSearch } from '@/utilities/searchText'
import { letterAnchor, type RailEntry } from '@/utilities/lexiconGrouping'

type Props = {
  labels: FilterBarLabels & { railLabel: string }
  rail: RailEntry[]
  /** Row count as rendered on the server. The denominator in the count. */
  total: number
  /** Id of the server-rendered list container this filters. */
  listId: string
  /** Id of the server-rendered empty state, revealed when nothing matches. */
  emptyId: string
}

type IndexedRow = {
  element: HTMLElement
  /** Title + definition, folded once at mount. */
  haystack: string
  letter: string
}

/**
 * The category page's filter.
 *
 * This filters **server-rendered rows in place** rather than owning them. That is
 * the unusual decision in this file and it is deliberate.
 *
 * The alternative — passing 436 rows into a client component and rendering the
 * matches — would mean the rows exist twice in the response and, more to the
 * point, would mean the list does not exist at all until JavaScript runs. The
 * brief requires the opposite: "It must also work with JavaScript switched off,
 * which simply means the field is hidden and the full list shows." A
 * server-rendered list that a client component later hides parts of satisfies
 * that by construction, and it is the only shape that does.
 *
 * So this component reaches into the DOM. The contract with
 * `LexiconTermList` is:
 *
 * - `#{listId}`                      the container
 * - `[data-term-row][data-letter]`   one per term
 * - `[data-letter-group]`            a letter section, hidden when it empties
 * - `[data-sub-group]`               a genus heading, hidden when it empties
 * - `#{emptyId}`                     the empty state
 *
 * Written down because a rename on either side breaks it silently — the page
 * still renders, the filter just stops finding anything.
 *
 * The haystack is folded ONCE at mount, not per keystroke. Folding is NFD
 * normalisation plus a regex over every row; doing that to 436 rows on every
 * keypress is the difference between a filter that feels instant and one that
 * stutters as you type.
 */
export function TermFilter({ labels, rail, total, listId, emptyId }: Props) {
  const rows = useRef<IndexedRow[] | null>(null)
  const [shown, setShown] = useState(total)
  const [activeLetters, setActiveLetters] = useState<Set<string> | null>(null)

  // Index on mount. `textContent` rather than a data attribute: the definition is
  // already in the DOM, and repeating it in an attribute would add ~90KB to the
  // page to save a single pass at mount.
  useEffect(() => {
    const container = document.getElementById(listId)
    if (!container) return

    rows.current = Array.from(
      container.querySelectorAll<HTMLElement>('[data-term-row]'),
    ).map((element) => ({
      element,
      haystack: foldForSearch(element.textContent ?? ''),
      letter: element.dataset.letter ?? '#',
    }))
  }, [listId])

  const apply = useCallback(
    (query: string) => {
      const indexed = rows.current
      if (!indexed) return

      const needle = foldForSearch(query)
      const visibleByLetter = new Map<string, number>()
      let visible = 0

      for (const row of indexed) {
        const matches = !needle || row.haystack.includes(needle)
        // Only touch the attribute when it actually changes. At 436 rows and one
        // call per keystroke, the redundant writes are what cause layout thrash.
        if (row.element.hidden !== !matches) row.element.hidden = !matches
        if (matches) {
          visible++
          visibleByLetter.set(row.letter, (visibleByLetter.get(row.letter) ?? 0) + 1)
        }
      }

      const container = document.getElementById(listId)
      if (container) {
        // A sticky letter heading over nothing is worse than no heading — it
        // stays pinned to the top of the viewport with an empty section beneath.
        for (const group of container.querySelectorAll<HTMLElement>('[data-letter-group]')) {
          const letter = group.dataset.letter ?? '#'
          const empty = (visibleByLetter.get(letter) ?? 0) === 0
          if (group.hidden !== empty) group.hidden = empty
        }

        for (const sub of container.querySelectorAll<HTMLElement>('[data-sub-group]')) {
          const anyVisible = Array.from(
            sub.querySelectorAll<HTMLElement>('[data-term-row]'),
          ).some((row) => !row.hidden)
          if (sub.hidden !== !anyVisible) sub.hidden = !anyVisible
        }
      }

      const empty = document.getElementById(emptyId)
      if (empty) empty.hidden = visible > 0

      setShown(visible)
      // The rail follows the results: a rung that leads to a section the filter
      // has just emptied should stop looking like a destination.
      setActiveLetters(needle ? new Set(visibleByLetter.keys()) : null)
    },
    [emptyId, listId],
  )

  return (
    <FilterBar labels={labels} onQueryChange={apply} shown={shown} total={total}>
      <nav aria-label={labels.railLabel} className="jr-rail">
        <ul>
          {rail.map((entry) => {
            // Two kinds of inert. A letter nothing starts with is inert because
            // the corpus has no such term — eight of twenty-six, and the brief
            // says show them anyway so the rail keeps its shape between
            // categories. A letter the current filter has emptied is inert for
            // now. Both render; neither is a link.
            const reachable = entry.active && (activeLetters === null || activeLetters.has(entry.letter))

            return (
              <li key={entry.letter}>
                {reachable ? (
                  <a href={`#${letterAnchor(entry.letter)}`}>{entry.letter}</a>
                ) : (
                  <span aria-disabled="true">{entry.letter}</span>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </FilterBar>
  )
}
