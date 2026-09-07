import config from '@payload-config'
import { getPayload } from 'payload'

import { appLocales, defaultLocale, localeConfig, type AppLocale } from '@/i18n/config'

/**
 * Which locales the Journal actually covers, read from the database.
 *
 *   npm run check:locales
 *
 * There is deliberately no `journalLocales` config list to compare against. A
 * declared list can be wrong — say French is live while French has no content and
 * hreflang starts advertising URLs that 404, which §6 warns can invalidate a whole
 * cluster rather than just its own entry. Every content query sets
 * `fallbackLocale: false`, so a locale exists exactly where content exists, and
 * the data is the only thing that cannot lie.
 *
 * What was missing was not a switch but visibility: "which locales are live?" was
 * unanswerable without writing queries. This answers it.
 *
 * Distinct from `scripts/check-international-seo.mjs`, which crawls a DEPLOYED
 * site and asserts hreflang reciprocity, self-canonicals and x-default. That one
 * checks the pages are correct; this one checks which pages exist at all.
 *
 * Counts mirror the page queries rather than counting rows: a document is counted
 * for a locale only where it has BOTH a title and a slug there, because that is
 * exactly when it renders. A row that exists but has no slug in this locale is not
 * a page, and counting it would report coverage the site does not have.
 */

const payload = await getPayload({ config })

type Coverage = {
  hubs: number
  pillars: number
  terms: number
  categories: number
  articles: number
}

