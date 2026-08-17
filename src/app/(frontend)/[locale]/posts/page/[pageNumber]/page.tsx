import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { notFound } from 'next/navigation'
import { appLocales, isAppLocale } from '@/i18n/config'

export const revalidate = 600

type Args = {
  params: Promise<{
    locale: string
    pageNumber: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { locale: localeParam, pageNumber } = await paramsPromise
  if (!isAppLocale(localeParam)) notFound()
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
    overrideAccess: false,
    locale: localeParam,
    fallbackLocale: false,
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
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
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `NB1 Posts Page ${pageNumber || ''}`,
    robots: { follow: true, index: false },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await Promise.all(
    appLocales.map(async (locale) => {
      const { totalDocs } = await payload.find({
        collection: 'posts',
        overrideAccess: false,
        locale,
        fallbackLocale: false,
        limit: 1,
        depth: 0,
        select: { slug: true },
      })

      return Array.from({ length: Math.ceil(totalDocs / 12) }, (_, index) => ({
        locale,
        pageNumber: String(index + 1),
      }))
    }),
  )

  return pages.flat()
}
