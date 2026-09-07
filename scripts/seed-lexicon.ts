import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds the Lexicon: its categories, one representative term in each, and one
 * category filled to realistic volume.
 *
 *   npm run seed:lexicon                categories + 10 representative terms
 *   npm run seed:lexicon -- --bulk      also fill "taxa" to 436 terms
 *   npm run seed:lexicon -- --clean     remove everything this script created
 *
 * WHY THE BULK FLAG IS SEPARATE: the first run is seconds and gives you every
 * template variant to look at. The second is ~440 documents and takes minutes, and
 * it exists for one purpose — the category browse page claims to list 436 terms
 * with a client-side filter and an alphabetical rail, and none of that can be
 * judged against ten rows. The uneven counts are the design (19 in the smallest,
 * 436 in the largest), so testing the largest is testing the real case.
 *
 * ALL COPY HERE IS PLACEHOLDER AND SAYS SO IN EVERY PARAGRAPH. The term names are
 * real vocabulary, because the layout has to cope with real name lengths and with
 * italicised binomials. The definitions and bodies are not: NB1 is a wellness
 * product, the brief forbids medical claims, and a lexicon entry that reads like
 * publishable health writing is a liability the day one escapes to production.
 *
 * Locales: the 10 representative terms get en/uk/uae + de/ch, matching the hub
 * slugs that exist. The bulk 436 get en + de only, which is what the real corpus
 * will be — ticket §12 scopes the SEO content platform to English and German, and
 * seeding 436 terms into five locales would put 1,300 documents in the database to
 * prove a point about two.
 */

// ── lexical helpers ────────────────────────────────────────────────────────────

type Node = Record<string, unknown>

const text = (value: string): Node => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})

