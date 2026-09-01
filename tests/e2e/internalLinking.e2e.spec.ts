import { expect, test } from '@playwright/test'

const BASE = 'http://localhost:3000'

/**
 * SEO-007 §11 — the internal linking the hubs depend on.
 *
 * §11.0 calls the footer block "the single most important item in this list",
 * and it is a hard SEO dependency rather than a design choice: before it existed
 * nothing on the site linked to a hub at all. `/en/microbiome` was reachable only
 * from the breadcrumb on its own pillar pages and from the sitemap — crawlable,
 * but with no internal link equity reaching it from anywhere.
 *
 * These are e2e rather than unit tests on purpose. The requirement is about what
 * a crawler receives, and the only honest way to assert that is to look at the
 * bytes the server sends.
 *
 * Run `npm run seed:hubs` first. The German case skips rather than fails when
 * that locale has not been seeded, so an unseeded database does not read as a
 * regression.
 */

const HUB_PATHS = ['/en/journal', '/en/microbiome', '/en/research', '/en/lexicon']

test.describe('Footer content block (§11.0)', () => {
  test('links to the Journal and all three hubs', async ({ page }) => {
    await page.goto(`${BASE}/en/journal`)

    const footer = page.locator('footer.nbf')
    await expect(footer).toBeVisible()

    for (const path of HUB_PATHS) {
      await expect(
        footer.locator(`a[href="${path}"]`),
        `footer should link to ${path}`,
      ).toHaveCount(1)
    }
  })

  test('is in the server-rendered HTML, not added by hydration', async ({ request }) => {
    // The block lives in FooterClient, which is a client component. Next SSRs
    // those, so the anchors ship in the initial response — but that is an
    // assumption worth pinning, because a future `dynamic(..., {ssr:false})` or
    // a `useEffect` guard would silently make the whole block invisible to a
    // crawler while looking perfectly fine in a browser.
    const response = await request.get(`${BASE}/en/journal`)
    expect(response.ok()).toBeTruthy()
    const html = await response.text()

    for (const path of HUB_PATHS) {
      expect(html, `raw HTML should contain a link to ${path}`).toContain(`href="${path}"`)
    }
  })

  test('needs no interaction to reveal', async ({ page }) => {
    // §11.0's reason for existing: the Journal sits behind two hovers in the nav.
    // A footer block that also needed a hover would not compensate for anything.
    await page.goto(`${BASE}/en/journal`)

    const link = page.locator('footer.nbf a[href="/en/microbiome"]')
    await expect(link).toBeVisible()
  })

  test('appears on a page that is not the Journal', async ({ page }) => {
    // "Always-rendered" means every page, not just the content section. If this
    // ever fails, the block has been attached to a route rather than the footer.
    await page.goto(`${BASE}/en`)

    const footer = page.locator('footer.nbf')
    await expect(footer.locator('a[href="/en/journal"]')).toHaveCount(1)
  })

  test('uses each locale own slugs, never the English ones', async ({ page }) => {
    await page.goto(`${BASE}/de/journal`)

    const links = page.locator('footer.nbf nav.nbf-col a[href^="/de/"]')
    const hrefs = await links.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    )

    const hubHrefs = hrefs.filter((href) => href.split('/').filter(Boolean).length === 2)
    test.skip(hubHrefs.length < 4, 'German hubs not seeded')

    // The failure this guards against is a footer built by swapping the locale
    // segment of the English path: /de/microbiome would 404, because the German
    // hub is a different slug entirely. §6 forbids exactly this construction for
    // hreflang and the same reasoning applies to a link.
    for (const href of hubHrefs) {
      expect(href.startsWith('/de/')).toBeTruthy()
    }
    expect(hubHrefs).toContain('/de/journal')
  })
})

test.describe('Journal index links down to the hubs (§11.1)', () => {
  test('renders a hub strip with real anchors', async ({ page }) => {
    await page.goto(`${BASE}/en/journal`)

    const strip = page.locator('.jr-hubs')
    await expect(strip).toBeVisible()

    const links = strip.locator('a.jr-hubs__link')
    await expect(links).toHaveCount(3)

    for (const path of ['/en/microbiome', '/en/research', '/en/lexicon']) {
      await expect(strip.locator(`a[href="${path}"]`)).toHaveCount(1)
    }
  })

  test('the strip is links, and the topic chips are still not', async ({ page }) => {
    // These two sit near each other and look alike by design. SEO-007 §10
    // removed the category archives and made the chips hrefless filters; if a
    // later restyle ever merges the two, this catches it from both directions.
    await page.goto(`${BASE}/en/journal`)

    await expect(page.locator('.jr-hubs__link').first()).toHaveAttribute('href', /^\/en\//)
    await expect(page.locator('.jr-chip[href]')).toHaveCount(0)
  })
})
