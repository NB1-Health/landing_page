import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload, type Payload } from 'payload'
import React from 'react'

import configPromise from '@payload-config'
import { getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { InfluencerDesign } from '@/components/InfluencerDesign'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'
import { getLocalizedPagePath } from '@/utilities/localizedPagePath'
import { getInfluencerTemplate } from '@/utilities/getInfluencerTemplate'
import { getServerSideURL } from '@/utilities/getURL'
import type { InfluencerLandingPage } from '@/payload-types'

type Args = { params: Promise<{ locale: string; slug: string }> }
export const dynamic = 'force-dynamic'

export default async function InfluencerLanding({ params }: Args) {
  const { locale: localeParam, slug: rawSlug } = await params
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryInfluencerPage(payload, read, {
    locale,
    slug: decodeURIComponent(rawSlug),
  })
  if (!page) notFound()

  const [template, orderHref, coreHref, advancedHref] = await Promise.all([
    getInfluencerTemplate(payload, page, read, locale),
    getLocalizedPagePath('order', locale),
    getLocalizedPagePath('order-core', locale),
    getLocalizedPagePath('order-advanced', locale),
  ])

  return (
    <>
      {read.draft && (
        <LivePreviewListener
          collection="influencer-landing-pages"
          documentId={page.id}
          locale={locale}
          updatedAt={page.updatedAt}
        />
      )}
      {read.draft && template && (
        <LivePreviewListener
          collection="influencer-templates"
          documentId={template.id}
          locale={locale}
          updatedAt={template.updatedAt}
        />
      )}
      <InfluencerDesign
        page={page}
        template={template}
        locale={locale}
        orderHref={orderHref}
        coreHref={coreHref}
        advancedHref={advancedHref}
      />
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: localeParam, slug: rawSlug } = await params
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryInfluencerPage(payload, read, {
    locale,
    slug: decodeURIComponent(rawSlug),
  })
  if (!page) return { robots: { follow: true, index: false } }
  return {
    title: `${page.influencerName} × NB1`,
    description: page.heroCopy,
    alternates: {
      canonical: new URL(
        `/${locale}/influencers/${encodeURIComponent(page.slug)}`,
        getServerSideURL(),
      ),
    },
    robots: { follow: !read.draft, index: false },
  }
}

async function queryInfluencerPage(
  payload: Payload,
  read: AuthenticatedDraft,
  { locale, slug }: { locale: AppLocale; slug: string },
): Promise<InfluencerLandingPage | null> {
  const reference = await payload.find({
    collection: 'influencer-landing-pages',
    depth: 0,
    draft: read.draft,
    fallbackLocale: false,
    limit: 1,
    locale,
    overrideAccess: false,
    pagination: false,
    select: { slug: true },
    user: read.user,
    where: { slug: { equals: slug } },
  })
  const id = reference.docs[0]?.id
  if (!id) return null
  return await payload.findByID({
    collection: 'influencer-landing-pages',
    id,
    depth: 1,
    disableErrors: true,
    draft: read.draft,
    fallbackLocale: getFallbackLocale(locale),
    locale,
    overrideAccess: false,
    user: read.user,
  })
}
