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
import { buildHreflangForLocalizedSlugs } from '@/utilities/hreflang'
import { getServerCurrency } from '@/utilities/currency'
import { resolvePriceTokensDeep } from '@/lib/plans/priceTokens'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'

import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'
const LOCALES = appLocales
const HOME_SLUGS = ['home-page', 'home'] as const
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

// Pages are served from the static / full-route cache and refreshed on publish
// via the revalidatePage afterChange hook (revalidatePath). This time-based value
// is just a backstop. Keeps the heavy ~260KB per-page query off the runtime hot
// path — critical on the 1 vCPU staging DB where it was saturating the pool.
export const revalidate = 600

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const homeRefs = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 2,
    pagination: false,
    overrideAccess: false,
    fallbackLocale: false,
    where: { slug: { in: [...HOME_SLUGS] } },
    locale: 'en',
    depth: 0,
    select: { slug: true },
  })
  const homeIDs = new Set(homeRefs.docs.map((doc) => String(doc.id)))

  // Fetch per locale so each locale gets its own translated slug value.
  // Skip the home document by stable ID (rendered at every locale root) and
  // test pages (would crash build on bad data).
  const allParams = await Promise.all(
    LOCALES.map(async (locale) => {
      const pages = await payload.find({
        collection: 'pages',
        draft: false,
        limit: 1000,
        overrideAccess: false,
        pagination: false,
        locale,
        fallbackLocale: false,
        select: { slug: true },
      })
      return pages.docs
        .filter((doc) => doc.slug && !homeIDs.has(String(doc.id)) && !/^test\b/i.test(doc.slug))
        .map((doc) => ({ locale, slug: doc.slug as string }))
    }),
  )

  return allParams.flat()
}

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

  // A required localized slug is the public-readiness marker for the active
  // locale. Never render an English fallback as if an unfinished locale were live.
  if (page && !(page as any).slug) page = null

  if (!page) {
    // Slug not found in this locale — check if it belongs to another locale and redirect
    const crossPath = await findCrossLocaleRedirect(payload, read, decodedSlug, locale)
    if (crossPath) redirect(crossPath)
    return <PayloadRedirects url={url} />
  }

  const {
    hero: rawHero,
    layout: rawLayout,
    header: pageHeader,
    footer: pageFooter,
    hideHeader,
    hideFooter,
  } = page as any

  // The English home slug is the stable route identity. Other locales may
  // translate that slug, but this document is always canonical at /{locale}.
  // Reuse the same lightweight lookup for the header locale switcher.
  const pageSlugsByLocale =
    page?.id && (rawSlug || !hideHeader)
      ? await getAllLocaleSlugs(payload, read, String(page.id))
      : null
  const isHomePage =
    !rawSlug || HOME_SLUGS.includes(pageSlugsByLocale?.en as (typeof HOME_SLUGS)[number])

  // When a slug is explicitly in the URL (not the home route), verify it belongs to
  // this locale and keep the home page at the locale root.
  if (rawSlug) {
    const returnedSlug = (page as any).slug as string | undefined
    // Home page is always served at /{locale} — redirect if accessed via any slug URL
    if (!returnedSlug || isHomePage) {
      redirect(`/${locale}`)
    } else if (returnedSlug !== decodedSlug) {
      // Wrong-locale slug — redirect to the correct one for this locale
      redirect(`/${locale}/${returnedSlug}`)
    }
  }

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
    decodedSlug === 'home-page'
      ? new URL(`/${locale}`, getServerSideURL()).toString()
      : new URL(`/${locale}/${encodeURIComponent(decodedSlug)}`, getServerSideURL()).toString()

  const pageJsonLd = buildPageJsonLd(page, absoluteUrl)

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

        {read.draft && <LivePreviewListener />}

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

  if (!page) return {}

  const siteURL = getServerSideURL()
  const slugsByLocale = page?.id ? await getAllLocaleSlugs(payload, read, String(page.id)) : {}
  const isHomePage = HOME_SLUGS.includes(slugsByLocale.en as (typeof HOME_SLUGS)[number])

  const metaCanonical = (page as any)?.meta?.canonicalURL as string | undefined
  const computedCanonical = isHomePage
    ? new URL(`/${locale}`, siteURL).toString()
    : new URL(`/${locale}/${encodeURIComponent(decodedSlug)}`, siteURL).toString()

  const canonical = metaCanonical || computedCanonical

  const alternates = buildHreflangForLocalizedSlugs({ siteURL, slugsByLocale })

  const robotsValue = (page as any)?.meta?.robots as string | undefined
  const robots =
    robotsValue && typeof robotsValue === 'string'
      ? {
          index: robotsValue.includes('index'),
          follow: robotsValue.includes('follow'),
        }
      : undefined

  return {
    ...generateMeta({ canonicalURL: canonical, doc: page as any, locale }),
    ...(robots ? { robots } : {}),
    alternates: {
      canonical,
      ...alternates,
    },
  }
}

