import React from 'react'

import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import { Breadcrumb } from '@/components/Breadcrumb'
import { ComplianceNoteComponent } from '@/blocks/ComplianceNote/Component'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { JsonLd } from '@/components/JsonLd'
import { LexiconTermList } from '@/components/LexiconTermList'
import { TermFilter } from '@/components/TermFilter'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { getDictionary } from '@/i18n/getDictionary'
import { getServerSideURL } from '@/utilities/getURL'
import { groupTerms, railFor } from '@/utilities/lexiconGrouping'
import { lexiconCategoryPath, lexiconCategoryPathForLocale } from '@/utilities/lexiconPaths'
import { pluralCount } from '@/utilities/searchText'
import { appLocales, localeConfig, type AppLocale } from '@/i18n/config'
import { titleScaleClass } from '@/utilities/titleScale'
import type { Hub } from '@/utilities/hubQueries'
import type { LexiconCategory } from '@/utilities/lexiconQueries'
import type { PublisherSchema } from '@/utilities/publisherSchema'
import type { TermRow } from '@/utilities/lexiconGrouping'

type Props = {
  category: LexiconCategory
  /** Every category, for the switcher. Includes the current one. */
  categories: LexiconCategory[]
  terms: TermRow[]
  hub: Hub
  locale: AppLocale
  /** The `educational-browse` record — a browse page is not an article. */
  disclaimer: unknown
  publisher?: PublisherSchema
}

const LIST_ID = 'lexicon-terms'
const EMPTY_ID = 'lexicon-terms-empty'

/**
 * A lexicon category: the browse page for one group of terms.
 *
 * `/en/lexicon/topics/bacterial-taxa` and `/de/glossar/themen/bakterielle-taxa`.
 * Both the browse segment AND the category slug are localized — the browse segment
 * is translated, so every path here goes through `lexiconCategoryPath` rather
 * than being concatenated.
 *
 * Four rungs, not five: Home › Journal › Lexicon › {Category}. A term below this
 * gets the fifth. The category is a real page precisely so that rung can be a
 * link — that is the argument for `LexiconCategories` being a collection rather
 * than a select field on the term.
 *
 * Counts are wildly uneven by design — 19 terms in the smallest category, 436 in
 * the largest — so everything here has to hold at both ends. The genus
 * sub-grouping only appears where a letter earns it, the filter is the primary
 * control rather than the rail, and the rail keeps all 26 letters whether or not
 * they lead anywhere.
 */
