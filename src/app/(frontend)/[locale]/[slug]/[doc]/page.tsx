import type { Metadata } from 'next/types'

import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

import { ArticleToc } from '@/components/ArticleToc'
import { AuthorBox } from '@/components/AuthorBox'
import { Byline } from '@/components/Byline'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { JsonLd } from '@/components/JsonLd'
import { JournalArticleCta } from '@/components/JournalArticleCta'
import RichText from '@/components/RichText'
import { ComplianceNoteComponent } from '@/blocks/ComplianceNote/Component'
import { RelatedContent } from '@/components/RelatedContent'
import { toRelatedCard } from '@/utilities/relatedCard'
import { hasLexicalBlock } from '@/utilities/lexicalBlocks'
import { titleScaleClass } from '@/utilities/titleScale'
import { firstAuthor, formatReviewDate, toAuthorDisplay } from '@/utilities/authorDisplay'
import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildHreflangAlternates } from '@/utilities/hreflang'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadingsFromLexical'
import { getCachedHubBySlug, getCachedHubByKey, type Hub } from '@/utilities/hubQueries'
import { ScientificArticlePage } from '@/components/ScientificArticlePage'
import { LexiconTermPage } from '@/components/LexiconTermPage'
import {
  CONVERSION_KEYS,
  DISCLAIMER_KEYS,
  getCachedConversionBlock,
  getCachedDisclaimer,
} from '@/utilities/libraryQueries'
import { localizeHref, resolveConversionBlock } from '@/utilities/contentLibrary'
import {
  getHubDocumentBySlug,
  getHubDocumentSlugsByLocale,
  type HubCollection,
} from '@/utilities/hubDocumentQueries'
import type { LocalizedDocument } from '@/Header/localizedDocument'
import { getJournalCopy } from '@/utilities/journalCopy'
import {
  getPillarBySlug,
  getRelatedPillars,
  getRelatedReading,
  getRelatedResearch,
  getRelatedTerms,
} from '@/utilities/pillarQueries'
import { getPublisherSchema } from '@/utilities/publisherSchema'
import { getServerSideURL } from '@/utilities/getURL'

import PageClient from './page.client'

// Inherits the Pages route's rendering model: the parent segment is a hub whose
// slug is looked up per request (cached and tagged), and Pages themselves are
// request-rendered for currency-sensitive copy.
export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ locale: string; slug: string; doc: string }> }

/**
 * A document inside a hub — a Microbiome pillar or a Research study summary.
 *
 * One route, three collections, dispatched on `hub.key`. Not three routes: Next
 * allows one dynamic parameter name per depth, so `[locale]/[hub]/[doc]` beside
 * this is a build error rather than a precedence question.
 *
 * Lives under `[locale]/[slug]/[doc]` because the hub segment is itself the
 * Pages route: `[slug]` resolves to a hub, `[doc]` to the document inside it.
 * Both segments are localized fields, so `/de/mikrobiom/darmbakterien` and
 * `/en/microbiome/gut-bacteria` are the same document reached by two composed
 * lookups rather than two routes.
 *
 * The layout is the approved Journal article design (`jr-*`), which is what the
 * original brief locked and what the newer designer brief has not yet replaced.
 * Pillar-specific body components — the evidence table, the step flow, the
 * callout, the pull quote — are not here yet; they are lexical blocks and can be
 * added without touching this file or the database.
 */

/**
 * Which locales a hub document exists in, as ready-made paths for the language
 * switcher.
 *
 * The one place in this tree where the switcher costs a query: a term's URL is
 * `locale + hub.slug + term.slug` and both parts are localized, so the document's
 * per-locale slugs have to be read. `generateMetadata` already does this for the
 * hreflang cluster, but that is a separate function with its own request — the
 * alternative was deriving it a second way in the render, which is how two
 * mechanisms that should agree stop agreeing.
 *
 * Same filter as hreflang: a locale is offered only where BOTH the hub and the
 * document have a slug. Offering one without both sends a reader to a 404, which
 * is exactly what the switcher does today on every Journal page.
 */
