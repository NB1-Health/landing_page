import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for the code-applied "Independent Validator" badge (LAB.220),
 * from the Lab workbook. Locales without an entry fall back to English.
 */
export type LabScienceBoardStrings = {
  independentValidator: string // LAB.220
}

const en: LabScienceBoardStrings = { independentValidator: 'Independent Validator' }
const de: LabScienceBoardStrings = { independentValidator: 'Unabhängiger wissenschaftlicher Gutachter' }
const fr: LabScienceBoardStrings = { independentValidator: 'Validateur indépendant' }
const nl: LabScienceBoardStrings = { independentValidator: 'Onafhankelijke controle' }

const BY_LOCALE: Partial<Record<AppLocale, LabScienceBoardStrings>> = { en, de, fr, nl }

export function getScienceBoardStrings(locale?: AppLocale): LabScienceBoardStrings {
  return (locale && BY_LOCALE[locale]) || en
}
