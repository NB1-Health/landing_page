import type { PayloadRequest } from 'payload'
import { appLocales, defaultLocale } from '@/i18n/config'
import {
  getPreviewTarget,
  isUsablePreviewSecret,
  signPreviewTarget,
  type PreviewCollection,
} from '@/utilities/preview'

type Props = {
  collection: PreviewCollection
  slug: string | Partial<Record<string, string>> | null | undefined
  req: PayloadRequest
}

function getLocale(req: PayloadRequest): string {
  const queryLocale = (req.query as Record<string, unknown> | undefined)?.locale
  const candidate =
    req.locale || req.i18n?.language || (typeof queryLocale === 'string' ? queryLocale : undefined)

  const locale = typeof candidate === 'string' ? candidate.trim() : ''
  // Guard against an empty or stale "undefined" admin locale, which would
  // otherwise produce a `/undefined/<slug>` path and a 404 in the live-preview
  // iframe. Only real frontend locales (see @/i18n/config) are allowed.
  return (appLocales as readonly string[]).includes(locale) ? locale : defaultLocale
}

function getFrontendURL(): string {
  // Set this to your STG frontend URL in Payload env
  const url =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_SITE_URL

  return (url || 'http://localhost:3000').replace(/\/+$/g, '')
}

export const generatePreviewPath = ({ collection, slug, req }: Props) => {
  if (slug === undefined || slug === null) return null

  const locale = getLocale(req)
  const resolvedSlug = typeof slug === 'string' ? slug : (slug[locale] ?? '')
  const target = getPreviewTarget({ collection, locale, slug: resolvedSlug })
  const secret = process.env.NEXT_PUBLIC_PREVIEW_SECRET
  if (!target || !isUsablePreviewSecret(secret)) return null

  const token = signPreviewTarget({ secret, target })
  const params = new URLSearchParams({
    collection,
    slug: target.slug,
    token,
  })

  const frontendURL = getFrontendURL()

  return `${frontendURL}/${target.locale}/next/preview?${params.toString()}`
}
