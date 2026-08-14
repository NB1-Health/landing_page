import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { JsonLd } from '@/components/JsonLd/index'
import configPromise from '@payload-config'
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import React from 'react'

import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { buildPageJsonLd } from '@/utilities/buildPageJsonLd'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

import { getServerSideURL } from '@/utilities/getURL'
import {
  buildHreflangAlternates,
  isHreflangXDefaultMissing,
  readHreflangOverrides,
} from '@/utilities/hreflang'
import { getServerCurrency } from '@/utilities/currency'
import { resolvePriceTokensDeep } from '@/lib/plans/priceTokens'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'
import { resolvePublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'
import { parseRobotsDirectives } from '@/utilities/robotsDirectives'

import { appLocales, getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'
const PAGE_RENDER_POPULATE = {
  headers: { name: true },
  footers: { name: true },
} as const

type Args = {
  params: Promise<{
    locale: string
    slug?: string
  }>
}

// Currency-sensitive page copy is rendered from the visitor's cookie. Keep
// landing pages request-rendered so newly published slugs work immediately and
// a shared route cache never serves one visitor's currency to another.
export const dynamic = 'force-dynamic'

export default async function Page({ params: paramsPromise }: Args) {
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  // rawSlug is undefined when the URL is /{locale} (no slug segment — home route).
  const { slug: rawSlug, locale: localeParam } = await paramsPromise

  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const decodedSlug = decodeURIComponent(rawSlug ?? 'home-page')

  const url =
    `/${locale}/${decodedSlug === 'home-page' ? '' : decodedSlug}`.replace(/\/+$/, '') ||
    `/${locale}`

  // Home route (/{locale}): always look up the home page by its canonical en slug so
  // it's found even when a locale-specific slug has been set for it in the CMS.
  const page: RequiredDataFromCollectionSlug<'pages'> | null = !rawSlug
    ? await queryHomePage(payload, read, locale)
    : await queryPageBySlug(payload, read, { slug: decodedSlug, locale })

  if (!page) {
    // Slug not found in this locale — check if it belongs to another locale and redirect
    const crossPath = await findCrossLocaleRedirect(payload, read, decodedSlug, locale)
    if (crossPath) redirect(crossPath)
    return <PayloadRedirects url={url} />
  }
  if (page.id == null) return <PayloadRedirects url={url} />
  const pageId = page.id

  const publishedSlugs = await resolvePublishedLocaleSlugs({
    collection: 'pages',
    id: pageId,
    payload,
  })
  const isHome = !rawSlug || (await isHomePageDocument(payload, read, pageId))

  // Draft previews remain available to authenticated editors. Public rendering is
  // gated before any content fallback so an unpublished locale cannot masquerade
  // as a 200 response containing another locale's content.
  if (!read.draft && typeof publishedSlugs[locale] !== 'string') {
    return <PayloadRedirects url={url} />
  }

  if (rawSlug && isHome) redirect(`/${locale}`)

  const {
    hero: rawHero,
    layout: rawLayout,
    header: pageHeader,
    footer: pageFooter,
    hideHeader,
    hideFooter,
  } = page as any
  const headerId = typeof pageHeader === 'object' ? pageHeader?.id : pageHeader
  const footerId = typeof pageFooter === 'object' ? pageFooter?.id : pageFooter

  // Resolve live-price tokens — incl. arithmetic like
  // {{(price:core:4-price:core:12)*12}} — in EVERY field of EVERY block (and the
  // hero), once, in the visitor's currency. This makes tokens work everywhere in
  // page content without per-block wiring. No-op (returns input) when a section
  // has no tokens, so it's cheap for token-free pages.
  const currency = await getServerCurrency(locale)
  const [hero, layout] = await Promise.all([
    resolvePriceTokensDeep(rawHero, currency, locale),
    resolvePriceTokensDeep(rawLayout, currency, locale),
  ])
  // The checkout PlanSelector is distinct from the generic marketing Plans block.
  // If an editor deliberately places this checkout selector on another page,
  // that page is treated as the first order-selection experience too.
  const isOrderEntry =
    Array.isArray(layout) &&
    layout.some((block: { blockType?: string } | null) => block?.blockType === 'planSelector')

  const absoluteUrl = new URL(
    getPagePath(locale, (page as { slug?: string }).slug, isHome),
    getServerSideURL(),
  ).toString()

  const pageJsonLd = buildPageJsonLd(page, absoluteUrl)

  // The switcher uses the same live availability map as hreflang and sitemaps.
  const pageSlugsByLocale = publishedSlugs

  return (
    <>
      <JsonLd data={pageJsonLd} />

      {!hideHeader && (
        <Header
          locale={locale}
          id={headerId}
          localizedDocument={{ route: isHome ? 'home' : 'page', slugs: pageSlugsByLocale }}
        />
      )}

      <article
        data-nb1-order-entry={isOrderEntry ? 'true' : undefined}
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
        }}
      >
        <PageClient />

        <PayloadRedirects disableNotFound url={url} />

        {read.draft && page.id != null && typeof page.updatedAt === 'string' && (
          <LivePreviewListener
            collection="pages"
            documentId={page.id}
            locale={locale}
            updatedAt={page.updatedAt}
          />
        )}

        {hero ? <RenderHero {...hero} /> : null}
        <RenderBlocks blocks={layout || []} locale={locale} pageSlugs={pageSlugsByLocale} />
      </article>

      {!hideFooter && <Footer locale={locale} id={footerId} />}
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug: rawSlug, locale: localeParam } = await paramsPromise
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const decodedSlug = decodeURIComponent(rawSlug ?? 'home-page')

  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryPageMeta(payload, read, {
    home: !rawSlug,
    slug: decodedSlug,
    locale,
  })

  if (!page) return {}
  if (page.id == null) return {}
  const pageId = page.id

  const siteURL = getServerSideURL()
  const publishedSlugs = await resolvePublishedLocaleSlugs({
    collection: 'pages',
    id: pageId,
    payload,
  })
  const isHome = !rawSlug || (await isHomePageDocument(payload, read, pageId))
  const canonical = new URL(
    getPagePath(locale, (page as { slug?: string }).slug, isHome),
    siteURL,
  ).toString()
  const pathsByLocale = Object.fromEntries(
    Object.entries(publishedSlugs).map(([availableLocale, slug]) => [
      availableLocale,
      isHome ? '' : slug,
    ]),
  )
  const hreflangOverrides = readHreflangOverrides(page.meta?.seoOverrides)
  const currentLocaleExcluded =
    hreflangOverrides?.enabled && hreflangOverrides.excludedLocales?.includes(locale)
  const robots = parseRobotsDirectives(page.meta?.robots)
  const alternates =
    read.draft || currentLocaleExcluded || robots?.index === false
      ? undefined
      : buildHreflangAlternates({
          pathsByLocale,
          siteURL,
          overrides: hreflangOverrides,
        })
  const hreflangSuppressedForMissingXDefault =
    !read.draft &&
    !currentLocaleExcluded &&
    robots?.index !== false &&
    isHreflangXDefaultMissing(pathsByLocale, hreflangOverrides)
  const baseMetadata = await generateMeta({ doc: page, locale })

  return {
    ...baseMetadata,
    ...(read.draft ? { robots: { follow: false, index: false } } : robots ? { robots } : {}),
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

function getPagePath(locale: AppLocale, slug: string | null | undefined, home: boolean): string {
  return home || !slug ? `/${locale}` : `/${locale}/${encodeURIComponent(slug)}`
}

function isHomeSlug(slug: unknown): boolean {
  return slug === 'home' || slug === 'home-page'
}

async function findHomePageID(payload: Payload, read: AuthenticatedDraft) {
  const result = await payload.find({
    collection: 'pages',
    draft: read.draft,
    limit: 1,
    pagination: false,
    // This first query only identifies the home document. The locale-specific
    // read below still enforces publication access.
    overrideAccess: true,
    where: {
      or: [{ slug: { equals: 'home-page' } }, { slug: { equals: 'home' } }],
    },
    locale: 'en',
    fallbackLocale: false,
    depth: 0,
    select: { slug: true },
  })

  return result.docs?.[0]?.id
}

async function isHomePageDocument(
  payload: Payload,
  read: AuthenticatedDraft,
  id: number | string,
): Promise<boolean> {
  const english = await payload.findByID({
    collection: 'pages',
    id,
    draft: read.draft,
    depth: 0,
    disableErrors: true,
    fallbackLocale: false,
    locale: 'en',
    overrideAccess: true,
    select: { slug: true },
  })

  return isHomeSlug(english?.slug)
}

/**
 * Find the home page by its canonical English slug ('home-page') then return its
 * content in the requested locale. This ensures /{locale} works even when an editor
 * has set a locale-specific slug for the home page (which would break a slug-based query).
 */
async function queryHomePage(payload: Payload, read: AuthenticatedDraft, locale: AppLocale) {
  const homeId = await findHomePageID(payload, read)
  if (!homeId) return null

  return payload.findByID({
    collection: 'pages',
    id: homeId,
    draft: read.draft,
    disableErrors: true,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: getFallbackLocale(locale),
    depth: 2,
    populate: PAGE_RENDER_POPULATE,
  }) as Promise<RequiredDataFromCollectionSlug<'pages'> | null>
}

async function queryPageBySlug(
  payload: Payload,
  read: AuthenticatedDraft,
  { slug, locale }: { slug: string; locale: AppLocale },
) {
  const reference = await payload.find({
    collection: 'pages',
    draft: read.draft,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    user: read.user,
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

  return payload.findByID({
    collection: 'pages',
    id,
    draft: read.draft,
    disableErrors: true,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: getFallbackLocale(locale),
    depth: 2,
    populate: PAGE_RENDER_POPULATE,
  }) as Promise<RequiredDataFromCollectionSlug<'pages'> | null>
}

// generateMetadata only needs the SEO group + slug — never the page's blocks.
// Reusing queryPageBySlug here would run the SAME ~300KB query that LEFT JOINs all
// ~85 block types (and on the small STG DB that draft query trips the DB-level
// statement_timeout → "canceling statement due to statement timeout"). `select`
// keeps this query tiny: just the scalar SEO columns + the meta image relation.
async function queryPageMeta(
  payload: Payload,
  read: AuthenticatedDraft,
  { home, slug, locale }: { home: boolean; slug: string; locale: AppLocale },
) {
  const id = home
    ? await findHomePageID(payload, read)
    : (
        await payload.find({
          collection: 'pages',
          draft: read.draft,
          limit: 1,
          pagination: false,
          overrideAccess: false,
          user: read.user,
          where: { slug: { equals: slug } },
          locale,
          fallbackLocale: false,
          depth: 0,
          select: { slug: true },
        })
      ).docs?.[0]?.id

  if (!id) return null

  return payload.findByID({
    collection: 'pages',
    id,
    draft: read.draft,
    disableErrors: true,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: getFallbackLocale(locale),
    depth: 1,
    select: { slug: true, title: true, meta: true },
  }) as Promise<RequiredDataFromCollectionSlug<'pages'> | null>
}

/**
 * When a slug isn't found in the requested locale, check all other locales.
 * If found, return the canonical path for the requested locale.
 * This handles the case where a user manually types e.g. /en/unsere-plaene
 * (the German slug) — we redirect them to /en/our-plans instead.
 */
async function findCrossLocaleRedirect(
  payload: Payload,
  read: AuthenticatedDraft,
  slug: string,
  requestedLocale: AppLocale,
): Promise<string | null> {
  for (const locale of appLocales) {
    if (locale === requestedLocale) continue
    const result = await payload.find({
      collection: 'pages',
      limit: 1,
      pagination: false,
      draft: read.draft,
      overrideAccess: false,
      user: read.user,
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: false,
      depth: 0,
      select: { slug: true },
    })
    const found = result.docs?.[0]
    if (!found?.id) continue

    // Only redirect when that same document is actually available in the
    // requested locale. Never fall back to the English URL.
    const target = await payload.findByID({
      collection: 'pages',
      id: found.id,
      locale: requestedLocale,
      fallbackLocale: false,
      draft: read.draft,
      disableErrors: true,
      overrideAccess: false,
      user: read.user,
      depth: 0,
      select: { slug: true },
    })
    const correctSlug = target?.slug
    if (typeof correctSlug !== 'string' || !correctSlug) return null
    if (await isHomePageDocument(payload, read, found.id)) return `/${requestedLocale}`
    return `/${requestedLocale}/${encodeURIComponent(correctSlug)}`
  }
  return null
}
