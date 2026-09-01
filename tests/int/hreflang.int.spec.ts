import { describe, expect, it } from 'vitest'

import { appLocales, localeConfig, payloadLocales } from '@/i18n/config'
import {
  buildHreflangAlternates,
  isHreflangXDefaultMissing,
  readHreflangOverrides,
} from '@/utilities/hreflang'
import { parseRobotsDirectives } from '@/utilities/robotsDirectives'
import { buildLocalizedDocumentPath } from '@/Header/localizedDocument'

describe('international SEO locale config', () => {
  it('maps the eight URL prefixes to valid languages and market codes', () => {
    expect(appLocales).toEqual(['en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae'])
    expect(localeConfig).toEqual({
      en: {
        hreflangCodes: ['en'],
        htmlLang: 'en',
        label: 'English (EU / Rest of World)',
        lexiconBrowseSegment: 'topics',
        urlPrefix: '/en',
      },
      de: {
        hreflangCodes: ['de-DE', 'de-AT'],
        htmlLang: 'de',
        label: 'German (Germany & Austria)',
        lexiconBrowseSegment: 'themen',
        urlPrefix: '/de',
      },
      fr: {
        hreflangCodes: ['fr-FR'],
        htmlLang: 'fr',
        label: 'French (France)',
        lexiconBrowseSegment: 'sujets',
        urlPrefix: '/fr',
      },
      nl: {
        hreflangCodes: ['nl-NL'],
        htmlLang: 'nl',
        label: 'Dutch (Netherlands)',
        lexiconBrowseSegment: 'onderwerpen',
        urlPrefix: '/nl',
      },
      ch: {
        fallbackLocale: 'de',
        hreflangCodes: ['de-CH'],
        htmlLang: 'de',
        label: 'German (Switzerland)',
        lexiconBrowseSegment: 'themen',
        urlPrefix: '/ch',
      },
      be: {
        fallbackLocale: 'nl',
        hreflangCodes: ['nl-BE'],
        htmlLang: 'nl',
        label: 'Dutch (Belgium)',
        lexiconBrowseSegment: 'onderwerpen',
        urlPrefix: '/be',
      },
      uk: {
        fallbackLocale: 'en',
        hreflangCodes: ['en-GB'],
        htmlLang: 'en',
        label: 'English (United Kingdom)',
        lexiconBrowseSegment: 'topics',
        urlPrefix: '/uk',
      },
      uae: {
        fallbackLocale: 'en',
        hreflangCodes: ['en-AE'],
        htmlLang: 'en',
        label: 'English (UAE)',
        lexiconBrowseSegment: 'topics',
        urlPrefix: '/uae',
      },
    })

    for (const config of Object.values(localeConfig)) {
      expect(Intl.getCanonicalLocales(config.htmlLang)).toHaveLength(1)
      for (const code of config.hreflangCodes) {
        expect(Intl.getCanonicalLocales(code)).toHaveLength(1)
      }
    }

    expect(payloadLocales.map(({ code }) => code)).toEqual(appLocales)
    expect(payloadLocales.find(({ code }) => code === 'ch')).toMatchObject({
      fallbackLocale: 'de',
    })
  })

  it('builds the full ten-entry cluster, including x-default and the Swiss URL', () => {
    const cluster = buildHreflangAlternates({
      siteURL: 'https://nb1.com',
      pathsByLocale: {
        en: 'our-plans',
        de: 'unsere-plane',
        fr: 'nos-formules',
        nl: 'onze-abonnementen',
        ch: 'unsere-plane',
        be: 'onze-abonnementen',
        uk: 'our-plans',
        uae: 'our-plans',
      },
    })

    expect(cluster?.languages).toEqual({
      en: 'https://nb1.com/en/our-plans',
      'de-DE': 'https://nb1.com/de/unsere-plane',
      'de-AT': 'https://nb1.com/de/unsere-plane',
      'fr-FR': 'https://nb1.com/fr/nos-formules',
      'nl-NL': 'https://nb1.com/nl/onze-abonnementen',
      'de-CH': 'https://nb1.com/ch/unsere-plane',
      'nl-BE': 'https://nb1.com/be/onze-abonnementen',
      'en-GB': 'https://nb1.com/uk/our-plans',
      'en-AE': 'https://nb1.com/uae/our-plans',
      'x-default': 'https://nb1.com/en/our-plans',
    })
  })

  it('emits only available locales and handles homepages', () => {
    expect(
      buildHreflangAlternates({
        siteURL: 'https://nb1.com/base',
        pathsByLocale: { en: '', ch: '', uk: '' },
      }),
    ).toEqual({
      languages: {
        en: 'https://nb1.com/en',
        'de-CH': 'https://nb1.com/ch',
        'en-GB': 'https://nb1.com/uk',
        'x-default': 'https://nb1.com/en',
      },
    })
  })

  it('gives home and deep pages the same shape for the same published locales', () => {
    const publishedLocales = { en: '', de: '', ch: '', fr: '' } as const
    const homepage = buildHreflangAlternates({
      siteURL: 'https://nb1.com',
      pathsByLocale: publishedLocales,
    })
    const deepPage = buildHreflangAlternates({
      siteURL: 'https://nb1.com',
      pathsByLocale: {
        en: 'our-plans',
        de: 'unsere-plane',
        ch: 'unsere-plane',
        fr: 'nos-formules',
      },
    })

    expect(Object.keys(deepPage!.languages).sort()).toEqual(Object.keys(homepage!.languages).sort())
  })

  it('suppresses the cluster when the English x-default is unavailable', () => {
    const pathsByLocale = { de: 'unsere-plane', ch: 'unsere-plane' } as const

    expect(isHreflangXDefaultMissing(pathsByLocale)).toBe(true)
    expect(
      buildHreflangAlternates({
        siteURL: 'https://nb1.com',
        pathsByLocale,
      }),
    ).toBeUndefined()
  })

  it('applies disabled-by-default exclusions and a published custom x-default', () => {
    const pathsByLocale = { en: 'about', de: 'ueber-uns', ch: 'ueber-uns' } as const

    expect(
      isHreflangXDefaultMissing(pathsByLocale, {
        enabled: true,
        excludedLocales: ['ch'],
        xDefaultLocale: 'de',
      }),
    ).toBe(false)

    expect(
      buildHreflangAlternates({
        siteURL: 'https://nb1.com',
        pathsByLocale,
        overrides: { enabled: false, excludedLocales: ['ch'], xDefaultLocale: 'de' },
      })?.languages,
    ).toHaveProperty('de-CH')

    expect(
      buildHreflangAlternates({
        siteURL: 'https://nb1.com',
        pathsByLocale,
        overrides: { enabled: true, excludedLocales: ['ch'], xDefaultLocale: 'de' },
      }),
    ).toEqual({
      languages: {
        en: 'https://nb1.com/en/about',
        'de-DE': 'https://nb1.com/de/ueber-uns',
        'de-AT': 'https://nb1.com/de/ueber-uns',
        'x-default': 'https://nb1.com/de/ueber-uns',
      },
    })
  })

  it('ignores invalid persisted override locales at the rendering boundary', () => {
    expect(
      readHreflangOverrides({
        enabled: true,
        excludedLocales: ['ch', 'invalid'],
        xDefaultLocale: 'invalid',
      }),
    ).toEqual({ enabled: true, excludedLocales: ['ch'], xDefaultLocale: undefined })
  })

  it('parses noindex and nofollow as exact tokens', () => {
    expect(parseRobotsDirectives('noindex,nofollow')).toEqual({
      follow: false,
      index: false,
    })
    expect(parseRobotsDirectives('index,follow')).toEqual({
      follow: true,
      index: true,
    })
  })

  it('builds localized home, page, and post paths without path indexes', () => {
    expect(buildLocalizedDocumentPath('de', 'startseite', 'home')).toBe('/de')
    expect(buildLocalizedDocumentPath('de', 'unsere-plane', 'page')).toBe('/de/unsere-plane')
    // Posts moved from /posts to /journal in Phase 2 of the Journal integration
    // (JOURNAL_INTEGRATION_PLAN.md); the old paths 301 from middleware.
    expect(buildLocalizedDocumentPath('de', 'artikel', 'post')).toBe('/de/journal/artikel')
    // The language switcher builds these, so a stale prefix here would send every
    // cross-locale click on an article through a redirect.
    expect(buildLocalizedDocumentPath('de', 'artikel', 'post')).not.toContain('/posts/')
  })
})
