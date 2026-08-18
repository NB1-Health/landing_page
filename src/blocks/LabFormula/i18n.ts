import { getFallbackLocale, type AppLocale } from '@/i18n/config'

/**
 * Localized copy for LabFormula strings that live in code (not the CMS): the two
 * captions inside the "basics" scene SVG and the dose-bar scale labels. All from
 * the Lab workbook. `en` mirrors the exact text baked into art.ts (scene captions
 * without a trailing period; dose labels title-cased) so English is unchanged;
 * the dose labels are lower-cased at injection time for the SVG axis, matching
 * the original art. Locales without an entry fall back to English.
 *
 * `sourceSample`/`sourceQuest` are the job-tag pills, previously an unlocalized
 * `SOURCE_LABELS` map in constants.ts. Only the FR/NL sample label was supplied;
 * the DE pair and both questionnaire labels were translated in-house, so they are
 * worth a review pass once they land in the workbook.
 */
export type LabFormulaStrings = {
  sceneWashesThrough: string // LAB.112
  sceneStaysWorks: string // LAB.115
  doseTooLittle: string // LAB.132
  doseRightForYou: string // LAB.133
  doseTooMuch: string // LAB.134
  sourceSample: string // job-tag pill; CSS-uppercased, so store sentence case
  sourceQuest: string // ditto
}

const en: LabFormulaStrings = {
  sceneWashesThrough: 'On its own, it washes through',
  sceneStaysWorks: 'Fed the right fibre, it stays and works',
  doseTooLittle: 'Too little',
  doseRightForYou: 'Right for you',
  doseTooMuch: 'Too much',
  sourceSample: 'From your sample',
  sourceQuest: 'From your questionnaire',
}

const de: LabFormulaStrings = {
  sceneWashesThrough: 'Ohne Nahrung, werden sie direkt wieder ausgeschieden',
  sceneStaysWorks: 'Mit der passenden Nahrungsquelle können sie ihre angedachte Aufgabe erledigen',
  doseTooLittle: 'Zu wenig',
  doseRightForYou: 'Ideal für dich',
  doseTooMuch: 'Zu viel',
  sourceSample: 'Aus deiner Probe',
  sourceQuest: 'Aus deinem Fragebogen',
}

const fr: LabFormulaStrings = {
  sceneWashesThrough: 'Sans ça, elles ne font que passer.',
  sceneStaysWorks: 'Avec la bonne fibre, elles restent et agissent.',
  doseTooLittle: 'Pas assez',
  doseRightForYou: "Pile ce qu'il vous faut",
  doseTooMuch: 'Trop',
  sourceSample: 'Issu de votre échantillon',
  sourceQuest: 'Issu de votre questionnaire',
}

const nl: LabFormulaStrings = {
  sceneWashesThrough: 'Zonder de juiste voeding spoelt het er zo weer uit.',
  sceneStaysWorks: 'Geef je ze de juiste vezels, dan blijven ze en doen ze hun werk.',
  doseTooLittle: 'Te weinig',
  doseRightForYou: 'Past bij jou',
  doseTooMuch: 'Te veel',
  sourceSample: 'Op basis van jouw sample',
  sourceQuest: 'Op basis van jouw vragenlijst',
}

const BY_LOCALE: Partial<Record<AppLocale, LabFormulaStrings>> = { en, de, fr, nl }

/** Resolves via the locale's configured parent language (ch → de, be → nl) before English. */
export function getFormulaStrings(locale?: AppLocale): LabFormulaStrings {
  if (!locale) return en
  const direct = BY_LOCALE[locale]
  if (direct) return direct
  const fallback = getFallbackLocale(locale)
  return (fallback && BY_LOCALE[fallback]) || en
}
