import React from 'react'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import { Breadcrumb } from '@/components/Breadcrumb'
import { ComplianceNoteComponent } from '@/blocks/ComplianceNote/Component'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import type { LocalizedDocument } from '@/Header/localizedDocument'
import { JournalArticleCta } from '@/components/JournalArticleCta'
import { JsonLd } from '@/components/JsonLd'
import { RelatedContent } from '@/components/RelatedContent'
import RichText from '@/components/RichText'
import { TermLinks, type TermLink } from '@/components/TermLinks'
import { TERM_SECTIONS, type TermSection, type TermSectionKey } from '@/collections/LexiconTerms/sections'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { formatReviewDate, toAuthorDisplay } from '@/utilities/authorDisplay'
import { getDictionary } from '@/i18n/getDictionary'
import { getServerSideURL } from '@/utilities/getURL'
import { lexiconCategoryPath } from '@/utilities/lexiconPaths'
import { titleScaleClass } from '@/utilities/titleScale'
import type { AppLocale } from '@/i18n/config'
import type { Hub } from '@/utilities/hubQueries'
import type { JournalArticleCtaCopy } from '@/utilities/journalCopy'
import type { PublisherSchema } from '@/utilities/publisherSchema'
import type { RelatedCardData } from '@/utilities/relatedCard'

type Props = {
  term: Record<string, any>
  hub: Hub
  locale: AppLocale
  /** Resolved from the library by key — `microbiome-analysis` or `condition-analysis`. */
  cta: JournalArticleCtaCopy
  ctaFine: string | null
  /**
   * The library records, raw. Passed through rather than pre-resolved so each one
   * keeps its own `weight` — the educational disclaimer renders as `standard`, the
   * health notice as `health`, and neither is forced by the caller.
   */
  disclaimer: unknown
  healthNotice: unknown
  relatedTerms: TermLink[]
  readMore: RelatedCardData[]
  publisher?: PublisherSchema
  /** Locales this document exists in, so the language switcher cannot offer a 404. */
  localizedDocument?: LocalizedDocument | null
}

type MaybeSection = ReturnType<typeof toSection>
type SectionRender = MaybeSection & { body: SerializedEditorState }

function toSection(
  section: TermSection,
  term: Record<string, any>,
  labels: Record<TermSectionKey, string>,
) {
  const group = (term[section.key] ?? {}) as Record<string, unknown>

  return {
    key: section.key,
    id: section.id,
    heading: labels[section.key],
    body: (group.body ?? null) as SerializedEditorState | null,
  }
}

/**
 * A lexicon term — up to 2,400 of these.
 *
 * No dek, no byline, no contents rail. The preview renders
 * `.art-wrap--solo` — a single column — and it is right to: a 270-word section
 * does not need a jump link, and a sticky rail listing three items on an
 * 800-word page is furniture.
 *
 * The definition sentence carries the page. It sits directly under the name,
 * larger than body text, and separated from the sections below, because it is the
 * sentence that gets quoted when the page is cited elsewhere and it has to read as
 * a standalone statement rather than as the opening line of a paragraph.
 *
 * The condition variant is three additions and nothing else: a health notice, a
 * reviewer line, and a different conversion block. All three are derived from one
 * checkbox, so they cannot get out of step with each other.
 */
