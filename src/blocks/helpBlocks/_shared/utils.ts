import { getMediaUrl } from '@/utilities/getMediaUrl'
import { normalizeSlug } from '@/utilities/slugify'

/**
 * An upload field as it arrives in a block component: populated `Media`, a bare
 * id when depth is 0, or null.
 */
export type MediaLike =
  | { url?: string | null; alt?: string | null; mimeType?: string | null }
  | string
  | number
  | null
  | undefined

export function mediaUrl(m?: MediaLike): string {
  if (!m || typeof m === 'string' || typeof m === 'number') return ''
  return m.url ? getMediaUrl(m.url) : ''
}

export function mediaAlt(m?: MediaLike, fallback = ''): string {
  if (!m || typeof m === 'string' || typeof m === 'number') return fallback
  return m.alt ?? fallback
}

/**
 * Prefix an editor-entered path with the current locale.
 *
 * Absolute URLs, `mailto:`, `tel:` and bare fragments are left alone, and a
 * path that already carries the locale is not prefixed twice. Note the
 * `=== '/xx'` / `startsWith('/xx/')` pair rather than a plain `startsWith`:
 * `/en-route` must not be mistaken for an already-localized `/en` path.
 */
export function localizedHref(href: string | null | undefined, locale?: string | null): string {
  const raw = (href || '').trim()
  if (!raw) return ''
  if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(raw)) return raw
  if (!locale) return raw
  if (raw === `/${locale}` || raw.startsWith(`/${locale}/`)) return raw
  return `/${locale}${raw.startsWith('/') ? '' : '/'}${raw}`
}

/**
 * Anchor id for a step heading — used by the contents rail and by any link
 * pointing at a specific step. Falls back to a slug of the title, then to a
 * positional id so the rail never produces duplicate or empty hrefs.
 */
export function helpAnchor(
  explicit: string | null | undefined,
  title: string | null | undefined,
  index: number,
): string {
  const fromField = normalizeSlug((explicit || '').trim())
  if (fromField) return fromField
  const fromTitle = normalizeSlug((title || '').trim())
  return fromTitle || `step-${index + 1}`
}
