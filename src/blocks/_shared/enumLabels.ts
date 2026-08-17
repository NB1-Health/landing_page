import { getFallbackLocale, type AppLocale } from '@/i18n/config'

/**
 * Display-label maps for `select` enum fields whose *values* are used as logic /
 * CSS keys (e.g. `band === 'Excellent'`, `s-${status}`), so the stored value
 * must stay the English enum. These maps translate only what is shown to the
 * user. Locales without an entry fall back to the raw English value.
 */
type LabelMap = Record<string, Partial<Record<AppLocale, string>>>

// LabReadingPanel archetype band (values: 'Excellent' | 'Needs work')
export const BAND_LABELS: LabelMap = {
  Excellent: { de: 'Ausgezeichnet' },
  'Needs work': { de: 'Optimierungsbedarf', fr: 'Soutien nécessaire', nl: 'Ondersteuning nodig' },
}

// LabComparison node status (values: 'Active' | 'Low' | 'Missing')
export const STATUS_LABELS: LabelMap = {
  Active: { de: 'Aktiv' },
  Low: { de: 'Niedrig' },
  Missing: { de: 'Fehlt', fr: 'Absent', nl: 'Ontbreekt' },
}

/**
 * Return the localized label for an enum value, falling back to the locale's
 * configured parent language (ch → de, be → nl) and then to the English value.
 */
export function enumLabel(
  map: LabelMap,
  value: string | null | undefined,
  locale?: AppLocale,
): string {
  if (!value) return ''
  if (!locale) return value
  const entry = map[value]
  if (!entry) return value
  const fallback = getFallbackLocale(locale)
  return entry[locale] || (fallback && entry[fallback]) || value
}
