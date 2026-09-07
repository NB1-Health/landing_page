import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload, type Payload } from 'payload'
import React from 'react'

import configPromise from '@payload-config'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { getDictionary } from '@/i18n/getDictionary'
import { getFallbackLocale, isAppLocale, type AppLocale } from '@/i18n/config'
import { Media } from '@/components/Media'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { getAuthenticatedDraft, type AuthenticatedDraft } from '@/utilities/authenticatedDraft'
import { getLocalizedPagePath } from '@/utilities/localizedPagePath'
import { getServerSideURL } from '@/utilities/getURL'
import { getInfluencerVideoEmbedURL } from '@/lib/influencerVideo'
import { resolvePublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'
import type { InfluencerLandingPage } from '@/payload-types'

import { InfluencerCta } from './InfluencerCta'
import { InfluencerVideo } from './InfluencerVideo'

type Args = {
  params: Promise<{ locale: string; slug: string }>
}

export const dynamic = 'force-dynamic'

function personalize(value: string, name: string) {
  return value.replaceAll('{name}', name)
}

export default async function InfluencerLanding({ params }: Args) {
  const { locale: localeParam, slug: rawSlug } = await params
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const slug = decodeURIComponent(rawSlug)
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryInfluencerPage(payload, read, { locale, slug })

  if (!page) notFound()

  const publishedSlugs = await resolvePublishedLocaleSlugs({
    collection: 'influencer-landing-pages',
    id: page.id,
    payload,
    user: read.user ?? undefined,
  })
  const planHref = await getLocalizedPagePath('your-plan', locale)
  const checkoutCopy = getDictionary(locale).checkout
  const copy = checkoutCopy.whatsNext
  const videoURL = getInfluencerVideoEmbedURL(page.videoUrl)

  return (
    <>
      <Header locale={locale} localizedDocument={{ route: 'influencer', slugs: publishedSlugs }} />
      <main className="bg-[#f7fafb] text-[#12314d]">
        {read.draft ? (
          <LivePreviewListener
            collection="influencer-landing-pages"
            documentId={page.id}
            locale={locale}
            updatedAt={page.updatedAt}
          />
        ) : null}

        <section className="px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#0e2740] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
            <div className="flex flex-col justify-center px-7 py-14 sm:px-12 lg:px-16 lg:py-20">
              {page.handle ? (
                <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#70d6e5]">
                  {page.handle}
                </p>
              ) : null}
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl">
                {personalize(page.heroHeadline, page.influencerName)}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">{page.heroCopy}</p>
              <p className="mt-7 w-fit rounded-full border border-[#70d6e5]/40 bg-[#70d6e5]/10 px-4 py-2 text-sm font-semibold text-[#70d6e5]">
                ✦ {personalize(page.giftQuote, page.influencerName)}
              </p>
              <div className="mt-9">
                <InfluencerCta
                  code={page.discountCode}
                  errorLabel={checkoutCopy.promoUi.offerUnavailable}
                  href={planHref}
                  label={page.ctaLabel}
                  sourceSlug={page.slug}
                />
              </div>
            </div>

            <div className="relative min-h-[420px] lg:min-h-[680px]">
              <Media
                fill
                imgClassName="object-cover"
                pictureClassName="absolute inset-0"
                priority
                resource={page.primaryImage}
                size="(max-width: 1024px) 100vw, 48vw"
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <blockquote className="mx-auto max-w-4xl text-center">
            <span aria-hidden="true" className="text-7xl leading-none text-[#0a8fb0]">
              “
            </span>
            <p className="-mt-5 text-2xl leading-relaxed tracking-[-0.02em] sm:text-4xl">
              {page.testimonial}
            </p>
            <footer className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[#12314d]/55">
              — {page.testimonialAttribution}
            </footer>
          </blockquote>
        </section>

        {videoURL ? (
          <section className="px-4 py-10 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <InfluencerVideo
                embedURL={videoURL}
                locale={locale}
                title={`${page.influencerName} video`}
              />
            </div>
          </section>
        ) : null}

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {copy.heading}
            </h2>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {[copy.step1, copy.step2, copy.step3].map((step, index) => (
                <li
                  className="rounded-3xl border border-[#12314d]/10 bg-white p-7 shadow-sm"
                  key={step}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#70d6e5]/20 font-semibold text-[#0a728c]">
                    {index + 1}
                  </span>
                  <p className="mt-5 leading-7 text-[#12314d]/75">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-4 pb-24 pt-8 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-[#0e2740] px-7 py-14 text-center text-white sm:px-14 sm:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#70d6e5]">
              {page.influencerName}
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {personalize(page.offerHeadline, page.influencerName)}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
              {page.offerCopy}
            </p>
            <div className="mt-9">
              <InfluencerCta
                code={page.discountCode}
                errorLabel={checkoutCopy.promoUi.offerUnavailable}
                href={planHref}
                label={page.ctaLabel}
                sourceSlug={page.slug}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale: localeParam, slug: rawSlug } = await params
  const locale: AppLocale = isAppLocale(localeParam) ? localeParam : 'en'
  const slug = decodeURIComponent(rawSlug)
  const payload = await getPayload({ config: configPromise })
  const read = await getAuthenticatedDraft(payload)
  const page = await queryInfluencerPage(payload, read, { locale, slug })

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

  return (await payload.findByID({
    collection: 'influencer-landing-pages',
    id,
    depth: 1,
    disableErrors: true,
    draft: read.draft,
    fallbackLocale: getFallbackLocale(locale),
    locale,
    overrideAccess: false,
    user: read.user,
  })) as InfluencerLandingPage | null
}