const paragraph = (value: string): Node => ({
  type: 'paragraph',
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const doc = (children: Node[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

const FILLER_EN =
  'This paragraph is placeholder text for layout testing only. It makes no health ' +
  'claim of any kind and must be replaced before this page is published. It is here ' +
  'so the section has enough copy to show a realistic column measure and the spacing ' +
  'between one section and the next.'

const FILLER_DE =
  'Dieser Absatz ist Platzhaltertext und dient ausschliesslich dem Layouttest. Er ' +
  'enthält keinerlei gesundheitsbezogene Aussage und muss vor der Veröffentlichung ' +
  'ersetzt werden. Er steht hier, damit der Abschnitt genug Fliesstext hat, um ' +
  'Zeilenbreite und Abstände realistisch zu zeigen.'

/**
 * A term body: three sections, ~270 words each, which is the brief's figure.
 *
 * `light` collapses that to one paragraph per section. Used for the bulk 436,
 * where the point is row count on the browse page rather than page depth, and
 * where full bodies would mean ~350,000 words of placeholder in the database.
 */
function sectionBody(filler: string, light: boolean): Node[] {
  const perSection = light ? 1 : Math.max(1, Math.round(270 / filler.split(/\s+/).length))
  return Array.from({ length: perSection }, () => paragraph(filler))
}

// ── categories ────────────────────────────────────────────────────────────────

type CategorySeed = {
  key: string
  en: { title: string; intro: string }
  de: { title: string; intro: string }
}

/**
 * Ten categories against the brief's "around 13".
 *
 * `key` is the URL segment and the identity, untranslated — matching the previews,
 * which use `/topics/taxa` rather than `/topics/bacterial-taxa`. The title is what
 * gets translated and displayed.
 */
const CATEGORIES: CategorySeed[] = [
  {
    key: 'taxa',
    en: { title: 'Bacterial taxa', intro: 'Placeholder intro. The genera and species that appear in microbiome sequencing results. Replace before publishing.' },
    de: { title: 'Bakterielle Taxa', intro: 'Platzhalter-Einleitung. Die Gattungen und Arten, die in Sequenzierergebnissen auftauchen. Vor der Veröffentlichung ersetzen.' },
  },
  {
    key: 'conditions',
    en: { title: 'Conditions', intro: 'Placeholder intro. Terms describing health conditions. Every entry here carries the health notice and a reviewer line.' },
    de: { title: 'Erkrankungen', intro: 'Platzhalter-Einleitung. Begriffe zu Gesundheitszuständen. Jeder Eintrag trägt den Gesundheitshinweis und eine Prüferzeile.' },
  },
  {
    key: 'diet',
    en: { title: 'Diet and nutrition', intro: 'Placeholder intro. Foods, nutrients and dietary patterns. Replace before publishing.' },
    de: { title: 'Ernährung', intro: 'Platzhalter-Einleitung. Lebensmittel, Nährstoffe und Ernährungsmuster. Vor der Veröffentlichung ersetzen.' },
  },
  {
    key: 'methods',
    en: { title: 'Methods', intro: 'Placeholder intro. How microbiome samples are collected, sequenced and analysed.' },
    de: { title: 'Methoden', intro: 'Platzhalter-Einleitung. Wie Mikrobiomproben gesammelt, sequenziert und analysiert werden.' },
  },
  {
    key: 'metabolites',
    en: { title: 'Metabolites', intro: 'Placeholder intro. The compounds gut bacteria produce and consume.' },
    de: { title: 'Metabolite', intro: 'Platzhalter-Einleitung. Die Verbindungen, die Darmbakterien produzieren und verbrauchen.' },
  },
  {
    key: 'lifestyle',
    en: { title: 'Lifestyle', intro: 'Placeholder intro. Sleep, movement, stress and the other non-dietary factors.' },
    de: { title: 'Lebensstil', intro: 'Platzhalter-Einleitung. Schlaf, Bewegung, Stress und weitere nicht-ernährungsbezogene Faktoren.' },
  },
  {
    key: 'statistics',
    en: { title: 'Statistics', intro: 'Placeholder intro. The measures used to describe a microbiome sample.' },
    de: { title: 'Statistik', intro: 'Platzhalter-Einleitung. Die Kennzahlen, mit denen eine Mikrobiomprobe beschrieben wird.' },
  },
  {
    key: 'antibiotics',
    en: { title: 'Antibiotics', intro: 'Placeholder intro. Antibiotic classes and their effect on the gut community.' },
    de: { title: 'Antibiotika', intro: 'Platzhalter-Einleitung. Antibiotikaklassen und ihre Wirkung auf die Darmgemeinschaft.' },
  },
  {
    key: 'interventions',
    en: { title: 'Interventions', intro: 'Placeholder intro. Probiotics, prebiotics and the other things people take or do.' },
    de: { title: 'Interventionen', intro: 'Platzhalter-Einleitung. Probiotika, Präbiotika und was Menschen sonst einnehmen oder tun.' },
  },
  {
    key: 'core',
    en: { title: 'Core concepts', intro: 'Placeholder intro. The foundational vocabulary the rest of the lexicon assumes.' },
    de: { title: 'Kernbegriffe', intro: 'Platzhalter-Einleitung. Das Grundvokabular, das der Rest des Glossars voraussetzt.' },
  },
]

// ── representative terms: one per category ────────────────────────────────────

type TermSeed = {
  category: string
  italic?: boolean
  condition?: boolean
  en: { title: string; slug: string; definition: string; aka?: string }
  de: { title: string; slug: string; definition: string; aka?: string }
}

/**
 * One term per category, chosen to exercise a different combination of optional
 * slots each time rather than to be representative content.
 *
 * Between them these ten cover: an italicised binomial, a condition term (health
 * notice + reviewer line + the condition CTA), a term with synonyms, a term with
 * none, German titles carrying umlauts so the diacritic-folding filter has
 * something real to fold, and the longest name the cap allows.
 */
const TERMS: TermSeed[] = [
  {
    category: 'taxa',
    italic: true,
    en: {
      title: 'Akkermansia muciniphila',
      slug: 'akkermansia-muciniphila',
      definition:
        'Placeholder definition for a bacterial species entry, written as one standalone sentence so the layout can be judged. It makes no health claim.',
      aka: 'A. muciniphila',
    },
    de: {
      title: 'Akkermansia muciniphila',
      slug: 'akkermansia-muciniphila-de',
      definition:
        'Platzhalter-Definition für einen Arteintrag, als ein eigenständiger Satz formuliert, damit das Layout beurteilt werden kann. Ohne gesundheitsbezogene Aussage.',
      aka: 'A. muciniphila',
    },
  },
  {
    category: 'conditions',
    condition: true,
    en: {
      title: 'Irritable bowel syndrome',
      slug: 'irritable-bowel-syndrome',
      definition:
        'Placeholder definition for a condition entry. This page carries the health notice and the reviewer line, and makes no medical claim of any kind.',
      aka: 'IBS',
    },
    de: {
      title: 'Reizdarmsyndrom',
      slug: 'reizdarmsyndrom',
      definition:
        'Platzhalter-Definition für einen Erkrankungseintrag. Diese Seite trägt den Gesundheitshinweis und die Prüferzeile und macht keine medizinische Aussage.',
      aka: 'RDS',
    },
  },
  {
    category: 'diet',
    en: {
      title: 'Dietary fibre',
      slug: 'dietary-fibre',
      definition:
        'Placeholder definition for a nutrition entry, kept to one sentence because this is the line that gets quoted elsewhere.',
    },
    de: {
      title: 'Ballaststoffe',
      slug: 'ballaststoffe',
      definition:
        'Platzhalter-Definition für einen Ernährungseintrag, auf einen Satz beschränkt, weil genau diese Zeile anderswo zitiert wird.',
    },
  },
  {
    category: 'methods',
    en: {
      title: '16S rRNA gene sequencing',
      slug: '16s-rrna-gene-sequencing',
      definition:
        'Placeholder definition for a method entry. The name begins with a digit, which is a case the alphabetical rail has to place somewhere.',
      aka: '16S sequencing',
    },
    de: {
      title: '16S-rRNA-Gensequenzierung',
      slug: '16s-rrna-gensequenzierung',
      definition:
        'Platzhalter-Definition für einen Methodeneintrag. Der Name beginnt mit einer Ziffer — ein Fall, den das Alphabet-Register einordnen muss.',
      aka: '16S-Sequenzierung',
    },
  },
  {
    category: 'metabolites',
    en: {
      title: 'Butyrate',
      slug: 'butyrate',
      definition:
        'Placeholder definition for a metabolite entry. Short name, so this is the case where the title scale stays at its largest step.',
    },
    de: {
      title: 'Butyrat',
      slug: 'butyrat',
      definition:
        'Platzhalter-Definition für einen Metaboliteintrag. Kurzer Name — hier bleibt die Titelgrösse auf der grössten Stufe.',
    },
  },
  {
    category: 'lifestyle',
    en: {
      title: 'Time restricted eating and the gut microbiome',
      slug: 'time-restricted-eating-and-the-gut-microbiome',
      definition:
        'Placeholder definition for a lifestyle entry. This is the longest name in the seed set, which is what makes it the test of the title scale at its smallest step.',
    },
    de: {
      title: 'Intervallfasten und das Darmmikrobiom',
      slug: 'intervallfasten-und-das-darmmikrobiom',
      definition:
        'Platzhalter-Definition für einen Lebensstileintrag. Dies ist der längste Name im Seed-Satz und damit der Test für die kleinste Titelstufe.',
    },
  },
  {
    category: 'statistics',
    en: {
      title: 'Alpha diversity',
      slug: 'alpha-diversity',
      definition:
        'Placeholder definition for a statistics entry, written as a standalone sentence and making no health claim.',
      aka: 'Within-sample diversity',
    },
    de: {
      title: 'Alpha-Diversität',
      slug: 'alpha-diversitaet',
      definition:
        'Platzhalter-Definition für einen Statistikeintrag, als eigenständiger Satz und ohne gesundheitsbezogene Aussage.',
      aka: 'Diversität innerhalb der Probe',
    },
  },
  {
    category: 'antibiotics',
    en: {
      title: 'Broad spectrum antibiotics',
      slug: 'broad-spectrum-antibiotics',
      definition:
        'Placeholder definition for an antibiotics entry. Not filed as a condition, so this page carries the educational disclaimer and no reviewer line.',
    },
    de: {
      title: 'Breitbandantibiotika',
      slug: 'breitbandantibiotika',
      definition:
        'Platzhalter-Definition für einen Antibiotikaeintrag. Nicht als Erkrankung geführt — diese Seite trägt nur den Bildungshinweis, keine Prüferzeile.',
    },
  },
  {
    category: 'interventions',
    en: {
      title: 'Prebiotics',
      slug: 'prebiotics',
      definition:
        'Placeholder definition for an intervention entry. It describes a category of ingredient and makes no claim about any effect.',
    },
    de: {
      title: 'Präbiotika',
      slug: 'praebiotika',
      definition:
        'Platzhalter-Definition für einen Interventionseintrag. Beschreibt eine Zutatenkategorie und behauptet keine Wirkung.',
    },
  },
  {
    category: 'core',
    en: {
      title: 'Gut microbiome',
      slug: 'gut-microbiome',
      definition:
        'Placeholder definition for a core concept entry. This is the term the rest of the lexicon assumes, so it is the one most likely to be quoted.',
      aka: 'Intestinal microbiome, gut flora',
    },
    de: {
      title: 'Darmmikrobiom',
      slug: 'darmmikrobiom',
      definition:
        'Platzhalter-Definition für einen Kernbegriff. Diesen Begriff setzt das übrige Glossar voraus — er wird am ehesten zitiert.',
      aka: 'Intestinales Mikrobiom, Darmflora',
    },
  },
]

// ── bulk fill for the taxa category ───────────────────────────────────────────

/**
 * 436 binomials, generated deterministically.
 *
 * Genera chosen to spread across initials rather than alphabetically, because the
 * browse page groups by first letter and a rail where every entry falls under A
 * would test nothing. Twenty-two genera across sixteen initials gives the uneven
 * distribution the real corpus has.
 *
 * No randomness: the same run produces the same 436 names in the same order, so
 * `--clean` can find them again and a re-run updates rather than duplicates.
 */
const GENERA = [
  'Akkermansia', 'Bacteroides', 'Bifidobacterium', 'Blautia', 'Christensenella',
  'Clostridium', 'Collinsella', 'Coprococcus', 'Dorea', 'Enterococcus',
  'Escherichia', 'Faecalibacterium', 'Fusobacterium', 'Lactobacillus', 'Methanobrevibacter',
  'Odoribacter', 'Parabacteroides', 'Prevotella', 'Roseburia', 'Ruminococcus',
  'Streptococcus', 'Veillonella',
]

const EPITHETS = [
  'adolescentis', 'brevis', 'caccae', 'dorei', 'eggerthii',
  'faecis', 'gnavus', 'hominis', 'intestinalis', 'longum',
  'muciniphila', 'nucleatum', 'obeum', 'plebeius', 'productus',
  'rectale', 'stercoris', 'torques', 'uniformis', 'vulgatus',
]

const BULK_COUNT = 436

type BulkTerm = { title: string; slug: string }

function bulkTerms(): BulkTerm[] {
  // The representative terms are seeded with full bodies, synonyms and five
  // locales. `Akkermansia muciniphila` is one of them AND falls out of the
  // generator below, and without this guard the bulk pass would find it by slug
  // and overwrite it with the one-paragraph placeholder — quietly destroying the
  // only italic-binomial variant there is to look at. 440 combinations against a
  // target of 436 leaves room to skip a few.
  const reserved = new Set(TERMS.map((term) => term.en.slug))

  const out: BulkTerm[] = []
  for (const genus of GENERA) {
    for (const epithet of EPITHETS) {
      if (out.length >= BULK_COUNT) return out
      const slug = `${genus.toLowerCase()}-${epithet}`
      if (reserved.has(slug)) continue
      out.push({ title: `${genus} ${epithet}`, slug })
    }
  }
  return out
}

const BULK_DEFINITION_EN =
  'Placeholder definition for a bacterial taxon, generated to fill this category ' +
  'to realistic volume. It makes no health claim and must not reach production.'

const BULK_DEFINITION_DE =
  'Platzhalter-Definition für ein bakterielles Taxon, generiert, um diese Kategorie ' +
  'auf realistische Grösse zu füllen. Ohne gesundheitsbezogene Aussage.'

const REFERENCES = [
  { text: 'Placeholder reference. Replace with a real citation before publishing.', url: 'https://doi.org/' },
  { text: 'Second placeholder reference, so the list renders with more than one entry.', url: 'https://doi.org/' },
]

const ENGLISH_LOCALES = ['en', 'uk', 'uae'] as const
const GERMAN_LOCALES = ['de', 'ch'] as const

// ── run ───────────────────────────────────────────────────────────────────────

/**
 * Flags come from argv OR the environment, and the mode is announced up front.
 *
 * `npm run seed:lexicon -- --bulk` puts `--bulk` on the end of a command that
 * runs through `payload run`, and whether that CLI forwards unrecognised
 * arguments into this script's `process.argv` is not something to take on trust —
 * a swallowed flag is indistinguishable from a successful run that quietly seeded
 * ten terms instead of 436.
 *
 * So: env vars work too, and the first line of output states which mode is
 * active. A run that says BULK: no when you asked for bulk tells you immediately,
 * instead of a count that looks wrong twenty minutes later.
 */
const argv = process.argv.slice(2)
const flag = (name: string, env: string) =>
  argv.includes(`--${name}`) || process.env[env] === '1' || process.env[env] === 'true'

const clean = flag('clean', 'SEED_CLEAN')
const withBulk = flag('bulk', 'SEED_BULK')

console.log(
  `\nseed:lexicon  —  BULK: ${withBulk ? `yes (${BULK_COUNT} terms in "taxa")` : 'no (10 representative terms only)'}` +
    `  ·  CLEAN: ${clean ? 'yes' : 'no'}`,
)
console.log(`argv seen by this script: ${JSON.stringify(argv)}\n`)

const payload = await getPayload({ config })
const ctx = { context: { disableRevalidate: true }, overrideAccess: true }

async function findOne(collection: 'lexicon-terms' | 'lexicon-categories', where: object) {
  const res = await payload.find({
    collection: collection as 'lexicon-terms',
    where: where as never,
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
    pagination: false,
    draft: true,
  })
  return res.docs[0] ?? null
}

/** Section groups for one locale, keyed by the field names in `TERM_SECTIONS`. */
function sections(filler: string, light: boolean) {
  const body = doc(sectionBody(filler, light))
  return {
    inSimpleTerms: { body },
    scientificBackground: { body },
    roleInGutHealth: { body },
  }
}

try {
  if (clean) {
    console.log('Removing lexicon seed data...\n')

    // Terms before categories: a term holds the relationship, so deleting the
    // category first would leave 436 rows pointing at nothing.
    let removed = 0
    for (const term of [...TERMS.map((t) => t.en.slug), ...bulkTerms().map((t) => t.slug)]) {
      const existing = await findOne('lexicon-terms', { slug: { equals: term } })
      if (existing) {
        await payload.delete({ collection: 'lexicon-terms', id: existing.id, ...ctx })
        removed++
      }
    }
    console.log(`  deleted  ${removed} terms`)

    for (const category of CATEGORIES) {
      const existing = await findOne('lexicon-categories', { key: { equals: category.key } })
      if (existing) {
        await payload.delete({ collection: 'lexicon-categories', id: existing.id, ...ctx })
        console.log(`  deleted  lexicon-categories/${category.key}`)
      }
    }

    console.log('\nDone.')
    process.exit(0)
  }

  // The Lexicon hub has to exist first — a term with no hub has no URL.
  const hubResult = await payload.find({
    collection: 'hubs',
    where: { key: { equals: 'lexicon' } },
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
    pagination: false,
  })
  const hub = hubResult.docs[0]
  if (!hub) {
    console.error('No Lexicon hub found. Run `npm run seed:hubs` first.')
    process.exit(1)
  }

  // A reviewer for the condition term. Optional: without one the condition
  // variant still renders its health notice, just not the reviewer line — which
  // is itself a state worth being able to see.
  const authorResult = await payload.find({
    collection: 'authors',
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
    pagination: false,
  })
  const reviewerId = authorResult.docs[0]?.id ?? null
  if (!reviewerId) {
    console.log('No author found — the condition term will render without a reviewer line.\n')
  }

  // ── categories ──────────────────────────────────────────────────────────────

  console.log('Lexicon categories\n')
  const categoryIds = new Map<string, number | string>()

  for (const category of CATEGORIES) {
    const existing = await findOne('lexicon-categories', { key: { equals: category.key } })

    let id: number | string
    if (existing) {
      id = existing.id
    } else {
      const created = await payload.create({
        collection: 'lexicon-categories',
        data: {
          key: category.key,
          title: category.en.title,
          intro: category.en.intro,
          publishedAt: new Date().toISOString(),
          _status: 'published',
        } as never,
        locale: 'en',
        ...ctx,
      })
      id = created.id
    }
    categoryIds.set(category.key, id)

    for (const locale of ENGLISH_LOCALES) {
      await payload.update({
        collection: 'lexicon-categories',
        id,
        data: {
          key: category.key,
          title: category.en.title,
          intro: category.en.intro,
          publishedAt: new Date().toISOString(),
          _status: 'published',
        } as never,
        locale,
        ...ctx,
      })
    }

    for (const locale of GERMAN_LOCALES) {
      await payload.update({
        collection: 'lexicon-categories',
        id,
        data: {
          key: category.key,
          title: category.de.title,
          intro: category.de.intro,
          publishedAt: new Date().toISOString(),
          _status: 'published',
        } as never,
        locale,
        ...ctx,
      })
    }

    console.log(`  ${existing ? 'updated' : 'created'}  ${category.key.padEnd(14)} ${category.en.title}`)
  }

  // ── representative terms ────────────────────────────────────────────────────

  console.log('\nRepresentative terms\n')

  for (const term of TERMS) {
    const existing = await findOne('lexicon-terms', { slug: { equals: term.en.slug } })

    const common = {
      hub: hub.id,
      category: categoryIds.get(term.category),
      italicName: term.italic === true,
      isCondition: term.condition === true,
      references: REFERENCES,
      publishedAt: new Date().toISOString(),
      _status: 'published',
      ...(term.condition && reviewerId
        ? { reviewer: reviewerId, reviewedAt: new Date().toISOString() }
        : {}),
    }

    let id: number | string
    if (existing) {
      id = existing.id
    } else {
      const created = await payload.create({
        collection: 'lexicon-terms',
        data: {
          ...common,
          title: term.en.title,
          slug: term.en.slug,
          definition: term.en.definition,
          ...(term.en.aka ? { alsoKnownAs: term.en.aka } : {}),
          ...sections(FILLER_EN, false),
        } as never,
        locale: 'en',
        ...ctx,
      })
      id = created.id
    }

    for (const locale of ENGLISH_LOCALES) {
      await payload.update({
        collection: 'lexicon-terms',
        id,
        data: {
          ...common,
          title: term.en.title,
          slug: term.en.slug,
          definition: term.en.definition,
          ...(term.en.aka ? { alsoKnownAs: term.en.aka } : {}),
          ...sections(FILLER_EN, false),
        } as never,
        locale,
        ...ctx,
      })
    }

    for (const locale of GERMAN_LOCALES) {
      await payload.update({
        collection: 'lexicon-terms',
        id,
        data: {
          ...common,
          title: term.de.title,
          slug: term.de.slug,
          definition: term.de.definition,
          ...(term.de.aka ? { alsoKnownAs: term.de.aka } : {}),
          ...sections(FILLER_DE, false),
        } as never,
        locale,
        ...ctx,
      })
    }

    const flags = [term.italic ? 'italic' : '', term.condition ? 'condition' : '']
      .filter(Boolean)
      .join(' ')
    console.log(`  ${existing ? 'updated' : 'created'}  ${term.en.slug.padEnd(46)} ${flags}`)
  }

  // ── bulk ────────────────────────────────────────────────────────────────────

  if (withBulk) {
    const taxaId = categoryIds.get('taxa')
    const bulk = bulkTerms()

    console.log(`\nFilling "taxa" to ${bulk.length} terms. This takes a few minutes.\n`)

    let created = 0
    let updated = 0

    for (const [index, term] of bulk.entries()) {
      const existing = await findOne('lexicon-terms', { slug: { equals: term.slug } })

      const common = {
        hub: hub.id,
        category: taxaId,
        italicName: true,
        isCondition: false,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      }

      let id: number | string
      if (existing) {
        id = existing.id
        updated++
      } else {
        // Not named `doc` — that is the lexical helper above, and shadowing it
        // inside the one block that also builds section bodies is a trap.
        const createdTerm = await payload.create({
          collection: 'lexicon-terms',
          data: {
            ...common,
            title: term.title,
            slug: term.slug,
            definition: BULK_DEFINITION_EN,
            ...sections(FILLER_EN, true),
          } as never,
          locale: 'en',
          ...ctx,
        })
        id = createdTerm.id
        created++
      }

      // EN and DE only. See the header comment: the SEO content platform is
      // scoped to two languages, and the browse page this exists to test is the
      // English one.
      await payload.update({
        collection: 'lexicon-terms',
        id,
        data: {
          ...common,
          title: term.title,
          slug: term.slug,
          definition: BULK_DEFINITION_EN,
          ...sections(FILLER_EN, true),
        } as never,
        locale: 'en',
        ...ctx,
      })

      await payload.update({
        collection: 'lexicon-terms',
        id,
        data: {
          ...common,
          title: term.title,
          // A distinct German slug: the slug field is localized and per-locale
          // unique, and reusing the English one would be indistinguishable from
          // a bug when checking hreflang.
          slug: `${term.slug}-de`,
          definition: BULK_DEFINITION_DE,
          ...sections(FILLER_DE, true),
        } as never,
        locale: 'de',
        ...ctx,
      })

      if ((index + 1) % 50 === 0) console.log(`  ${index + 1} / ${bulk.length}`)
    }

    console.log(`\n  ${created} created, ${updated} updated.`)
  }

  // ── summary ─────────────────────────────────────────────────────────────────

  console.log(`\n${CATEGORIES.length} categories, ${TERMS.length} representative terms.`)
  if (withBulk) console.log(`Plus ${BULK_COUNT} generated terms in "taxa".`)

  console.log('\nWhat to look at:')
  console.log('  /en/lexicon/akkermansia-muciniphila                  italic binomial, synonyms')
  console.log('  /en/lexicon/irritable-bowel-syndrome                 condition variant')
  console.log('  /en/lexicon/butyrate                                 short title, no synonyms')
  console.log('  /en/lexicon/time-restricted-eating-and-the-gut-microbiome   longest title')
  console.log('  /de/glossar/praebiotika                              German, umlaut in the name')
  if (withBulk)
    console.log(
      '  /en/lexicon/topics/bacterial-taxa                    436 terms, filter and rail',
    )
  console.log('')

  if (!withBulk) {
    console.log('Ran WITHOUT bulk — "taxa" has the 10 representative terms only.')
    console.log('To fill it to 436, either of these works:')
    console.log('  npm run seed:lexicon -- --bulk')
    console.log('  SEED_BULK=1 npm run seed:lexicon      (if the flag above is swallowed)')
  }

  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
