import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds the 10 Microbiome pillars.
 *
 *   npm run seed:pillars            create or update them
 *   npm run seed:pillars -- --clean remove them again
 *
 * Slugs are the real ones from TICKET-SEO-007 §4. The BODY COPY IS NOT: it is
 * obvious placeholder that says so in every paragraph. These 10 pages are the
 * most commercially important on the site and their real text arrives from the
 * content pipeline; seeding them with prose that reads like publishable health
 * writing would be a liability the day one escaped to production. NB1 is a
 * wellness product and the brief is explicit that copy must not make medical
 * claims.
 *
 * What this IS for: seeing the hub listing, the card grid, the breadcrumb and the
 * article layout with realistic titles, lengths and a working table of contents.
 *
 * Locales match the hubs — en/uk/uae get the English text, de/ch the German —
 * because a pillar published in a locale whose hub has no slug would have no URL.
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

const heading = (tag: 'h2' | 'h3', value: string): Node => ({
  type: 'heading',
  tag,
  children: [text(value)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const doc = (children: Node[]) => ({
  root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 },
})

const FILLER_EN =
  'This paragraph is placeholder text for layout testing only. It makes no health ' +
  'claim of any kind and must be replaced before this page is published. It exists ' +
  'so the article has enough body copy to show realistic spacing, a working table ' +
  'of contents and a plausible column measure.'

const FILLER_DE =
  'Dieser Absatz ist Platzhaltertext und dient ausschliesslich dem Layouttest. Er ' +
  'enthält keinerlei gesundheitsbezogene Aussage und muss vor der Veröffentlichung ' +
  'ersetzt werden. Er sorgt dafür, dass die Seite genug Fliesstext hat, um Abstände, ' +
  'ein funktionierendes Inhaltsverzeichnis und eine realistische Zeilenbreite zu zeigen.'

/** ~1,400 words across the given section titles, matching the brief's real range. */
function body(intro: string, sections: string[], filler: string): Node[] {
  const nodes: Node[] = [paragraph(intro)]
  const fillerWords = filler.split(/\s+/).length
  const perSection = Math.max(1, Math.round(1400 / sections.length / fillerWords))

  for (const section of sections) {
    nodes.push(heading('h2', section))
    for (let i = 0; i < perSection; i++) nodes.push(paragraph(filler))
  }
  return nodes
}

// ── seed data ─────────────────────────────────────────────────────────────────

type Side = { title: string; slug: string; standfirst: string; sections: string[] }
type PillarSeed = { en: Side; de: Side }

/**
 * German slugs that are taken, or reserved, and must not be reused.
 *
 * Nav v11 gave BOTH `nutrition` and `nutrients` the German slug `naehrstoffe`,
 * which §4's defect table flags. Neither is a pillar yet — the ten below are the
 * whole set and they match §4 exactly — so this is recorded rather than applied.
 *
 * It cannot be introduced silently: `costomSlugField({ localized: true })` runs a
 * per-locale uniqueness validate hook, so the second document to claim
 * `naehrstoffe` in `de` is rejected at save with "Slug is already in use for the
 * de locale". What that guard does NOT do is say which of the two should move, and
 * whoever hits it will be mid-form choosing a replacement. That is what this is
 * for.
 *
 * The resolution from §4:
 *
 *   nutrition  → ernaehrungsweise
 *   nutrients  → naehrstoffe
 *
 * NOT `ernaehrung` for either. That belongs to the `diet` pillar below, and it is
 * the obvious wrong answer — close enough in meaning that it reads as correct
 * while pointing at a page that already exists.
 */
const RESERVED_DE_SLUGS = {
  ernaehrung: 'diet (seeded below)',
  naehrstoffe: 'nutrients (future sub-section, per §4)',
  ernaehrungsweise: 'nutrition (future sub-section, per §4)',
} as const

const PILLARS: PillarSeed[] = [
  {
    en: {
      title: 'Gut Health: What It Means and What Actually Changes It',
      slug: 'gut-health',
      standfirst: 'A working definition, and the handful of things with evidence behind them.',
      sections: ['What "gut health" means', 'What the evidence supports', 'What moves the needle'],
    },
    de: {
      title: 'Darmgesundheit: Was der Begriff bedeutet und was ihn verändert',
      slug: 'darmgesundheit',
      standfirst: 'Eine brauchbare Definition und die wenigen Dinge mit belastbarer Evidenz.',
      sections: ['Was "Darmgesundheit" bedeutet', 'Was die Evidenz hergibt', 'Was wirklich zählt'],
    },
  },
  {
    en: {
      title: 'Gut Flora: The Community Living in Your Digestive Tract',
      slug: 'gut-flora',
      standfirst: 'Who lives there, in what numbers, and why the balance shifts.',
      sections: ['Who lives there', 'How the balance shifts', 'Measuring it'],
    },
    de: {
      title: 'Darmflora: Die Gemeinschaft in deinem Verdauungstrakt',
      slug: 'darmflora',
      standfirst: 'Wer dort lebt, in welcher Zahl, und warum sich das Gleichgewicht verschiebt.',
      sections: ['Wer dort lebt', 'Wie sich das Gleichgewicht verschiebt', 'Wie man es misst'],
    },
  },
  {
    en: {
      title: 'Gut Bacteria: The Organisms That Run Your Digestive System',
      slug: 'gut-bacteria',
      standfirst: 'The species that do the work, and why counting them is harder than it sounds.',
      sections: [
        'Key species at a glance',
        'The "good bacteria / bad bacteria" problem',
        'What shifts bacterial populations',
        'Why sequencing changed what we know',
      ],
    },
    de: {
      title: 'Darmbakterien: Die Organismen, die deine Verdauung steuern',
      slug: 'darmbakterien',
      standfirst: 'Die Arten, die die Arbeit machen, und warum das Zählen schwerer ist als gedacht.',
      sections: [
        'Wichtige Arten im Überblick',
        'Das Problem mit "guten" und "schlechten" Bakterien',
        'Was die Bakterienpopulation verschiebt',
        'Was die Sequenzierung verändert hat',
      ],
    },
  },
  {
    en: {
      title: 'Probiotics: What the Research Does and Does Not Show',
      slug: 'probiotics',
      standfirst: 'Strain-specific, dose-specific, and far more conditional than the label suggests.',
      sections: ['What a probiotic is', 'Where the evidence is strongest', 'Where it is thin'],
    },
    de: {
      title: 'Probiotika: Was die Forschung zeigt und was nicht',
      slug: 'probiotika',
      standfirst: 'Stammspezifisch, dosisabhängig und deutlich bedingter, als das Etikett vermuten lässt.',
      sections: ['Was ein Probiotikum ist', 'Wo die Evidenz am stärksten ist', 'Wo sie dünn wird'],
    },
  },
  {
    en: {
      title: 'Prebiotics: The Fibres That Feed Your Gut Bacteria',
      slug: 'prebiotics',
      standfirst: 'The "-biotics" family untangled: what each term refers to and how they differ.',
      sections: [
        'What are prebiotics?',
        'Types of prebiotics',
        'How prebiotics work',
        'Individual variation: why the same fibre produces different results',
      ],
    },
    de: {
      title: 'Präbiotika: Die Ballaststoffe, die deine Darmbakterien ernähren',
      slug: 'praebiotika',
      standfirst: 'Die "-biotika"-Familie entwirrt: was die Begriffe meinen und wie sie sich unterscheiden.',
      sections: [
        'Was sind Präbiotika?',
        'Arten von Präbiotika',
        'Wie Präbiotika wirken',
        'Warum derselbe Ballaststoff unterschiedlich wirkt',
      ],
    },
  },
  {
    en: {
      title: 'Gut Reset: What the Term Means and What It Cannot Do',
      slug: 'gut-reset',
      standfirst: 'A popular phrase with no clinical definition. Here is what is actually being claimed.',
      sections: ['Where the term came from', 'What is being claimed', 'What the evidence says'],
    },
    de: {
      title: 'Darmsanierung: Was der Begriff meint und was er nicht leisten kann',
      slug: 'darmsanierung',
      standfirst: 'Ein verbreiteter Begriff ohne klinische Definition. Was tatsächlich behauptet wird.',
      sections: ['Woher der Begriff kommt', 'Was behauptet wird', 'Was die Evidenz sagt'],
    },
  },
  {
    en: {
      title: 'Diet and the Microbiome: What Changes, and How Fast',
      slug: 'diet',
      standfirst: 'Dietary shifts move the microbiome within days — but not always in the direction expected.',
      sections: ['How quickly diet shifts the microbiome', 'Fibre, fat and fermentation', 'Why results vary'],
    },
    de: {
      title: 'Ernährung und Mikrobiom: Was sich ändert und wie schnell',
      slug: 'ernaehrung',
      standfirst: 'Ernährungsumstellungen verändern das Mikrobiom binnen Tagen — nicht immer wie erwartet.',
      sections: ['Wie schnell Ernährung wirkt', 'Ballaststoffe, Fett und Fermentation', 'Warum die Ergebnisse variieren'],
    },
  },
  {
    en: {
      title: 'The Gut-Brain Axis: How the Two Systems Talk to Each Other',
      slug: 'gut-brain-axis',
      standfirst: 'The signalling routes between gut and brain, and how much of it is established.',
      sections: ['The signalling routes', 'What is well established', 'What is still speculative'],
    },
    de: {
      title: 'Die Darm-Hirn-Achse: Wie beide Systeme miteinander sprechen',
      slug: 'darm-hirn-achse',
      standfirst: 'Die Signalwege zwischen Darm und Gehirn — und wie viel davon gesichert ist.',
      sections: ['Die Signalwege', 'Was gut belegt ist', 'Was noch spekulativ ist'],
    },
  },
  {
    en: {
      title: 'The Gut-Liver Axis: A Two-Way Relationship',
      slug: 'gut-liver-axis',
      standfirst: 'What the portal vein carries, and why intestinal permeability matters here.',
      sections: ['The portal route', 'Permeability and the liver', 'Where research is heading'],
    },
    de: {
      title: 'Die Darm-Leber-Achse: Eine wechselseitige Beziehung',
      slug: 'darm-leber-achse',
      standfirst: 'Was die Pfortader transportiert und warum die Darmbarriere hier zählt.',
      sections: ['Der Weg über die Pfortader', 'Barriere und Leber', 'Wohin die Forschung geht'],
    },
  },
  {
    en: {
      title: 'Longevity and the Microbiome: What Ageing Populations Show',
      slug: 'longevity',
      standfirst: 'What changes in the microbiome with age, and what remains correlation rather than cause.',
      sections: ['What changes with age', 'Correlation and cause', 'What is being trialled'],
    },
    de: {
      title: 'Langlebigkeit und Mikrobiom: Was alternde Populationen zeigen',
      slug: 'langlebigkeit',
      standfirst: 'Was sich mit dem Alter im Mikrobiom ändert und was Korrelation statt Ursache bleibt.',
      sections: ['Was sich mit dem Alter ändert', 'Korrelation und Ursache', 'Was derzeit erprobt wird'],
    },
  },
]

/**
 * Fail the seed rather than write a URL collision.
 *
 * Payload's per-locale uniqueness hook already rejects a duplicate slug on save,
 * but this script writes with `overrideAccess` and would surface the failure as a
 * confusing mid-run database error on document seven of ten, having already
 * written six. Checked up front, against the data, before anything is written.
 *
 * Also catches the subtler case the uniqueness hook cannot: a pillar claiming a
 * German slug this file has RESERVED for a future sub-section. That is legal today
 * — nothing holds `naehrstoffe` yet — and it is exactly how the v11 collision
 * happened.
 */
function assertSlugsAreSound() {
  const seen = new Map<string, string>()

  for (const pillar of PILLARS) {
    for (const [locale, side] of [
      ['en', pillar.en],
      ['de', pillar.de],
    ] as const) {
      const key = `${locale}:${side.slug}`
      const previous = seen.get(key)
      if (previous) {
        throw new Error(
          `Duplicate ${locale} slug "${side.slug}" — used by both "${previous}" and "${side.title}". ` +
            `Two pillars cannot share a URL.`,
        )
      }
      seen.set(key, side.title)
    }

    const reservedFor = RESERVED_DE_SLUGS[pillar.de.slug as keyof typeof RESERVED_DE_SLUGS]
    if (reservedFor && !reservedFor.startsWith(pillar.en.slug)) {
      throw new Error(
        `German slug "${pillar.de.slug}" is reserved for ${reservedFor}, but "${pillar.en.slug}" ` +
          `is claiming it. See RESERVED_DE_SLUGS for the §4 resolution.`,
      )
    }
  }
}


const REFERENCES_EN = [
  {
    text: 'Placeholder reference. Replace with the real citation before publishing.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    text: 'Second placeholder reference, so the list renders with more than one entry.',
    url: 'https://doi.org/',
  },
]

const ENGLISH_LOCALES = ['en', 'uk', 'uae'] as const
const GERMAN_LOCALES = ['de', 'ch'] as const

// ── run ───────────────────────────────────────────────────────────────────────

// Before the database connection, so a data error costs nothing and reports
// clearly rather than arriving as a constraint violation part-way through a write.
assertSlugsAreSound()

const clean = process.argv.includes('--clean')
const payload = await getPayload({ config })
const ctx = { context: { disableRevalidate: true }, overrideAccess: true }

async function findPillar(slug: string) {
  const res = await payload.find({
    collection: 'pillars',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
    pagination: false,
    draft: true,
  })
  return res.docs[0] ?? null
}

try {
  if (clean) {
    console.log('Removing pillars...\n')
    for (const pillar of PILLARS) {
      const existing = await findPillar(pillar.en.slug)
      if (existing) {
        await payload.delete({ collection: 'pillars', id: existing.id, ...ctx })
        console.log(`  deleted  pillars/${pillar.en.slug}`)
      }
    }
    console.log('\nDone.')
    process.exit(0)
  }

  // The Microbiome hub has to exist first — a pillar with no hub has no URL.
  const hubResult = await payload.find({
    collection: 'hubs',
    where: { key: { equals: 'microbiome' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const hub = hubResult.docs[0]
  if (!hub) {
    console.error('No Microbiome hub found. Run `npm run seed:hubs` first.')
    process.exit(1)
  }

  // `heroImage` and `authors` are required before publishing (designer brief §5,
  // slots 5 and 6). Rather than fail on validation, reuse whatever is already in
  // the CMS; if there is no media at all, seed as drafts and say so — a draft is
  // an honest result, a published page with no cover is not.
  const media = await payload.find({
    collection: 'media',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const heroImage = media.docs[0]?.id ?? null

  const authorResult = await payload.find({
    collection: 'authors',
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  let authorId = authorResult.docs[0]?.id ?? null

  if (!authorId) {
    const created = await payload.create({
      collection: 'authors',
      data: { name: 'NB1 Editorial', slug: 'nb1-editorial' } as never,
      ...ctx,
    })
    authorId = created.id
    console.log('Created a placeholder author: NB1 Editorial\n')
  }

  const canPublish = Boolean(heroImage)
  if (!canPublish) {
    console.log('No media found — seeding as DRAFTS.')
    console.log('Upload one image and re-run to publish them.\n')
  }

  console.log('Pillars\n')

  for (const pillar of PILLARS) {
    const existing = await findPillar(pillar.en.slug)

    const common = {
      hub: hub.id,
      authors: [authorId],
      heroImage,
      publishedAt: new Date().toISOString(),
      ...(canPublish ? { _status: 'published' } : { _status: 'draft' }),
    }

    let id: number | string
    if (existing) {
      id = existing.id
    } else {
      const created = await payload.create({
        collection: 'pillars',
        data: {
          ...common,
          title: pillar.en.title,
          slug: pillar.en.slug,
          standfirst: pillar.en.standfirst,
          content: doc(body(pillar.en.standfirst, pillar.en.sections, FILLER_EN)),
          references: REFERENCES_EN,
        } as never,
        locale: 'en',
        ...ctx,
      })
      id = created.id
    }

    for (const locale of ENGLISH_LOCALES) {
      await payload.update({
        collection: 'pillars',
        id,
        data: {
          ...common,
          title: pillar.en.title,
          slug: pillar.en.slug,
          standfirst: pillar.en.standfirst,
          content: doc(body(pillar.en.standfirst, pillar.en.sections, FILLER_EN)),
          references: REFERENCES_EN,
        } as never,
        locale,
        ...ctx,
      })
    }

    for (const locale of GERMAN_LOCALES) {
      await payload.update({
        collection: 'pillars',
        id,
        data: {
          ...common,
          title: pillar.de.title,
          slug: pillar.de.slug,
          standfirst: pillar.de.standfirst,
          content: doc(body(pillar.de.standfirst, pillar.de.sections, FILLER_DE)),
          references: REFERENCES_EN,
        } as never,
        locale,
        ...ctx,
      })
    }

    console.log(
      `  ${existing ? 'updated' : 'created'}  ${pillar.en.slug.padEnd(16)} ` +
        `${canPublish ? 'published' : 'draft    '}  /${pillar.de.slug}`,
    )
  }

  console.log(`\n${PILLARS.length} pillars in the Microbiome hub.`)
  console.log('  /en/microbiome   and   /de/mikrobiom')
  if (!canPublish) {
    console.log('\nThey are drafts, so the hub will still show its empty state.')
  }

  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
