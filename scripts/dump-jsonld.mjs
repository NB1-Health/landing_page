import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Pulls the JSON-LD out of local pages and writes one paste-ready file per page.
 *
 *   npm run dev                    # in one terminal
 *   node scripts/dump-jsonld.mjs   # in another
 *
 * Output lands in `jsonld/`. Each file holds just that page's
 * `<script type="application/ld+json">` blocks, which is a valid snippet for both
 * validators — so structured data can be checked without deploying anything.
 *
 * WHY THIS EXISTS, AND WHY TWO TOOLS
 *
 * Google's Rich Results Test takes either a public URL or a pasted snippet, and
 * the snippet mode is what makes localhost testable. But it only reports on types
 * that are eligible for a rich RESULT — a visual treatment in search. Of what the
 * Journal emits, that is `BreadcrumbList` everywhere, plus `Article` and `FAQPage`
 * on pillars. It will say nothing useful about `MedicalWebPage`, `DefinedTerm`,
 * `DefinedTermSet` or `CollectionPage`, because none of those produce a rich
 * result. "No items detected" from that tool is not a failure for a lexicon term.
 *
 * For those, Google points at the Schema Markup Validator, which checks
 * schema.org validity with no Google-specific eligibility filter. So:
 *
 *   Rich Results Test      → breadcrumbs render, pillars are eligible as Articles
 *   Schema Markup Validator → everything else is valid schema.org
 *
 * One gotcha from Google's own docs: the Rich Results Test silently ignores
 * comments inside JSON-LD blocks, which the JSON-LD standard does not allow. Ours
 * are `JSON.stringify` output and carry no comments, so this is safe here — but it
 * means the tool can pass markup that would fail in production.
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const OUT = 'jsonld'

async function get(path) {
  try {
    const response = await fetch(`${BASE}${path}`)
    return { status: response.status, body: await response.text() }
  } catch (error) {
    return { status: 0, body: '', error }
  }
}

function scriptTagsFrom(html) {
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
  return html.match(pattern) ?? []
}

/** Pretty-print the JSON inside each tag so the output is readable, not one line. */
function prettify(tag) {
  const inner = tag.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
  try {
    return `<script type="application/ld+json">\n${JSON.stringify(JSON.parse(inner.trim()), null, 2)}\n</script>`
  } catch {
    return tag
  }
}

function summarise(tags) {
  const types = new Set()
  for (const tag of tags) {
    const inner = tag.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    let parsed
    try {
      parsed = JSON.parse(inner.trim())
    } catch {
      types.add('(unparseable)')
      continue
    }
    const nodes = Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [parsed]
    for (const node of nodes) {
      const raw = node?.['@type']
      if (Array.isArray(raw)) raw.forEach((t) => types.add(t))
      else if (raw) types.add(raw)
    }
  }
  return [...types]
}

// Types Google can actually turn into a rich result, of the ones we emit. Used
// only to label the output — it decides nothing.
const RICH_ELIGIBLE = new Set(['BreadcrumbList', 'Article', 'FAQPage'])

const pages = [
  ['lexicon-index-en', '/en/lexicon'],
  ['lexicon-index-de', '/de/glossar'],
  ['pillar-en', '/en/microbiome/gut-health'],
  ['pillar-de', '/de/mikrobiom/darmgesundheit'],
]

/**
 * Category URLs are the LOCALIZED SLUG, generated from the title — so they are
 * scraped from the index page rather than hardcoded. The category `key` used to
 * resolve as a URL too; it no longer does.
 */
async function discoverCategoryPath(indexPath, browseWord) {
  const { status, body } = await get(indexPath)
  if (status !== 200) return null
  const pattern = new RegExp(`href="(/[a-z-]+/[a-z-]+/${browseWord}/[^"#?]+)"`, 'i')
  return body.match(pattern)?.[1] ?? null
}

for (const [name, indexPath, word] of [
  ['lexicon-category-en', '/en/lexicon', 'topics'],
  ['lexicon-category-de', '/de/glossar', 'themen'],
]) {
  const found = await discoverCategoryPath(indexPath, word)
  if (found) pages.push([name, found])
}

// A term URL, discovered rather than hardcoded, so this survives a reseed.
const index = await get('/en/lexicon-search.json')
try {
  const entries = JSON.parse(index.body)
  if (entries?.[0]?.h) pages.push(['lexicon-term-en', entries[0].h])
} catch {
  console.log('Could not read /en/lexicon-search.json — skipping the term page.')
}

const deIndex = await get('/de/lexicon-search.json')
try {
  const entries = JSON.parse(deIndex.body)
  if (entries?.[0]?.h) pages.push(['lexicon-term-de', entries[0].h])
} catch {
  // German terms may not be published yet. Not a failure.
}

const reachable = await get('/en/lexicon')
if (reachable.status === 0) {
  console.error(`Cannot reach ${BASE}. Is the dev server running?`)
  process.exit(2)
}

await mkdir(OUT, { recursive: true })

console.log(`\nDumping JSON-LD from ${BASE} into ${OUT}/\n`)

let written = 0
for (const [name, path] of pages) {
  const { status, body } = await get(path)
  if (status !== 200) {
    console.log(`  skip  ${name.padEnd(22)} ${path} → ${status}`)
    continue
  }

  const tags = scriptTagsFrom(body)
  if (tags.length === 0) {
    console.log(`  none  ${name.padEnd(22)} ${path} → no JSON-LD found`)
    continue
  }

  const types = summarise(tags)
  const rich = types.filter((t) => RICH_ELIGIBLE.has(t))
  const generic = types.filter((t) => !RICH_ELIGIBLE.has(t))

  const header = [
    `<!-- ${path}`,
    `     Rich Results Test will report on: ${rich.join(', ') || '(nothing)'}`,
    `     Check with validator.schema.org:  ${generic.join(', ') || '(nothing)'}`,
    `-->`,
  ].join('\n')

  await writeFile(join(OUT, `${name}.html`), `${header}\n${tags.map(prettify).join('\n')}\n`, 'utf8')
  written++
  console.log(`  ok    ${name.padEnd(22)} ${types.join(', ')}`)
}

console.log(`\n${written} file(s) in ${OUT}/`)
console.log(`
Next, for each file:

  1. Rich Results Test — https://search.google.com/test/rich-results
     Choose the CODE tab, paste the file, run it.
     Expect: BreadcrumbList detected. On pillars, also Article.
     "No items detected" on a lexicon term is CORRECT — DefinedTerm and
     MedicalWebPage are not rich-result types.

  2. Schema Markup Validator — https://validator.schema.org/
     Paste the same file. This is the one that validates MedicalWebPage,
     DefinedTerm, DefinedTermSet and CollectionPage.
     Expect: no errors. Warnings about optional properties are fine.
`)
