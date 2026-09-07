import React from 'react'

import '@/styles/journal-tokens.css'
import '@/styles/journal-index.css'
import '@/styles/journal-article.css'

import { Breadcrumb } from '@/components/Breadcrumb'
import { ComplianceNoteComponent } from '@/blocks/ComplianceNote/Component'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { hubLocalizedDocument } from '@/Header/localizedDocument'
import { JsonLd } from '@/components/JsonLd'
import { LexiconSearch } from '@/components/LexiconSearch'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { pluralCount } from '@/utilities/searchText'
import { lexiconCategoryPath } from '@/utilities/lexiconPaths'
import { getDictionary } from '@/i18n/getDictionary'
import { getServerSideURL } from '@/utilities/getURL'
import { localeConfig, type AppLocale } from '@/i18n/config'
import type { Hub } from '@/utilities/hubQueries'
import type { LexiconCategory } from '@/utilities/lexiconQueries'
import type { PublisherSchema } from '@/utilities/publisherSchema'

type Props = {
  hub: Hub
  locale: AppLocale
  categories: LexiconCategory[]
  /** Term count per category key. */
  counts: Record<string, number>
  /** Three example term names per category key. */
  examples: Record<string, string[]>
  /** The `educational-browse` record. */
  disclaimer: unknown
  publisher?: PublisherSchema
}

const GRID_ID = 'lexicon-category-grid'

/**
 * The lexicon index — the Lexicon hub's own page.
 *
 * It lists CATEGORIES, not terms. That is the one structural decision here and
 * it follows from arithmetic: an A–Z of 2,400 entries is not an index, it is the
 * corpus with a scrollbar, and the reader who wants a specific term has a search
 * field for that. Ten to thirteen cards is a page someone can actually read.
 *
 * The counts are wildly uneven by design — 19 in the smallest category, 436 in
 * the largest — and they are shown rather than hidden. A card that says 19 and a
 * card that says 436 tell a reader something true about where the depth is; a
 * grid of identical-looking cards does not.
 *
 * Search replaces the grid at two characters. It is a client component that
 * renders nothing until mounted, so with JavaScript off there is no field and the
 * grid — which is the page's real content — is simply there. That is the same
 * arrangement as the category page's filter, for the same reason.
 */
export function LexiconIndexPage({
  hub,
  locale,
  categories,
  counts,
  examples,
  disclaimer,
  publisher,
}: Props) {
  const dict = getDictionary(locale)
  const siteURL = getServerSideURL()
  const path = `/${locale}/${hub.slug}`

  const htmlLang = localeConfig[locale].htmlLang
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)

  /** "1 term" / "436 terms", inflected. Reused by the hero and the placeholder. */
  const termsPhrase = (count: number) =>
    pluralCount({
      count,
      forms: { one: dict.lexicon.countOne, other: dict.lexicon.countAll },
      htmlLang,
    })

  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema({ siteURL, rungs }),
      {
        // A `CollectionPage` whose parts are the category sets. The categories
        // each emit `DefinedTermSet` on their own page and the terms below them
        // emit `DefinedTerm`, so the three levels agree rather than each
        // asserting itself in isolation.
        '@type': 'CollectionPage',
        '@id': new URL(path, siteURL).toString(),
        url: new URL(path, siteURL).toString(),
        name: hub.title,
        inLanguage: locale,
        ...(hub.intro ? { description: hub.intro } : {}),
        ...(categories.length
          ? {
              hasPart: categories.map((category) => ({
                '@type': 'DefinedTermSet',
                name: category.title,
                url: new URL(
                  lexiconCategoryPath({
                    locale,
                    hubSlug: hub.slug,
                    categorySegment: category.segment,
                  }),
                  siteURL,
                ).toString(),
              })),
            }
          : {}),
        publisher: {
          '@type': 'Organization',
          name: publisher?.name || 'NB1 Health GmbH',
        },
      },
    ],
  }

  return (
    <>
      {!hub.header.hide && (
        <Header
          id={hub.header.id}
          locale={locale}
          // Which locales this hub actually exists in. Without it the
          // language switcher offers all eight and sends a reader to a 404.
          localizedDocument={hubLocalizedDocument(hub.slugsByLocale)}
        />
      )}
      <div className="jr-page">
        <JsonLd data={jsonLd} />

        <header className="jr-hero">
          <div className="jr-hero__inner">
            <Breadcrumb rungs={rungs} />
            <h1>{hub.title}</h1>
            {hub.intro ? <p>{hub.intro}</p> : null}

            {/* The total, server-rendered, so it is present with JavaScript off
                and is not a number the search field has to arrive before saying. */}
            <p className="jr-lexindex__total">{termsPhrase(total)}</p>
          </div>
        </header>

        <div className="jr-body">
          <LexiconSearch
            endpoint={`/${locale}/lexicon-search.json`}
            gridId={GRID_ID}
            labels={{
              label: dict.lexicon.searchLabel,
              placeholder: dict.lexicon.searchPlaceholder.replace('{terms}', termsPhrase(total)),
              loading: dict.lexicon.searching,
              noMatch: dict.lexicon.noMatch,
              countFiltered: dict.lexicon.countFiltered,
              capped: dict.lexicon.resultsCapped,
            }}
          />

          {/*
            The grid. Server-rendered and hidden by `LexiconSearch` while results
            are showing — never unmounted, so clearing the field restores it
            without a re-render or a second query.
          */}
          <div className="jr-lexindex" id={GRID_ID}>
            {categories.length > 0 ? (
              <ul className="jr-lexindex__grid">
                {categories.map((category) => {
                  const count = counts[category.key] ?? 0
                  const example = examples[category.key] ?? []

                  return (
                    <li key={category.key}>
                      <a
                        href={lexiconCategoryPath({
                          locale,
                          hubSlug: hub.slug,
                          categorySegment: category.segment,
                        })}
                      >
                        <span className="jr-lexindex__name">{category.title}</span>

                        {/* The count. Tabular figures so a column of cards lines
                            up, and shown even at zero — a category with nothing
                            in it yet is information, not an error. */}
                        <span className="jr-lexindex__count">{termsPhrase(count)}</span>

                        {category.intro ? (
                          <span className="jr-lexindex__intro">{category.intro}</span>
                        ) : null}

                        {/* Three example names, so the card says what is inside
                            rather than only how much. Editor-set where they
                            bothered, newest three otherwise. */}
                        {example.length > 0 ? (
                          <span className="jr-lexindex__examples">{example.join(' · ')}</span>
                        ) : null}
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="jr-empty">{dict.journal.empty}</div>
            )}
          </div>

          <div className="jr-foot">
            <ComplianceNoteComponent
              disclaimer={disclaimer}
              fallback={dict.disclaimer.text}
              label={dict.journal.complianceLabel}
            />
          </div>
        </div>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}
