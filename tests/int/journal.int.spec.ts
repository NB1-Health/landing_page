import { beforeEach, describe, expect, it, vi } from 'vitest'

import { enforceSingleFeatured } from '@/collections/Posts/hooks/enforceSingleFeatured'
import { requiredOnPublish } from '@/collections/Posts/hooks/requiredOnPublish'
import { buildBreadcrumbSchema } from '@/utilities/buildSchema'
import { buildJournalTrail } from '@/utilities/journalTrail'
import { countLexicalWords, estimateReadTime } from '@/utilities/countLexicalWords'
import { cardTopic, thumbClassName, toJournalCard } from '@/utilities/journalCard'
import { toChromeId } from '@/utilities/chromeId'

const logger = { info: vi.fn(), warn: vi.fn() }

/** Minimal serialized lexical document with `n` paragraphs of `words` words. */
function lexical(paragraphs: number, wordsPerParagraph = 50) {
  const text = Array.from({ length: wordsPerParagraph }, () => 'word').join(' ')
  return {
    root: {
      type: 'root',
      version: 1,
      children: Array.from({ length: paragraphs }, () => ({
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text }],
      })),
    },
  }
}

describe('read time', () => {
  it('counts words across intro and content together', () => {
    expect(countLexicalWords(lexical(2), lexical(3))).toBe(250)
  })

  it('rounds to whole minutes and never returns zero for real content', () => {
    expect(estimateReadTime(lexical(1, 10))).toBe(1)
    expect(estimateReadTime(lexical(9))).toBe(2)
  })

  it('returns undefined for empty content rather than 0', () => {
    expect(estimateReadTime(null, undefined)).toBeUndefined()
  })

  it('ignores a localized map, which would multiply the estimate per locale', () => {
    // Field hooks receive this shape on a `locale: 'all'` write. Counting it
    // would report ~8x the real read time on an eight-locale site.
    const localizedMap = { en: lexical(10), de: lexical(10) }
    expect(countLexicalWords(localizedMap as never)).toBe(0)
  })
})

describe('requiredOnPublish', () => {
  const validate = requiredOnPublish('Excerpt')

  it('lets a draft save with the field empty', () => {
    expect(validate('', { data: { _status: 'draft' } })).toBe(true)
    expect(validate(undefined, { data: {} })).toBe(true)
  })

  it('blocks publishing with the field empty', () => {
    expect(validate('', { data: { _status: 'published' } })).toBe(
      'Excerpt is required before publishing.',
    )
  })

  it('treats whitespace as empty', () => {
    expect(validate('   ', { data: { _status: 'published' } })).toContain('required')
  })

  it('allows publishing once filled', () => {
    expect(validate('A real excerpt.', { data: { _status: 'published' } })).toBe(true)
  })

  it('never blocks the API ingestion path', () => {
    expect(validate('', { data: { _status: 'published', source: 'api' } })).toBe(true)
  })

  it('reads a locale-keyed status map', () => {
    expect(validate('', { data: { _status: { en: 'published', de: 'draft' } } })).toContain(
      'required',
    )
    expect(validate('', { data: { _status: { en: 'draft', de: 'draft' } } })).toBe(true)
  })

  it('treats an empty array as empty, for relationship fields', () => {
    expect(validate([], { data: { _status: 'published' } })).toContain('required')
  })
})

