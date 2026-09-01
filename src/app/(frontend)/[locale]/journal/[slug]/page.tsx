import type { Metadata } from 'next'

import '@/styles/journal-tokens.css'
import '@/styles/journal-article.css'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { JournalArticleHero } from '@/heros/JournalArticleHero'
import { ArticleToc } from '@/components/ArticleToc'
import { JournalRelated } from '@/components/JournalRelated'
import { JournalArticleCta } from '@/components/JournalArticleCta'
import { getDictionary } from '@/i18n/getDictionary'
import { getJournalCopy } from '@/utilities/journalCopy'
import { toChromeId } from '@/utilities/chromeId'
import { toJournalCard, type JournalCardData } from '@/utilities/journalCard'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { JsonLd } from '@/components/JsonLd'
import { buildPostSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { getPublisherSchema } from '@/utilities/publisherSchema'
import { getServerSideURL } from '@/utilities/getURL'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadingsFromLexical'
import {
  buildHreflangAlternates,
  isHreflangXDefaultMissing,
  readHreflangOverrides,
} from '@/utilities/hreflang'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'
import { resolvePublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'

import { appLocales, getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  return (
    await Promise.all(
      appLocales.map(async (locale) => {
        const posts = await payload.find({
          collection: 'posts',
          draft: false,
          fallbackLocale: false,
          limit: 0,
          locale,
          overrideAccess: false,
          pagination: false,
          select: { slug: true },
        })

        return posts.docs
          .filter((post) => typeof post.slug === 'string' && post.slug)
          .map((post) => ({ locale, slug: post.slug }))
      }),
    )
  ).flat()
}

type Args = {
  params: Promise<{
    locale: string
    slug?: string
  }>
}

export default async function PostPage({ params: paramsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const { slug = '', locale: localeParam } = await paramsPromise

  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const decodedSlug = decodeURIComponent(slug)
  const url = `/${locale}/journal/${decodedSlug}`

  const post = await queryPostBySlug(payload, read, { slug: decodedSlug, locale })

  if (!post) return <PayloadRedirects url={url} />

  const publishedSlugs = await resolvePublishedLocaleSlugs({
    collection: 'posts',
    id: post.id,
    payload,
  })
  if (!read.draft && typeof publishedSlugs[locale] !== 'string') {
    return <PayloadRedirects url={url} />
  }

  const siteURL = getServerSideURL()
  const dict = getDictionary(locale)
  const publisher = await getPublisherSchema(locale)
  // One trail, rendered by <Breadcrumb> and serialised into BreadcrumbList, so
  // the visible text and the JSON-LD `name` values cannot drift — SEO-007 §5
  // calls that mismatch a P1 defect. The article itself is the final rung.
  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
    current: { name: typeof post.title === 'string' ? post.title : '', path: url },
  })

  const jsonLd = buildPostSchema({ post, siteURL, locale, publisher, breadcrumb: rungs })
  const copy = await getJournalCopy(locale)

  // The brief builds the table of contents from H2s. The helper already accepts
  // this; it was passing 'h3', which also pulled subsections into the rail.
  const headings = extractHeadingsFromLexical(post.content, 'h2')

  const related = await resolveRelated(payload, post, locale)

  // Per-article header and footer, same shape as the Pages route. Blank falls
  // through to the site default (the document flagged isDefault).
  const headerId = toChromeId(post.header)
  const footerId = toChromeId(post.footer)

  const populatedAuthors = (post.populatedAuthors || [])
    .filter((author) => Boolean(author.name))
    .map((author) => ({
      name: author.name as string,
      slug: author.slug ?? undefined,
      credentials: author.credentials ?? undefined,
      avatarUrl: author.avatarUrl ?? undefined,
    }))

  // The author box needs the one-line bio, which `populatedAuthors` does not
  // carry (it stores name, slug, credentials and avatar only). The query runs at
  // depth 2, so the full Author document is already here.
  const primaryAuthor = Array.isArray(post.authors) ? post.authors[0] : null
  const authorBio =
    primaryAuthor && typeof primaryAuthor === 'object' ? primaryAuthor.bio?.trim() || null : null

  return (
    <>
      {!post.hideHeader && (
        <Header
          id={headerId}
          locale={locale}
          localizedDocument={{ route: 'post', slugs: publishedSlugs }}
        />
      )}
      <div className="jr-page">
        <PageClient />

        <PayloadRedirects disableNotFound url={url} />

        {read.draft && (
          <LivePreviewListener
            collection="posts"
            documentId={post.id}
            locale={locale}
            updatedAt={post.updatedAt}
          />
        )}

        <JsonLd data={jsonLd} />

        <article className="jr-article">
          <JournalArticleHero
            labels={{
              by: dict.journal.by,
              reviewedBy: dict.journal.reviewedBy,
              minRead: dict.journal.minRead,
            }}
            post={post}
            rungs={rungs}
          />

          <div className="jr-wrap">
            <ArticleToc headings={headings} label={dict.header.onThisPage} />

            <div className="jr-prose">
              {/* The template's `.lead` is the opening paragraph. This project
                  splits that into its own `intro` field, so the whole field is
                  wrapped as lead copy. */}
              {post.intro ? (
                <div className="jr-lead">
                  <RichText
                    data={post.intro}
                    enableGutter={false}
                    enableProse={false}
                    locale={locale}
                  />
                </div>
              ) : null}

              <RichText
                data={post.content}
                enableGutter={false}
                // Tailwind's `prose` classes fight the template's own type
                // scale; `.jr-prose` owns it instead.
                enableProse={false}
                headings={headings}
                locale={locale}
                populatedAuthors={populatedAuthors}
              />
            </div>
          </div>

          <div className="jr-foot">
            {post.references && post.references.length > 0 ? (
              <section className="jr-refs">
                <h2>{dict.journal.references}</h2>
                <ol>
                  {post.references.map((reference, index) => (
                    <li key={reference.id ?? index}>
                      {reference.url ? (
                        <a href={reference.url} rel="noopener noreferrer" target="_blank">
                          {reference.citation}
                        </a>
                      ) : (
                        reference.citation
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {populatedAuthors[0] ? (
              <div className="jr-author">
                <div className="jr-av">
                  {populatedAuthors[0].avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={populatedAuthors[0].avatarUrl} />
                  ) : null}
                </div>
                <div>
                  <div className="jr-nm">{populatedAuthors[0].name}</div>
                  {authorBio ? <div className="jr-ro">{authorBio}</div> : null}
                </div>
              </div>
            ) : null}
          </div>

          <JournalRelated cards={related} heading={dict.journal.keepReading} />

          <JournalArticleCta cta={copy.cta} />
        </article>
      </div>
      {!post.hideFooter && <Footer id={footerId} locale={locale} />}
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', locale: localeParam } = await paramsPromise
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'

  const decodedSlug = decodeURIComponent(slug)
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const post = await queryPostBySlug(payload, read, { slug: decodedSlug, locale })

  if (!post) return {}

  const siteURL = getServerSideURL()
  const publishedSlugs = await resolvePublishedLocaleSlugs({
    collection: 'posts',
    id: post.id,
    payload,
  })
  const pathsByLocale = Object.fromEntries(
    Object.entries(publishedSlugs).map(([availableLocale, availableSlug]) => [
      availableLocale,
      `journal/${availableSlug}`,
    ]),
  )
  const hreflangOverrides = readHreflangOverrides(post.meta?.seoOverrides)
  const currentLocaleExcluded =
    hreflangOverrides?.enabled && hreflangOverrides.excludedLocales?.includes(locale)
  const alternates =
    read.draft || currentLocaleExcluded
      ? undefined
      : buildHreflangAlternates({ pathsByLocale, siteURL, overrides: hreflangOverrides })
  const hreflangSuppressedForMissingXDefault =
    !read.draft &&
    !currentLocaleExcluded &&
    isHreflangXDefaultMissing(pathsByLocale, hreflangOverrides)
  const canonical = new URL(`/${locale}/journal/${encodeURIComponent(post.slug)}`, siteURL).toString()
  const baseMetadata = await generateMeta({ doc: post, locale })

  // Open Graph article fields. Built explicitly rather than spread-and-override:
  // Next types `openGraph` as a discriminated union on `type`, so switching an
  // object built as a website into an article is not assignable.
  const baseOg = baseMetadata.openGraph
  const articleCategory =
    typeof post.primaryCategory === 'object' && post.primaryCategory !== null
      ? (post.primaryCategory.title ?? undefined)
      : undefined
  const articleAuthors = (post.populatedAuthors ?? [])
    .map((author) => author?.name)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)

  // A draft is hidden outright. `noindex` keeps the page live and crawlable for
  // link equity but drops it from the index — it is also excluded from the
  // sitemap in (sitemaps)/posts-sitemap.xml.
  const robots = read.draft
    ? { follow: false, index: false }
    : post.noindex
      ? { follow: true, index: false }
      : undefined

  return {
    ...baseMetadata,
    ...(robots ? { robots } : {}),
    alternates: {
      canonical,
      ...(alternates ?? {}),
    },
    other: hreflangSuppressedForMissingXDefault
      ? { 'nb1-hreflang': 'suppressed-missing-x-default' }
      : undefined,
    openGraph: {
      type: 'article',
      title: baseOg?.title,
      description: baseOg?.description,
      images: baseOg?.images,
      siteName: baseOg?.siteName,
      locale: baseOg?.locale,
      url: canonical,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? undefined,
      ...(articleCategory ? { section: articleCategory } : {}),
      ...(articleAuthors.length > 0 ? { authors: articleAuthors } : {}),
    },
  }
}

async function queryPostBySlug(
  payload: Payload,
  read: AuthenticatedDraft,
  { slug, locale }: { slug: string; locale: AppLocale },
) {
  const reference = await payload.find({
    collection: 'posts',
    draft: read.draft,
    limit: 1,
    overrideAccess: false,
    user: read.user,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    locale,
    fallbackLocale: false,
    depth: 0,
    select: { slug: true },
  })

  const id = reference.docs?.[0]?.id
  if (!id) return null

  return (await payload.findByID({
    collection: 'posts',
    id,
    draft: read.draft,
    disableErrors: true,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: getFallbackLocale(locale),
    depth: 2,
  })) as Post | null
}

/**
 * Cards for the "Keep reading" strip.
 *
 * Uses the editor's manual `relatedArticles` picks, and tops up from the same
 * primary category — newest first, excluding this article and anything already
 * picked — so the strip is never half empty on a new post. Three is what the
 * template's grid is built for.
 */
async function resolveRelated(
  payload: Payload,
  post: Post,
  locale: AppLocale,
): Promise<JournalCardData[]> {
  const TARGET = 3

  const manual = (Array.isArray(post.relatedArticles) ? post.relatedArticles : [])
    .filter((entry): entry is Post => typeof entry === 'object' && entry !== null)
    .map((entry) => toJournalCard(entry, locale))
    .filter((card): card is JournalCardData => card !== null)

  if (manual.length >= TARGET) return manual.slice(0, TARGET)

  const categoryId =
    typeof post.primaryCategory === 'object' && post.primaryCategory !== null
      ? post.primaryCategory.id
      : post.primaryCategory

  if (!categoryId) return manual

  const excluded = [post.id, ...manual.map((card) => card.id)]

  const fill = await payload.find({
    collection: 'posts',
    depth: 1,
    fallbackLocale: false,
    limit: TARGET - manual.length,
    locale,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { primaryCategory: { equals: categoryId } },
        { id: { not_in: excluded } },
      ],
    },
  })

  const filled = fill.docs
    .map((doc) => toJournalCard(doc as Post, locale))
    .filter((card): card is JournalCardData => card !== null)

  return [...manual, ...filled]
}
