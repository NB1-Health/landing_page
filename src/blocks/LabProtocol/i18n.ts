import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for LabProtocol's hardcoded "+ more" chip (LAB.151), from the
 * Lab workbook. Locales without an entry fall back to English. The IT workbook
 * cell reads "e altro"; the leading "+" is kept to match the chip in every other
 * locale.
 */
export type LabProtocolStrings = {
  moreChip: string // LAB.151
}

const en: LabProtocolStrings = { moreChip: '+ more' }
const de: LabProtocolStrings = { moreChip: '+ mehr' }
const fr: LabProtocolStrings = { moreChip: '+ en plus' }
const nl: LabProtocolStrings = { moreChip: '+ meer' }

const it: LabProtocolStrings = { moreChip: '+ altro' }

const BY_LOCALE: Partial<Record<AppLocale, LabProtocolStrings>> = { en, de, fr, nl, it }

export function getProtocolStrings(locale?: AppLocale): LabProtocolStrings {
  return (locale && BY_LOCALE[locale]) || en
}
