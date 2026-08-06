import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import type { AuthenticatedDraft } from '@/utilities/authenticatedDraft'

function safeLocale(locale?: string): AppLocale {
  return isAppLocale(locale ?? '') ? (locale as AppLocale) : 'en'
}

async function fetchHeaderById(
  id: string,
  locale?: string,
  read: AuthenticatedDraft = { draft: false, user: null },
) {
  const payload = await getPayload({ config: configPromise })
  return payload.findByID({
    collection: 'headers',
    id,
    draft: read.draft,
    depth: 2,
    disableErrors: true,
    locale: safeLocale(locale),
    overrideAccess: false,
    user: read.user,
  })
}

async function fetchDefaultHeader(
  locale?: string,
  read: AuthenticatedDraft = { draft: false, user: null },
) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'headers',
    draft: read.draft,
    where: { isDefault: { equals: true } },
    limit: 1,
    pagination: false,
    sort: '-updatedAt',
    depth: 2,
    locale: safeLocale(locale),
    overrideAccess: false,
    user: read.user,
  })
  return result.docs[0] ?? null
}

async function fetchFooterById(
  id: string,
  locale?: string,
  read: AuthenticatedDraft = { draft: false, user: null },
) {
  const payload = await getPayload({ config: configPromise })
  return payload.findByID({
    collection: 'footers',
    id,
    draft: read.draft,
    depth: 1,
    disableErrors: true,
    locale: safeLocale(locale),
    overrideAccess: false,
    user: read.user,
  })
}

async function fetchDefaultFooter(
  locale?: string,
  read: AuthenticatedDraft = { draft: false, user: null },
) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'footers',
    draft: read.draft,
    where: { isDefault: { equals: true } },
    limit: 1,
    pagination: false,
    sort: '-updatedAt',
    depth: 1,
    locale: safeLocale(locale),
    overrideAccess: false,
    user: read.user,
  })
  return result.docs[0] ?? null
}

export const getCachedHeader = (id: string | null | undefined, locale?: string) => {
  if (id) {
    return unstable_cache(async () => {
      const header = await fetchHeaderById(id, locale)
      return header ?? fetchDefaultHeader(locale)
    }, ['header', id, locale ?? 'en'], {
      tags: [`header_${id}`, 'header_default'],
    })
  }
  return unstable_cache(() => fetchDefaultHeader(locale), ['header', 'default', locale ?? 'en'], {
    tags: ['header_default'],
  })
}

export const getCachedFooter = (id: string | null | undefined, locale?: string) => {
  if (id) {
    return unstable_cache(async () => {
      const footer = await fetchFooterById(id, locale)
      return footer ?? fetchDefaultFooter(locale)
    }, ['footer', id, locale ?? 'en'], {
      tags: [`footer_${id}`, 'footer_default'],
    })
  }
  return unstable_cache(() => fetchDefaultFooter(locale), ['footer', 'default', locale ?? 'en'], {
    tags: ['footer_default'],
  })
}

export async function getHeader(
  id: string | null | undefined,
  locale?: string,
  read?: AuthenticatedDraft,
) {
  if (read?.draft && read.user) {
    if (!id) return fetchDefaultHeader(locale, read)
    return (await fetchHeaderById(id, locale, read)) ?? fetchDefaultHeader(locale, read)
  }

  return getCachedHeader(id, locale)()
}

export async function getFooter(
  id: string | null | undefined,
  locale?: string,
  read?: AuthenticatedDraft,
) {
  if (read?.draft && read.user) {
    if (!id) return fetchDefaultFooter(locale, read)
    return (await fetchFooterById(id, locale, read)) ?? fetchDefaultFooter(locale, read)
  }

  return getCachedFooter(id, locale)()
}
