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
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { JsonLd } from '@/components/JsonLd'
import { buildPostSchema } from '@/utilities/buildSchema'
import { getServerSideURL } from '@/utilities/getURL'
import { extractHeadingsFromLexical } from '@/utilities/extractHeadingsFromLexical'
import { buildHreflangForSharedSlug } from '@/utilities/hreflang'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'

import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
const LOCALES = appLocales

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return posts.docs.flatMap(({ slug }) =>
    LOCALES.map((locale) => ({
      locale,
      slug,
    })),
  )
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
      <Header locale={locale} />
      <article className="pt-16 mr-auto ml-auto bg-white" style={{ maxWidth: '1440px' }}>
        <PageClient />

        <PayloadRedirects disableNotFound url={url} />

        {read.draft && <LivePreviewListener />}

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

  const alternates = buildHreflangForSharedSlug({
    siteURL,
    basePath: 'posts',
    slug: encodeURIComponent(decodedSlug),
    trailingSlash: false,
  })

  return {
    ...generateMeta({ doc: post, locale }),
    alternates: {
      canonical: new URL(`/${locale}/posts/${encodeURIComponent(decodedSlug)}`, siteURL).toString(),
      ...alternates,
    },
  }
}

async function queryPostBySlug(
  payload: Payload,
  read: AuthenticatedDraft,
  { slug, locale }: { slug: string; locale: AppLocale },
) {
  const result = await payload.find({
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
    fallbackLocale: 'en',
    depth: 2,
  })

  return (result.docs?.[0] as Post) || null
}
