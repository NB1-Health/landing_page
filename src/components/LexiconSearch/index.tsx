'use client'

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { foldForSearch } from '@/utilities/searchText'
import type { TermSearchEntry } from '@/utilities/lexiconQueries'

type Props = {
  labels: {
    label: string
    placeholder: string
    loading: string
    noMatch: string
    /** "{shown} of {total} terms" */
    countFiltered: string
    /** "Showing the first {shown} of {total} matches. Keep typing to narrow." */
    capped: string
  }
  /** `/{locale}/lexicon-search.json`, built on the server so the locale is not guessed. */
  endpoint: string
  /** Id of the server-rendered category grid, hidden while results are showing. */
  gridId: string
  /** Characters required before searching. The brief says two. */
  minChars?: number
}

/** Above this, rendering every match costs more than it tells the reader. */
const MAX_RESULTS = 50

/**
 * The lexicon index's search field.
 *
 * Two behaviours the category page's filter does not have.
 *
 * First, it searches ACROSS categories, so its data is not already on the page —
 * it is fetched from `/{locale}/lexicon-search.json` on first interaction. Not at
 * mount: a reader who came to browse the ten category cards should not download
 * an index of 2,400 terms to do it. The fetch happens once, on the first focus or
 * keystroke, and is reused for the rest of the visit.
 *
 * Second, it REPLACES the category grid rather than filtering rows in place,
 * which is what the brief specifies at two characters or more. The grid is
 * server-rendered and hidden here by id, for the same reason the category page
 * works that way: with JavaScript off this component renders nothing, the field
 * never appears, and the grid — the page's actual content — is simply there.
 *
 * Results are capped at 50. A two-character query against 2,400 terms can match
 * most of them, and a list of 2,000 links is not a search result; it is the
 * corpus in a different order. The cap is stated in the UI rather than applied
 * silently, because a reader who cannot see their term needs to know to keep
 * typing rather than to conclude it is missing.
 */
export function LexiconSearch({ labels, endpoint, gridId, minChars = 2 }: Props) {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<TermSearchEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const requested = useRef(false)
  const inputId = useId()

  useEffect(() => setMounted(true), [])

  const load = useCallback(async () => {
    if (requested.current) return
    requested.current = true
    setLoading(true)

    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(String(response.status))
      setEntries((await response.json()) as TermSearchEntry[])
      setFailed(false)
    } catch {
      // Allow a retry on the next keystroke. A transient failure on the one fetch
      // this component makes would otherwise disable the field for the session.
      requested.current = false
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  const active = query.trim().length >= minChars

  // Hide the grid only while results are actually showing. Done as an effect
  // rather than in the change handler so that clearing the field — or unmounting
  // — always puts the grid back, including on the paths that do not go through a
  // keystroke.
  useEffect(() => {
    const grid = document.getElementById(gridId)
    if (!grid) return
    grid.hidden = active
    return () => {
      grid.hidden = false
    }
  }, [active, gridId])

  // Folded ONCE, when the index arrives — not per keystroke. `foldForSearch` is
  // an NFD normalisation plus a regex, and running it over 2,400 titles and 2,400
  // definitions on every keypress is 4,800 normalisations per character typed.
  // Same reasoning as the category page's filter, which folds at mount.
  const haystacks = useMemo(
    () => (entries ? entries.map((entry) => foldForSearch(`${entry.t} ${entry.d}`)) : []),
    [entries],
  )

  if (!mounted) return null

  const needle = foldForSearch(query)
  const matches =
    active && entries
      ? entries.filter((_entry, index) => haystacks[index]?.includes(needle))
      : []

  const shown = matches.slice(0, MAX_RESULTS)

  return (
    <div className="jr-lexsearch">
      <div className="jr-filterbar__field">
        <label className="jr-sr-only" htmlFor={inputId}>
          {labels.label}
        </label>
        <input
          autoComplete="off"
          id={inputId}
          onChange={(event) => {
            setQuery(event.target.value)
            if (event.target.value.trim().length >= minChars) void load()
          }}
          onFocus={() => void load()}
          placeholder={labels.placeholder}
          type="search"
          value={query}
        />
      </div>

      {active ? (
        <div className="jr-lexsearch__results">
          <p aria-live="polite" className="jr-lexsearch__count">
            {loading && !entries
              ? labels.loading
              : failed
                ? labels.noMatch
                : labels.countFiltered
                    .replace('{shown}', String(matches.length))
                    .replace('{total}', String(entries?.length ?? 0))}
          </p>

          {!loading && entries && matches.length === 0 ? (
            <p className="jr-termlist__empty">{labels.noMatch}</p>
          ) : null}

          <ul className="jr-termlist__rows">
            {shown.map((entry) => (
              <li key={entry.h}>
                <a href={entry.h}>
                  <span className="jr-termlist__name">
                    {entry.i ? <em>{entry.t}</em> : entry.t}
                  </span>
                  {entry.d ? <span className="jr-termlist__def">{entry.d}</span> : null}
                </a>
              </li>
            ))}
          </ul>

          {matches.length > MAX_RESULTS ? (
            <p className="jr-lexsearch__capped">
              {labels.capped
                .replace('{shown}', String(MAX_RESULTS))
                .replace('{total}', String(matches.length))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
