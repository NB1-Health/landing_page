import { describe, expect, it } from 'vitest'

import {
  checkInternationalSEO,
  parsePageSEO,
  parseRobotsTxt,
  parseSitemap,
} from '../../scripts/check-international-seo.mjs'

describe('international SEO deployment check', () => {
  it('parses sitemap indexes and decodes their locations', () => {
    expect(
      parseSitemap(`<?xml version="1.0"?>
        <sitemapindex><sitemap><loc>https://nb1.com/en/pages-sitemap.xml?a=1&amp;b=2</loc></sitemap></sitemapindex>`),
    ).toEqual({
      kind: 'index',
      locations: ['https://nb1.com/en/pages-sitemap.xml?a=1&b=2'],
    })
  })

  it('reads canonical, lang and alternate metadata from rendered HTML', () => {
    const parsed = parsePageSEO(`<!doctype html><html lang="de"><head>
      <link rel="canonical" href="https://nb1.com/ch/unsere-plane">
      <link rel="alternate" hreflang="de-CH" href="https://nb1.com/ch/unsere-plane">
      <link rel="alternate" hreflang="en" href="https://nb1.com/en/our-plans">
      <link rel="alternate" hreflang="x-default" href="https://nb1.com/en/our-plans">
    </head></html>`)

    expect(parsed.canonical).toBe('https://nb1.com/ch/unsere-plane')
    expect(parsed.htmlLang).toBe('de')
    expect(parsed.robots).toEqual(new Set())
    expect(Object.fromEntries(parsed.alternates)).toEqual({
      'de-CH': 'https://nb1.com/ch/unsere-plane',
      en: 'https://nb1.com/en/our-plans',
      'x-default': 'https://nb1.com/en/our-plans',
    })
  })

  it('rejects duplicate hreflang codes', () => {
    expect(() =>
      parsePageSEO(`<html lang="en"><head>
        <link rel="alternate" hreflang="en" href="https://nb1.com/en">
        <link rel="alternate" hreflang="EN" href="https://nb1.com/uk">
      </head></html>`),
    ).toThrow(/Duplicate hreflang code/)
  })

  it('reads wildcard robots rules without confusing crawler-specific groups', () => {
    expect(
      parseRobotsTxt(`User-agent: GPTBot
Disallow: /

User-agent: *
Disallow: /cms
Sitemap: https://nb1.com/sitemap.xml`),
    ).toEqual({
      sitemaps: ['https://nb1.com/sitemap.xml'],
      universalDisallow: ['/cms'],
    })
  })

  it('crawls reciprocal clusters with staging auth and permits a declared custom x-default', async () => {
    const origin = 'https://stg.nb1.test'
    const htmlLanguages = {
      be: 'nl',
      ch: 'de',
      de: 'de',
      en: 'en',
      fr: 'fr',
      nl: 'nl',
      uae: 'en',
      uk: 'en',
    }
    const prefixesByCode = {
      'de-AT': 'de',
      'de-CH': 'ch',
      'de-DE': 'de',
      en: 'en',
      'en-AE': 'uae',
      'en-GB': 'uk',
      'fr-FR': 'fr',
      'nl-BE': 'be',
      'nl-NL': 'nl',
    }
    const localizedPrefixes = [...new Set(Object.values(prefixesByCode))]
    const pageHTML = new Map<string, string>()

    function addCluster(prefixes: string[], tail: string, xDefaultPrefix: string) {
      const alternates = Object.entries(prefixesByCode)
        .filter(([, prefix]) => prefixes.includes(prefix))
        .map(([code, prefix]) => [code, `${origin}/${prefix}${tail}`])
      alternates.push(['x-default', `${origin}/${xDefaultPrefix}${tail}`])

      for (const prefix of prefixes) {
        const url = `${origin}/${prefix}${tail}`
        pageHTML.set(
          url,
          `<html lang='${htmlLanguages[prefix as keyof typeof htmlLanguages]}'><head>
            <link href='${url}' rel='canonical'>
            ${alternates
              .map(([code, href]) => `<link href='${href}' hreflang='${code}' rel='alternate'>`)
              .join('\n')}
          </head></html>`,
        )
      }
    }

    addCluster(localizedPrefixes, '', 'en')
    addCluster(localizedPrefixes, '/our-plans', 'en')
    addCluster(['en', 'fr'], '/custom', 'fr')
    const contentSitemap = () =>
      `<urlset>${[...pageHTML.keys()]
        .map((url) => `<url><loc>${url}</loc></url>`)
        .join('')}</urlset>`
    const rootSitemap = `<sitemapindex>
      <sitemap><loc>${origin}/content-sitemap.xml</loc></sitemap>
      <sitemap><loc>${origin}/empty-sitemap.xml</loc></sitemap>
    </sitemapindex>`
    const requests: Array<{ authorization?: string; url: string }> = []
    let robotsText = 'User-agent: *\nDisallow: /'
    let xRobotsTag = 'noindex, nofollow'
    let activePageRequests = 0
    let maximumPageRequests = 0
    const fetchImpl = async (input: URL | RequestInfo, init?: RequestInit) => {
      const url = input.toString()
      requests.push({
        authorization: (init?.headers as Record<string, string> | undefined)?.Authorization,
        url,
      })
      const pathname = new URL(url).pathname
      if (pathname === '/robots.txt') {
        return new Response(robotsText, { headers: { 'content-type': 'text/plain' } })
      }
      if (pathname === '/sitemap.xml') {
        return new Response(rootSitemap, { headers: { 'content-type': 'application/xml' } })
      }
      if (pathname === '/content-sitemap.xml') {
        return new Response(contentSitemap(), { headers: { 'content-type': 'application/xml' } })
      }
      if (pathname === '/empty-sitemap.xml') {
        return new Response('<urlset></urlset>', {
          headers: { 'content-type': 'application/xml' },
        })
      }

      const html = pageHTML.get(url)
      activePageRequests += 1
      maximumPageRequests = Math.max(maximumPageRequests, activePageRequests)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1))
        return new Response(html ?? 'missing', {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            ...(xRobotsTag ? { 'x-robots-tag': xRobotsTag } : {}),
          },
          status: html ? 200 : 404,
        })
      } finally {
        activePageRequests -= 1
      }
    }

    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'staging',
        fetchImpl,
        password: 'password',
        username: 'reviewer',
      }),
    ).resolves.toEqual({ checkedPages: 18, sitemapPages: 18 })
    expect(
      requests.every(({ authorization }) => authorization === 'Basic cmV2aWV3ZXI6cGFzc3dvcmQ='),
    ).toBe(true)
    expect(maximumPageRequests).toBeLessThanOrEqual(8)

    xRobotsTag = 'googlebot: noindex, nofollow'
    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'staging',
        fetchImpl,
        password: 'password',
        username: 'reviewer',
      }),
    ).rejects.toThrow(/missing global staging X-Robots noindex/)
    xRobotsTag = 'noindex, nofollow'

    const missingXDefaultURL = `${origin}/de/nur-de`
    pageHTML.set(
      missingXDefaultURL,
      `<html lang="de"><head>
        <meta name="nb1-hreflang" content="suppressed-missing-x-default">
        <link href="${missingXDefaultURL}" rel="canonical">
      </head></html>`,
    )
    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'staging',
        fetchImpl,
        password: 'password',
        username: 'reviewer',
      }),
    ).rejects.toThrow(/cannot ship without a published x-default locale/)
    pageHTML.delete(missingXDefaultURL)

    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'production',
        fetchImpl,
      }),
    ).rejects.toThrow(/Production robots\.txt must not contain Disallow: \/$/)

    robotsText = `User-agent: *
Disallow: /cms
Sitemap: ${origin}/sitemap.xml`
    xRobotsTag = ''
    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'production',
        fetchImpl,
      }),
    ).resolves.toEqual({ checkedPages: 18, sitemapPages: 18 })

    xRobotsTag = 'googlebot: noindex, nofollow'
    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'production',
        fetchImpl,
      }),
    ).rejects.toThrow(/production X-Robots noindex/)
    xRobotsTag = ''

    const noindexURL = `${origin}/en/custom`
    pageHTML.set(
      noindexURL,
      pageHTML.get(noindexURL)!.replace('<head>', '<head><meta name="robots" content="noindex">'),
    )
    await expect(
      checkInternationalSEO({
        baseURL: origin,
        deploymentEnvironment: 'production',
        fetchImpl,
        password: 'password',
        username: 'reviewer',
      }),
    ).rejects.toThrow(/noindex but appears in a sitemap/)
  })
})