describe('enforceSingleFeatured', () => {
  beforeEach(() => vi.clearAllMocks())

  const makeReq = (docs: { id: number }[]) => ({
    context: {} as Record<string, unknown>,
    locale: 'en',
    payload: {
      find: vi.fn().mockResolvedValue({ docs }),
      update: vi.fn().mockResolvedValue({}),
      logger,
    },
  })

  it('clears the flag on every other post when one is published as featured', async () => {
    const req = makeReq([{ id: 2 }, { id: 3 }])

    await enforceSingleFeatured({
      doc: { id: 1, featured: true, _status: 'published' },
      req,
    } as never)

    expect(req.payload.update).toHaveBeenCalledTimes(2)
    const ids = req.payload.update.mock.calls.map((call) => call[0].id)
    expect(ids).toEqual([2, 3])
  })

  it('marks the cascade so it cannot recurse or storm revalidation', async () => {
    const req = makeReq([{ id: 2 }])

    await enforceSingleFeatured({
      doc: { id: 1, featured: true, _status: 'published' },
      req,
    } as never)

    const context = req.payload.update.mock.calls[0][0].context
    expect(context.skipEnforceSingleFeatured).toBe(true)
    expect(context.disableRevalidate).toBe(true)
  })

  it('does nothing when the post is not featured', async () => {
    const req = makeReq([{ id: 2 }])
    await enforceSingleFeatured({ doc: { id: 1, featured: false }, req } as never)
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('does not let a draft steal the live featured slot', async () => {
    const req = makeReq([{ id: 2 }])
    await enforceSingleFeatured({
      doc: { id: 1, featured: true, _status: 'draft' },
      req,
    } as never)
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('stops when re-entered, so the cascade cannot loop', async () => {
    const req = makeReq([{ id: 2 }])
    req.context.skipEnforceSingleFeatured = true
    await enforceSingleFeatured({
      doc: { id: 1, featured: true, _status: 'published' },
      req,
    } as never)
    expect(req.payload.find).not.toHaveBeenCalled()
  })
})

describe('journal card mapping', () => {
  const base = {
    id: 12,
    slug: 'gut-health-basics',
    title: 'Gut health basics',
    excerpt: 'A plain summary.',
    readTime: 7,
    primaryCategory: { id: 3, title: 'Gut health', slug: 'gut-health' },
    heroImage: null,
  }

  it('builds a locale-prefixed /journal href', () => {
    expect(toJournalCard(base as never, 'de')?.href).toBe('/de/journal/gut-health-basics')
  })

  it('carries the category through for the label and the chip', () => {
    const card = toJournalCard(base as never, 'en')
    expect(card?.categoryTitle).toBe('Gut health')
    expect(card?.categorySlug).toBe('gut-health')
  })

  it('refuses to render a card with no title for this locale', () => {
    expect(toJournalCard({ ...base, title: '' } as never, 'en')).toBeNull()
    expect(toJournalCard({ ...base, title: '   ' } as never, 'en')).toBeNull()
    expect(toJournalCard({ ...base, slug: '' } as never, 'en')).toBeNull()
  })

  it('drops a zero or missing read time rather than rendering "0 min read"', () => {
    expect(toJournalCard({ ...base, readTime: 0 } as never, 'en')?.readTime).toBeNull()
    expect(toJournalCard({ ...base, readTime: null } as never, 'en')?.readTime).toBeNull()
  })

  it('falls back to the base thumb for an unknown category', () => {
    expect(thumbClassName('science')).toBe('jr-thumb jr-thumb--science')
    expect(thumbClassName('brand-new-topic')).toBe('jr-thumb jr-thumb--brand-new-topic')
    expect(thumbClassName(null)).toBe('jr-thumb')
  })

  it('gives an uncategorised card a topic that matches no chip', () => {
    const card = toJournalCard({ ...base, primaryCategory: null } as never, 'en')
    expect(cardTopic(card!)).toBe('__none__')
  })
})

describe('toChromeId', () => {
  it('normalises an id, a populated document, and empty', () => {
    expect(toChromeId(4)).toBe('4')
    expect(toChromeId({ id: 4, name: 'DarkFooter' })).toBe('4')
    expect(toChromeId(null)).toBeNull()
    expect(toChromeId(undefined)).toBeNull()
  })
})

describe('breadcrumb trail', () => {
  const labels = { home: 'Home', journal: 'Journal' }
  const siteURL = 'https://nb1.com'

  it('is Home / Journal on the hub itself', () => {
    const rungs = buildJournalTrail({ locale: 'en', labels })
    expect(rungs.map((r) => r.name)).toEqual(['Home', 'Journal'])
    expect(rungs.map((r) => r.path)).toEqual(['/en', '/en/journal'])
  })

  it('appends the current page as the final rung', () => {
    const rungs = buildJournalTrail({
      locale: 'de',
      labels: { home: 'Startseite', journal: 'Journal' },
      current: { name: 'Darmgesundheit', path: '/de/journal/gut-health-basics' },
    })
    expect(rungs.map((r) => r.name)).toEqual(['Startseite', 'Journal', 'Darmgesundheit'])
  })

  it('ignores an empty current page rather than rendering a blank rung', () => {
    expect(buildJournalTrail({ locale: 'en', labels, current: { name: '   ', path: '/x' } })).toHaveLength(2)
  })

  it('puts Journal at position 2 — the hierarchy SEO-007 §5 exists to declare', () => {
    const rungs = buildJournalTrail({
      locale: 'en',
      labels,
      current: { name: 'Gut health basics', path: '/en/journal/gut-health-basics' },
    })
    const schema = buildBreadcrumbSchema({ siteURL, rungs })
    expect(schema.itemListElement[1].position).toBe(2)
    expect(schema.itemListElement[1].name).toBe('Journal')
    expect(schema.itemListElement[1].item).toBe('https://nb1.com/en/journal')
  })

  it('serialises the SAME names the visible trail renders', () => {
    // §5: "name must match the visible anchor text character for character."
    // One array feeds both, so this asserts the contract rather than a copy.
    const rungs = buildJournalTrail({
      locale: 'en',
      labels,
      current: { name: 'A title with, punctuation', path: '/en/journal/x' },
    })
    const schema = buildBreadcrumbSchema({ siteURL, rungs })
    expect(schema.itemListElement.map((i) => i.name)).toEqual(rungs.map((r) => r.name))
  })

  it('gives every rung an absolute item URL', () => {
    const rungs = buildJournalTrail({ locale: 'en', labels })
    for (const item of buildBreadcrumbSchema({ siteURL, rungs }).itemListElement) {
      expect(item.item).toMatch(/^https:\/\/nb1\.com\//)
    }
  })

  it('points nothing at a category archive', () => {
    const rungs = buildJournalTrail({
      locale: 'en',
      labels,
      current: { name: 'Gut health basics', path: '/en/journal/gut-health-basics' },
    })
    const urls = buildBreadcrumbSchema({ siteURL, rungs }).itemListElement.map((i) => i.item)
    expect(urls.some((url) => url.includes('/category/'))).toBe(false)
  })

  it('numbers positions from 1', () => {
    const rungs = buildJournalTrail({ locale: 'en', labels })
    expect(buildBreadcrumbSchema({ siteURL, rungs }).itemListElement.map((i) => i.position)).toEqual(
      [1, 2],
    )
  })
})
