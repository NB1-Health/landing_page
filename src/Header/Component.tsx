import { getCachedHeader } from '@/utilities/getHeaderFooter'
import { getCachedJournalNav } from '@/utilities/journalNav'
import { isAppLocale } from '@/i18n/config'
import React, { Suspense } from 'react'

import type { Media } from '@/payload-types'
import { getServerCurrency } from '@/utilities/currency'
import { HeaderClient } from './Component.client'
import type { LocalizedDocument } from './localizedDocument'

type RawLink = {
  label?: string | null
  localizedLabel?: string | null
  url?: string | null
  newTab?: boolean | null
  [key: string]: unknown
} | null

type HeaderData = {
  logo?: number | Media | null
  logoDark?: number | Media | null
  theme?: 'light' | 'dark' | null
  darkHero?: boolean | null
  loginText?: string | null
  loginUrl?: string | null
  loginTextColor?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  navItems?: Array<{ link?: RawLink }> | null
  variants?: Array<{
    variantKey: string
    theme: 'light' | 'dark'
    loginTextColor?: string | null
  }> | null
  sectionNavEnabled?: boolean | null
  sectionNavItems?: Array<{
    sectionId: string
    label: string
  }> | null
  discoverNavEnabled?: boolean | null
  discoverNavLabel?: string | null
  discoverNavItems?: Array<{ link?: RawLink }> | null
}

// Shared by navItems and discoverNavItems — both use the same `link()` field
// shape (internal page reference vs custom URL), so the slug/URL resolution
// logic only needs to live once.
function resolveNavLink(link: RawLink, locale: string) {
  if (!link) return null
  const linkType = (link as any).type
  let url: string | null = null
  if (linkType === 'custom') {
    const customUrl = (link as any).url as string | null | undefined
    url = customUrl
      ? customUrl.startsWith('/') || customUrl.startsWith('http')
        ? customUrl
        : `/${customUrl}`
      : null
  } else {
    const ref = (link as any).reference
    const refDoc = ref?.value ?? ref
    const rawSlug = typeof refDoc === 'object' && refDoc !== null ? refDoc.slug : undefined
    const slug =
      typeof rawSlug === 'string'
        ? rawSlug
        : ((rawSlug as any)?.[locale] ?? (rawSlug as any)?.['en'])
    url = slug ? (slug === 'home-page' ? `/${locale}` : `/${locale}/${slug}`) : null
  }
  return {
    label: link.label ?? null,
    localizedLabel: link.localizedLabel ?? null,
    url,
    newTab: (link as any).newTab ?? null,
  }
}

function pickMedia(val: number | Media | null | undefined) {
  if (typeof val === 'object' && val !== null) {
    const m = val as Media
    return { url: m.url, alt: m.alt, width: m.width, height: m.height }
  }
  return null
}

type Props = {
  locale: string
  id?: string | null
  /** The current document's route shape and published localized slugs. Passed
   * from the page template rather than stored globally, so client navigation
   * cannot leave the switcher pointing at the previously hard-loaded page. */
  localizedDocument?: LocalizedDocument | null
}

export async function Header({ locale, id, localizedDocument }: Props) {
  const data = (await getCachedHeader(id, locale)()) as HeaderData | null
  // Resolved server-side from the cookie so the initial currency label
  // matches what HeaderClient hydrates with — previously HeaderClient read
  // localStorage in its useState initializer, which is unavailable during
  // SSR (always fell back to 'EUR') but available on the client (the real
  // stored value), causing a text mismatch on hydration whenever a
  // returning visitor had a non-EUR currency saved.
  const initialCurrency = await getServerCurrency(locale)

  // The Journal branch of the Discover menu. Fetched here rather than in the
  // client component because it is CMS data — generated from hub and pillar
  // slugs — and every link in it has to be a real `<a href>` in the HTML the
  // server sends, which §12 requires and the JS-off test checks.
  //
  // Returns null in a locale with no hub slugs, which is how `fr`/`nl`/`be`
  // correctly get four Discover items instead of five.
  //
  // `Props.locale` is `string` — the Header is rendered from several layouts and
  // widening it would ripple into every caller — so it is narrowed here. An
  // unrecognised locale gets no Journal branch rather than a guessed one, which
  // is the same answer a locale with no hub slugs gets.
  const journalNav = isAppLocale(locale) ? await getCachedJournalNav(locale)() : null

  if (!data) return null

  return (
    <Suspense>
      <HeaderClient
        locale={locale}
        localizedDocument={localizedDocument ?? null}
        initialCurrency={initialCurrency}
        logo={pickMedia(data?.logo)}
        logoDark={pickMedia(data?.logoDark)}
        defaultTheme={data?.theme ?? 'light'}
        darkHero={data?.darkHero ?? false}
        loginText={data?.loginText ?? null}
        loginUrl={data?.loginUrl ?? null}
        loginTextColor={data?.loginTextColor ?? null}
        ctaLabel={data?.ctaLabel ?? null}
        ctaUrl={data?.ctaUrl ?? null}
        navItems={(data?.navItems ?? []).map((item) => ({
          link: resolveNavLink(item.link ?? null, locale),
        }))}
        discoverNavEnabled={data?.discoverNavEnabled ?? false}
        discoverNavLabel={data?.discoverNavLabel ?? null}
        discoverNavItems={(data?.discoverNavItems ?? []).map((item) => ({
          link: resolveNavLink(item.link ?? null, locale),
        }))}
        journalNav={journalNav}
        variants={data?.variants ?? []}
        sectionNavEnabled={data?.sectionNavEnabled ?? false}
        sectionNavItems={(data?.sectionNavItems ?? []).map((item) => ({
          sectionId: item.sectionId,
          label: item.label,
        }))}
      />
    </Suspense>
  )
}
