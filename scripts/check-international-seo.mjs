import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

/**
 * A status worth trying again rather than failing the deploy over.
 *
 * 429 and 500 were added after staging failed a build on each in turn. Both were
 * transient and both came from the same cause — this check asking a 1-vCPU box
 * for every page in its sitemaps, each of which is an uncached dynamic render.
 * The route that 500'd rendered fine seconds later by hand.
 *
 * This does NOT let a broken page through: a status that persists across all
 * `attempts` still throws and still fails the build. It only stops a single
 * blip from doing so.
 */
const retryableStatuses = new Set([429, 500, 502, 503, 504])
const deploymentEnvironments = new Set(['production', 'staging'])

/**
 * How hard to push the site being checked.
 *
 * Staging is one small instance, and every marketing route is `force-dynamic`
 * with the edge cache switched off — so each page this check fetches is a full
 * uncached render, not a file. Measured on stg, that origin serialises requests
 * at roughly 600ms each; at concurrency 8 a request therefore waits behind
 * seven others before it even starts, and the 15s abort fires on work that was
 * always going to arrive. Fewer requests in flight is FASTER here, not slower:
 * against a serialising origin, concurrency buys no throughput and spends the
 * whole timeout budget on queueing.
 *
 * Production is a different machine with caching in front of it and keeps the
 * original settings. Every value is overridable so CI can tune without a code
 * change.
 */
function readLimits(deploymentEnvironment) {
  const staging = deploymentEnvironment === 'staging'
  const number = (value, fallback) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }
  return {
    attempts: number(process.env.SEO_CHECK_ATTEMPTS, 5),
    pageConcurrency: number(process.env.SEO_CHECK_CONCURRENCY, staging ? 3 : 8),
    // Sitemap discovery used to fan out with an uncapped `Promise.all`. With
    // seven sitemap kinds across nine locales that is a burst the box takes all
    // at once, before the throttled page phase has even begun — and it is what
    // leaves the queue deep enough for the first page fetches to time out.
    sitemapConcurrency: number(process.env.SEO_CHECK_SITEMAP_CONCURRENCY, staging ? 3 : 8),
    timeoutMs: number(process.env.SEO_CHECK_TIMEOUT_MS, staging ? 45_000 : 15_000),
  }
}
const require = createRequire(import.meta.url)
const localeConfig = require('../src/i18n/localeConfig.json')
const localeByPrefix = new Map(
  Object.entries(localeConfig).map(([prefix, definition]) => [
    prefix,
    { htmlLang: definition.htmlLang, hreflangs: definition.hreflangCodes },
  ]),
)
const prefixByHreflang = new Map(
  [...localeByPrefix].flatMap(([prefix, { hreflangs }]) =>
    hreflangs.map((hreflang) => [hreflang, prefix]),
  ),
)
const expectedFullClusterCodes = [...prefixByHreflang.keys(), 'x-default'].sort()

function normalizeURL(value) {
  const url = new URL(value)
  url.hash = ''
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  return url.toString()
}

function decodeXML(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}

export function parseSitemap(xml) {
  const locations = [...xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)].map((match) =>
    decodeXML(match[1].trim()),
  )

  if (/<sitemapindex\b/i.test(xml)) return { kind: 'index', locations }
  if (/<urlset\b/i.test(xml)) return { kind: 'urls', locations }
  throw new Error('Response is not a sitemap index or URL set')
}

export function parseRobotsTxt(value) {
  const groups = []
  const sitemaps = []
  let group

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue

    const separator = line.indexOf(':')
    if (separator === -1) continue
    const name = line.slice(0, separator).trim().toLowerCase()
    const directiveValue = line.slice(separator + 1).trim()

    if (name === 'sitemap') {
      if (directiveValue) sitemaps.push(directiveValue)
      continue
    }

    if (name === 'user-agent') {
      if (!group || group.hasDirectives) {
        group = { directives: [], hasDirectives: false, userAgents: [] }
        groups.push(group)
      }
      group.userAgents.push(directiveValue.toLowerCase())
      continue
    }

    if (!group) continue
    group.hasDirectives = true
    group.directives.push({ name, value: directiveValue })
  }

  return {
    sitemaps,
    universalDisallow: groups
      .filter(({ userAgents }) => userAgents.includes('*'))
      .flatMap(({ directives }) =>
        directives.filter(({ name }) => name === 'disallow').map(({ value }) => value),
      ),
  }
}

function parseAttributes(source) {
  const attributes = new Map()
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g

  for (const match of source.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), decodeXML(match[2] ?? match[3] ?? match[4] ?? ''))
  }

  return attributes
}