const HUB_TOTAL = 3

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Documents that would actually render: title AND slug present in this locale. */
async function countRenderable(
  collection: 'pillars' | 'lexicon-terms' | 'scientific-articles',
  locale: AppLocale,
): Promise<number> {
  const result = await payload.find({
    collection,
    depth: 0,
    draft: false,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    pagination: false,
    select: { title: true, slug: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.filter((doc) => {
    const record = doc as unknown as Record<string, unknown>
    return Boolean(clean(record.title) && clean(record.slug))
  }).length
}

/**
 * Categories are counted on TITLE only, not slug.
 *
 * A category's URL segment falls back to its untranslated `key` when no localized
 * slug is set, so it is reachable wherever the Lexicon hub has a slug. What it
 * cannot do without a localized title is render a heading — so the title is the
 * thing that gates it, and requiring a slug here would under-report every locale.
 */
async function countCategories(locale: AppLocale): Promise<number> {
  const result = await payload.find({
    collection: 'lexicon-categories',
    depth: 0,
    draft: false,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    pagination: false,
    select: { title: true, key: true },
    where: { _status: { equals: 'published' } },
  })

  return result.docs.filter((doc) => {
    const record = doc as unknown as Record<string, unknown>
    return Boolean(clean(record.title) && clean(record.key))
  }).length
}

/**
 * Hubs, unlike every other collection here, has NO drafts — so it has no `_status`
 * column and filtering on one is a 400, not an empty result. `hubQueries` and both
 * sitemap helpers already query hubs without it; this had drifted from that.
 *
 * A hub is therefore live wherever it has a slug in this locale, full stop. There
 * is no unpublished state to exclude.
 */
async function countHubs(locale: AppLocale): Promise<number> {
  const result = await payload.find({
    collection: 'hubs',
    depth: 0,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: true,
    pagination: false,
    select: { slug: true },
  })

  return result.docs.filter((doc) => clean((doc as unknown as Record<string, unknown>).slug))
    .length
}

const coverage: Partial<Record<AppLocale, Coverage>> = {}

for (const locale of appLocales) {
  coverage[locale] = {
    hubs: await countHubs(locale),
    pillars: await countRenderable('pillars', locale),
    terms: await countRenderable('lexicon-terms', locale),
    categories: await countCategories(locale),
    articles: await countRenderable('scientific-articles', locale),
  }
}

// ── report ────────────────────────────────────────────────────────────────────

const columns = ['locale', 'hubs', 'pillars', 'terms', 'cats', 'articles', 'state'] as const
const rows: string[][] = []

for (const locale of appLocales) {
  const c = coverage[locale]!
  const total = c.pillars + c.terms + c.articles

  // Three states, and the middle one is the interesting one.
  let state: string
  if (c.hubs === 0 && total === 0) {
    state = 'not published'
  } else if (c.hubs === 0 && total > 0) {
    // Documents exist but no hub slug, so none of them have a URL. Silent: the
    // documents look fine in the admin and are unreachable on the site.
    state = 'UNREACHABLE — no hub slug'
  } else if (c.hubs > 0 && total === 0) {
    // Hub pages resolve and list nothing. Real URLs, in the sitemap, with no
    // content beneath them — the thin-content case §12 is trying to prevent.
    state = 'THIN — hub with no documents'
  } else if (c.hubs < HUB_TOTAL) {
    state = `partial — ${c.hubs}/${HUB_TOTAL} hubs`
  } else {
    state = 'live'
  }

  rows.push([
    `/${locale}`,
    `${c.hubs}/${HUB_TOTAL}`,
    String(c.pillars),
    String(c.terms),
    String(c.categories),
    String(c.articles),
    state,
  ])
}

const widths = columns.map((column, i) =>
  Math.max(column.length, ...rows.map((row) => row[i]!.length)),
)
const line = (cells: readonly string[]) =>
  cells.map((cell, i) => cell.padEnd(widths[i]!)).join('  ')

console.log('\nJournal locale coverage — documents that would actually render\n')
console.log(line(columns))
console.log(widths.map((w) => '─'.repeat(w)).join('  '))
for (const row of rows) console.log(line(row))

// ── category slugs, per locale ────────────────────────────────────────────────
//
// Category URLs are the localized slug, so a missing slug means no category page
// in that locale — and no entry in the hreflang cluster or the language switcher.
// Read straight from the database with `locale: 'all'`, bypassing every
// `unstable_cache` layer, so this reports the data rather than what a warm cache
// happens to be holding.

const allCategories = await payload.find({
  collection: 'lexicon-categories',
  depth: 0,
  draft: false,
  limit: 0,
  locale: 'all',
  overrideAccess: true,
  pagination: false,
  select: { key: true, slug: true },
})

console.log('\nCategory slugs (the URL segment, per locale)\n')

const liveForCategories = appLocales.filter((locale) => (coverage[locale]?.hubs ?? 0) > 0)
const catHeader = ['key', ...liveForCategories.map((l) => `/${l}`)]
const catRows: string[][] = []

for (const doc of allCategories.docs as unknown as Record<string, unknown>[]) {
  const key = typeof doc.key === 'string' ? doc.key : '(no key)'
  const raw = doc.slug
  const row = [key]
  for (const locale of liveForCategories) {
    const value =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>)[locale] : undefined
    row.push(typeof value === 'string' && value.trim() ? value.trim() : '— MISSING')
  }
  catRows.push(row)
}

if (catRows.length === 0) {
  console.log('  (no published categories)')
} else {
  const catWidths = catHeader.map((column, i) =>
    Math.max(column.length, ...catRows.map((row) => row[i]!.length)),
  )
  const catLine = (cells: readonly string[]) =>
    cells.map((cell, i) => cell.padEnd(catWidths[i]!)).join('  ')
  console.log(catLine(catHeader))
  console.log(catWidths.map((w) => '─'.repeat(w)).join('  '))
  for (const row of catRows) console.log(catLine(row))

  const missing = catRows.filter((row) => row.slice(1).some((cell) => cell === '— MISSING'))
  if (missing.length) {
    console.log(
      `\n  ${missing.length} category/categories have no slug in at least one live locale.` +
        '\n  Those have no page, no hreflang entry and no language-switcher option there.' +
        '\n  The slug auto-generates from the title, so a missing slug means a missing TITLE.',
    )
  }
}

// ── what this means for hreflang ──────────────────────────────────────────────

const live = appLocales.filter((locale) => (coverage[locale]?.hubs ?? 0) > 0)
const declared = live.flatMap((locale) => localeConfig[locale].hreflangCodes)
const silent = appLocales
  .filter((locale) => !live.includes(locale))
  .flatMap((locale) => localeConfig[locale].hreflangCodes)

console.log('\nhreflang')
console.log(`  declared:     ${declared.join(', ') || '(none)'}`)
console.log(`  not declared: ${silent.join(', ') || '(none)'}`)

// x-default targets the default locale, and `buildHreflangAlternates` returns NO
// cluster at all when the default locale has no path. So if English ever loses its
// hub slugs, every page on the site silently stops declaring hreflang — not just
// the English ones. This is the single worst state the report can find, which is
// why it is a failure and not a warning.
const defaultLocaleMissing = !live.includes(defaultLocale)

const problems = rows.filter(
  (row) => row[6]!.startsWith('THIN') || row[6]!.startsWith('UNREACHABLE'),
)

if (problems.length || defaultLocaleMissing) {
  console.log('\nProblems')

  if (defaultLocaleMissing) {
    console.log(
      `  /${defaultLocale}: NO HUB SLUGS — x-default cannot resolve, so NO page on the` +
        `\n       site will declare hreflang at all, in any locale.`,
    )
  }

  for (const row of problems) console.log(`  ${row[0]}: ${row[6]}`)

  console.log(
    '\n  THIN means real URLs in the sitemap with nothing beneath them.' +
      '\n  UNREACHABLE means documents with no hub slug to build a URL from.',
  )
  process.exit(1)
}

console.log('\nNo coverage problems.\n')
process.exit(0)
