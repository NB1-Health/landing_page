import type { AppLocale } from '@/i18n/config'

/**
 * Localized copy for the reading-dashboard's hardcoded UI strings — the pieces
 * that live in code (data-viz labels, status pills, computed score notes) rather
 * than in the CMS. Values keyed to the enum/position logic still use the English
 * key; only the displayed text is localized. Locales without an entry fall back
 * to English. German comes from the Lab translations workbook (LAB.295–327).
 */
export type LRPStrings = {
  dims: string[] // 5, DIMS order
  teams: { name: string; sub: string }[] // 6, TEAM_DEFS order
  ratios: { name: string; bad: string; good: string }[] // 4, RATIO_DEFS order
  status: Record<'Low' | 'High' | 'In range', string> // teamStatus labels
  zone: Record<'In range' | 'Watch' | 'Needs work', string> // ratioZone labels
  borderline: string
  note: {
    hold: string
    stress: string
    lowest: string // template with {p} placeholder for the pillar name
    lowerPillar: boolean // lowercase the pillar inside the sentence (EN grammar)
  }
}

const en: LRPStrings = {
  dims: ['Health', 'Diversity', 'Metabolic', 'Team balance', 'Safety'],
  teams: [
    { name: 'Fibre', sub: 'break down fibre' },
    { name: 'Butyrate', sub: 'make butyrate' },
    { name: 'Cross-feeders', sub: 'pass nutrients along' },
    { name: 'Bifido', sub: 'feed the acetate base' },
    { name: 'Mucus', sub: 'turn over the mucus layer' },
    { name: 'Protein', sub: 'ferment protein' },
  ],
  ratios: [
    { name: 'Main fuel preference', bad: 'Protein-driven', good: 'Carbohydrate-driven' },
    { name: 'Fermentation efficiency', bad: 'Stalled', good: 'Efficient' },
    { name: 'Gut-lining dependence', bad: 'Feeding on the lining', good: 'Diet-fed' },
    { name: 'Harsh by-products', bad: 'Putrefactive', good: 'SCFA-dominant' },
  ],
  status: { Low: 'Low', High: 'High', 'In range': 'In range' },
  zone: { 'In range': 'In range', Watch: 'Watch', 'Needs work': 'Needs work' },
  borderline: 'Borderline',
  note: {
    hold: 'The job here is to <b>hold this</b>, not disturb it.',
    stress:
      'The score reads well. The work here is <b>a targeted strain set</b>, not an ecological rebuild.',
    lowest: 'Lowest pillar: <b>{p}.</b> That is what the formula is built to move.',
    lowerPillar: true,
  },
}

const de: LRPStrings = {
  dims: ['Gesundheit', 'Vielfalt', 'Stoffwechsel', 'Balance der funktionellen Gruppen', 'Sicherheit'],
  teams: [
    { name: 'Ballaststoffe', sub: 'Ballaststoffe abbauen' },
    { name: 'Butyrat', sub: 'Butyrat bilden' },
    { name: 'Cross-Feeder', sub: 'Geben Stoffwechselprodukte weiter' },
    { name: 'Bifido', sub: 'Versorgen die Acetat-Basis' },
    { name: 'Schleim', sub: 'Erneuern die Schleimbarriere' },
    { name: 'Protein', sub: 'Fermentieren Proteine' },
  ],
  ratios: [
    { name: 'Bevorzugte Energiequelle', bad: 'vorwiegend proteinbasiert', good: 'vorwiegend kohlehydratbasiert' },
    { name: 'Fermentationseffizienz', bad: 'Verlangsamt', good: 'Optimal' },
    { name: 'Abhängigkeit zur Darmschleimhaut', bad: 'Nutzt die Darmschleimhaut als Energiequelle', good: 'Wird über Ernährung ausreichend versorgt' },
    { name: 'Belastende Nebenprodukte', bad: 'Fäulnisbetont', good: 'Überwiegend von SCFA geprägt' },
  ],
  status: { Low: 'Niedrig', High: 'Hoch', 'In range': 'Im Zielbereich' },
  zone: { 'In range': 'Im Zielbereich', Watch: 'Beobachten', 'Needs work': 'Optimierungsbedarf' },
  borderline: 'Grenzwertig',
  note: {
    hold: 'Hier liegt der Fokus auf dem Erhalt der Werte – statt das Gleichgewicht zu stören.',
    stress:
      'Der Score sieht gut aus. An dieser Stelle geht es darum, <b>einen gezielten Komplex an Bakterienstämmen</b> hinzuzufügen – nicht um einen Wiederaufbau des kompletten Ökosystems.',
    lowest: 'Die niedrigste Säule: <b>{p}.</b> Die Formel ist darauf ausgerichtet, diesen Wert zu bewegen.',
    lowerPillar: false,
  },
}

