import React from 'react'

import { letterAnchor, type LetterGroup } from '@/utilities/lexiconGrouping'

type Props = {
  groups: LetterGroup[]
  /** Must match what `TermFilter` was given. */
  listId: string
  emptyId: string
  emptyMessage: string
}

/**
 * The term list on a lexicon category page: every row, server-rendered.
 *
 * One scrolling page, no pagination and no lazy-loading, at up to 436 entries —
 * the brief's requirement, and the reason is that this page is a reference index
 * rather than a feed. A reader arriving from a search engine wants to find one
 * word; a reader browsing wants to see the shape of the whole category. Neither
 * is served by "load more", and a paginated reference makes the filter a lie,
 * since it could only ever filter the page you happen to be on.
 *
 * The `data-*` attributes are the contract with `TermFilter`, which hides rows in
 * place rather than re-rendering them. They are not styling hooks — see that
 * file's header for the full contract.
 *
 * Definitions are rendered for every row, not just on hover or expansion. They
 * are what the filter matches against ("a reader searching 'short chain fatty
 * acid' should find Butyrate"), and text that is matched but not visible makes
 * the results look arbitrary.
 */
export function LexiconTermList({ groups, listId, emptyId, emptyMessage }: Props) {
  return (
    <>
      <div className="jr-termlist" id={listId}>
        {groups.map((group) => (
          <section data-letter={group.letter} data-letter-group="" key={group.letter}>
            {/* Sticky, and an h2 because it is a real division of the page —
                the rail links to it and a screen-reader user navigating by
                heading should reach it. */}
            <h2 className="jr-termlist__letter" id={letterAnchor(group.letter)}>
              {group.letter}
              <span className="jr-termlist__letter-count">{group.count}</span>
            </h2>

            {group.subGroups.map((subGroup, index) =>
              subGroup.name ? (
                <div data-sub-group="" key={subGroup.name}>
                  {/* Genus sub-heading. h3 under the letter's h2 — the brief's
                      Rule 1 is three heading levels and real headings, so this
                      is not a styled div. Italic because a genus name is. */}
                  <h3 className="jr-termlist__genus">
                    <em>{subGroup.name}</em>
                    <span className="jr-termlist__letter-count">{subGroup.terms.length}</span>
                  </h3>
                  <Rows terms={subGroup.terms} letter={group.letter} />
                </div>
              ) : (
                <Rows key={index} terms={subGroup.terms} letter={group.letter} />
              ),
            )}
          </section>
        ))}
      </div>

      {/*
        Rendered but hidden, rather than created by the filter when it is needed.
        With JavaScript off it must never appear — and something that only exists
        once JavaScript has run cannot be styled or translated by anything else.
      */}
      <p className="jr-termlist__empty" hidden id={emptyId}>
        {emptyMessage}
      </p>
    </>
  )
}

function Rows({ terms, letter }: { terms: LetterGroup['subGroups'][number]['terms']; letter: string }) {
  return (
    <ul className="jr-termlist__rows">
      {terms.map((term) => (
        <li data-letter={letter} data-term-row="" key={term.id}>
          <a href={term.href}>
            <span className="jr-termlist__name">
              {term.italic ? <em>{term.title}</em> : term.title}
            </span>
            {term.definition ? (
              <span className="jr-termlist__def">{term.definition}</span>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  )
}
