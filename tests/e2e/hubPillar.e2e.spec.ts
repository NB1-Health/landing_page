import { expect, test, type Page } from '@playwright/test'

const BASE = 'http://localhost:3000'
const HUB = `${BASE}/en/microbiome`

/**
 * Hubs and pillars, end to end.
 *
 * Nothing covered these until now. The two things worth pinning are the ones
 * that would fail silently: a breadcrumb whose visible text has drifted from its
 * JSON-LD (SEO-007 §5 calls that a P1 defect), and a pillar that resolves under
 * a hub it does not belong to — which would put the same article on three URLs
 * and split its ranking three ways.
 *
 * Content-agnostic, like the Journal specs: the pillar is discovered from the
 * hub listing rather than hardcoded to a seeded slug. Run `npm run seed:hubs`
 * and `npm run seed:pillars` first; the pillar tests skip rather than fail when
 * the hub is empty, so an unseeded database does not read as a regression.
 */

type Node = Record<string, unknown>

async function jsonLdNodes(page: Page): Promise<Node[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.flatMap((raw) => {
    const parsed = JSON.parse(raw)
    return (parsed['@graph'] ?? [parsed]) as Node[]
  })
}

/** The visible trail, in order, separators excluded. */
async function visibleTrail(page: Page): Promise<string[]> {
  return page.locator('.jr-crumb a, .jr-crumb [aria-current="page"]').allTextContents()
}

async function firstPillarHref(page: Page): Promise<string | null> {
  await page.goto(HUB)
  const card = page.locator('a.jr-card').first()
  if ((await card.count()) === 0) return null
  return card.getAttribute('href')
}

test.describe('Hub page', () => {
  test('renders a three-rung trail ending in itself', async ({ page }) => {
    await page.goto(HUB)

    await expect(page.locator('h1')).toHaveCount(1)
    expect(await visibleTrail(page)).toEqual(['Home', 'Journal', 'Microbiome'])

    // The last rung is the current page: text with aria-current, never a link.
    await expect(page.locator('.jr-crumb [aria-current="page"]')).toHaveText('Microbiome')
    await expect(page.locator('.jr-crumb a[href="/en/journal"]')).toHaveCount(1)
    await expect(page.locator('.jr-crumb a[href="/en/microbiome"]')).toHaveCount(0)
  })

  test('states the hierarchy in JSON-LD, since the URLs do not', async ({ page }) => {
    await page.goto(HUB)
    const nodes = await jsonLdNodes(page)

    expect(nodes.map((n) => n['@type'])).toContain('CollectionPage')

    const crumb = nodes.find((n) => n['@type'] === 'BreadcrumbList') as {
      itemListElement: { position: number; name: string; item: string }[]
    }
    expect(crumb).toBeTruthy()
    expect(crumb.itemListElement).toHaveLength(3)
    expect(crumb.itemListElement[1].name).toBe('Journal')
    expect(crumb.itemListElement[2].item).toContain('/en/microbiome')
  })

  test('the visible trail and the JSON-LD agree exactly (§5)', async ({ page }) => {
    await page.goto(HUB)

    const crumb = (await jsonLdNodes(page)).find((n) => n['@type'] === 'BreadcrumbList') as {
      itemListElement: { name: string }[]
    }

    expect(crumb.itemListElement.map((i) => i.name)).toEqual(await visibleTrail(page))
  })

  test('a hub with no collection yet says so, and asserts nothing in ItemList', async ({ page }) => {
    // Research and Lexicon have no documents until later phases. An empty
    // ItemList would claim the hub has no content; omitting it says nothing,
    // which is the truthful option.
    await page.goto(`${BASE}/en/research`)
    await expect(page.locator('h1')).toHaveCount(1)

    const nodes = await jsonLdNodes(page)
    const list = nodes.find((n) => n['@type'] === 'ItemList') as
      | { itemListElement?: unknown[] }
      | undefined

    if (list) {
      expect(list.itemListElement?.length ?? 0).toBeGreaterThan(0)
    }
  })
})

test.describe('Pillar page', () => {
  test('renders a four-rung trail through its hub', async ({ page }) => {
    const href = await firstPillarHref(page)
    test.skip(!href, 'no pillars seeded')

    await page.goto(`${BASE}${href}`)

    const trail = await visibleTrail(page)
    expect(trail).toHaveLength(4)
    expect(trail.slice(0, 3)).toEqual(['Home', 'Journal', 'Microbiome'])

    // The hub rung is a real link back up. Without it the only route from a
    // pillar to its hub is the browser's back button.
    await expect(page.locator('.jr-crumb a[href="/en/microbiome"]')).toHaveCount(1)
    await expect(page.locator('.jr-crumb [aria-current="page"]')).toHaveText(trail[3])
  })

  test('the visible trail and the JSON-LD agree exactly (§5)', async ({ page }) => {
    const href = await firstPillarHref(page)
    test.skip(!href, 'no pillars seeded')

    await page.goto(`${BASE}${href}`)

    const crumb = (await jsonLdNodes(page)).find((n) => n['@type'] === 'BreadcrumbList') as {
      itemListElement: { name: string; item: string }[]
    }

    // Character for character, including the title's own punctuation. One array
    // feeds both sides in the code; this is what proves it stayed that way.
    expect(crumb.itemListElement.map((i) => i.name)).toEqual(await visibleTrail(page))
    expect(crumb.itemListElement[3].item).toContain(href!)
  })

  test('carries Article structured data', async ({ page }) => {
    const href = await firstPillarHref(page)
    test.skip(!href, 'no pillars seeded')

    await page.goto(`${BASE}${href}`)
    const nodes = await jsonLdNodes(page)

    const article = nodes.find((n) => n['@type'] === 'Article') as
      | { headline?: string; url?: string }
      | undefined
    expect(article).toBeTruthy()

    // The headline is the h1, not the SEO title — a mismatch here is the same
    // class of defect as a drifting breadcrumb.
    const h1 = await page.locator('h1').first().textContent()
    expect(article!.headline).toBe(h1?.trim())
  })

  test('404s under a hub it does not belong to', async ({ page }) => {
    const href = await firstPillarHref(page)
    test.skip(!href, 'no pillars seeded')

    const slug = href!.split('/').pop()

    // The lookup is scoped to hub AND slug on purpose. If it were scoped to slug
    // alone, this URL would serve the article — putting one document on three
    // URLs and splitting its ranking between them.
    const response = await page.goto(`${BASE}/en/research/${slug}`)
    expect(response?.status()).toBe(404)
  })

  test('404s under a slug that is not a hub at all', async ({ page }) => {
    const href = await firstPillarHref(page)
    test.skip(!href, 'no pillars seeded')

    const slug = href!.split('/').pop()

    const response = await page.goto(`${BASE}/en/not-a-hub-at-all/${slug}`)
    expect(response?.status()).toBe(404)
  })
})
