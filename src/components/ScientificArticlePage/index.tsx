import React from 'react'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import { ArticleToc } from '@/components/ArticleToc'
import { AuthorBox } from '@/components/AuthorBox'
import { Byline } from '@/components/Byline'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ComplianceNoteComponent } from '@/blocks/ComplianceNote/Component'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import type { LocalizedDocument } from '@/Header/localizedDocument'
import { JournalArticleCta } from '@/components/JournalArticleCta'
import { JsonLd } from '@/components/JsonLd'
import RichText from '@/components/RichText'
import { RelatedContent } from '@/components/RelatedContent'
import {
  ARTICLE_SECTIONS,
  type ArticleSection,
  type ArticleSectionKey,
} from '@/collections/ScientificArticles/sections'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { getDictionary } from '@/i18n/getDictionary'
import { getServerSideURL } from '@/utilities/getURL'
import { hasLexicalBlock } from '@/utilities/lexicalBlocks'
import { titleScaleClass } from '@/utilities/titleScale'
import { firstAuthor, formatReviewDate, toAuthorDisplay } from '@/utilities/authorDisplay'
import type { AppLocale } from '@/i18n/config'
import type { Hub } from '@/utilities/hubQueries'
import type { JournalArticleCtaCopy } from '@/utilities/journalCopy'
import type { PublisherSchema } from '@/utilities/publisherSchema'
import type { RelatedCardData } from '@/utilities/relatedCard'

type Props = {
  article: Record<string, any>
  hub: Hub
  locale: AppLocale
  cta: JournalArticleCtaCopy
  publisher?: PublisherSchema
  /** Locales this document exists in, so the language switcher cannot offer a 404. */
  localizedDocument?: LocalizedDocument | null
  /** Slot 12, generated. Empty renders nothing. */
  relatedReading?: RelatedCardData[]
}

/**
 * One section, as the renderer needs it.
 *
 * DERIVED from `toSection` rather than written out. Restating a mapped shape by
 * hand is how a `filter` predicate ends up wider than the array it filters —
 * three separate times in this file, each on a different field, each looking like
 * a new bug and each being the same one. The intersection narrows `body` and
 * nothing else, so adding a field to the mapper cannot desynchronise the two.
 */
type MaybeSection = ReturnType<typeof toSection>
type SectionRender = MaybeSection & { body: SerializedEditorState }

/** Reads one section group off an untrusted document. */
function toSection(
  section: ArticleSection,
  article: Record<string, any>,
  labels: Record<ArticleSectionKey, string>,
) {
  const group = (article[section.key] ?? {}) as Record<string, unknown>

  return {
    key: section.key,
    // The anchor from the preview, not a slug of the label. A translated heading
    // must never move a deep link.
    id: section.id,
    panel: section.panel,
    heading:
      typeof group.heading === 'string' && group.heading.trim()
        ? group.heading.trim()
        : labels[section.key],
    // Cast at the read boundary, where an untrusted document becomes a checked
    // value. The filter downstream is what makes the narrowing true.
    body: (group.body ?? null) as SerializedEditorState | null,
  }
}

/**
 * A study summary under the Research hub.
 *
 * The same `jr-*` article shell as a pillar, so the two read as one system, with
 * three differences that come from the content rather than the design: the body
 * is seven fixed sections instead of one free-form field, an "In Plain Language"
 * panel sits above them, and the source study is cited.
 *
 * The contents rail is built from the SECTION LIST, not by scanning the rendered
 * body for headings. That is the whole reason the sections are fixed: the rail
 * can state what a reader will find before any of it is written, it is identical
 * across all 408 articles, and it cannot be knocked out of step by an editor's
 * choice of markup.
 */
