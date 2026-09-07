import type { Metadata } from 'next/types'

import '@/styles/journal-tokens.css'
import '@/styles/journal-index.css'

import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { JournalGrid } from '@/components/JournalGrid'
import { Pagination } from '@/components/Pagination'
import { appLocales, isAppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getJournalCopy } from '@/utilities/journalCopy'
import { getJournalIndexData, JOURNAL_PAGE_SIZE } from '@/utilities/journalQueries'
import { buildJournalTrail } from '@/utilities/journalTrail'

import PageClient from './page.client'

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

  const requestedPage = Number(pageNumber)
  if (!Number.isInteger(requestedPage) || requestedPage < 1) notFound()

  const payload = await getPayload({ config: configPromise })
  const dict = getDictionary(localeParam)
  const copy = await getJournalCopy(localeParam)

  // Page 1 lives at /journal — getJournalIndexData only fills the featured slot
  // for page 1, so paginated pages are a plain grid.
  const { cards, topics, page, totalPages } = await getJournalIndexData({
    locale: localeParam,
    page: requestedPage,
    payload,
  })

  if (cards.length === 0 && requestedPage > 1) notFound()

  return (
    <>
      {!copy.header.hide && <Header id={copy.header.id} locale={localeParam} />}
      <div className="jr-page">
        <PageClient />

        <header className="jr-hero">
          <div className="jr-hero__inner">
            {/* These pages are `noindex, follow` (see generateMetadata), so this
                trail is for readers rather than crawlers — hence no
                BreadcrumbList alongside it. Journal stays a link: on page 2 the
                reader's "up" is the hub, and marking it as the current page
                would take that away. */}
            <Breadcrumb
              rungs={buildJournalTrail({
                locale: localeParam,
                labels: {
                  home: dict.journal.breadcrumbHome,
                  journal: dict.journal.breadcrumbJournal,
                },
                current: {
                  name: `${dict.journal.breadcrumbPage} ${requestedPage}`,
                  path: `/${localeParam}/journal/page/${requestedPage}`,
                },
              })}
            />
            <h1>{copy.heroTitle}</h1>
            <p>{copy.heroLede}</p>
          </div>
        </header>

        <div className="jr-body">
          <JournalGrid
            cards={cards}
            featured={null}
            labels={{
              allTopics: dict.journal.allTopics,
              empty: dict.journal.empty,
              featured: dict.journal.featuredLabel,
              imagePlaceholder: dict.journal.imagePlaceholder,
              minRead: dict.journal.minRead,
              readArticle: dict.journal.readArticle,
            }}
            topics={topics}
          />

          {totalPages > 1 && <Pagination basePath="/journal" page={page} totalPages={totalPages} />}
        </div>
      </div>
      {!copy.footer.hide && <Footer id={copy.footer.id} locale={localeParam} />}
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: localeParam, pageNumber } = await paramsPromise
  const locale = isAppLocale(localeParam) ? localeParam : 'en'
  const copy = await getJournalCopy(locale)

  return {
    title: `${copy.heroTitle} — ${pageNumber || ''} | NB1`,
    // Paginated pages are crawlable but not indexed: page 1 is the canonical
    // entry point and these would otherwise compete with it.
    robots: { follow: true, index: false },
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  const pages = await Promise.all(
    appLocales.map(async (locale) => {
      const { totalDocs } = await payload.find({
        collection: 'posts',
        depth: 0,
        fallbackLocale: false,
        limit: 1,
        locale,
        overrideAccess: false,
        select: { slug: true },
        where: { _status: { equals: 'published' } },
      })

      // One post is held back by the featured slot on page 1.
      const gridDocs = Math.max(0, totalDocs - 1)

      return Array.from({ length: Math.ceil(gridDocs / JOURNAL_PAGE_SIZE) }, (_, index) => ({
        locale,
        pageNumber: String(index + 1),
      }))
    }),
  )

  return pages.flat()
}
