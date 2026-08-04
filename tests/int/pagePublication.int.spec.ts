import { describe, expect, it } from 'vitest'

import { Pages } from '@/collections/Pages'
import payloadConfig from '@/payload.config'
import { buildHreflangForLocalizedSlugs } from '@/utilities/hreflang'
import {
  getPagePublicationLocales,
  getPageRevalidationTargets,
  getPublicPagePath,
} from '@/utilities/pagePublication'
import { getPreviewTarget, signPreviewTarget, verifyPreviewToken } from '@/utilities/preview'

describe('native page publication boundaries', () => {
  it('makes the active locale the default native Payload publish action', async () => {
    const config = await payloadConfig
    expect(config.localization && config.localization.defaultLocalePublishOption).toBe('active')
  })

  it('maps only approved locale/slug pairs to public paths', () => {
    expect(getPublicPagePath('de', 'unsere-plaene')).toBe('/de/unsere-plaene')
    expect(getPublicPagePath('en', 'home-page')).toBe('/en')
    expect(getPublicPagePath('en', 'home')).toBe('/en')
    expect(getPublicPagePath('de', 'home')).toBe('/de/home')
    expect(getPublicPagePath('xx', 'our-plans')).toBeNull()
    expect(getPublicPagePath('en', '../cms/admin')).toBeNull()
    expect(getPublicPagePath('en', 'plans/anything')).toBeNull()
  })

  it('builds constrained targets from explicit locale values', () => {
    expect(
      getPageRevalidationTargets({
        currentSlugs: { de: 'neue-seite', en: 'new-page' },
        locales: ['de'],
        previousSlugs: { de: 'alte-seite', en: 'old-page' },
      }),
    ).toEqual({
      paths: ['/de/alte-seite', '/de/neue-seite'],
      tags: ['pages-sitemap-de'],
    })
  })

  it('normalizes every localized home slug to its locale root', () => {
    const slugs = { de: 'startseite', en: 'home' } as const
    expect(
      getPageRevalidationTargets({
        currentSlugs: slugs,
        locales: getPagePublicationLocales(),
      }).paths,
    ).toEqual(['/en', '/de'])
    expect(
      buildHreflangForLocalizedSlugs({
        siteURL: 'https://nb1.example',
        slugsByLocale: slugs,
      }).languages,
    ).toMatchObject({
      'de-DE': 'https://nb1.example/de',
      en: 'https://nb1.example/en',
      'x-default': 'https://nb1.example/en',
    })
  })

  it('requires authenticated Payload mutation before revalidation can run', async () => {
    const updateAccess = Pages.access?.update
    expect(typeof updateAccess).toBe('function')
    await expect(
      Promise.resolve((updateAccess as Function)({ req: { user: null } })),
    ).resolves.toBe(false)
  })
})

describe('draft preview boundaries', () => {
  const secret = '0123456789abcdef0123456789abcdef'
  const now = Date.UTC(2026, 7, 4, 12, 0, 0)
  const timestamp = Math.floor(now / 1000)
  const target = getPreviewTarget({ collection: 'pages', locale: 'fr', slug: 'a-propos' })!
  const token = signPreviewTarget({ secret, target, timestamp })

  it('accepts a short-lived signed target without putting the secret in the token', () => {
    expect(target.path).toBe('/fr/a-propos')
    expect(token).not.toContain(secret)
    expect(verifyPreviewToken({ now, secret, target, timestamp, token })).toBe(true)
  })

  it('rejects stale/tampered tokens and arbitrary preview paths', () => {
    expect(verifyPreviewToken({ now: now + 301_000, secret, target, timestamp, token })).toBe(false)
    expect(
      verifyPreviewToken({
        now,
        secret,
        target,
        timestamp,
        token: `${token[0] === '0' ? '1' : '0'}${token.slice(1)}`,
      }),
    ).toBe(false)
    expect(getPreviewTarget({ collection: 'pages', locale: 'en', slug: '../admin' })).toBeNull()
    expect(getPreviewTarget({ collection: 'unknown', locale: 'en', slug: 'home' })).toBeNull()
  })

  it('reserves the home slug by English document identity, not translated text alone', () => {
    expect(getPreviewTarget({ collection: 'pages', locale: 'en', slug: 'home' })?.path).toBe('/en')
    expect(getPreviewTarget({ collection: 'pages', locale: 'de', slug: 'home' })?.path).toBe(
      '/de/home',
    )
  })
})