/**
 * Find the home page by its English seed/canonical slug, then return its content
 * in the requested locale. This keeps /{locale} working for both generations of
 * seed data and when another locale uses a different localized slug.
 */
async function queryHomePage(payload: Payload, read: AuthenticatedDraft, locale: AppLocale) {
  // Step 1: find the home page ID using either known English home slug.
  const ref = await payload.find({
    collection: 'pages',
    draft: read.draft,
    limit: 2,
    pagination: false,
    overrideAccess: false,
    user: read.user,
    fallbackLocale: false,
    where: { slug: { in: [...HOME_SLUGS] } },
    locale: 'en',
    depth: 0,
    select: { slug: true },
  })

  const homeId = ref.docs.find((doc) => doc.slug === 'home-page')?.id ?? ref.docs.find(Boolean)?.id
  if (!homeId) return null

  // Step 2: fetch full content in the requested locale
  return payload.findByID({
    collection: 'pages',
    id: homeId,
    draft: read.draft,
    overrideAccess: false,
    user: read.user,
    locale,
    fallbackLocale: false,
    disableErrors: true,
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
    fallbackLocale: false,
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
    fallbackLocale: false,
    overrideAccess: false,
    user: read.user,
    disableErrors: true,
    depth: 0,
    select: { slug: true },
  })
  return (doc?.slug as unknown as Partial<Record<string, string>>) ?? {}
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
  if (HOME_SLUGS.includes(slug as (typeof HOME_SLUGS)[number])) {
    const ref = await payload.find({
      collection: 'pages',
      draft: read.draft,
      limit: 2,
      pagination: false,
      overrideAccess: false,
      user: read.user,
      where: { slug: { in: [...HOME_SLUGS] } },
      locale: 'en',
      fallbackLocale: false,
      depth: 0,
      select: { slug: true },
    })
    const homeID =
      ref.docs.find((doc) => doc.slug === 'home-page')?.id ?? ref.docs.find(Boolean)?.id
    if (!homeID) return null

    const home = await payload.findByID({
      collection: 'pages',
      id: homeID,
      draft: read.draft,
      overrideAccess: false,
      user: read.user,
      locale,
      fallbackLocale: false,
      disableErrors: true,
      depth: 1,
      select: { slug: true, title: true, meta: true },
    })
    return home?.slug ? (home as RequiredDataFromCollectionSlug<'pages'>) : null
  }

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
    fallbackLocale: false,
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
      overrideAccess: false,
      user: read.user,
      where: { slug: { equals: slug } },
      locale,
      draft: read.draft,
      fallbackLocale: false,
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
      fallbackLocale: false,
      overrideAccess: false,
      user: read.user,
      depth: 0,
      select: { slug: true },
    })
    const slugMap = slugsDoc?.slug as unknown as Partial<Record<string, string>>
    const correctSlug = slugMap?.[requestedLocale]
    if (!correctSlug) return null
    if (HOME_SLUGS.includes(slugMap?.en as (typeof HOME_SLUGS)[number])) {
      return `/${requestedLocale}`
    }
    return `/${requestedLocale}/${correctSlug}`
  }
  return null
}
