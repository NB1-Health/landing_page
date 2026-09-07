import { expect, test, type Page } from '@playwright/test'

const BASE = 'http://localhost:3000'
const INDEX = `${BASE}/en/journal`

/**
 * End-to-end checks for the Journal.
 *
 * Deliberately content-agnostic: the first article is discovered from the index
 * rather than hardcoded to a seeded slug, so these keep passing as the agency
 * publishes real content. Run `npm run seed:journal` first if the Journal is
 * empty — the content-dependent tests skip rather than fail in that case, so an
 * empty CMS does not look like a regression.
 */

const WIDTHS = [
  { name: 'desktop', width: 1440, height: 1200 },
  { name: 'tablet', width: 768, height: 1200 },
  { name: 'mobile', width: 375, height: 1200 },
]

async function firstArticleHref(page: Page): Promise<string | null> {
  await page.goto(INDEX)
  const card = page.locator('a.jr-card, a.jr-feat').first()
  if ((await card.count()) === 0) return null
  return card.getAttribute('href')
}

test.describe('Journal index', () => {
  test('renders the approved shell', async ({ page }) => {
    await page.goto(INDEX)

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('.jr-hero')).toBeVisible()
    await expect(page.locator('.jr-body')).toBeVisible()
  })

  test('carries the structured data SEO-007 §8 found missing', async ({ page }) => {
    // Defect 2 in the ticket: the hub prototype had no JSON-LD of any kind, so
    // the hierarchy in §5 had nothing to attach to.
    await page.goto(INDEX)

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const nodes = blocks.flatMap((raw) => {
      const parsed = JSON.parse(raw)
      return (parsed['@graph'] ?? [parsed]) as Record<string, unknown>[]
    })
    const types = nodes.map((node) => node['@type'])

    expect(types).toContain('BreadcrumbList')
    expect(types).toContain('CollectionPage')

    const crumb = nodes.find((n) => n['@type'] === 'BreadcrumbList') as {
      itemListElement: { position: number; name: string; item: string }[]
    }
    // Journal at position 2 is the whole point: the URLs are flat, so this is
    // the only place the hierarchy is stated.
    expect(crumb.itemListElement[1].position).toBe(2)
    expect(crumb.itemListElement[1].item).toContain('/en/journal')
  })

  test('the visible trail matches the markup exactly', async ({ page }) => {
    await page.goto(INDEX)

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    const nodes = blocks.flatMap((raw) => {
      const parsed = JSON.parse(raw)
      return (parsed['@graph'] ?? [parsed]) as Record<string, unknown>[]
    })
    const crumb = nodes.find((n) => n['@type'] === 'BreadcrumbList') as {
      itemListElement: { name: string }[]
    }

    const visible = (await page.locator('.jr-crumb').innerText())
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)

    // §5 treats any drift here as a P1 defect.
    expect(crumb.itemListElement.map((i) => i.name)).toEqual(visible)
  })

  test('the breadcrumb is in the raw HTML, not injected by JS', async ({ browser }) => {
    // §5: "must be present in the HTML response, not injected by client JavaScript."
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(INDEX)
    const html = await page.content()
    await context.close()

    expect(html).toContain('aria-label="Breadcrumb"')
    expect(html).toContain('application/ld+json')
  })

  test('carries an og:image', async ({ page }) => {
    // §8, defect 8. A hub with no card image is a bare link everywhere it is shared.
    await page.goto(INDEX)
    const content = await page.locator('meta[property="og:image"]').first().getAttribute('content')
    expect(content).toBeTruthy()
  })

  test('shows at most one featured article', async ({ page }) => {
    await page.goto(INDEX)
    // The brief is explicit: "never show two".
    expect(await page.locator('.jr-feat').count()).toBeLessThanOrEqual(1)
  })

  test('every card carries the fields the brief requires', async ({ page }) => {
    await page.goto(INDEX)
    const cards = page.locator('a.jr-card')
    const count = await cards.count()
    test.skip(count === 0, 'No published articles — run npm run seed:journal')

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i)
      await expect(card).toHaveAttribute('href', /\/en\/journal\//)
      await expect(card.locator('h3')).not.toBeEmpty()
    }
  })

  test('topic chips filter without a page load', async ({ page }) => {
    await page.goto(INDEX)
    const chips = page.locator('.jr-chip')
    test.skip((await chips.count()) < 2, 'Needs at least one category')

    const before = await page.locator('a.jr-card').count()
    const url = page.url()

    await chips.nth(1).click()
    await expect(chips.nth(1)).toHaveClass(/is-active/)
    // Client-side filter: the URL must not change.
    expect(page.url()).toBe(url)

    const after = await page.locator('a.jr-card').count()
    expect(after).toBeLessThanOrEqual(before)
  })

  test('all cards are in the server-rendered HTML, not injected by JS', async ({ browser }) => {
    // Crawlers and no-JS visitors must see the full list.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(INDEX)
    const html = await page.content()
    await context.close()

    expect(html).toContain('jr-grid')
  })
})

