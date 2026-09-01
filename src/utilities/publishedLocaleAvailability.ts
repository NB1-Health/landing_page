import type { Payload, PayloadRequest } from 'payload'

import { appLocales, defaultLocale, isAppLocale, type AppLocale } from '@/i18n/config'

export type PublicationCollection =
  | 'pages'
  | 'posts'
  | 'pillars'
  | 'scientific-articles'
  | 'lexicon-terms'
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

/**
 * Whether the collection's `slug` is a localized field.
 *
 * A localized slug arrives from a `locale: 'all'` read as a map keyed by locale;
 * a non-localized one arrives as a plain string that is the same in every
 * market. Reading the wrong shape does not throw — it silently returns
 * `undefined` for every locale, which reads as "published nowhere" and quietly
 * disables revalidation.
 *
 * Every content collection is localized now. The map is kept rather than
 * collapsed because it is the thing that has to stay in step with the field
 * configs, and a collection added with a non-localized slug should have to say so
 * here rather than inherit an assumption.
 */
const HAS_LOCALIZED_SLUG: Record<PublicationCollection, boolean> = {
  pages: true,
  pillars: true,
  // Flipped when `Posts.slug` became localized, alongside migration
  // `20260825_135859`. The two must move together: read a localized slug as a
  // scalar and every locale gets the English one; read a scalar as localized and
  // every locale gets `undefined`, which reads as "published nowhere" and
  // silently disables revalidation.
  posts: true,
  // Both declare `costomSlugField({ ..., localized: true })`. Verified against
  // the field call rather than assumed from the pattern — this map going out of
  // step with a collection config is the exact failure the comment above
  // describes, and it fails silently.
  'scientific-articles': true,
  'lexicon-terms': true,
}

function readExactSlug(
  collection: PublicationCollection,
  value: unknown,
  locale: AppLocale,
): unknown {
  return HAS_LOCALIZED_SLUG[collection] ? readExactLocalizedValue(value, locale) : value
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