export function LexiconCategoryPage({
  category,
  categories,
  terms,
  hub,
  locale,
  disclaimer,
  publisher,
}: Props) {
  const dict = getDictionary(locale)
  const siteURL = getServerSideURL()
  const path = lexiconCategoryPath({
    locale,
    hubSlug: hub.slug,
    categorySegment: category.segment,
  })

  const htmlLang = localeConfig[locale].htmlLang
  const groups = groupTerms(terms, { htmlLang })
  const rail = railFor(groups)

  // Which locales this category page exists in, for the language switcher.
  //
  // Same rule as the hreflang cluster in the route: a locale is offered only where
  // both the hub and the category have a slug. The browse word and the category
  // slug both come from THAT locale, so a German entry reads
  // `themen/bakterielle-taxa` rather than this page's own words.
  // `?? {}` because `unstable_cache` entries outlive a type change. A category
  // cached before `slugsByLocale` existed deserialises without it, and reading
  // `[locale]` off undefined took the whole page down with a 500 — a stale cache
  // entry should cost the switcher, not the article.
  const categorySlugs = category.slugsByLocale ?? {}
  const switcherPaths: Partial<Record<AppLocale, string>> = {}
  for (const available of appLocales) {
    const hubSlug = hub.slugsByLocale[available]
    const categorySlug = categorySlugs[available]
    // Both parts, or no URL. Offering a locale where only one exists is how the
    // switcher sends a reader to a 404.
    if (!hubSlug || !categorySlug) continue
    switcherPaths[available] = `/${available}/${lexiconCategoryPathForLocale({
      locale: available,
      hubSlug,
      categorySegment: categorySlug,
    })}`
  }

  const termsPhrase = pluralCount({
    count: terms.length,
    forms: { one: dict.lexicon.countOne, other: dict.lexicon.countAll },
    htmlLang,
  })

  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path: `/${locale}/${hub.slug}` },
    current: { name: category.title, path },
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema({ siteURL, rungs }),
      {
        // `DefinedTermSet` and not `CollectionPage`: the terms below each emit
        // `DefinedTerm` with `inDefinedTermSet` pointing back here, and the two
        // halves have to agree or the relationship states nothing.
        '@type': 'DefinedTermSet',
        '@id': new URL(path, siteURL).toString(),
        url: new URL(path, siteURL).toString(),
        name: category.title,
        inLanguage: locale,
        ...(category.intro ? { description: category.intro } : {}),
        // The count, not the 436 terms themselves. Inlining every entry would
        // put the whole category in the head twice over, and a crawler that
        // wants the terms has 436 links to follow.
        ...(terms.length ? { hasPart: { '@type': 'ItemList', numberOfItems: terms.length } } : {}),
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
          localizedDocument={{ route: 'absolute', slugs: switcherPaths }}
        />
      )}
      {/* `id="top"` is the back-to-top target. A real element rather than a bare
          `href="#"`, which some browsers treat as "reload" and which puts a
          meaningless entry in the history. */}
      <div className="jr-page" id="top">
        <JsonLd data={jsonLd} />

        <article className="jr-article jr-browse">
          <Breadcrumb rungs={rungs} />

          <header className={titleScaleClass(category.title)}>
            <span className="jr-cat">{hub.title}</span>
            <h1>{category.title}</h1>
            {category.intro ? <p className="jr-dek">{category.intro}</p> : null}
          </header>

          {/*
            The switcher. Server-rendered links, not a select: it is the only way
            to reach a sibling category from here, so it has to work before
            JavaScript and be crawlable. The current category is present but not
            a link — `aria-current` says which one you are on, and a link to the
            page you are already on is a dead control.
          */}
          {categories.length > 1 ? (
            <nav aria-label={dict.lexicon.browseByCategory} className="jr-switcher">
              <ul>
                {categories.map((entry) => {
                  const isCurrent = entry.key === category.key
                  return (
                    <li key={entry.key}>
                      {isCurrent ? (
                        <span aria-current="page">{entry.title}</span>
                      ) : (
                        <a
                          href={lexiconCategoryPath({
                            locale,
                            hubSlug: hub.slug,
                            categorySegment: entry.segment,
                          })}
                        >
                          {entry.title}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          ) : null}

          {/*
            The filter and the rail. A client component, and it renders nothing
            until it has mounted — with JavaScript off there is no field and the
            full list below is simply visible, which is what §8 asks for.

            It is a SIBLING of the list, not its parent: the rows are
            server-rendered and it hides them in place. See `TermFilter` for why.
          */}
          <TermFilter
            emptyId={EMPTY_ID}
            labels={{
              label: dict.lexicon.filterLabel,
              // The placeholder embeds an inflected noun phrase, not a bare
              // number: "Filter 1 term" and "Filter 436 terms". Pluralised here
              // rather than inside the template string so the dictionary keeps one
              // form per plural category instead of a rule per language.
              placeholder: dict.lexicon.filterPlaceholder.replace('{terms}', termsPhrase),
              countOne: dict.lexicon.countOne,
              countAll: dict.lexicon.countAll,
              countFiltered: dict.lexicon.countFiltered,
              htmlLang,
              railLabel: dict.lexicon.jumpToLetter,
            }}
            listId={LIST_ID}
            rail={rail}
            total={terms.length}
          />

          <LexiconTermList
            emptyId={EMPTY_ID}
            emptyMessage={dict.lexicon.noMatch}
            groups={groups}
            listId={LIST_ID}
          />

          <div className="jr-foot">
            <p className="jr-backtotop">
              <a href="#top">{dict.lexicon.backToTop}</a>
            </p>

            {/*
              `educational-browse`, not `educational`. A browse page makes no
              claim of its own, and the article wording ("this article is for
              information only") would be describing something this page is not.
            */}
            <ComplianceNoteComponent
              disclaimer={disclaimer}
              fallback={dict.disclaimer.text}
              label={dict.journal.complianceLabel}
            />
          </div>
        </article>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}