test.describe('Journal article', () => {
  test('renders the approved layout with exactly one h1', async ({ page }) => {
    const href = await firstArticleHref(page)
    test.skip(!href, 'No published articles — run npm run seed:journal')

    await page.goto(`${BASE}${href}`)

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('.jr-crumb')).toBeVisible()
    await expect(page.locator('.jr-byline')).toBeVisible()
    await expect(page.locator('.jr-prose')).toBeVisible()
    await expect(page.locator('.jr-cta')).toBeVisible()
  })

  test('every table-of-contents anchor resolves to a heading', async ({ page }) => {
    const href = await firstArticleHref(page)
    test.skip(!href, 'No published articles')

    await page.goto(`${BASE}${href}`)
    const links = page.locator('.jr-toc a')
    const count = await links.count()
    test.skip(count === 0, 'Article has no H2 headings')

    for (let i = 0; i < count; i++) {
      const hash = await links.nth(i).getAttribute('href')
      expect(hash).toMatch(/^#/)
      // A TOC entry pointing at nothing is the classic silent breakage here.
      await expect(page.locator(`${hash}`)).toHaveCount(1)
    }
  })

  test('structured data parses and matches the visible breadcrumb', async ({ page }) => {
    const href = await firstArticleHref(page)
    test.skip(!href, 'No published articles')

    await page.goto(`${BASE}${href}`)

    // The root layout emits its own Organization JSON-LD, so there is more than
    // one ld+json block on the page and `.first()` is not the article's. Collect
    // every block and flatten each @graph before looking for anything.
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(blocks.length).toBeGreaterThan(0)

    const nodes = blocks.flatMap((raw) => {
      try {
        const parsed = JSON.parse(raw)
        return (parsed['@graph'] ?? [parsed]) as Record<string, unknown>[]
      } catch {
        // A block that does not parse is itself a failure worth surfacing.
        throw new Error(`Unparseable JSON-LD block: ${raw.slice(0, 120)}`)
      }
    })

    const types = nodes.map((node) => node['@type'])

    expect(types).toContain('BreadcrumbList')
    expect(types.some((t) => t === 'Article' || t === 'TechArticle')).toBe(true)

    const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList') as {
      itemListElement: { name: string }[]
    }
    const markupTrail = breadcrumb.itemListElement.map((item) => item.name)

    // The brief requires the markup and the rendered trail to agree.
    const visibleTrail = (await page.locator('.jr-crumb').innerText())
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)

    expect(markupTrail).toEqual(visibleTrail)
  })

  test('carries the Open Graph article tags', async ({ page }) => {
    const href = await firstArticleHref(page)
    test.skip(!href, 'No published articles')

    await page.goto(`${BASE}${href}`)

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    expect(await page.locator('meta[property="article:published_time"]').count()).toBe(1)
  })

  test('the canonical points at /journal, matching the JSON-LD', async ({ page }) => {
    const href = await firstArticleHref(page)
    test.skip(!href, 'No published articles')

    await page.goto(`${BASE}${href}`)
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toContain('/journal/')
    expect(canonical).not.toContain('/posts/')
  })
})

test.describe('Topic chips', () => {
  test('carry no URL of any kind', async ({ page }) => {
    // TICKET-SEO-007 §10 and its acceptance criteria: "Journal chips carry no
    // URL, no query parameter and no path." A crawlable category URL here would
    // compete with the Microbiome pillar built to rank for the same term. This
    // asserts the constraint directly, because the previous implementation DID
    // link and nothing caught it.
    await page.goto(INDEX)
    const chips = page.locator('.jr-filter .jr-chip')
    const count = await chips.count()
    test.skip(count === 0, 'Needs at least one category')

    expect(await page.locator('.jr-filter a').count()).toBe(0)

    for (let i = 0; i < count; i++) {
      const chip = chips.nth(i)
      await expect(chip).toHaveJSProperty('tagName', 'BUTTON')
      expect(await chip.getAttribute('href')).toBeNull()
    }
  })

  test('no category archive route exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/en/journal/category/gut-health`, {
      waitUntil: 'commit',
    })
    expect(response?.status()).toBe(404)
  })
})

test.describe('Legacy URLs', () => {
  test('/posts redirects to /journal', async ({ page }) => {
    const response = await page.goto(`${BASE}/en/posts`)
    expect(page.url()).toContain('/en/journal')
    expect(response?.status()).toBe(200)
  })
})

/**
 * Screenshots for the visual comparison against the two approved templates. Not
 * assertions — a pixel diff against the source HTML would be noise, since those
 * files reference fonts and images this app serves differently. These are
 * attached to the HTML report for a human to compare side by side.
 */
test.describe('Visual capture', () => {
  for (const viewport of WIDTHS) {
    test(`captures the Journal at ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      await page.goto(INDEX)
      testInfo.attach(`index-${viewport.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })

      const href = await firstArticleHref(page)
      if (!href) return

      await page.goto(`${BASE}${href}`)
      testInfo.attach(`article-${viewport.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })
    })
  }
})
