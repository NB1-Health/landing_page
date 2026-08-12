import { createHmac, timingSafeEqual } from 'node:crypto'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import { isSafePageSlug } from '@/utilities/pagePublication'

export const previewCollections = ['pages', 'posts'] as const
export type PreviewCollection = (typeof previewCollections)[number]

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

function previewTokenMessage(target: NonNullable<ReturnType<typeof getPreviewTarget>>) {
  return `${target.locale}:${target.collection}:${target.slug}`
}

export function signPreviewTarget({
  secret,
  target,
}: {
  secret: string
  target: NonNullable<ReturnType<typeof getPreviewTarget>>
}) {
  return createHmac('sha256', secret).update(previewTokenMessage(target)).digest('hex')
}

export function verifyPreviewToken({
  secret,
  target,
  token,
}: {
  secret: unknown
  target: NonNullable<ReturnType<typeof getPreviewTarget>>
  token: unknown
}) {
  if (
    !isUsablePreviewSecret(secret) ||
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return false
  }

  const expected = signPreviewTarget({ secret, target })
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'))
}
