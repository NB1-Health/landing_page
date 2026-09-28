/**
 * Site locale → Mention Me campaign locale (`lang_REGION`).
 *
 * Only list locales that have a live Mention Me campaign: anything unmapped falls back
 * to en_GB, which is also Mention Me's own default. `ch` has no campaign of its own, so
 * Swiss pages (German-language) use the de_DE one.
 */
const MM_LOCALE: Record<string, string> = {
  de: 'de_DE',
  ch: 'de_DE',
}

export const MM_DEFAULT_LOCALE = 'en_GB'

export function toMentionMeLocale(siteLocale?: string | null): string {
  if (!siteLocale) return MM_DEFAULT_LOCALE
  return MM_LOCALE[siteLocale.toLowerCase()] ?? MM_DEFAULT_LOCALE
}
