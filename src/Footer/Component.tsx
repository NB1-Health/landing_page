import { getCachedFooter } from '@/utilities/getHeaderFooter'
import React, { Suspense } from 'react'

import type { Media } from '@/payload-types'
import { isAppLocale, type AppLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/getDictionary'
import { getCachedHubLinks } from '@/utilities/hubQueries'
import { FooterClient } from './FooterClient'

type Props = {
  locale: string
  id?: string | null
}

type FooterData = {
  logo?: number | Media | null
  theme?: 'light' | 'dark' | null
  tagline?: string | null
  subnote?: string | null
  disclaimer?: string | null
  copyrightText?: string | null
  instagramUrl?: string | null
  exploreLinks?: Array<{ label?: string | null; url?: string | null }> | null
  getStartedLinks?: Array<{ label?: string | null; url?: string | null }> | null
  legalLinks?: Array<{ label?: string | null; url?: string | null }> | null
  form?: { id?: string | number | null; confirmationType?: string | null; redirect?: { url?: string | null } | null } | number | null
  variants?: Array<{
    variantKey: string
    theme: 'light' | 'dark'
    linkColor?: string | null
    logo?: number | Media | null
  }> | null
}

export async function Footer({ locale, id }: Props) {
  const appLocale: AppLocale = isAppLocale(locale) ? locale : 'en'
  const dict = getDictionary(appLocale)

  // SEO-007 §11.0: direct, always-rendered links to Journal and the three hubs,
  // in every locale, with no interaction required to reveal them. This is the
  // compensation for the Journal sitting two hovers deep in the nav, and until
  // now nothing on the site linked to a hub at all — they were reachable only
  // from their own pillar breadcrumbs and the sitemap.
  //
  // Fetched here rather than inside FooterClient because the links have to be in
  // the server-rendered HTML. They still are: FooterClient is a client component
  // but Next SSRs it, so the anchors ship in the initial response.
  const [footerRaw, hubLinks] = await Promise.all([
    getCachedFooter(id, locale)(),
    getCachedHubLinks(appLocale)(),
  ])

  const footerData = footerRaw as FooterData | null
  if (!footerData) return null

  // Journal first, then the hubs in their fixed order. The Journal is not a Hubs
  // record — it has its own route — so it is prepended here rather than seeded
  // into the collection.
  const contentLinks = [
    { label: dict.footer.journal, url: `/${appLocale}/journal` },
    ...hubLinks.map((hub) => ({ label: hub.title, url: hub.path })),
  ]

  const rawForm = footerData?.form
  const formObj = typeof rawForm === 'object' && rawForm !== null ? rawForm : null
  const formID = formObj?.id ?? null
  const confirmationType = (formObj as any)?.confirmationType ?? null
  const redirectUrl = (formObj as any)?.redirect?.url ?? null

  const logo =
    typeof footerData?.logo === 'object' && footerData.logo !== null
      ? (footerData.logo as Media)
      : null

  return (
    <Suspense>
      <FooterClient
        logo={logo ? { url: logo.url, alt: logo.alt } : null}
        tagline={footerData?.tagline ?? null}
        subnote={footerData?.subnote ?? null}
        disclaimer={footerData?.disclaimer ?? null}
        copyrightText={footerData?.copyrightText ?? null}
        instagramUrl={footerData?.instagramUrl ?? null}
        exploreLinks={(footerData?.exploreLinks ?? []).map((l) => ({ label: l.label ?? null, url: l.url ?? null }))}
        getStartedLinks={(footerData?.getStartedLinks ?? []).map((l) => ({ label: l.label ?? null, url: l.url ?? null }))}
        contentLinks={contentLinks}
        headings={{
          explore: dict.footer.explore,
          getStarted: dict.footer.getStarted,
          content: dict.footer.content,
        }}
        legalLinks={(footerData?.legalLinks ?? []).map((l) => ({ label: l.label ?? null, url: l.url ?? null }))}
        formID={formID != null ? String(formID) : undefined}
        confirmationType={confirmationType}
        redirectUrl={redirectUrl}
        defaultTheme={footerData?.theme ?? 'dark'}
        variants={(footerData?.variants ?? []).map((v) => {
          const raw = v as typeof v & { logo?: number | Media | null }
          const variantLogo =
            typeof raw.logo === 'object' && raw.logo !== null ? (raw.logo as Media) : null
          return {
            variantKey: v.variantKey,
            theme: v.theme,
            linkColor: v.linkColor,
            logo: variantLogo ? { url: variantLogo.url, alt: variantLogo.alt } : null,
          }
        })}
      />
    </Suspense>
  )
}
