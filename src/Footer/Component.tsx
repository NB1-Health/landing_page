import { getFooter } from '@/utilities/getHeaderFooter'
import React, { Suspense } from 'react'

import type { Media } from '@/payload-types'
import type { AuthenticatedDraft } from '@/utilities/authenticatedDraft'
import { FooterClient } from './FooterClient'

type Props = {
  locale: string
  id?: string | null
  read?: AuthenticatedDraft
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

export async function Footer({ locale, id, read }: Props) {
  const footerData = (await getFooter(id, locale, read)) as FooterData | null

  if (!footerData) return null

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
