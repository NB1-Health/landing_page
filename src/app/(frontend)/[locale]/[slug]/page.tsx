import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { JsonLd } from '@/components/JsonLd/index'
import configPromise from '@payload-config'
import { getPayload, type Payload, type RequiredDataFromCollectionSlug } from 'payload'
import React from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { buildPageJsonLd } from '@/utilities/buildPageJsonLd'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

import { getServerSideURL } from '@/utilities/getURL'
import { buildHreflangForLocalizedSlugs, buildHreflangForSharedSlug } from '@/utilities/hreflang'
import { getServerCurrency } from '@/utilities/currency'
import { resolvePriceTokensDeep } from '@/lib/plans/priceTokens'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'

import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
const LOCALES = appLocales
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

  let page: RequiredDataFromCollectionSlug<'pages'> | null

  // Home route (/{locale}): always look up the home page by its canonical en slug so
  // it's found even when a locale-specific slug has been set for it in the CMS.
  page = !rawSlug
    ? await queryHomePage(payload, read, locale)
    : await queryPageBySlug(payload, read, { slug: decodedSlug, locale })

  // Ultimate fallback: static seed (used when DB is empty / not yet seeded)
  if (!page && !rawSlug) {
    page = homeStatic as any
  }

  if (!page) {
    // Slug not found in this locale — check if it belongs to another locale and redirect
    const crossPath = await findCrossLocaleRedirect(payload, read, decodedSlug, locale)
    if (crossPath) redirect(crossPath)
    return <PayloadRedirects url={url} />
  }

  // When a slug is explicitly in the URL (not the home route), verify it belongs to
  // this locale. Payload's fallbackLocale means the query can return a page whose
  // actual locale slug differs from what was requested.
  if (rawSlug) {
    const returnedSlug = (page as any).slug as string | undefined
    // Home page is always served at /{locale} — redirect if accessed via any slug URL
    if (!returnedSlug || returnedSlug === 'home-page') {
      redirect(`/${locale}`)
    } else if (returnedSlug !== decodedSlug) {
      // Wrong-locale slug — redirect to the correct one for this locale
      redirect(`/${locale}/${returnedSlug}`)
    }
  }

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

  const absoluteUrl =
    decodedSlug === 'home'
      ? new URL(`/${locale}`, getServerSideURL()).toString()
      : new URL(`/${locale}/${encodeURIComponent(decodedSlug)}`, getServerSideURL()).toString()

  const pageJsonLd = buildPageJsonLd(page, absoluteUrl)

  // Fetch all locale slugs so the header switcher can navigate to the correct
  // locale-specific slug when the user changes language.
  const pageSlugsByLocale = page?.id
    ? await getAllLocaleSlugs(payload, read, String(page.id))
    : null

  return (
    <>
      <JsonLd data={pageJsonLd} />

      {!hideHeader && <Header locale={locale} id={headerId} pageSlugs={pageSlugsByLocale} />}

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
        <RenderBlocks blocks={layout || []} locale={locale} />
      </article>

      {!hideFooter && <Footer locale={locale} id={footerId} />}
    </>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home-page', locale: localeParam } = await paramsPromise
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const decodedSlug = decodeURIComponent(slug)

  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryPageMetaBySlug(payload, read, {
    slug: decodedSlug,
    locale,
  })

  if (!page && decodedSlug !== 'home-page') return {}

  const siteURL = getServerSideURL()

  const metaCanonical = (page as any)?.meta?.canonicalURL as string | undefined
  const computedCanonical =
    decodedSlug === 'home-page'
      ? new URL(`/${locale}`, siteURL).toString()
      : new URL(`/${locale}/${encodeURIComponent(decodedSlug)}`, siteURL).toString()

  const canonical = metaCanonical || computedCanonical

  const alternates =
    decodedSlug === 'home-page'
      ? {
          languages: {
            'de-DE': new URL('/de', siteURL).toString(),
            'de-AT': new URL('/de', siteURL).toString(),
            'de-CH': new URL('/de', siteURL).toString(),
            en: new URL('/en', siteURL).toString(),
            'x-default': new URL('/en', siteURL).toString(),
          },
        }
      : await buildLocalizedHreflang(
          payload,
          read,
          siteURL,
          page?.id as string | undefined,
          decodedSlug,
        )

  const robotsValue = (page as any)?.meta?.robots as string | undefined
  const robots =
    robotsValue && typeof robotsValue === 'string'
      ? {
          index: robotsValue.includes('index'),
          follow: robotsValue.includes('follow'),
        }
      : undefined

  return {
    ...generateMeta({ doc: page as any, locale }),
    ...(robots ? { robots } : {}),
    alternates: {
      canonical,
      ...alternates,
    },
  }
}

