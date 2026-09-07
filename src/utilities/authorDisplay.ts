import { localeConfig, type AppLocale } from '@/i18n/config'

/**
 * An author, as a template needs one.
 *
 * Normalized from the `authors` record at the read boundary so no template has to
 * guess whether a relationship arrived populated or as a bare id, and so a
 * missing field is `null` rather than `undefined`, `''` or the string "null".
 */
export type AuthorProfileLink = { label: string; url: string }

export type AuthorDisplay = {
  name: string
  credentials: string | null
  roleTitle: string | null
  affiliation: string | null
  bio: string | null
  slug: string | null
  avatar: { src: string; alt: string } | null
  /**
   * Up to three, per designer brief §4.
   *
   * The legacy single `website` field is folded in here rather than kept beside
   * them, so the author box has one list to render instead of two sources to
   * reconcile. A record that has both keeps the array and ignores `website` —
   * the array is the newer, explicit answer.
   */
  profileLinks: AuthorProfileLink[]
}

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/**
 * Returns null for anything that is not a usable author.
 *
 * A relationship at depth 0 is a bare id, and an author with no name is a record
 * someone started and abandoned. Both render as an empty byline otherwise —
 * which on a health page is worse than no byline at all, because the slot still
 * claims a named human stands behind the content.
 */
export function toAuthorDisplay(value: unknown): AuthorDisplay | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const name = clean(record.name)
  if (!name) return null

  const avatar = record.avatar
  const avatarUrl =
    avatar && typeof avatar === 'object' ? clean((avatar as Record<string, unknown>).url) : null

  return {
    name,
    credentials: clean(record.credentials),
    roleTitle: clean(record.roleTitle),
    affiliation: clean(record.affiliation),
    bio: clean(record.bio),
    slug: clean(record.slug),
    avatar: avatarUrl
      ? { src: avatarUrl, alt: clean((avatar as Record<string, unknown>).alt) ?? name }
      : null,
    profileLinks: readProfileLinks(record.profileLinks, clean(record.website)),
  }
}

/**
 * The profile links, capped at three.
 *
 * A row needs both a label and a URL to be a link; one without the other is a
 * half-filled row, and rendering it produces either an unlabelled anchor or a
 * label that goes nowhere. `website` is used only when the array is empty, so
 * migrating an author to the array does not leave the old value showing as a
 * fourth entry.
 */
function readProfileLinks(value: unknown, website: string | null): AuthorProfileLink[] {
  const rows = Array.isArray(value) ? value : []

  const links = rows
    .map((row): AuthorProfileLink | null => {
      if (!row || typeof row !== 'object') return null
      const entry = row as Record<string, unknown>
      const label = clean(entry.label)
      const url = clean(entry.url)
      return label && url ? { label, url } : null
    })
    .filter((link): link is AuthorProfileLink => link !== null)
    .slice(0, 3)

  if (links.length > 0) return links
  return website ? [{ label: 'Profile', url: website }] : []
}

/** The first usable author from a `hasMany` relationship. */
export function firstAuthor(value: unknown): AuthorDisplay | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const author = toAuthorDisplay(entry)
      if (author) return author
    }
    return null
  }
  return toAuthorDisplay(value)
}

/**
 * A review date, in the reader's locale.
 *
 * `Intl` needs a BCP-47 tag and our locale codes are not all valid ones — `ch`,
 * `be` and `uae` are market codes, not languages. `localeConfig` already carries
 * the real tag as `htmlLang` for the `<html lang>` attribute, so it is reused
 * here rather than mapped a second time.
 *
 * Day-month-year with a spelled month, never numeric: 03/04/2026 is two different
 * dates depending on which side of the Atlantic reads it, and this line appears
 * on medical content.
 */
export function formatReviewDate(value: unknown, locale: AppLocale): string | null {
  const raw = typeof value === 'string' || value instanceof Date ? value : null
  if (!raw) return null

  const date = raw instanceof Date ? raw : new Date(raw)
  if (Number.isNaN(date.getTime())) return null

  try {
    return new Intl.DateTimeFormat(localeConfig[locale]?.htmlLang ?? 'en', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date)
  } catch {
    // An unknown tag should not take the page down over a date line.
    return date.toISOString().slice(0, 10)
  }
}
