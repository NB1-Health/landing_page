import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for LabComparison's hardcoded UI strings — the two mobile tab
 * buttons and the 16S figure caption. The caption's CMS field (`leftCaption`) is
 * not wired yet, so this is the live source for it. Locales without an entry fall
 * back to English. DE, FR and NL are all from the Lab workbook
 * (LAB.085 / LAB.086 / LAB.090).
 */
export type LabComparisonStrings = {
  tab16s: string // mobile tab: the "most gut tests" figure
  tabUs: string // mobile tab: the "our method" figure
  caption: string // caption under the 16S figure (leftCaption fallback)
}

const en: LabComparisonStrings = {
  tab16s: 'Most gut tests',
  tabUs: 'Our gut test',
  caption: 'Every microbe is just a dot. All you learn is that it exists.',
}

const de: LabComparisonStrings = {
  tab16s: 'Die meisten Darm-Tests',
  tabUs: 'Unser Testverfahren',
  caption: 'Jede Mikrobe ist ein kleiner, grauer Datenpunkt. Du weißt aktuell also nur, dass sie "da ist".',
}

const fr: LabComparisonStrings = {
  tab16s: 'La plupart des tests intestinaux',
  tabUs: 'Notre test intestinal',
  caption: 'Chaque microbe n’est qu’un point. Vous apprends juste qu’il existe.',
}

const nl: LabComparisonStrings = {
  tab16s: 'De meeste darmtesten',
  tabUs: 'Onze darmtest',
  caption: 'Elke microbe is niet meer dan een stip. Meer dan dat je ’m hebt, leer je niet.',
}

const BY_LOCALE: Partial<Record<AppLocale, LabComparisonStrings>> = { en, de, fr, nl }

export function getComparisonStrings(locale?: AppLocale): LabComparisonStrings {
  return (locale && BY_LOCALE[locale]) || en
}
