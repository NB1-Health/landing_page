import { describe, expect, it } from 'vitest'

import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail, type BreadcrumbRung } from '@/utilities/journalTrail'

/**
 * The breadcrumb contract, SEO-007 §5.
 *
 * §5 requires the rendered trail and the `BreadcrumbList` JSON-LD to agree
 * character for character, and calls any mismatch a P1 defect. The codebase
 * satisfies that by construction — one `BreadcrumbRung[]` feeds both the
 * `Breadcrumb` component and `buildBreadcrumbSchema` — which is a strong
 * guarantee right up until someone adds a second trail builder for a new page
 * type, or "tidies" a label on the render side only.
 *
 * These are the tests that make the single-source design load-bearing rather
 * than merely intended. No database and no server: the whole point is that the
 * contract is a pure function of its inputs.
 */

const LABELS = { home: 'Home', journal: 'Journal' }
const SITE = 'https://nb1.com'

describe('buildJournalTrail — depth', () => {
  it('is two rungs on the Journal index', () => {
    const rungs = buildJournalTrail({ locale: 'en', labels: LABELS })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal'])
    expect(rungs.map((r) => r.path)).toEqual(['/en', '/en/journal'])
  })

  it('is three rungs on a Journal article, with no category', () => {
    // The category rung went with the category archives (§10). An article's
    // trail ends at the article; the chips it carries are filters, not places.
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      current: { name: 'What your gut is telling you', path: '/en/journal/what-your-gut-is-telling-you' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal', 'What your gut is telling you'])
  })

  it('is three rungs on a hub, which is its own last rung', () => {
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      hub: { name: 'Microbiome', path: '/en/microbiome' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal', 'Microbiome'])
  })

  it('is four rungs on a pillar', () => {
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      hub: { name: 'Microbiome', path: '/en/microbiome' },
      current: { name: 'Gut bacteria', path: '/en/microbiome/gut-bacteria' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal', 'Microbiome', 'Gut bacteria'])
    expect(rungs.map((r) => r.path)).toEqual([
      '/en',
      '/en/journal',
      '/en/microbiome',
      '/en/microbiome/gut-bacteria',
    ])
  })

  it('carries the locale into every path, never just the first', () => {
    // A trail that mixes locales sends a German reader to English pages, and
    // emits a BreadcrumbList whose items cross language boundaries.
    const rungs = buildJournalTrail({
      locale: 'de',
      labels: { home: 'Start', journal: 'Journal' },
      hub: { name: 'Mikrobiom', path: '/de/mikrobiom' },
      current: { name: 'Darmbakterien', path: '/de/mikrobiom/darmbakterien' },
    })

    for (const rung of rungs) {
      expect(rung.path.startsWith('/de')).toBe(true)
    }
  })

  it('drops a rung whose name is blank or whitespace', () => {
    // A document saved without a title in this locale must not produce a rung
    // rendering as an empty link with a separator floating beside it.
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      hub: { name: '   ', path: '/en/microbiome' },
      current: { name: '', path: '/en/microbiome/gut-bacteria' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal'])
  })

  it('is five rungs on a lexicon term, through its category', () => {
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      hub: { name: 'Lexicon', path: '/en/lexicon' },
      category: { name: 'Bacterial taxa', path: '/en/lexicon/topics/taxa' },
      current: { name: 'Akkermansia muciniphila', path: '/en/lexicon/akkermansia-muciniphila' },
    })

    expect(rungs.map((r) => r.name)).toEqual([
      'Home',
      'Journal',
      'Lexicon',
      'Bacterial taxa',
      'Akkermansia muciniphila',
    ])
    // The term's own URL is flat — the category appears in the trail only.
    expect(rungs[4].path).toBe('/en/lexicon/akkermansia-muciniphila')
  })

  it('falls back to four rungs when a term has no category', () => {
    // The sources disagree about whether the category rung exists at all: §5's
    // table says four levels, the designer brief and every lexicon preview say
    // five. Making the rung optional means the trail follows the data and neither
    // reading has to be hardcoded.
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      hub: { name: 'Lexicon', path: '/en/lexicon' },
      current: { name: 'Butyrate', path: '/en/lexicon/butyrate' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal', 'Lexicon', 'Butyrate'])
  })

  it('ignores a category with no hub above it', () => {
    // A category rung with nothing above it would put the term two levels below
    // Journal and assert a hierarchy that does not exist.
    const rungs = buildJournalTrail({
      locale: 'en',
      labels: LABELS,
      category: { name: 'Bacterial taxa', path: '/en/lexicon/topics/taxa' },
      current: { name: 'Butyrate', path: '/en/lexicon/butyrate' },
    })

    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal', 'Butyrate'])
  })

  it('puts Journal at position 2 at every depth', () => {
    // §5's one fixed point. The URLs are flat, so this rung is the only place
    // the hierarchy is stated at all.
    const shapes: BreadcrumbRung[][] = [
      buildJournalTrail({ locale: 'en', labels: LABELS }),
      buildJournalTrail({ locale: 'en', labels: LABELS, current: { name: 'A', path: '/en/journal/a' } }),
      buildJournalTrail({ locale: 'en', labels: LABELS, hub: { name: 'H', path: '/en/h' } }),
      buildJournalTrail({
        locale: 'en',
        labels: LABELS,
        hub: { name: 'H', path: '/en/h' },
        current: { name: 'P', path: '/en/h/p' },
      }),
      buildJournalTrail({
        locale: 'en',
        labels: LABELS,
        hub: { name: 'H', path: '/en/h' },
        category: { name: 'C', path: '/en/h/topics/c' },
        current: { name: 'T', path: '/en/t' },
      }),
    ]

    for (const rungs of shapes) {
      expect(rungs[1].name).toBe('Journal')
      expect(rungs[1].path).toBe('/en/journal')
    }
  })
})

describe('buildBreadcrumbSchema — agreement with the rendered trail', () => {
  const rungs = buildJournalTrail({
    locale: 'en',
    labels: LABELS,
    hub: { name: 'Microbiome', path: '/en/microbiome' },
    current: { name: 'Gut bacteria & the gut–brain axis', path: '/en/microbiome/gut-bacteria' },
  })

  it('emits one ListItem per rung, numbered from 1', () => {
    const schema = buildBreadcrumbSchema({ siteURL: SITE, rungs })

    expect(schema.itemListElement).toHaveLength(4)
    expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2, 3, 4])
  })

  it('uses the rung name verbatim — no trimming, casing or entity rewriting', () => {
    // This is the P1 defect §5 names. The ampersand and en dash in the title
    // above are the realistic failure: a builder that HTML-escapes or normalises
    // one side and not the other produces a mismatch no human would spot.
    const schema = buildBreadcrumbSchema({ siteURL: SITE, rungs })

    expect(schema.itemListElement.map((item) => item.name)).toEqual(rungs.map((r) => r.name))
  })

  it('gives every rung an absolute item URL, including the last', () => {
    // The final rung is the current page. It stays in the JSON-LD as a
    // self-reference even though the rendered trail drops the link — that is
    // valid, and it is what the approved previews emit.
    const schema = buildBreadcrumbSchema({ siteURL: SITE, rungs })

    expect(schema.itemListElement.map((item) => item.item)).toEqual([
      'https://nb1.com/en',
      'https://nb1.com/en/journal',
      'https://nb1.com/en/microbiome',
      'https://nb1.com/en/microbiome/gut-bacteria',
    ])
  })

  it('handles any depth, not just the two it was originally written for', () => {
    // It used to take a category and produce 2 or 3 levels. Lexicon terms will
    // want 5. Nothing here should need changing when they arrive.
    const deep = [
      ...rungs.slice(0, 3),
      { name: 'Genera', path: '/en/lexicon/genera' },
      { name: 'Akkermansia', path: '/en/lexicon/genera/akkermansia' },
    ]
    const schema = buildBreadcrumbSchema({ siteURL: SITE, rungs: deep })

    expect(schema.itemListElement).toHaveLength(5)
    expect(schema.itemListElement[4].position).toBe(5)
  })
})
