import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Seeds the three content hubs.
 *
 *   npm run seed:hubs            create or update the hub records
 *   npm run seed:hubs -- --clean remove them again
 *
 * Slugs come straight from TICKET-SEO-007 §4, which calls its URL map "the seed
 * data". Re-running updates in place — the `key` is the identity, so a second
 * run can never produce a duplicate Microbiome.
 *
 * The Journal is not seeded here. It has its own `[locale]/journal` route, since
 * "Journal" is the same word in both languages and never needs a lookup to
 * resolve, and its copy lives in Site Settings. A hub record for it would be read
 * by nothing while looking editable in the admin.
 *
 * WHICH LOCALES GET FILLED, AND WHY NOT ALL EIGHT
 *
 * A hub with no slug in a locale has no URL there, and `fallbackLocale: false`
 * on the lookup means it 404s rather than quietly serving the English page under
 * a German path. That is deliberate, so the locales seeded here are exactly the
 * ones where the hub should exist:
 *
 *   en, uk, uae  →  the English slug   (en-GB and en-AE are region variants of
 *                                       a language NB1 publishes)
 *   de, ch       →  the German slug    (de-CH likewise)
 *   fr, nl, be   →  deliberately EMPTY
 *
 * The ticket is unambiguous about the last line: "no French or Dutch page is to
 * be built, linked or declared", and §12 requires that no page declare an
 * hreflang for a language NB1 does not publish. Because the cluster is generated
 * from the slugs that actually exist, leaving these unset is what enforces it —
 * there is no separate exclusion list to keep in sync.
 *
 * Fill fr/nl/be here the day that content exists, and the URLs and the hreflang
 * cluster both appear on their own.
 */

type HubSeed = {
  key: 'microbiome' | 'research' | 'lexicon'
  en: { title: string; slug: string; intro: string }
  de: { title: string; slug: string; intro: string }
}

const HUBS: HubSeed[] = [
  {
    key: 'microbiome',
    en: {
      title: 'Microbiome',
      slug: 'microbiome',
      intro:
        'The organisms that live in your gut, what shifts them, and what the evidence actually supports.',
    },
    de: {
      title: 'Mikrobiom',
      slug: 'mikrobiom',
      intro:
        'Die Organismen in deinem Darm, was sie verändert und was die Evidenz tatsächlich hergibt.',
    },
  },
  {
    key: 'research',
    en: {
      title: 'Research',
      slug: 'research',
      intro:
        'Write-ups of published studies, each based on a peer-reviewed paper and reviewed before it goes out.',
    },
    de: {
      title: 'Forschung',
      slug: 'forschung',
      intro:
        'Zusammenfassungen veröffentlichter Studien, jeweils auf Basis einer begutachteten Arbeit und vor Veröffentlichung geprüft.',
    },
  },
  {
    key: 'lexicon',
    en: {
      title: 'Lexicon',
      slug: 'lexicon',
      intro:
        'Plain definitions for the terms that come up in microbiome science, from Akkermansia to 16S sequencing.',
    },
    de: {
      title: 'Glossar',
      slug: 'glossar',
      intro:
        'Verständliche Definitionen der Begriffe aus der Mikrobiom-Forschung, von Akkermansia bis 16S-Sequenzierung.',
    },
  },
]

/** Locales that render the English hub, and those that render the German one. */
const ENGLISH_LOCALES = ['en', 'uk', 'uae'] as const
const GERMAN_LOCALES = ['de', 'ch'] as const

// ── run ───────────────────────────────────────────────────────────────────────

const clean = process.argv.includes('--clean')
const payload = await getPayload({ config })

// Revalidation calls next/cache APIs, which do not exist outside a Next request.
// The hook logs a warning and continues; silencing it keeps the output readable.
const ctx = { context: { disableRevalidate: true }, overrideAccess: true }

async function findByKey(key: string) {
  const res = await payload.find({
    collection: 'hubs',
    where: { key: { equals: key } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  return res.docs[0] ?? null
}

try {
  if (clean) {
    console.log('Removing hub records...\n')
    for (const hub of HUBS) {
      const existing = await findByKey(hub.key)
      if (existing) {
        await payload.delete({ collection: 'hubs', id: existing.id, ...ctx })
        console.log(`  deleted  hubs/${hub.key}`)
      }
    }
    console.log('\nDone.')
    process.exit(0)
  }

  console.log('Hubs\n')

  for (const hub of HUBS) {
    const existing = await findByKey(hub.key)

    // The first write creates the record and fills its default locale; the rest
    // are per-locale updates. Payload writes one locale per call, so a hub in
    // five locales is one create plus four updates — not one call with a map.
    let id: number | string

    if (existing) {
      id = existing.id
    } else {
      const created = await payload.create({
        collection: 'hubs',
        data: { key: hub.key, title: hub.en.title, slug: hub.en.slug, intro: hub.en.intro } as never,
        locale: 'en',
        ...ctx,
      })
      id = created.id
    }

    for (const locale of ENGLISH_LOCALES) {
      await payload.update({
        collection: 'hubs',
        id,
        data: { title: hub.en.title, slug: hub.en.slug, intro: hub.en.intro } as never,
        locale,
        ...ctx,
      })
    }

    for (const locale of GERMAN_LOCALES) {
      await payload.update({
        collection: 'hubs',
        id,
        data: { title: hub.de.title, slug: hub.de.slug, intro: hub.de.intro } as never,
        locale,
        ...ctx,
      })
    }

    console.log(
      `  ${existing ? 'updated' : 'created'}  ${hub.key.padEnd(11)} ` +
        `en|uk|uae → /${hub.en.slug}   de|ch → /${hub.de.slug}`,
    )
  }

  console.log('\nURLs now resolving:')
  console.log('  /en/microbiome   /de/mikrobiom')
  console.log('  /en/research     /de/forschung')
  console.log('  /en/lexicon      /de/glossar')
  console.log('\n  /fr, /nl, /be deliberately have no hub slugs — see the header comment.')
  console.log('\n  /en/journal is served by its own route and is not seeded here.')

  process.exit(0)
} catch (error) {
  console.error(error)
  process.exit(1)
}