export function LexiconTermPage({
  term,
  hub,
  locale,
  cta,
  ctaFine,
  disclaimer,
  healthNotice,
  relatedTerms,
  readMore,
  publisher,
  localizedDocument = null,
}: Props) {
  const dict = getDictionary(locale)
  const siteURL = getServerSideURL()
  const path = `/${locale}/${hub.slug}/${term.slug}`

  const category =
    term.category && typeof term.category === 'object'
      ? (term.category as Record<string, unknown>)
      : null
  const categoryTitle =
    typeof category?.title === 'string' && category.title.trim() ? category.title.trim() : null
  const categorySegment =
    (typeof category?.slug === 'string' && category.slug.trim()) ||
    (typeof category?.key === 'string' && category.key.trim()) ||
    null

  const sections: SectionRender[] = TERM_SECTIONS.map((section) =>
    toSection(section, term, dict.lexicon.sections),
  ).filter((section): section is SectionRender => Boolean(section.body))

  const isCondition = term.isCondition === true
  const reviewer = toAuthorDisplay(term.reviewer)
  const reviewedAt = formatReviewDate(term.reviewedAt, locale)

  // Five rungs: Home › Journal › Lexicon › {Category} › {Term}. The category rung
  // is optional in `buildJournalTrail`, so a term filed under nothing renders four
  // and the trail stays truthful rather than inventing a parent.
  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    hub: { name: hub.title, path: `/${locale}/${hub.slug}` },
    category:
      categoryTitle && categorySegment
        ? {
            name: categoryTitle,
            path: lexiconCategoryPath({
              locale,
              hubSlug: hub.slug,
              categorySegment,
            }),
          }
        : null,
    current: { name: term.title ?? '', path },
  })

  const canonical = new URL(path, siteURL).toString()
  const termId = `${canonical}#term`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBreadcrumbSchema({ siteURL, rungs }),
      {
        // The PAGE. `MedicalWebPage` is what §12 asks for on every content type,
        // and it is separate from the `DefinedTerm` below rather than merged into
        // one multi-typed node: the page is not the term, it is a page ABOUT the
        // term, and `mainEntity` is how schema.org says exactly that. Merging
        // them would also put `reviewedBy` and `lastReviewed` — which describe
        // editorial review of the page — onto the term itself, which is a
        // different claim.
        '@type': 'MedicalWebPage',
        '@id': canonical,
        url: canonical,
        name: term.title,
        ...(term.definition ? { description: term.definition } : {}),
        inLanguage: locale,
        mainEntity: { '@id': termId },
        // The two properties Google's health-content guidance actually reads on
        // this type. Emitted only when real — a `lastReviewed` we cannot
        // substantiate is a stronger claim than saying nothing.
        ...(reviewer ? { reviewedBy: { '@type': 'Person', name: reviewer.name } } : {}),
        // The RAW date, sliced to YYYY-MM-DD — not `reviewedAt`, which is
        // `formatReviewDate`'s output and is localized for display ("12. August
        // 2026" in German). `lastReviewed` is typed `Date`; a localized string
        // there is not a date, and the property is silently dropped rather than
        // flagged.
        ...(typeof term.reviewedAt === 'string' && term.reviewedAt
          ? { lastReviewed: term.reviewedAt.slice(0, 10) }
          : {}),
        publisher: {
          '@type': 'Organization',
          name: publisher?.name || 'NB1 Health GmbH',
        },
      },
      {
        // The THING. `DefinedTerm` in a `DefinedTermSet` — the shape the lexicon
        // previews emit, and the one that says "this defines a thing" rather than
        // "this is an article about a thing".
        '@type': 'DefinedTerm',
        '@id': termId,
        url: canonical,
        name: term.title,
        // The definition sentence, verbatim. This is the field most likely to be
        // lifted into a search result or an AI answer, which is why it is one
        // sentence and why it is stored separately from the body.
        description: term.definition ?? '',
        inLanguage: locale,
        ...(term.alsoKnownAs ? { alternateName: term.alsoKnownAs } : {}),
        ...(categoryTitle
          ? {
              inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: categoryTitle,
                ...(categorySegment
                  ? {
                      url: new URL(
                        lexiconCategoryPath({ locale, hubSlug: hub.slug, categorySegment }),
                        siteURL,
                      ).toString(),
                    }
                  : {}),
              },
            }
          : {}),
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

          <header className={titleScaleClass(term.title)}>
            {/* "Lexicon · Bacterial taxa", as the preview renders it — the
                section and the category together, since the category alone would
                not say where the reader is. */}
            <span className="jr-cat">
              {hub.title}
              {categoryTitle ? ` · ${categoryTitle}` : ''}
            </span>

            <h1>{term.italicName ? <em>{term.title}</em> : term.title}</h1>

            {term.alsoKnownAs ? (
              <p className="jr-aka">
                <span>{dict.lexicon.alsoKnownAs}</span> {term.alsoKnownAs}
              </p>
            ) : null}
          </header>

          {/* Single column — no contents rail on a three-section page. */}
          <div className="jr-wrap jr-wrap--solo">
            <div className="jr-prose">
              {term.definition ? <p className="jr-def">{term.definition}</p> : null}

              {sections.map((section) => (
                <section key={section.key}>
                  <h2 id={section.id}>{section.heading}</h2>
                  <RichText
                    data={section.body}
                    enableGutter={false}
                    enableProse={false}
                    locale={locale}
                  />
                </section>
              ))}
            </div>
          </div>

          <div className="jr-foot">
            <TermLinks heading={dict.lexicon.relatedTerms} terms={relatedTerms} />

            <RelatedContent cards={readMore} heading={dict.lexicon.readMore} />

            {Array.isArray(term.references) && term.references.length > 0 ? (
              <section className="jr-refs">
                <h2>{dict.journal.references}</h2>
                <ol>
                  {term.references.map((reference: Record<string, any>, index: number) => (
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

            {/* The standard educational disclaimer — every term, from the library
                by key, so a wording change is one edit across 2,400 pages. */}
            <ComplianceNoteComponent
              disclaimer={disclaimer}
              fallback={dict.disclaimer.text}
              label={dict.journal.complianceLabel}
            />

            {/* Condition terms only: the health notice and the reviewer line. */}
            {isCondition && healthNotice ? (
              <ComplianceNoteComponent
                disclaimer={healthNotice}
                fallback={dict.disclaimer.text}
                label={dict.journal.complianceLabel}
              />
            ) : null}

            {isCondition && reviewer ? (
              <p className="jr-reviewline">
                {dict.lexicon.reviewedFor} {reviewer.name}
                {reviewer.credentials ? `, ${reviewer.credentials}` : ''}
                {reviewer.roleTitle ? `. ${reviewer.roleTitle}` : ''}
                {reviewedAt ? ` — ${dict.journal.lastReviewed} ${reviewedAt}` : ''}
              </p>
            ) : null}
          </div>

          <JournalArticleCta cta={cta} fine={ctaFine} />
        </article>
      </div>
      {!hub.footer.hide && <Footer id={hub.footer.id} locale={locale} />}
    </>
  )
}
