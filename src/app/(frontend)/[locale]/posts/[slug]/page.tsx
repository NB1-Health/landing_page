import type { Metadata } from 'next'
import '@/styles/banner-template.css'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { JsonLd } from '@/components/JsonLd'
import { buildPostSchema } from '@/utilities/buildSchema'
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
  const url = `/${locale}/posts/${decodedSlug}`

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
  const jsonLd = buildPostSchema({ post, siteURL, locale })
  const headings = extractHeadingsFromLexical(post.content, 'h3')
  const populatedAuthors = (post.populatedAuthors || [])
    .filter((author) => Boolean(author.name))
    .map((author) => ({
      name: author.name as string,
      slug: author.slug ?? undefined,
      credentials: author.credentials ?? undefined,
      avatarUrl: author.avatarUrl ?? undefined,
    }))

  return (
    <>
      <Header locale={locale} localizedDocument={{ route: 'post', slugs: publishedSlugs }} />
      <article className="pt-16 mr-auto ml-auto bg-white" style={{ maxWidth: '1440px' }}>
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

        <PostHero post={post} />

        <div className="banner-wrapper" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
          <div className="w-full mx-auto">
            {post.intro ? (
              <RichText className="mb-8" data={post.intro} enableGutter={false} locale={locale} />
            ) : null}

            <RichText
              data={post.content}
              enableGutter={false}
              locale={locale}
              headings={headings}
              populatedAuthors={populatedAuthors}
            />

            {post.relatedArticles && post.relatedArticles.length > 0 && (
              <RelatedPosts
                className="mt-12"
                docs={post.relatedArticles.filter((p) => typeof p === 'object')}
              />
            )}
          </div>
        </div>
      </article>
      <Footer locale={locale} />
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
      `posts/${availableSlug}`,
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
  const canonical = new URL(`/${locale}/posts/${encodeURIComponent(post.slug)}`, siteURL).toString()
  const baseMetadata = await generateMeta({ doc: post, locale })

  return {
    ...baseMetadata,
    ...(read.draft ? { robots: { follow: false, index: false } } : {}),
    alternates: {
      canonical,
      ...(alternates ?? {}),
    },
    other: hreflangSuppressedForMissingXDefault
      ? { 'nb1-hreflang': 'suppressed-missing-x-default' }
      : undefined,
    openGraph: baseMetadata.openGraph
      ? {
          ...baseMetadata.openGraph,
          url: canonical,
        }
      : undefined,
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
