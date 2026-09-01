/**
 * Checks the Journal's SEO surface against a running dev server.
 *
 *   npm run dev            # in one terminal
 *   node scripts/check-journal-seo.mjs
 *
 * Plain Node, no dependencies, no database access — it asks the site the same
 * questions a crawler would and reports what it got back. Everything it checks is
 * something that can break silently: a sitemap advertising URLs that 404, a
 * `lastReviewed` that is a localized string rather than a date, a browse page
 * typed as medical content, a duplicate address serving one page.
 *
 * Exits non-zero if any check fails, so it can go in CI later.
 *
 * Pass a different origin as the first argument:
 *   node scripts/check-journal-seo.mjs https://staging.nb1.com
 */

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')

let passed = 0
let failed = 0
const failures = []

function ok(label, detail = '') {
  passed++
  console.log(`  \x1b[32mPASS\x1b[0m  ${label}${detail ? ` — ${detail}` : ''}`)
}

function bad(label, detail) {
  failed++
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
  console.log(`  \x1b[31mFAIL\x1b[0m  ${label}${detail ? ` — ${detail}` : ''}`)
}

function check(label, condition, detail = '') {
  condition ? ok(label, detail) : bad(label, detail)
}

async function get(path) {
  try {
    const response = await fetch(`${BASE}${path}`, { redirect: 'manual' })
    return { status: response.status, headers: response.headers, body: await response.text() }
  } catch (error) {
    return { status: 0, headers: new Headers(), body: '', error }
  }
}

/** Every JSON-LD block on the page, parsed. A page may legitimately have several. */
function jsonLdFrom(html) {
  const blocks = []
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = pattern.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()))
    } catch {
      blocks.push({ __unparseable: match[1].slice(0, 120) })
    }
  }
  return blocks
}

/** Flatten @graph so a node can be found regardless of nesting. */
function nodesFrom(blocks) {
  const nodes = []
  for (const block of blocks) {
    if (Array.isArray(block?.['@graph'])) nodes.push(...block['@graph'])
    else nodes.push(block)
  }
  return nodes
}