function parseRobotsDirectives(value) {
  return new Set(
    value
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean),
  )
}

function parseXRobotsTag(value) {
  const all = new Set()
  const global = new Set()
  let scoped = false

  for (const rawToken of value.split(',')) {
    const token = rawToken.trim().toLowerCase()
    if (!token) continue

    const separator = token.indexOf(':')
    const directive = separator === -1 ? token : token.slice(separator + 1).trim()
    if (separator !== -1) scoped = true
    all.add(directive)
    if (!scoped) global.add(directive)
  }

  return { all, global }
}

export function parsePageSEO(html) {
  const htmlTag = html.match(/<html\b([^>]*)>/i)
  const htmlLang = htmlTag ? parseAttributes(htmlTag[1]).get('lang') : undefined
  let canonical
  let hreflangStatus
  const alternates = new Map()
  const alternateCodes = new Set()
  const robots = new Set()

  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attributes = parseAttributes(match[1])
    const name = attributes.get('name')?.toLowerCase()
    const content = attributes.get('content')
    if (name === 'robots' && content) {
      for (const token of parseRobotsDirectives(content)) robots.add(token)
    }
    if (name === 'nb1-hreflang') hreflangStatus = content
  }

  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attributes = parseAttributes(match[1])
    const relationships = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/)
    const href = attributes.get('href')

    if (relationships.includes('canonical')) {
      assert(!canonical, 'Duplicate canonical links')
      canonical = href
    }

    if (!relationships.includes('alternate')) continue
    const code = attributes.get('hreflang')
    if (code && href) {
      const normalizedCode = code.toLowerCase()
      assert(!alternateCodes.has(normalizedCode), `Duplicate hreflang code: ${code}`)
      alternateCodes.add(normalizedCode)
      alternates.set(code, href)
    }
  }

  return {
    alternates,
    canonical,
    hreflangStatus,
    htmlLang,
    robots,
  }
}

