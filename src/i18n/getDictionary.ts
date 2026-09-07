import { defaultLocale, type AppLocale } from './config'
import { en } from './dictionaries/en'
import { de } from './dictionaries/de'
import { fr } from './dictionaries/fr'
import { nl } from './dictionaries/nl'
import { it } from './dictionaries/it'

const dictionaries = {
  en,
  de,
  fr,
  nl,
  it,
} as const

type DictLocale = keyof typeof dictionaries

function toDictLocale(locale?: string): DictLocale {
  if (locale === 'de' || locale === 'ch') return 'de'
  if (locale === 'fr') return 'fr'
  if (locale === 'nl' || locale === 'be') return 'nl'
  if (locale === 'it') return 'it'
  return 'en' // en, uk, uae, unknown
}

export function getDictionary(locale?: string) {
  return dictionaries[toDictLocale(locale)]
}
