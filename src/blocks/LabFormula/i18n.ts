import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for LabFormula strings that live in code (not the CMS): the two
 * captions inside the "basics" scene SVG and the dose-bar scale labels. All from
 * the Lab workbook. `en` mirrors the exact text baked into art.ts (scene captions
 * without a trailing period; dose labels title-cased) so English is unchanged;
 * the dose labels are lower-cased at injection time for the SVG axis, matching
 * the original art. Locales without an entry fall back to English.
 */
export type LabFormulaStrings = {
  sceneWashesThrough: string // LAB.112
  sceneStaysWorks: string // LAB.115
  doseTooLittle: string // LAB.132
  doseRightForYou: string // LAB.133
  doseTooMuch: string // LAB.134
}

const en: LabFormulaStrings = {
  sceneWashesThrough: 'On its own, it washes through',
  sceneStaysWorks: 'Fed the right fibre, it stays and works',
  doseTooLittle: 'Too little',
  doseRightForYou: 'Right for you',
  doseTooMuch: 'Too much',
}

const de: LabFormulaStrings = {
  sceneWashesThrough: 'Ohne Nahrung, werden sie direkt wieder ausgeschieden',
  sceneStaysWorks: 'Mit der passenden Nahrungsquelle können sie ihre angedachte Aufgabe erledigen',
  doseTooLittle: 'Zu wenig',
  doseRightForYou: 'Ideal für dich',
  doseTooMuch: 'Zu viel',
}

const fr: LabFormulaStrings = {
  sceneWashesThrough: 'Sans ça, elles ne font que passer.',
  sceneStaysWorks: 'Avec la bonne fibre, elles restent et agissent.',
  doseTooLittle: 'Pas assez',
  doseRightForYou: "Pile ce qu'il vous faut",
  doseTooMuch: 'Trop',
}

const nl: LabFormulaStrings = {
  sceneWashesThrough: 'Zonder de juiste voeding spoelt het er zo weer uit.',
  sceneStaysWorks: 'Geef je ze de juiste vezels, dan blijven ze en doen ze hun werk.',
  doseTooLittle: 'Te weinig',
  doseRightForYou: 'Past bij jou',
  doseTooMuch: 'Te veel',
}

const BY_LOCALE: Partial<Record<AppLocale, LabFormulaStrings>> = { en, de, fr, nl }

export function getFormulaStrings(locale?: AppLocale): LabFormulaStrings {
  return (locale && BY_LOCALE[locale]) || en
}
