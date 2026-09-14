import { getFallbackLocale, type AppLocale } from '@/i18n/config'

/**
 * Display-label maps for `select` enum fields whose *values* are used as logic /
 * CSS keys (e.g. `band === 'Excellent'`, `s-${status}`), so the stored value
 * must stay the English enum. These maps translate only what is shown to the
 * user. Locales without an entry fall back to the raw English value.
 */
type LabelMap = Record<string, Partial<Record<AppLocale, string>>>

// LabReadingPanel archetype band (values: 'Excellent' | 'Needs work')
// 'Excellent' is the workbook's YP.yourdata.16 across all four languages.
// 'Needs work' is LAB.389, which has only FR/NL filled in — DE matches the
// LabReadingPanel zone label and IT follows it (see LabReadingPanel/i18n.ts).
export const BAND_LABELS: LabelMap = {
  Excellent: { de: 'Ausgezeichnet', fr: 'Excellent', nl: 'Uitstekend', it: 'Eccellente' },
  'Needs work': {
    de: 'Optimierungsbedarf',
    fr: 'Soutien nécessaire',
    nl: 'Ondersteuning nodig',
    it: 'Da migliorare',
  },
}

// LabComparison node status (values: 'Active' | 'Low' | 'Missing')
// Only 'Missing' has a workbook row (LAB.387, FR/NL only). 'Active' and 'Low'
// appear nowhere in the workbook, so their non-DE labels are written to match
// the DE wording already here and want a native review pass.
export const STATUS_LABELS: LabelMap = {
  Active: { de: 'Aktiv', fr: 'Actif', nl: 'Actief', it: 'Attivo' },
  Low: { de: 'Niedrig', fr: 'Faible', nl: 'Laag', it: 'Basso' },
  Missing: { de: 'Fehlt', fr: 'Absent', nl: 'Ontbreekt', it: 'Mancante' },
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