/**
 * Find the home page by its canonical English slug ('home-page') then return its
 * content in the requested locale. This ensures /{locale} works even when an editor
 * has set a locale-specific slug for the home page (which would break a slug-based query).
 */
async function queryHomePage(payload: Payload, read: AuthenticatedDraft, locale: AppLocale) {
  // Step 1: find the home page ID using the English slug
  const ref = await payload.find({
    collection: 'pages',
    draft: read.draft,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    user: read.user,
    where: { slug: { equals: 'home-page' } },
    locale: 'en',
    depth: 0,
    select: { slug: true },
  })

  const homeId = ref.docs?.[0]?.id
  if (!homeId) return null

  // Step 2: fetch full content in the requested locale
  return payload.findByID({
    collection: 'pages',
    id: homeId,
    draft: read.draft,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: 'en',
    depth: 2,
    populate: PAGE_RENDER_POPULATE,
  }) as Promise<RequiredDataFromCollectionSlug<'pages'> | null>
}

async function queryPageBySlug(
  payload: Payload,
  read: AuthenticatedDraft,
  { slug, locale }: { slug: string; locale: AppLocale },
) {
  const result = await payload.find({
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
    fallbackLocale: 'en',
    depth: 2,
    populate: PAGE_RENDER_POPULATE,
  })

  return (result.docs?.[0] as RequiredDataFromCollectionSlug<'pages'>) || null
}

/** Fetch all locale slug variants for a page (used by both hreflang and the slug-map script). */
async function getAllLocaleSlugs(
  payload: Payload,
  read: AuthenticatedDraft,
  pageId: string,
): Promise<Partial<Record<string, string>>> {
  const doc = await payload.findByID({
    collection: 'pages',
    id: pageId,
    locale: 'all' as unknown as AppLocale,
    draft: read.draft,
    overrideAccess: false,
    user: read.user,
    depth: 0,
    select: { slug: true },
  })
  return (doc?.slug as unknown as Partial<Record<string, string>>) ?? {}
}

/** Fetch all locale slug variants for a page and build localized hreflang alternates. */
async function buildLocalizedHreflang(
  payload: Payload,
  read: AuthenticatedDraft,
  siteURL: string,
  pageId: string | undefined,
  fallbackSlug: string,
) {
  if (!pageId) {
    return buildHreflangForSharedSlug({ siteURL, slug: encodeURIComponent(fallbackSlug) })
  }
  const slugsByLocale = await getAllLocaleSlugs(payload, read, pageId)
  return buildHreflangForLocalizedSlugs({ siteURL, slugsByLocale })
}

// generateMetadata only needs the SEO group + slug — never the page's blocks.
// Reusing queryPageBySlug here would run the SAME ~300KB query that LEFT JOINs all
// ~85 block types (and on the small STG DB that draft query trips the DB-level
// statement_timeout → "canceling statement due to statement timeout"). `select`
// keeps this query tiny: just the scalar SEO columns + the meta image relation.
async function queryPageMetaBySlug(
  payload: Payload,
  read: AuthenticatedDraft,
  { slug, locale }: { slug: string; locale: AppLocale },
) {
  const result = await payload.find({
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
    fallbackLocale: 'en',
    depth: 1,
    select: {
      slug: true,
      title: true,
      meta: true,
    },
  })

  return (result.docs?.[0] as RequiredDataFromCollectionSlug<'pages'>) || null
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
  for (const locale of LOCALES) {
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
      depth: 0,
      select: { slug: true },
    })
    const found = result.docs?.[0]
    if (!found?.id) continue
    // Found in another locale — get the correct slug for the requested locale
    const slugsDoc = await payload.findByID({
      collection: 'pages',
      id: found.id,
      locale: 'all' as unknown as AppLocale,
      draft: read.draft,
      overrideAccess: false,
      user: read.user,
      depth: 0,
      select: { slug: true },
    })
    const slugMap = slugsDoc?.slug as unknown as Partial<Record<string, string>>
    const correctSlug = slugMap?.[requestedLocale] ?? slugMap?.['en']
    if (!correctSlug || correctSlug === 'home-page') return `/${requestedLocale}`
    return `/${requestedLocale}/${correctSlug}`
  }
  return null
}