function basicAuthorization(username, password) {
  if (!username && !password) return undefined
  assert(
    username && password,
    'Both STG_BASIC_AUTH_USERNAME and STG_BASIC_AUTH_PASSWORD are required',
  )
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

export async function checkInternationalSEO({
  baseURL,
  deploymentEnvironment,
  fetchImpl = fetch,
  password = '',
  username = '',
}) {
  assert(
    deploymentEnvironments.has(deploymentEnvironment),
    'deploymentEnvironment must be production or staging',
  )
  const site = new URL(baseURL)
  const expectedOrigin = site.origin
  const authorization = basicAuthorization(username, password)
  const pageCache = new Map()
  const { attempts, pageConcurrency, sitemapConcurrency, timeoutMs } =
    readLimits(deploymentEnvironment)

  async function request(url, acceptedType) {
    const target = new URL(url, site)
    assert.equal(target.origin, expectedOrigin, `Cross-host URL found: ${target}`)
    let lastError

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      let response
      try {
        response = await fetchImpl(target, {
          headers: authorization ? { Authorization: authorization } : undefined,
          redirect: 'manual',
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        // A timeout lands here as an AbortError, leaving `response` undefined —
        // which falls through to the retry below rather than being mistaken for
        // a bad status. That is deliberate; don't "simplify" it into the
        // `if (response)` branch.
        lastError = error
      }

      if (response && !retryableStatuses.has(response.status)) {
        assert.equal(response.status, 200, `${target} returned ${response.status}, expected 200`)
        const contentType = response.headers.get('content-type') ?? ''
        assert.match(
          contentType,
          acceptedType,
          `${target} returned unexpected content-type ${contentType}`,
        )
        return response
      }

      if (response) {
        lastError = new Error(`${target} returned ${response.status}`)
        await response.arrayBuffer()
      }

      // Back off rather than hammering: an origin that just timed out or 500'd
      // is busy, and retrying at a fixed 2s adds to exactly the queue that
      // caused the failure. 2s, 4s, 8s, 16s.
      if (attempt < attempts) await wait(2_000 * 2 ** (attempt - 1))
    }

    throw lastError
  }

  async function discoverPages(sitemapURL, seen = new Set()) {
    const normalized = normalizeURL(sitemapURL)
    assert(!seen.has(normalized), `Sitemap cycle found at ${normalized}`)
    seen.add(normalized)

    const response = await request(normalized, /(?:application|text)\/(?:[\w.+-]*\+)?xml/i)
    const sitemap = parseSitemap(await response.text())

    if (sitemap.kind === 'urls') return sitemap.locations.map(normalizeURL)
    assert(sitemap.locations.length > 0, `${normalized} sitemap index is empty`)

    const nested = await mapWithConcurrency(sitemap.locations, sitemapConcurrency, (location) =>
      discoverPages(location, new Set(seen)),
    )
    return nested.flat()
  }

  async function readPage(url) {
    const normalized = normalizeURL(url)
    if (pageCache.has(normalized)) return pageCache.get(normalized)

    const pending = (async () => {
      const response = await request(normalized, /text\/html/i)
      const seo = parsePageSEO(await response.text())
      const headerRobots = parseXRobotsTag(response.headers.get('x-robots-tag') ?? '')
      const prefix = new URL(normalized).pathname.split('/').filter(Boolean)[0]
      const currentLocale = localeByPrefix.get(prefix)

      assert(seo.canonical, `${normalized} is missing a canonical`)
      assert.equal(normalizeURL(seo.canonical), normalized, `${normalized} is not self-canonical`)
      assert(currentLocale, `${normalized} has unsupported locale prefix /${prefix}`)
      assert(seo.htmlLang, `${normalized} is missing <html lang>`)
      assert.equal(
        seo.htmlLang,
        currentLocale.htmlLang,
        `${normalized} must use <html lang="${currentLocale.htmlLang}">`,
      )
      assert(
        !seo.robots.has('noindex') && !seo.robots.has('none'),
        `${normalized} is noindex but appears in a sitemap`,
      )
      if (deploymentEnvironment === 'staging') {
        assert(
          headerRobots.global.has('noindex'),
          `${normalized} is missing global staging X-Robots noindex`,
        )
        assert(
          headerRobots.global.has('nofollow'),
          `${normalized} is missing global staging X-Robots nofollow`,
        )
      } else {
        assert(
          !headerRobots.all.has('noindex') && !headerRobots.all.has('none'),
          `${normalized} has production X-Robots noindex`,
        )
        assert(!headerRobots.all.has('nofollow'), `${normalized} has production X-Robots nofollow`)
      }

      // A document with no published English variant cannot produce the required
      // x-default -> English target. The renderer intentionally leaves that page
      // standalone; English pages must always declare their generated cluster.
      if (seo.alternates.size === 0) {
        assert.notEqual(prefix, 'en', `${normalized} is missing hreflang alternates`)
        assert.equal(
          seo.hreflangStatus,
          'suppressed-missing-x-default',
          `${normalized} has no hreflang without a declared missing-x-default reason`,
        )
        assert.fail(`${normalized} cannot ship without a published x-default locale`)
      }

      for (const [code, href] of seo.alternates) {
        if (code !== 'x-default') {
          assert.doesNotThrow(
            () => Intl.getCanonicalLocales(code),
            `${normalized} has invalid hreflang ${code}`,
          )
          assert(prefixByHreflang.has(code), `${normalized} has unexpected hreflang ${code}`)
        }
        const alternateURL = new URL(href)
        assert.equal(
          alternateURL.origin,
          expectedOrigin,
          `${normalized} links to another host: ${href}`,
        )
        if (code !== 'x-default') {
          assert.equal(
            alternateURL.pathname.split('/').filter(Boolean)[0],
            prefixByHreflang.get(code),
            `${normalized} maps ${code} to the wrong locale URL: ${href}`,
          )
        }
      }

      const xDefault = seo.alternates.get('x-default')
      assert(xDefault, `${normalized} is missing x-default`)
      const declaredAlternateURLs = new Set(
        [...seo.alternates]
          .filter(([code]) => code !== 'x-default')
          .map(([, href]) => normalizeURL(href)),
      )
      assert(
        declaredAlternateURLs.has(normalizeURL(xDefault)),
        `${normalized} x-default does not target a declared alternate`,
      )

      for (const code of currentLocale.hreflangs) {
        const href = seo.alternates.get(code)
        assert(href, `${normalized} is missing self hreflang ${code}`)
        assert.equal(
          normalizeURL(href),
          normalized,
          `${normalized} ${code} is not self-referencing`,
        )
      }

      return { ...seo, url: normalized }
    })()

    pageCache.set(normalized, pending)
    return pending
  }

  const robotsResponse = await request(new URL('/robots.txt', site), /text\/plain/i)
  const robotsText = await robotsResponse.text()
  const robotsPolicy = parseRobotsTxt(robotsText)
  // Compare disallow paths without a trailing slash. The edge (nginx) serves `Disallow: /cms/`,
  // while app/robots.ts and this guard speak in terms of `/cms` — they mean the same directory, so
  // the check must not fail on the slash. A bare `/` is mapped through unchanged (so a real
  // Disallow: / is still detected), and any non-slash difference stays strict.
  const disallowPaths = robotsPolicy.universalDisallow.map((path) => path.replace(/\/+$/, '') || '/')
  const rootSitemap = normalizeURL(new URL('/sitemap.xml', site))

  if (deploymentEnvironment === 'staging') {
    assert(
      disallowPaths.includes('/'),
      'Staging robots.txt is missing Disallow: /',
    )
    assert.equal(robotsPolicy.sitemaps.length, 0, 'Staging robots.txt must not advertise sitemaps')
  } else {
    assert(
      !disallowPaths.includes('/'),
      'Production robots.txt must not contain Disallow: /',
    )
    assert(
      disallowPaths.includes('/cms'),
      'Production robots.txt must contain Disallow: /cms',
    )
    assert(
      robotsPolicy.sitemaps.some((sitemap) => normalizeURL(sitemap) === rootSitemap),
      `Production robots.txt must advertise ${rootSitemap}`,
    )
    assert(!robotsText.includes('stg.nb1.com'), 'Production robots.txt references staging')
  }

  const sitemapPages = [...new Set(await discoverPages(new URL('/sitemap.xml', site)))]
  const sitemapPageSet = new Set(sitemapPages)
  // Keep the deploy check gentle on the same small staging instance it is
  // validating. Sitemap discovery is throttled too now — see `readLimits`; it
  // used to fan out uncapped, which front-loaded a burst onto the box and left
  // this phase timing out behind it.
  const pages = await mapWithConcurrency(sitemapPages, pageConcurrency, readPage)

  for (const page of pages) {
    for (const alternateURL of new Set([...page.alternates.values()].map(normalizeURL))) {
      assert(
        sitemapPageSet.has(alternateURL),
        `${page.url} links to ${alternateURL}, but that alternate is missing from sitemaps`,
      )
      const alternate = await readPage(alternateURL)
      assert.deepEqual(
        [...alternate.alternates]
          .map(([code, href]) => [code, normalizeURL(href)])
          .sort(([left], [right]) => left.localeCompare(right)),
        [...page.alternates]
          .map(([code, href]) => [code, normalizeURL(href)])
          .sort(([left], [right]) => left.localeCompare(right)),
        `${alternate.url} does not reciprocate ${page.url}'s hreflang cluster`,
      )
    }
  }

  const homepageByPath = new Map(
    pages
      .filter((page) => new URL(page.url).pathname.split('/').filter(Boolean).length === 1)
      .map((page) => [new URL(page.url).pathname, page]),
  )
  const expectedHomepagePaths = [...localeByPrefix.keys()].map((prefix) => `/${prefix}`).sort()
  assert.deepEqual(
    [...homepageByPath.keys()].sort(),
    expectedHomepagePaths,
    'Sitemaps must contain every localized homepage',
  )

  const homepages = [...homepageByPath.values()]
  for (const homepage of homepages) {
    assert.deepEqual(
      [...homepage.alternates.keys()].sort(),
      expectedFullClusterCodes,
      `${homepage.url} does not contain the complete homepage cluster`,
    )
    assert.equal(
      normalizeURL(homepage.alternates.get('x-default')),
      normalizeURL(homepage.alternates.get('en')),
      `${homepage.url} x-default must target English`,
    )
    for (const [code, prefix] of prefixByHreflang) {
      assert.equal(
        new URL(homepage.alternates.get(code)).pathname,
        `/${prefix}`,
        `${homepage.url} ${code} must target /${prefix}`,
      )
    }
  }

  const swissHomepage = homepages[0].alternates.get('de-CH')
  assert.equal(new URL(swissHomepage).pathname, '/ch', 'de-CH must target /ch')

  const englishPlans = pages.find((page) => new URL(page.url).pathname === '/en/our-plans')
  assert(englishPlans, 'The /en/our-plans parity page was not discovered in sitemaps')
  assert.deepEqual(
    [...englishPlans.alternates.keys()].sort(),
    expectedFullClusterCodes,
    '/en/our-plans must retain the complete deep-page hreflang cluster',
  )
  assert.equal(
    normalizeURL(englishPlans.alternates.get('x-default')),
    normalizeURL(englishPlans.alternates.get('en')),
    '/en/our-plans x-default must target English',
  )

  return { checkedPages: pageCache.size, sitemapPages: pages.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseURL = process.env.SEO_BASE_URL
  assert(baseURL, 'SEO_BASE_URL is required')

  const result = await checkInternationalSEO({
    baseURL,
    deploymentEnvironment: process.env.SEO_DEPLOY_ENV,
    password: process.env.STG_BASIC_AUTH_PASSWORD,
    username: process.env.STG_BASIC_AUTH_USERNAME,
  })
  console.log(
    `International SEO passed for ${result.sitemapPages} sitemap pages (${result.checkedPages} pages including alternates).`,
  )
}
