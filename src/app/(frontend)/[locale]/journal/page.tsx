import type { Metadata } from 'next/types'

import '@/styles/journal-tokens.css'
import '@/styles/journal-index.css'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { HubStrip } from '@/components/HubStrip'
import { JournalGrid } from '@/components/JournalGrid'
import { Pagination } from '@/components/Pagination'
import { getCachedHubLinks } from '@/utilities/hubQueries'
import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getJournalCopy } from '@/utilities/journalCopy'
import { buildHreflangAlternates } from '@/utilities/hreflang'
import { getJournalIndexData } from '@/utilities/journalQueries'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { buildIndexPageSchema } from '@/utilities/indexSchema'
import { getPublisherSchema } from '@/utilities/publisherSchema'
import { JsonLd } from '@/components/JsonLd'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import PageClient from './page.client'

export const dynamic = 'force-static'
// Backstop only. `revalidatePost` invalidates this path on publish, so a new
// card appears immediately rather than waiting out this window.
export const revalidate = 600

export default async function Page({ params }: { params?: Promise<{ locale?: string }> }) {
  const localeParam = (await params)?.locale ?? 'en'
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const payload = await getPayload({ config: configPromise })
  const dict = getDictionary(locale)

  const [copy, { featured, cards, topics, page, totalPages }, publisher, hubs] = await Promise.all([
    getJournalCopy(locale),
    getJournalIndexData({ payload, locale }),
    getPublisherSchema(locale),
    getCachedHubLinks(locale)(),
  ])

  // Home / Journal, with Journal as the current page. Same rungs feed the
  // rendered trail and the BreadcrumbList — SEO-007 §8 lists both as missing
  // from the prototype, and §5 requires them to agree exactly.
  const rungs = buildJournalTrail({
    locale,
    labels: { home: dict.journal.breadcrumbHome, journal: dict.journal.breadcrumbJournal },
  })

  const jsonLd = buildIndexPageSchema({
    siteURL: getServerSideURL(),
    canonicalPath: `/${locale}/journal`,
    locale,
    rungs,
    cards,
    featured,
    title: copy.heroTitle,
    description: copy.heroLede,
    publisher,
  })

  return (
    <>
      {!copy.header.hide && <Header id={copy.header.id} locale={locale} />}
      <div className="jr-page">
        <PageClient />
        <JsonLd data={jsonLd} />

        <header className="jr-hero">
          <div className="jr-hero__inner">
            <Breadcrumb rungs={rungs} />
            <h1>{copy.heroTitle}</h1>
            <p>{copy.heroLede}</p>
          </div>
        </header>

        <div className="jr-body">
          {/* §11.1 — the index links down to the hubs, in body content. */}
          <HubStrip heading={dict.journal.exploreHubs} hubs={hubs} />

          <JournalGrid
            cards={cards}
            featured={featured}
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
      {!copy.footer.hide && <Footer id={copy.footer.id} locale={locale} />}
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
  const payload = await getPayload({ config: configPromise })
  const [copy, { featured, cards }] = await Promise.all([
    getJournalCopy(locale),
    getJournalIndexData({ payload, locale }),
  ])
  const canonical = new URL(`/${locale}/journal`, siteURL).toString()

  const title = copy.metaTitle ?? `${copy.heroTitle} | NB1`
  const description = copy.metaDescription ?? copy.heroLede

  // SEO-007 §8, defect 8: the hub prototype shipped with no og:image, which
  // makes it a bare link on every social and AI surface. Use the featured
  // article's cover, then the newest card's, then the site default — the same
  // fallback shape `resolveOgImageSource` uses for an article.
  const ogImage = featured?.image?.src ?? cards.find((card) => card.image)?.image?.src
  const ogImageURL = ogImage ? new URL(ogImage, siteURL).toString() : undefined

  return {
    title,
    description,
    alternates: {
      canonical,
      ...buildHreflangAlternates({
        siteURL,
        pathsByLocale: Object.fromEntries(
          appLocales.map((availableLocale) => [availableLocale, 'journal']),
        ),
      }),
    },
    openGraph: mergeOpenGraph({
      type: 'website',
      // Open Graph shows the human headline, not the SERP-tuned title.
      title: copy.heroTitle,
      description,
      url: canonical,
      ...(ogImageURL ? { images: [{ url: ogImageURL }] } : {}),
    }),
  }
}
