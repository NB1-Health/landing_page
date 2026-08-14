import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for the "N components" formula counter. The component switches
 * to the singular form when the count is exactly 1, so both forms are needed.
 * Plural forms were supplied directly; singular forms follow standard grammar.
 * Locales without an entry fall back to English.
 */
export type BiologyReadingToFormulaStrings = {
  componentSingular: string
  componentPlural: string
}

const en: BiologyReadingToFormulaStrings = { componentSingular: 'component', componentPlural: 'components' }
const de: BiologyReadingToFormulaStrings = { componentSingular: 'Bestandteil', componentPlural: 'Bestandteile' }
const fr: BiologyReadingToFormulaStrings = { componentSingular: 'composant', componentPlural: 'composants' }
const nl: BiologyReadingToFormulaStrings = { componentSingular: 'component', componentPlural: 'componenten' }

const BY_LOCALE: Partial<Record<AppLocale, BiologyReadingToFormulaStrings>> = { en, de, fr, nl }

export function getReadingToFormulaStrings(locale?: AppLocale): BiologyReadingToFormulaStrings {
  return (locale && BY_LOCALE[locale]) || en
}

/** "N component" / "N components", localized. */
export function formatComponentCount(n: number, s: BiologyReadingToFormulaStrings): string {
  return `${n} ${n === 1 ? s.componentSingular : s.componentPlural}`
}