export function ScientificArticlePage({
  article,
  hub,
  locale,
  cta,
  publisher,
  localizedDocument = null,
  relatedReading = [],
}: Props) {
  const dict = getDictionary(locale)
  const siteURL = getServerSideURL()
  const path = `/${locale}/${hub.slug}/${article.slug}`

  // Populated at depth 1+; a bare id means the relationship was read shallow.
  const categoryLabel =
    article.category && typeof article.category === 'object'
      ? ((article.category as Record<string, unknown>).title as string | undefined)?.trim() || null
      : null

  const author = firstAuthor(article.authors)
  const reviewer = toAuthorDisplay(article.reviewer)
  const reviewedAt = formatReviewDate(article.reviewedAt, locale)

  // Only sections with a body. An article whose Limitations section is empty
  // should not render an empty heading, and should not list one in the rail
  // either — a contents entry that jumps to nothing is worse than a short rail.
  const sections: SectionRender[] = ARTICLE_SECTIONS.map((section) =>
    toSection(section, article, dict.research.sections),
  ).filter((section): section is SectionRender => Boolean(section.body))

  // Supplied, not extracted. `ArticleToc` already accepted a list, so it needed
  // no change — only a different list. All seven sections are listed, "In Plain
  // Language" among them: it is section seven, not a panel outside the body.
  const tocHeadings = sections.map((section) => ({
    id: section.id,
    depth: 2 as const,
    text: section.heading,
  }))

  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path: `/${locale}/${hub.slug}` },
    current: { name: article.title ?? '', path },
  })

  // The compliance note is required, so it is placed rather than remembered.
  // Checked across every section body, because an editor may have put one in any
  // of the seven.
  const hasNote = sections.some((section) => hasLexicalBlock(section.body, 'complianceNote'))

  const doiUrl =
    typeof article.doi === 'string' && article.doi.trim()
      ? `https://doi.org/${article.doi.trim().replace(/^https?:\/\/doi\.org\//i, '')}`
      : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema({ siteURL, rungs }),
      {
        // `ScholarlyArticle` rather than `Article`: this summarises a study, and
        // the type is what lets `citation` below be understood as a source rather
        // than a related link.
        // Multi-typed rather than split into two nodes the way the lexicon term
        // is. There the page is ABOUT a thing; here the page IS the thing —
        // a plain-language summary of a study — so one node carrying both types states
        // it without inventing a `mainEntity` relationship to itself.
        //
        // `MedicalWebPage` is §12's requirement. Deliberately NOT applied to the
        // lexicon index or category pages: those are lists of links, not medical
        // content, and typing a browse listing as medical over-claims.
        '@type': ['MedicalWebPage', 'ScholarlyArticle'],
        '@id': new URL(path, siteURL).toString(),
        url: new URL(path, siteURL).toString(),
        headline: article.title,
        description: article.standfirst ?? '',
        inLanguage: locale,
        // The subject label, as a schema.org `about`. It is a taxonomy term, so
        // `DefinedTerm` rather than a bare string — the same shape the lexicon
        // previews use for their terms.
        ...(categoryLabel
          ? { about: { '@type': 'DefinedTerm', name: categoryLabel } }
          : {}),
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
        // Server-rendered `Person`, per P7. `affiliation` and `jobTitle` are what
        // make this an E-E-A-T signal rather than a name.
        ...(author?.name
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
        ...(reviewer?.name
          ? { reviewedBy: { '@type': 'Person', name: reviewer.name } }
          : {}),
        // The RAW date, not the display-formatted one — `lastReviewed` is typed
        // `Date`, and a localized string there is silently dropped.
        ...(typeof article.reviewedAt === 'string' && article.reviewedAt
          ? { lastReviewed: article.reviewedAt.slice(0, 10) }
          : {}),
        ...(article.sourceTitle || doiUrl
          ? {
              citation: {
                '@type': 'ScholarlyArticle',
                ...(article.sourceTitle ? { name: article.sourceTitle } : {}),
                ...(article.sourceJournal
                  ? { isPartOf: { '@type': 'Periodical', name: article.sourceJournal } }
                  : {}),
                ...(article.studyYear ? { datePublished: String(article.studyYear) } : {}),
                ...(doiUrl ? { sameAs: doiUrl } : {}),
              },
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
        <Header id={hub.header.id} locale={locale} localizedDocument={localizedDocument} />
      )}
      <div className="jr-page">
        <JsonLd data={jsonLd} />

        <article className="jr-article">
          <Breadcrumb rungs={rungs} />

          {/* The type scale follows the title's length — a 122-character study
              title and a 41-character one cannot share a size. See titleScale. */}
          <header className={titleScaleClass(article.title)}>
            {/*
              Slot 2. The article's own subject category, not the hub — "Gut
              Conditions & Disease", not "Research". Falls back to the hub name
              only if a published article somehow has no category, so the slot
              never renders empty.
            */}
            <span className="jr-cat">{categoryLabel ?? hub.title}</span>
            <h1>{article.title}</h1>
            {article.standfirst ? <p className="jr-dek">{article.standfirst}</p> : null}

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

          <div className="jr-wrap">
            <ArticleToc headings={tocHeadings} label={dict.header.onThisPage} />

            <div className="jr-prose">
              {/* Slot 6 — the opening paragraph, no heading above it. */}
              {article.lead ? (
                <div className="jr-lead">
                  <RichText
                    data={article.lead}
                    enableGutter={false}
                    enableProse={false}
                    locale={locale}
                  />
                </div>
              ) : null}

              {sections.map((section) => (
                <section
                  className={section.panel ? 'jr-plain' : undefined}
                  key={section.key}
                >
                  {/* Generated from the section list, not typed by an editor —
                      which is what keeps the rail and the headings identical
                      across all 408 articles. */}
                  <h2 id={section.id}>{section.heading}</h2>
                  <RichText
                    data={section.body}
                    enableGutter={false}
                    enableProse={false}
                    locale={locale}
                  />
                </section>
              ))}

              {!hasNote ? (
                <ComplianceNoteComponent
                  label={dict.journal.complianceLabel}
                  fallback={dict.disclaimer.text}
                />
              ) : null}
            </div>
          </div>

          <div className="jr-foot">
            {article.sourceTitle || doiUrl ? (
              <section className="jr-source">
                <h2>{dict.research.source}</h2>
                <p>
                  {article.sourceTitle}
                  {article.sourceJournal ? <em> — {article.sourceJournal}</em> : null}
                  {article.studyYear ? ` (${article.studyYear})` : null}
                </p>
                {doiUrl ? (
                  <a href={doiUrl} rel="noopener noreferrer" target="_blank">
                    {dict.research.doi} ↗
                  </a>
                ) : null}
              </section>
            ) : null}

            {Array.isArray(article.references) && article.references.length > 0 ? (
              <section className="jr-refs">
                <h2>{dict.journal.references}</h2>
                <ol>
                  {article.references.map((reference: Record<string, any>, index: number) => (
                    // `id="ref-N"` so a citation in the body can link to its own
                    // entry. This type has the anchors and the pillar does not —
                    // a study summary cites inline, a pillar lists at the foot.
                    <li id={`ref-${index + 1}`} key={reference.id ?? index}>
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

          {/* Slot 12 — generated, no editor field. §11: a new slot is a new
              field, and a new field is content that has to exist across 408
              documents. */}
          <RelatedContent cards={relatedReading} heading={dict.journal.relatedReading} />

          <JournalArticleCta cta={cta} />
        </article>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}