async function switcherPathsFor(
  payload: Payload,
  collection: HubCollection,
  hub: Hub,
  documentId: number | string,
): Promise<LocalizedDocument> {
  const documentSlugs = await getHubDocumentSlugsByLocale(payload, collection, documentId)
  const slugs: Record<string, string> = {}

  for (const available of appLocales) {
    const hubSlug = hub.slugsByLocale[available]
    const docSlug = documentSlugs[available]
    if (hubSlug && docSlug) slugs[available] = `/${available}/${hubSlug}/${docSlug}`
  }

  return { route: 'absolute', slugs }
}

export default async function Page({ params }: Args) {
  const { locale: localeParam, slug: hubSlug, doc: docSlug } = await params
  if (!isAppLocale(localeParam)) notFound()
  const locale: AppLocale = localeParam

  const payload = await getPayload({ config: configPromise })

  // The parent segment must be a real hub in THIS locale. If it is an ordinary
  // page slug, there is no such thing as a document beneath it.
  const hub = await getCachedHubBySlug(locale, decodeURIComponent(hubSlug))()
  if (!hub) notFound()

  // Which collection lives under this hub. Dispatching on the stable `key`
  // rather than trying each collection in turn: one lookup instead of two, and
  // the answer is explicit rather than "whichever query happened to match".
  //
  // Same pattern the Pages route uses to render a hub — resolve, then dispatch —
  // because Next allows only one dynamic parameter name per depth, so
  // `[locale]/[hub]/[article]` alongside this route is a build error rather than
  // a precedence question.
  if (hub.key === 'research') {
    const article = await getHubDocumentBySlug({
      payload,
      collection: 'scientific-articles',
      locale,
      hubId: hub.id,
      slug: decodeURIComponent(docSlug),
    })
    if (!article) notFound()

    const articleRecord = article as unknown as Record<string, any>
    const category = articleRecord.category
    const categoryId =
      category && typeof category === 'object' ? (category.id as number | string) : category

    const [researchCopy, researchPublisher, relatedReading] = await Promise.all([
      getJournalCopy(locale),
      getPublisherSchema(locale),
      getRelatedReading({
        payload,
        locale,
        hub: { id: hub.id, slug: hub.slug, title: hub.title },
        currentId: articleRecord.id,
        categoryId: categoryId ?? null,
      }),
    ])

    return (
      <ScientificArticlePage
        article={articleRecord}
        cta={researchCopy.cta}
        hub={hub}
        locale={locale}
        localizedDocument={await switcherPathsFor(
          payload,
          'scientific-articles',
          hub,
          articleRecord.id,
        )}
        publisher={researchPublisher}
        relatedReading={relatedReading}
      />
    )
  }

  if (hub.key === 'lexicon') {
    const term = await getHubDocumentBySlug({
      payload,
      collection: 'lexicon-terms',
      locale,
      hubId: hub.id,
      slug: decodeURIComponent(docSlug),
    })
    if (!term) notFound()

    const termRecord = term as unknown as Record<string, any>
    const termCategory = termRecord.category
    const termCategoryId =
      termCategory && typeof termCategory === 'object'
        ? (termCategory.id as number | string)
        : termCategory
    const isCondition = termRecord.isCondition === true

    // "Read more" sends the reader out of the reference and into the long-form
    // content, so its cards are scientific articles and their URLs belong to the
    // RESEARCH hub — not this one. Passing the lexicon hub here was silently
    // wrong: `getRelatedReading` filters on the hub id it is given, so the strip
    // matched nothing and rendered empty on every term. Null in a locale where
    // Research has no slug, in which case the strip renders nothing rather than
    // linking into a 404 — the same rule the pillar branch below follows.
    const researchHubForTerm = await getCachedHubByKey(locale, 'research')()

    // Both derived from `isCondition` rather than stored: the previews differ
    // only in which library key they mount, so a field here would hold a value
    // already implied by the checkbox — on up to 2,400 documents.
    const [
      lexiconPublisher,
      educational,
      healthNotice,
      conversion,
      relatedTerms,
      readMoreCards,
    ] = await Promise.all([
      getPublisherSchema(locale),
      getCachedDisclaimer(locale, DISCLAIMER_KEYS.educational)(),
      isCondition
        ? getCachedDisclaimer(locale, DISCLAIMER_KEYS.healthCondition)()
        : Promise.resolve(null),
      getCachedConversionBlock(
        locale,
        isCondition ? CONVERSION_KEYS.conditionAnalysis : CONVERSION_KEYS.microbiomeAnalysis,
      )(),
      getRelatedTerms({
        payload,
        locale,
        hub: { id: hub.id, slug: hub.slug, title: hub.title },
        currentId: termRecord.id,
        categoryId: termCategoryId ?? null,
        manualIds: termRecord.relatedTerms,
      }),
      // No `categoryId`: a lexicon category id and an article category id come
      // from different tables, so comparing them is a match that can never fire.
      // The ordering falls back to recency, which is what slot 12 asks for.
      researchHubForTerm
        ? getRelatedReading({
            payload,
            locale,
            hub: {
              id: researchHubForTerm.id,
              slug: researchHubForTerm.slug,
              title: researchHubForTerm.title,
            },
            // Empty, not the term's id. `getRelatedReading` excludes the current
            // document by comparing ids, and ids are per-table — term 7 and
            // article 7 both exist, so passing the term's id would drop an
            // unrelated article from the strip.
            currentId: '',
            limit: 2,
          })
        : Promise.resolve([]),
    ])

    const lexiconDict = getDictionary(locale)
    const resolvedCta = resolveConversionBlock({
      reference: conversion,
      inlineBody: null,
      inlineHref: null,
    })

    return (
      <LexiconTermPage
        cta={{
          heading: resolvedCta.heading ?? lexiconDict.cta.heading,
          body: resolvedCta.body ?? lexiconDict.journal.ctaBody,
          label: resolvedCta.buttonLabel ?? lexiconDict.cta.buttonText,
          href: localizeHref(resolvedCta.href, locale, '/order'),
        }}
        ctaFine={resolvedCta.fine}
        disclaimer={educational}
        healthNotice={healthNotice}
        hub={hub}
        locale={locale}
        localizedDocument={await switcherPathsFor(payload, 'lexicon-terms', hub, termRecord.id)}
        publisher={lexiconPublisher}
        readMore={readMoreCards}
        relatedTerms={relatedTerms}
        term={termRecord}
      />
    )
  }

  const pillar = await getPillarBySlug({
    payload,
    locale,
    hubId: hub.id,
    slug: decodeURIComponent(docSlug),
  })
  if (!pillar) notFound()

  const dict = getDictionary(locale)
  const [copy, publisher] = await Promise.all([
    getJournalCopy(locale),
    getPublisherSchema(locale),
  ])

  const record = pillar as unknown as Record<string, any>
  const path = `/${locale}/${hub.slug}/${record.slug}`

  // The Research hub, for the "Related research" strip's URLs. Cached and tagged
  // like every other hub lookup, and null in a locale where Research has no slug —
  // in which case the strip renders nothing rather than linking into a 404.
  const researchHub = await getCachedHubByKey(locale, 'research')()

  const [related, relatedResearch] = await Promise.all([
    getRelatedPillars({
      payload,
      locale,
      hubId: hub.id,
      hubSlug: hub.slug,
      hubTitle: hub.title,
      hubKey: hub.key,
      currentId: record.id,
      manualIds: record.relatedPillars,
    }),
    getRelatedResearch({
      payload,
      locale,
      researchHub: researchHub
        ? { id: researchHub.id, slug: researchHub.slug, title: researchHub.title }
        : null,
      manualIds: record.relatedResearch,
    }),
  ])

  // The compliance note is required on every pillar, so it is placed rather than
  // remembered. An editor who put one somewhere specific keeps it where they put
  // it — a second copy of the same legal framing is redundant at best.
  const needsComplianceNote = !hasLexicalBlock(record.content, 'complianceNote')

  // Home › Journal › Microbiome › {title}. Four rungs — the depth §5 specifies
  // for a hub document — and the same array feeds the BreadcrumbList below.
  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path: `/${locale}/${hub.slug}` },
    current: { name: record.title ?? '', path },
  })

  // The contents list is built from H2s, per the designer brief's Rule 1: three
  // heading levels, section titles are real headings. `extractHeadingsFromLexical`
  // and the rich-text converter share a slugify, so the ids match the anchors.
  const headings = extractHeadingsFromLexical(record.content, 'h2')

  const siteURL = getServerSideURL()
  const author = firstAuthor(record.authors)
  const reviewer = toAuthorDisplay(record.reviewer)
  const reviewedAt = formatReviewDate(record.reviewedAt, locale)
  const cover = record.heroImage && typeof record.heroImage === 'object' ? record.heroImage : null

  // Locales this pillar exists in, for the language switcher. Same query and
  // same filter as the article and term branches above.
  const pillarSwitcherPaths = await switcherPathsFor(payload, 'pillars', hub, record.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema({ siteURL, rungs }),
      {
        // Multi-typed rather than split into two nodes the way the lexicon term
        // is. There the page is ABOUT a thing; here the page IS the thing —
        // a pillar explainer about gut health — so one node carrying both types states
        // it without inventing a `mainEntity` relationship to itself.
        //
        // `MedicalWebPage` is §12's requirement. Deliberately NOT applied to the
        // lexicon index or category pages: those are lists of links, not medical
        // content, and typing a browse listing as medical over-claims.
        '@type': ['MedicalWebPage', 'Article'],
        '@id': new URL(path, siteURL).toString(),
        url: new URL(path, siteURL).toString(),
        headline: record.title,
        description: record.standfirst ?? '',
        inLanguage: locale,
        ...(cover?.url ? { image: new URL(cover.url, siteURL).toString() } : {}),
        ...(record.publishedAt ? { datePublished: record.publishedAt } : {}),
        ...(record.updatedAt ? { dateModified: record.updatedAt } : {}),
        // Same Person shape as the scientific article. `jobTitle`, credentials
        // and affiliation are what make this an E-E-A-T signal rather than a
        // name, and the author record already carries them.
        ...(author
          ? {
              author: {
                '@type': 'Person',
                name: author.name,
                ...(author.roleTitle ? { jobTitle: author.roleTitle } : {}),
                ...(author.credentials ? { honorificSuffix: author.credentials } : {}),
                ...(author.affiliation
                  ? { affiliation: { '@type': 'Organization', name: author.affiliation } }
                  : {}),
                // `Person.url` is the canonical page for the human. The
                // author's own page on this site if there is one, otherwise the
                // first external profile they gave us — never a bare list, since
                // `url` takes one value.
                ...(author.profileLinks[0] ? { url: author.profileLinks[0].url } : {}),
                ...(author.profileLinks.length > 1
                  ? { sameAs: author.profileLinks.slice(1).map((link) => link.url) }
                  : {}),
              },
            }
          : {}),
        ...(reviewer ? { reviewedBy: { '@type': 'Person', name: reviewer.name } } : {}),
        // The RAW date, not the display-formatted one — `lastReviewed` is typed
        // `Date`, and a localized string there is silently dropped.
        ...(typeof record.reviewedAt === 'string' && record.reviewedAt
          ? { lastReviewed: record.reviewedAt.slice(0, 10) }
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
          localizedDocument={pillarSwitcherPaths}
        />
      )}
      <div className="jr-page">
        <PageClient />
        <JsonLd data={jsonLd} />

        <article className="jr-article">
          <Breadcrumb rungs={rungs} />

          <header className={titleScaleClass(record.title)}>
            {/* Slot 2 in the designer brief: the category label is the hub. */}
            <span className="jr-cat">{hub.title}</span>
            <h1>{record.title}</h1>
            {record.standfirst ? <p className="jr-dek">{record.standfirst}</p> : null}

            <Byline
              author={author}
              labels={{
                by: dict.journal.by,
                reviewedBy: dict.journal.reviewedBy,
                lastReviewed: dict.journal.lastReviewed,
              }}
              reviewedAt={reviewedAt}
              reviewer={reviewer}
            />
          </header>

          {cover?.url ? (
            <figure className="jr-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={cover.alt ?? ''} src={cover.url} />
              {/* Slot 6's caption. Renders only when written — an empty
                  figcaption still occupies its margin under the image. */}
              {record.heroCaption ? <figcaption>{record.heroCaption}</figcaption> : null}
            </figure>
          ) : null}

          <div className="jr-wrap">
            <ArticleToc headings={headings} label={dict.header.onThisPage} />

            <div className="jr-prose">
              <RichText
                data={record.content}
                enableGutter={false}
                // Tailwind's `prose` classes fight the template's own type
                // scale; `.jr-prose` owns it.
                enableProse={false}
                headings={headings}
                locale={locale}
              />

              {/* The one place an accordion is allowed: Rule 3 forbids hiding
                  body content behind a click and names the FAQ as the exception.
                  <details> works with JavaScript disabled, and the answers are in
                  the HTML either way — the Journal's old FAQ block rendered
                  `{isOpen && answer}` and lost every answer but the first. */}
              {Array.isArray(record.faq) && record.faq.length > 0 ? (
                <section className="jr-faq">
                  <h2>{dict.faq.heading}</h2>
                  {record.faq.map((item: Record<string, any>, index: number) => (
                    <details key={item.id ?? index}>
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </section>
              ) : null}

              {needsComplianceNote ? (
                <ComplianceNoteComponent
                  label={dict.journal.complianceLabel}
                  fallback={dict.disclaimer.text}
                />
              ) : null}
            </div>
          </div>

          <div className="jr-foot">
            {Array.isArray(record.references) && record.references.length > 0 ? (
              <section className="jr-refs">
                <h2>{dict.journal.references}</h2>
                <ol>
                  {record.references.map((reference: Record<string, any>, index: number) => (
                    <li key={reference.id ?? index}>
                      {reference.url ? (
                        <a href={reference.url} rel="noopener noreferrer" target="_blank">
                          {reference.text}
                        </a>
                      ) : (
                        reference.text
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <AuthorBox
              author={author}
              labels={{ heading: dict.journal.aboutAuthor, profile: dict.journal.profile }}
              locale={locale}
            />
          </div>

          <RelatedContent
            cards={related.map((card) => toRelatedCard(card))}
            heading={dict.journal.relatedTopics}
          />

          {/* Slot 11. Same card component; the journal + year line is what makes
              it read as research rather than as another topic. */}
          <RelatedContent cards={relatedResearch} heading={dict.journal.relatedResearch} />

          <JournalArticleCta cta={copy.cta} />
        </article>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: localeParam, slug: hubSlug, doc: docSlug } = await params
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'

  const payload = await getPayload({ config: configPromise })
  const hub = await getCachedHubBySlug(locale, decodeURIComponent(hubSlug))()
  if (!hub) return {}

  // Metadata dispatches on the same key as the render, so a Research URL cannot
  // end up with a pillar's canonical.
  //
  // This comment was true and the code was not. `Page()` grew a third branch when
  // the lexicon arrived; this stayed a two-way and sent every term lookup to
  // `pillars`, found nothing, and returned `{}` — so up to 854 term pages shipped
  // with NO title, description, canonical, hreflang or OpenGraph, only the root
  // layout's defaults. Nothing rendered wrong, which is why it survived.
  //
  // Keep this list and the one in `Page()` in step. There is no type that forces
  // it: `hub.key` is a string from the CMS, so a fourth hub would compile fine and
  // silently land here as a pillar.
  const collection: HubCollection =
    hub.key === 'research'
      ? 'scientific-articles'
      : hub.key === 'lexicon'
        ? 'lexicon-terms'
        : 'pillars'

  const doc = await getHubDocumentBySlug({
    payload,
    collection,
    locale,
    hubId: hub.id,
    slug: decodeURIComponent(docSlug),
  })
  if (!doc) return {}

  const record = doc as unknown as Record<string, any>
  const siteURL = getServerSideURL()
  const canonical = new URL(`/${locale}/${hub.slug}/${record.slug}`, siteURL).toString()

  // A lexicon term has no standfirst. Its one-sentence definition is the field
  // written to be quoted elsewhere, so it is the description.
  const description: string =
    (hub.key === 'lexicon' ? record.definition : record.standfirst) ?? ''

  // Built from the locales where BOTH the hub and the document have a slug. A
  // document translated into a locale whose hub is not would have no URL there, so
  // declaring an alternate for it would point at a 404 — which §6 warns can
  // invalidate the whole cluster rather than just that one entry.
  const documentSlugs = await getHubDocumentSlugsByLocale(payload, collection, record.id)
  const pathsByLocale = Object.fromEntries(
    appLocales
      .filter((available) => hub.slugsByLocale[available] && documentSlugs[available])
      .map((available) => [
        available,
        `${hub.slugsByLocale[available]}/${documentSlugs[available]}`,
      ]),
  )

  return {
    title: `${record.title} | NB1`,
    description,
    ...(record.noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical,
      ...buildHreflangAlternates({ siteURL, pathsByLocale }),
    },
    openGraph: {
      type: 'article',
      title: record.title,
      description,
      url: canonical,
      ...(record.publishedAt ? { publishedTime: record.publishedAt } : {}),
      ...(record.updatedAt ? { modifiedTime: record.updatedAt } : {}),
    },
  }
}
