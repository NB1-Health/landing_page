import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for LabProtocol's hardcoded "+ more" chip (LAB.151), from the
 * Lab workbook. Locales without an entry fall back to English.
 */
export type LabProtocolStrings = {
  moreChip: string // LAB.151
}

const en: LabProtocolStrings = { moreChip: '+ more' }
const de: LabProtocolStrings = { moreChip: '+ mehr' }
const fr: LabProtocolStrings = { moreChip: '+ en plus' }
const nl: LabProtocolStrings = { moreChip: '+ meer' }

const BY_LOCALE: Partial<Record<AppLocale, LabProtocolStrings>> = { en, de, fr, nl }

export function getProtocolStrings(locale?: AppLocale): LabProtocolStrings {
  return (locale && BY_LOCALE[locale]) || en
}
