import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
import { buildHreflangAlternates } from '@/utilities/hreflang'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page({ params }: { params?: Promise<{ locale?: string }> }) {
  const localeParam = (await params)?.locale ?? 'en'
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    locale,
    fallbackLocale: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <>
      <Header locale={locale} />
      <div className="pt-24 pb-24">
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Posts</h1>
          </div>
        </div>

        <div className="container mb-8">
          <PageRange
            collection="posts"
            currentPage={posts.page}
            limit={12}
            totalDocs={posts.totalDocs}
          />
        </div>

        <CollectionArchive posts={posts.docs} />

        <div className="container">
          {posts.totalPages > 1 && posts.page && (
            <Pagination page={posts.page} totalPages={posts.totalPages} />
          )}
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}

export async function generateMetadata({
  params,
}: {
  params?: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const localeParam = (await params)?.locale ?? 'en'
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const siteURL = getServerSideURL()

  return {
    title: `NB1 Posts`,
    alternates: {
      canonical: new URL(`/${locale}/posts`, siteURL).toString(),
      ...buildHreflangAlternates({
        siteURL,
        pathsByLocale: Object.fromEntries(
          appLocales.map((availableLocale) => [availableLocale, 'posts']),
        ),
      }),
    },
  }
}