// French comes from the Lab translations workbook (LAB.295–327). The status,
// zone and borderline labels have no workbook row yet, so they stay in English
// until a translation is added to the sheet.
const fr: LRPStrings = {
  dims: ['Santé', 'Diversité', 'Métabolisme', 'Équilibre global', 'Sécurité'],
  teams: [
    { name: 'Fibres', sub: 'dégradent les fibres' },
    { name: 'Butyrate', sub: 'produisent du butyrate' },
    { name: 'Relais métaboliques', sub: 'font passer les nutriments' },
    { name: 'Bifido', sub: 'nourrissent la base d’acétate' },
    { name: 'Mucus', sub: 'renouvellent la couche de mucus' },
    { name: 'Protéines', sub: 'fermentent les protéines' },
  ],
  ratios: [
    { name: 'Carburant principal', bad: 'Plutôt protéines', good: 'Plutôt glucides' },
    { name: 'Efficacité de fermentation', bad: 'Au point mort', good: 'Efficace' },
    { name: 'Dépendance à la muqueuse intestinale', bad: 'Se nourrit de la muqueuse', good: 'Nourrie par votre alimentation' },
    { name: 'Sous-produits irritants', bad: 'Putréfactif', good: 'Dominé par les AGCC' },
  ],
  // Not yet in the workbook — English until a French translation is added.
  status: { Low: 'Low', High: 'High', 'In range': 'In range' },
  zone: { 'In range': 'In range', Watch: 'Watch', 'Needs work': 'Needs work' },
  borderline: 'Borderline',
  note: {
    hold: 'Ici, l’enjeu, c’est de <b>préserver cet équilibre</b>, pas de le bousculer.',
    stress:
      'Votre score est bon. Ici, on vise <b>un ensemble de souches ciblées</b>, pas une reconstruction complète de l’écosystème.',
    lowest: 'Votre maillon faible : <b>{p}.</b> C’est ça que la formule vient renforcer.',
    lowerPillar: true,
  },
}

// Dutch comes from the Lab translations workbook (LAB.295–327). The status,
// zone and borderline labels have no workbook row yet, so they stay in English
// until a translation is added to the sheet.
const nl: LRPStrings = {
  dims: ['Gezondheid', 'Diversiteit', 'Stofwisseling', 'Balans', 'Veiligheid'],
  teams: [
    { name: 'Vezels', sub: 'breken vezels af' },
    { name: 'Butyraat', sub: 'maken butyraat aan' },
    { name: 'Doorgeefteams', sub: 'geven voedingsstoffen door' },
    { name: 'Bifido', sub: 'voeden de acetaatbasis' },
    { name: 'Slijm', sub: 'verversen de slijmlaag' },
    { name: 'Eiwit', sub: 'fermenteren eiwit' },
  ],
  ratios: [
    { name: 'Belangrijkste brandstof', bad: 'Eiwitgestuurd', good: 'Koolhydraatgestuurd' },
    { name: 'Fermentatie-efficiëntie', bad: 'Vastgelopen', good: 'Efficiënt' },
    { name: 'Afhankelijk van je darmwand', bad: 'Teert op je darmwand', good: 'Voedinggestuurd' },
    { name: 'Heftige bijproducten', bad: 'Rottend', good: 'SCFA-dominant' },
  ],
  // Not yet in the workbook — English until a Dutch translation is added.
  status: { Low: 'Low', High: 'High', 'In range': 'In range' },
  zone: { 'In range': 'In range', Watch: 'Watch', 'Needs work': 'Needs work' },
  borderline: 'Borderline',
  note: {
    hold: 'De bedoeling is <b>dit te behouden</b>, niet te verstoren.',
    stress:
      'De score ziet er goed uit. Hier draait het om <b>een gerichte set stammen</b>, niet om je hele ecosysteem opnieuw op te bouwen.',
    lowest: 'Laagste pijler: <b>{p}.</b> Daarop is je formule gebouwd.',
    lowerPillar: true,
  },
}

const BY_LOCALE: Partial<Record<AppLocale, LRPStrings>> = { en, de, fr, nl }

export function getLRPStrings(locale?: AppLocale): LRPStrings {
  return (locale && BY_LOCALE[locale]) || en
}
