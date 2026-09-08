/** Local browser QA. Plan API is fixture-backed; this does NOT place purchases. */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const base = 'http://localhost:3017'
const output = path.resolve('outputs/influencer-design')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const errors: string[] = []
page.on('pageerror', (error) => errors.push(error.message))
await context.route('**/*', (route) => {
  const url = route.request().url()
  if (url.includes('/test-backend/subscriptions/plans'))
    return route.fulfill({
      json: [
        { title: 'Core', month: 1, prices: { EUR: 99, GBP: 99 }, is_preferred: false },
        { title: 'Core', month: 4, prices: { EUR: 94, GBP: 94 }, is_preferred: true },
        { title: 'Advanced', month: 1, prices: { EUR: 159, GBP: 159 }, is_preferred: false },
        { title: 'Advanced', month: 4, prices: { EUR: 149, GBP: 149 }, is_preferred: true },
      ],
    })
  if (/^(data:|blob:|file:)/.test(url) || url.startsWith(base)) return route.continue()
  return route.abort() // No marketing, analytics or remote checkout traffic.
})
try {
  if (process.env.INFLUENCER_REFERENCE_HTML) {
    const reference = await context.newPage()
    await reference.emulateMedia({ reducedMotion: 'reduce' })
    await reference.setViewportSize({ width: 1440, height: 1000 })
    await reference.goto(`file://${process.env.INFLUENCER_REFERENCE_HTML}`)
    await reference.locator('.il-hero h1').waitFor()
    await reference.evaluate(() => document.fonts.ready)
    await reference.screenshot({ path: `${output}/reference-desktop.png`, fullPage: true })
    await reference.close()
  }
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${base}/en/influencers/qa-influencer-design`)
    await page.getByRole('heading', { name: 'Alex thinks your biology deserves better.' }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.influencer-design img').evaluateAll((images) =>
      images.forEach((image) => {
        ;(image as HTMLImageElement).loading = 'eager'
      }),
    )
    await page.waitForFunction(() =>
      [...document.querySelectorAll('.influencer-design img')].every(
        (image) =>
          (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
      ),
    )
    await page.getByRole('button', { name: 'Compare side by side' }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Compare side by side' }).click()
    await page.getByRole('button', { name: 'Hide full comparison' }).waitFor()
    await page.locator('.rto-flip').first().focus()
    await page.locator('.rto-flip').first().press('Enter')
    assert.equal(await page.locator('.rto-flip').first().getAttribute('aria-expanded'), 'true')
    await page.locator('.rto-flip').first().press('Enter')
    await page.locator('.il-footer').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForFunction(() => window.scrollY === 0)
    await page.screenshot({ path: `${output}/desktop-or-mobile-${width}.png`, fullPage: true })
    await page.locator('.il-hero h1').evaluate((element) => {
      element.textContent = 'Alexandertheextremelylongcreatorname'.repeat(4)
    })
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `Long creator name overflows at ${width}`,
    )
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `Horizontal overflow at ${width}`,
    )
    const boxes = await page
      .locator('.il-hero h1, .il-badge, .il-hero-image, .il-lede, .il-hero-action')
      .evaluateAll((nodes) =>
        Object.fromEntries(
          nodes.map((node) => [node.className || node.tagName, node.getBoundingClientRect().top]),
        ),
      )
    if (width < 800)
      assert.ok(
        boxes.H1 < boxes['il-badge'] &&
          boxes['il-badge'] < boxes['il-hero-image'] &&
          boxes['il-hero-image'] < boxes['il-lede'] &&
          boxes['il-lede'] < boxes['il-hero-action'],
        'Mobile hero order differs from reference',
      )
    assert.equal(
      await page
        .locator('.influencer-design img')
        .evaluateAll(
          (imgs) =>
            imgs.filter(
              (img) =>
                !(img as HTMLImageElement).complete || !(img as HTMLImageElement).naturalWidth,
            ).length,
        ),
      0,
      'Broken image',
    )
  }
  for (const selector of [
    '.il-nav .influencer-cta',
    '.il-hero-action .influencer-cta',
    '.il-offer .influencer-cta',
    '.plan-card:first-child .influencer-cta',
    '.plan-card:nth-child(2) .influencer-cta',
    '.crow.cta .influencer-cta',
  ]) {
    await page.goto(`${base}/en/influencers/qa-influencer-design`)
    if (selector.startsWith('.crow'))
      await page.getByRole('button', { name: 'Compare side by side' }).click()
    const buttons = page.locator(selector)
    const count = await buttons.count()
    assert.ok(count > 0, `No CTA found: ${selector}`)
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await page.goto(`${base}/en/influencers/qa-influencer-design`)
        await page.getByRole('button', { name: 'Compare side by side' }).click()
      }
      await buttons.nth(i).click()
      await page.waitForURL(/\/en\/order(?:-core|-advanced)?$/)
      const offer = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('nb1_influencer_offer') ?? 'null'),
      )
      assert.equal(offer.code, 'TEST2')
      assert.equal(offer.sourceSlug, 'qa-influencer-design')
      assert.ok(!page.url().includes('TEST2'))
    }
  }
  assert.deepEqual(errors, [], 'Browser runtime errors')
  console.log(
    'PASS: 1440/390/320 layouts, no overflow/broken images, mobile order, comparison toggle, all 7 CTA handoffs. Prices are local fixtures, not live checkout verification.',
  )
} finally {
  await browser.close()
}
