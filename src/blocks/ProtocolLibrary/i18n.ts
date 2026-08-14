import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for the ProtocolLibrary "components on file" count label.
 * Locales without an entry fall back to English.
 */
export type ProtocolLibraryStrings = {
  componentsOnFile: string
}

const en: ProtocolLibraryStrings = { componentsOnFile: 'components on file' }
const de: ProtocolLibraryStrings = { componentsOnFile: 'Inhaltsstoffe verfügbar in Datenbank' }
const fr: ProtocolLibraryStrings = { componentsOnFile: 'composants disponibles' }
const nl: ProtocolLibraryStrings = { componentsOnFile: 'componentenbibliotheek' }

const BY_LOCALE: Partial<Record<AppLocale, ProtocolLibraryStrings>> = { en, de, fr, nl }

export function getLibraryStrings(locale?: AppLocale): ProtocolLibraryStrings {
  return (locale && BY_LOCALE[locale]) || en
}
