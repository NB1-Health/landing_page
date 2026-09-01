import type { AppLocale } from '@/i18n/config'
import { getCachedGlobal } from '@/utilities/getGlobals'

export type PublisherSchema = {
  name: string
  /** May be relative; callers resolve it against the site URL. */
  logoUrl?: string
}

/**
 * Last-resort name. Only used when Site Settings has no Organization JSON-LD, or
 * it has one with no `name`.
 */
const FALLBACK_NAME = 'NB1 Health GmbH'

/** `logo` in Organization JSON-LD is either a URL string or an ImageObject. */
function extractLogoUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value && typeof value === 'object') {
    const url = (value as { url?: unknown }).url
    if (typeof url === 'string' && url.trim()) return url.trim()
  }
  return undefined
}

/**
 * Publisher for Article structured data, read from the Organization JSON-LD in
 * Site Settings.
 *
 * `buildPostSchema` used to hardcode the publisher name and emit no logo at all.
 * Both were wrong: the site already has an editable Organization block that is
 * the obvious source of truth (a hardcoded name silently lies the day the
 * company is renamed), and Google's Article guidance asks for `publisher.logo`,
 * which the approved template's own JSON-LD stub includes.
 */
export async function getPublisherSchema(locale: AppLocale): Promise<PublisherSchema> {
  const settings = await getCachedGlobal('site-settings', 0, locale)()
  const org = settings?.organizationJsonLd

  if (!org || typeof org !== 'object') return { name: FALLBACK_NAME }

  const record = org as Record<string, unknown>
  const name =
    typeof record.name === 'string' && record.name.trim() ? record.name.trim() : FALLBACK_NAME

  return { name, logoUrl: extractLogoUrl(record.logo) }
}