function hasType(node, type) {
  const raw = node?.['@type']
  return Array.isArray(raw) ? raw.includes(type) : raw === type
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Absolute URLs in the JSON-LD that MUST point at the site being tested.
 *
 * `getServerSideURL()` falls back to `http://localhost:3000` when neither
 * `NEXT_PUBLIC_SERVER_URL` nor `VERCEL_PROJECT_PRODUCTION_URL` is set. A deploy
 * missing both renders perfectly and emits every canonical, every `@id`, every
 * hreflang alternate and every sitemap entry pointing at localhost. Nothing looks
 * broken; the entire SEO surface is simply wrong.
 *
 * Deliberately narrow: only a node's own identity fields. `author.url`,
 * `sameAs` and `citation.url` are SUPPOSED to be external, so a blanket sweep of
 * every `url` in the graph would flag correct markup.
 */
function internalURLsFrom(nodes) {
  const urls = []
  const push = (value) => {
    if (typeof value === 'string' && /^https?:\/\//.test(value)) urls.push(value)
    else if (Array.isArray(value)) value.forEach(push)
  }

  for (const node of nodes) {
    push(node?.['@id'])
    push(node?.url)
    push(node?.image)
    push(node?.mainEntity?.['@id'])

    if (Array.isArray(node?.itemListElement)) {
      for (const item of node.itemListElement) push(item?.item)
    }
    if (Array.isArray(node?.hasPart)) {
      for (const part of node.hasPart) push(part?.url)
    }
  }

  return urls
}



/**
 * A real category URL, scraped from the index page's own links.
 *
 * Hardcoding one means the checker breaks the moment a category is renamed — and
 * worse, it hid a bug: the tests used `/topics/taxa`, which resolved via the
 * category `key` while the canonical pointed at the auto-generated slug. Asking
 * the page which URLs it actually links to cannot drift from what it serves.
 */
async function discoverCategoryPath(indexPath, browseWord) {
  const { status, body } = await get(indexPath)
  if (status !== 200) return null
  const pattern = new RegExp(`href="(/[a-z-]+/[a-z-]+/${browseWord}/[^"#?]+)"`, 'i')
  return body.match(pattern)?.[1] ?? null
}

// ── 1. Route shape — the localized browse segment ─────────────────────────────

async function checkRoutes() {
  console.log('\nRoutes — the localized browse segment')

  // Category URLs use the LOCALIZED SLUG, generated from the title — not the
  // untranslated `key`. Discovered from the index page rather than hardcoded, so
  // this survives an editor renaming a category.
  const enCategory = await discoverCategoryPath('/en/lexicon', 'topics')
  const deCategory = await discoverCategoryPath('/de/glossar', 'themen')

  const cases = [
    ['/en/lexicon', 200, 'English lexicon index'],
    ['/de/glossar', 200, 'German lexicon index'],
    ...(enCategory ? [[enCategory, 200, 'English category (localized slug)']] : []),
    ...(deCategory ? [[deCategory, 200, 'German category (localized slug)']] : []),
    // `key` is identity, not an address. It used to resolve as well, giving every
    // category page a second URL returning 200 — the duplicate-content problem
    // the flat term URL and the chips-without-hrefs rule both exist to avoid.
    ['/en/lexicon/topics/taxa', 404, 'category key must NOT be a URL'],
    ['/de/glossar/themen/taxa', 404, 'German category key must NOT be a URL'],
    // Wrong browse word for the locale.
    ...(deCategory
      ? [[deCategory.replace('/themen/', '/topics/'), 404, 'German hub + English segment must 404']]
      : []),
    ...(enCategory
      ? [[enCategory.replace('/topics/', '/themen/'), 404, 'English hub + German segment must 404']]
      : []),
    // Discover was never published, so it 404s rather than redirects.
    ['/en/discover', 404, '/en/discover must not exist'],
    ['/de/entdecken', 404, '/de/entdecken must not exist'],
  ]

  for (const [path, expected, label] of cases) {
    const { status } = await get(path)
    check(`${label} (${path})`, status === expected, `got ${status}, expected ${expected}`)
  }
}

// ── 2. Structured data ────────────────────────────────────────────────────────

async function checkStructuredData() {
  console.log('\nStructured data')

  // A term URL, discovered from the search endpoint rather than hardcoded, so
  // this keeps working as the corpus changes.
  const index = await get('/en/lexicon-search.json')
  let termPath = null
  try {
    const entries = JSON.parse(index.body)
    check('search endpoint returns entries', Array.isArray(entries) && entries.length > 0,
      `${Array.isArray(entries) ? entries.length : 0} terms`)
    check('search endpoint is noindex',
      index.headers.get('x-robots-tag')?.includes('noindex') === true,
      `x-robots-tag: ${index.headers.get('x-robots-tag') ?? 'absent'}`)
    if (entries?.[0]?.h) termPath = entries[0].h
  } catch {
    bad('search endpoint returns JSON', `status ${index.status}`)
  }

  const pages = [
    { path: '/en/lexicon', must: ['CollectionPage'], mustNot: ['MedicalWebPage'],
      label: 'lexicon index' },
    ...(await (async () => {
      const path = await discoverCategoryPath('/en/lexicon', 'topics')
      return path
        ? [{ path, must: ['DefinedTermSet'], mustNot: ['MedicalWebPage'], label: 'category page' }]
        : []
    })()),
  ]
  if (termPath) {
    pages.push({ path: termPath, must: ['MedicalWebPage', 'DefinedTerm'], mustNot: [],
      label: 'term page' })
  } else {
    bad('term page checks', 'could not discover a term URL from the search endpoint')
  }

  for (const page of pages) {
    const { status, body } = await get(page.path)
    if (status !== 200) {
      bad(`${page.label} loads`, `${page.path} returned ${status}`)
      continue
    }

    const nodes = nodesFrom(jsonLdFrom(body))

    check(`${page.label}: JSON-LD parses`,
      nodes.length > 0 && !nodes.some((n) => n.__unparseable),
      `${nodes.length} nodes`)

    // §12: exactly one BreadcrumbList per page. Two is a defect, not a bonus.
    const crumbs = nodes.filter((n) => hasType(n, 'BreadcrumbList'))
    check(`${page.label}: exactly one BreadcrumbList`, crumbs.length === 1,
      `found ${crumbs.length}`)

    // The visible trail must match the JSON-LD item for item. Checked by name
    // presence rather than exact markup — the rendered trail is anchors and
    // separators, so a character-for-character diff would compare formatting.
    if (crumbs[0]?.itemListElement) {
      const names = crumbs[0].itemListElement.map((i) => i.name).filter(Boolean)
      const missing = names.filter((n) => !body.includes(n))
      check(`${page.label}: every breadcrumb name appears in the HTML`,
        missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : `${names.length} rungs`)
      check(`${page.label}: Journal is at position 2`,
        crumbs[0].itemListElement.some((i) => i.position === 2), '')
    }

    for (const type of page.must) {
      check(`${page.label}: has ${type}`, nodes.some((n) => hasType(n, type)), '')
    }
    for (const type of page.mustNot) {
      // A browse listing is a list of links, not medical content.
      check(`${page.label}: does NOT claim ${type}`,
        !nodes.some((n) => hasType(n, type)), '')
    }

    // lastReviewed must be a date. A localized display string is silently
    // ignored by consumers rather than reported, which is why this is checked.
    for (const node of nodes) {
      if (node?.lastReviewed !== undefined) {
        check(`${page.label}: lastReviewed is an ISO date`,
          typeof node.lastReviewed === 'string' && ISO_DATE.test(node.lastReviewed),
          `got ${JSON.stringify(node.lastReviewed)}`)
      }
    }

    // mainEntity must resolve to a node actually present in the graph.
    for (const node of nodes) {
      const ref = node?.mainEntity?.['@id']
      if (ref) {
        check(`${page.label}: mainEntity resolves inside the graph`,
          nodes.some((n) => n['@id'] === ref), ref)
      }
    }

    // Every identity URL must be on the host under test. Catches a deploy with no
    // NEXT_PUBLIC_SERVER_URL, where everything silently reads localhost.
    const expectedOrigin = new URL(BASE).origin
    const foreign = internalURLsFrom(nodes).filter((url) => {
      try {
        return new URL(url).origin !== expectedOrigin
      } catch {
        return true
      }
    })
    check(`${page.label}: identity URLs are on ${expectedOrigin}`,
      foreign.length === 0,
      foreign.length ? `wrong origin: ${[...new Set(foreign)].slice(0, 3).join(', ')}` : '')

    // Title and description. These come from `generateMetadata`, and a route whose
    // metadata function forgot a branch returns `{}` — no title, no description,
    // no canonical, no hreflang — while rendering perfectly. That is exactly how
    // 854 lexicon term pages shipped with none of it: `Page()` had three branches
    // and `generateMetadata` had two.
    const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
    check(`${page.label}: has a page title`, Boolean(title) && title !== 'NB1', title ?? 'absent')

    const metaDescription = body
      .match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
      ?.match(/content=["']([^"']*)["']/i)?.[1]
      ?.trim()
    check(`${page.label}: has a meta description`, Boolean(metaDescription),
      metaDescription ? `${metaDescription.slice(0, 40)}…` : 'absent')

    // hreflang. Every Journal URL is composed from a localized hub slug, so the
    // whole cluster depends on `hub.slugsByLocale` being populated. If that map
    // is empty, `buildHreflangAlternates` returns undefined and the page emits NO
    // alternates at all — while rendering perfectly and passing every other check
    // here. This assertion exists because that failure has no other symptom.
    const alternates = [...body.matchAll(/<link[^>]+rel=["']alternate["'][^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /hreflang=/i.test(tag))
    const hreflangCodes = alternates
      .map((tag) => tag.match(/hreflang=["']([^"']+)["']/i)?.[1])
      .filter(Boolean)

    check(`${page.label}: emits hreflang alternates`, hreflangCodes.length > 0,
      hreflangCodes.length ? `${hreflangCodes.length} codes` : 'NONE — hub slugsByLocale is likely empty')

    if (hreflangCodes.length) {
      check(`${page.label}: hreflang includes x-default`,
        hreflangCodes.includes('x-default'), hreflangCodes.join(', '))
      // Five live prefixes across two languages: en, en-GB, en-AE, de-DE, de-AT,
      // de-CH, plus x-default. French and Dutch must be absent.
      const forbidden = hreflangCodes.filter((code) => /^(fr|nl)/i.test(code))
      check(`${page.label}: no fr/nl hreflang`, forbidden.length === 0,
        forbidden.join(', ') || 'clean')
    }

    // And the canonical, which is the one Google actually obeys.
    const canonical = body.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0]
    const canonicalHref = canonical?.match(/href=["']([^"']+)["']/i)?.[1]
    check(`${page.label}: has a canonical`, Boolean(canonicalHref), canonicalHref ?? 'absent')
    if (canonicalHref) {
      let sameOrigin = false
      try {
        sameOrigin = new URL(canonicalHref, BASE).origin === expectedOrigin
      } catch {}
      check(`${page.label}: canonical is on ${expectedOrigin}`, sameOrigin, canonicalHref)
    }
  }
}

// ── 3. Sitemaps ───────────────────────────────────────────────────────────────

async function checkSitemaps() {
  console.log('\nSitemaps')

  for (const locale of ['en', 'de']) {
    const { status, body } = await get(`/${locale}/sitemap.xml`)
    if (status !== 200) {
      bad(`/${locale}/sitemap.xml loads`, `status ${status}`)
      continue
    }

    const children = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    const expected = [
      'pages-sitemap.xml', 'posts-sitemap.xml', 'hubs-sitemap.xml', 'pillars-sitemap.xml',
      'research-sitemap.xml', 'lexicon-sitemap.xml', 'lexicon-categories-sitemap.xml',
    ]
    for (const name of expected) {
      check(`${locale} index lists ${name}`, children.some((c) => c.endsWith(name)), '')
    }

    // Every child must actually resolve. A sitemap index pointing at a 404 is
    // worse than one listing fewer children.
    for (const child of children) {
      const path = child.replace(BASE, '')
      const { status: childStatus } = await get(path)
      check(`${locale}: child resolves ${path}`, childStatus === 200, `status ${childStatus}`)
    }
  }

  // The one that would expose a topics/themen mismatch.
  const de = await get('/de/lexicon-categories-sitemap.xml')
  const deLocs = [...de.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (deLocs.length === 0) {
    bad('German category sitemap has entries', 'empty — seed categories first')
  } else {
    check('German category URLs use /themen/',
      deLocs.every((l) => l.includes('/themen/')),
      deLocs.find((l) => !l.includes('/themen/')) ?? `${deLocs.length} URLs`)
    check('German category URLs never use /topics/',
      !deLocs.some((l) => l.includes('/topics/')),
      deLocs.find((l) => l.includes('/topics/')) ?? 'clean')
  }

  const en = await get('/en/lexicon-categories-sitemap.xml')
  const enLocs = [...en.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  if (enLocs.length) {
    check('English category URLs use /topics/',
      enLocs.every((l) => l.includes('/topics/')), `${enLocs.length} URLs`)
  }

  // Every URL a sitemap advertises must resolve. Sampled, because at 854 terms
  // checking all of them would take minutes.
  const terms = await get('/en/lexicon-sitemap.xml')
  const termLocs = [...terms.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const sample = termLocs.slice(0, 5)
  if (sample.length === 0) {
    console.log('  \x1b[33mSKIP\x1b[0m  term sitemap URLs resolve — sitemap is empty')
  } else {
    for (const loc of sample) {
      const { status } = await get(loc.replace(BASE, ''))
      check(`advertised term URL resolves ${loc.replace(BASE, '')}`, status === 200, `status ${status}`)
    }
    if (termLocs.length > sample.length) {
      console.log(`  \x1b[33mNOTE\x1b[0m  checked ${sample.length} of ${termLocs.length} term URLs`)
    }
  }
}

// ── run ───────────────────────────────────────────────────────────────────────

console.log(`Checking ${BASE}`)

const reachable = await get('/en/lexicon')
if (reachable.status === 0) {
  console.error(`\nCannot reach ${BASE}. Is the dev server running?`)
  process.exit(2)
}

await checkRoutes()
await checkStructuredData()
await checkSitemaps()

console.log(`\n${passed} passed, ${failed} failed`)
if (failed) {
  console.log('\nFailures:')
  for (const failure of failures) console.log(`  - ${failure}`)
  process.exit(1)
}
