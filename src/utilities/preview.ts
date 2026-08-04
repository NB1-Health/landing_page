import { createHmac, timingSafeEqual } from 'node:crypto'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import { isSafePageSlug } from '@/utilities/pagePublication'

export const previewCollections = ['pages', 'posts'] as const
export type PreviewCollection = (typeof previewCollections)[number]

const PREVIEW_TOKEN_TTL_SECONDS = 5 * 60
const MAX_FUTURE_SKEW_SECONDS = 30

export function isPreviewCollection(value: unknown): value is PreviewCollection {
  return typeof value === 'string' && previewCollections.includes(value as PreviewCollection)
}

export function isUsablePreviewSecret(secret: unknown): secret is string {
  return typeof secret === 'string' && secret.length >= 32
}

export function getPreviewTarget({
  collection,
  locale,
  slug,
}: {
  collection: unknown
  locale: unknown
  slug: unknown
}): { collection: PreviewCollection; locale: AppLocale; path: string; slug: string } | null {
  if (!isPreviewCollection(collection) || typeof locale !== 'string' || !isAppLocale(locale)) {
    return null
  }
  if (!isSafePageSlug(slug)) return null

  const path =
    collection === 'pages'
      ? locale === 'en' && (slug === 'home' || slug === 'home-page')
        ? `/${locale}`
        : `/${locale}/${slug}`
      : `/${locale}/posts/${slug}`

  return { collection, locale, path, slug }
}

function previewTokenMessage(
  target: NonNullable<ReturnType<typeof getPreviewTarget>>,
  timestamp: number,
) {
  return `${timestamp}:${target.locale}:${target.collection}:${target.slug}`
}

export function signPreviewTarget({
  secret,
  target,
  timestamp,
}: {
  secret: string
  target: NonNullable<ReturnType<typeof getPreviewTarget>>
  timestamp: number
}) {
  return createHmac('sha256', secret).update(previewTokenMessage(target, timestamp)).digest('hex')
}

export function verifyPreviewToken({
  now = Date.now(),
  secret,
  target,
  timestamp,
  token,
}: {
  now?: number
  secret: unknown
  target: NonNullable<ReturnType<typeof getPreviewTarget>>
  timestamp: unknown
  token: unknown
}) {
  if (
    !isUsablePreviewSecret(secret) ||
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return false
  }

  const issuedAt = typeof timestamp === 'string' ? Number(timestamp) : timestamp
  if (!Number.isInteger(issuedAt)) return false

  const nowSeconds = Math.floor(now / 1000)
  if (
    (issuedAt as number) > nowSeconds + MAX_FUTURE_SKEW_SECONDS ||
    nowSeconds - (issuedAt as number) > PREVIEW_TOKEN_TTL_SECONDS
  ) {
    return false
  }

  const expected = signPreviewTarget({ secret, target, timestamp: issuedAt as number })
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
}
