import type { Payload, PayloadRequest } from 'payload'

import { appLocales, defaultLocale, isAppLocale, type AppLocale } from '@/i18n/config'

export type PublicationCollection = 'pages' | 'posts'
export type PublishedLocaleSlugs = Partial<Record<AppLocale, string>>

type PublicationDocument = {
  _status?: unknown
  slug?: unknown
  title?: unknown
}

type ResolvePublishedLocaleSlugsArgs = {
  collection: PublicationCollection
  id: number | string
} & (
  | {
      payload?: never
      req: PayloadRequest
      user?: never
    }
  | {
      payload: Payload
      req?: never
      user?: NonNullable<PayloadRequest['user']>
    }
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readExactLocalizedValue(value: unknown, locale: AppLocale): unknown {
  if (isRecord(value)) return value[locale]

  // A scalar can only be treated as exact for legacy/default-locale data.
  return locale === defaultLocale ? value : undefined
}

function readExactSlug(
  collection: PublicationCollection,
  value: unknown,
  locale: AppLocale,
): unknown {
  return collection === 'pages' ? readExactLocalizedValue(value, locale) : value
}

export function isPublishedForActiveLocale(status: unknown, locale: unknown): boolean {
  if (status === 'published') return true
  return typeof locale === 'string' && isAppLocale(locale)
    ? readExactLocalizedValue(status, locale) === 'published'
    : false
}

/**
 * Resolve live locale/slug pairs without Payload's content fallback. A required
 * localized title is used as the small, exact-content readiness check.
 */
export async function resolvePublishedLocaleSlugs(
  request: ResolvePublishedLocaleSlugsArgs,
): Promise<PublishedLocaleSlugs> {
  const { collection, id } = request
  const req = request.req
  const payload = request.payload ?? req?.payload
  if (!payload) throw new Error('resolvePublishedLocaleSlugs requires req or payload')
  const requestLocale = req?.locale

  try {
    const doc = (await payload.findByID({
      collection,
      id,
      depth: 0,
      disableErrors: true,
      draft: false,
      fallbackLocale: false,
      locale: 'all',
      overrideAccess: request.user ? false : true,
      ...(req ? { req } : {}),
      ...(request.user ? { user: request.user } : {}),
      select: { _status: true, slug: true, title: true },
    })) as PublicationDocument | null

    if (!doc) return {}

    const publishedSlugs: PublishedLocaleSlugs = {}

    for (const locale of appLocales) {
      const status = readExactLocalizedValue(doc._status, locale)
      const slug = readExactSlug(collection, doc.slug, locale)
      const title = readExactLocalizedValue(doc.title, locale)

      if (
        status === 'published' &&
        typeof slug === 'string' &&
        slug.length > 0 &&
        typeof title === 'string' &&
        title.trim().length > 0
      ) {
        publishedSlugs[locale] = slug
      }
    }

    return publishedSlugs
  } finally {
    if (req) req.locale = requestLocale
  }
}
