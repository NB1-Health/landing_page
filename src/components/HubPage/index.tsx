import React from 'react'

import '@/styles/journal-tokens.css'
import '@/styles/journal-index.css'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Breadcrumb } from '@/components/Breadcrumb'
import { DISCLAIMER_KEYS, getCachedDisclaimer } from '@/utilities/libraryQueries'
import { Footer } from '@/Footer/Component'
import { JournalCard } from '@/components/JournalCard'
import { LexiconIndexPage } from '@/components/LexiconIndexPage'
import {
  getCachedCategoryCounts,
  getCachedExampleTerms,
  getCachedLexiconCategories,
} from '@/utilities/lexiconQueries'
import { getPillarCardsForHub } from '@/utilities/pillarQueries'
import { getHubDocumentCards } from '@/utilities/hubDocumentQueries'
import { Header } from '@/Header/Component'
import { hubLocalizedDocument } from '@/Header/localizedDocument'
import { JsonLd } from '@/components/JsonLd'
import { getDictionary } from '@/i18n/getDictionary'
import type { AppLocale } from '@/i18n/config'
import { buildIndexPageSchema } from '@/utilities/indexSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import type { Hub } from '@/utilities/hubQueries'
import { getPublisherSchema } from '@/utilities/publisherSchema'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * A content hub — Microbiome, Research or Lexicon.
 *
 * Rendered from inside `[locale]/[slug]` rather than a route of its own: the hub
 * segment is a localized field (`/en/microbiome`, `/de/mikrobiom`), so no static
 * folder can serve it, and Next refuses two differently-named dynamic segments at
 * the same depth — `[locale]/[hub]` alongside the existing `[locale]/[slug]` is a
 * build error, not a precedence question. So the Pages route asks "is this slug a
 * hub?" first and renders this if so.
 *
 * Microbiome lists its pillars and Research lists its study summaries — both as
 * a card grid, because both are collections of articles.
 *
 * Lexicon does NOT, and is handed off to `LexiconIndexPage` before any of the
 * card machinery below runs. It lists categories rather than documents: an A–Z of
 * 2,400 terms is the corpus with a scrollbar, not an index. That difference is
 * structural rather than cosmetic, which is why it is a different component and
 * not a variant flag here.
 */
export async function HubPage({ hub, locale }: { hub: Hub; locale: AppLocale }) {
  // Before the payload lookup below: the lexicon index needs none of it, and
  // `getPillarCardsForHub`-shaped reads over 2,400 terms is exactly the query
  // this branch exists to avoid.
  if (hub.key === 'lexicon') return <LexiconHubIndex hub={hub} locale={locale} />

  const dict = getDictionary(locale)
  const payload = await getPayload({ config: configPromise })
  const publisher = await getPublisherSchema(locale)
  const path = `/${locale}/${hub.slug}`

  // Each hub lists its own collection. Dispatched on the stable `key` rather than
  // querying every collection and keeping whatever came back.
  //
  // A hub with no collection falls through to the empty state, which
  // `buildIndexPageSchema` handles by omitting ItemList entirely — an empty
  // ItemList would assert the hub has no content rather than saying nothing.
  const cards =
    hub.key === 'research'
      ? await getHubDocumentCards({
          payload,
          collection: 'scientific-articles',
          locale,
          hubId: hub.id,
          hubSlug: hub.slug,
          hubTitle: hub.title,
          hubKey: hub.key,
        })
      : hub.key === 'microbiome'
        ? await getPillarCardsForHub({
            payload,
            locale,
            hubId: hub.id,
            hubSlug: hub.slug,
            hubTitle: hub.title,
            hubKey: hub.key,
          })
        : []

  // Home › Journal › {Hub}. The hub is the current page, so it is the final rung:
  // rendered as plain text with aria-current, and carrying `item` in the JSON-LD
  // as a self-reference. One array feeds both, so §5's character-for-character
  // requirement holds by construction rather than by care.
  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path },
  })

  const jsonLd = buildIndexPageSchema({
    siteURL: getServerSideURL(),
    canonicalPath: path,
    locale,
    rungs,
    cards,
    title: hub.title,
    description: hub.intro ?? '',
    publisher,
  })

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
          </div>
        </header>

        <div className="jr-body">
          {cards.length > 0 ? (
            <div className="jr-grid">
              {cards.map((card, index) => (
                <JournalCard
                  card={card}
                  key={card.id}
                  labels={{
                    minRead: dict.journal.minRead,
                    imagePlaceholder: dict.journal.imagePlaceholder,
                    featured: dict.journal.featuredLabel,
                    readArticle: dict.journal.readArticle,
                  }}
                  // Only the first row is above the fold on a desktop viewport.
                  priority={index < 3}
                />
              ))}
            </div>
          ) : (
            <div className="jr-empty">{dict.journal.empty}</div>
          )}
        </div>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}

/**
 * The Lexicon hub's index: categories, counts and example terms.
 *
 * A separate async component rather than a branch inside `HubPage`'s body, so
 * that none of the card queries above are even reachable on this path.
 * `LexiconIndexPage` itself stays presentational, matching the other page
 * components, which is what keeps it testable without a database.
 *
 * `getCachedExampleTerms` is passed the resolved categories rather than fetching
 * them again — its cache key includes their keys, so a new category produces a
 * new key rather than serving the old set from cache.
 */
async function LexiconHubIndex({ hub, locale }: { hub: Hub; locale: AppLocale }) {
  const categories = await getCachedLexiconCategories(locale)()

  const [counts, examples, disclaimer, publisher] = await Promise.all([
    getCachedCategoryCounts(locale)(),
    getCachedExampleTerms(locale, categories)(),
    getCachedDisclaimer(locale, DISCLAIMER_KEYS.educationalBrowse)(),
    getPublisherSchema(locale),
  ])

  return (
    <LexiconIndexPage
      categories={categories}
      counts={counts}
      disclaimer={disclaimer}
      examples={examples}
      hub={hub}
      locale={locale}
      publisher={publisher}
    />
  )
}
