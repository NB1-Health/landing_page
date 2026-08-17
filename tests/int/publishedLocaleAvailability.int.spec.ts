import { describe, expect, it, vi } from 'vitest'

import {
  isPublishedForActiveLocale,
  resolvePublishedLocaleSlugs,
} from '@/utilities/publishedLocaleAvailability'

describe('published locale availability', () => {
  it('returns only pages with exact published status, slug, and localized content', async () => {
    const req = {
      locale: 'de',
      payload: {
        findByID: vi.fn().mockImplementation(() => {
          req.locale = 'all'
          return Promise.resolve({
            _status: { de: 'published', en: 'published', fr: 'draft', nl: 'published' },
            slug: { de: 'ueber-uns', en: 'about-us', fr: 'a-propos', nl: 'over-ons' },
            title: { de: 'Über uns', en: 'About us', fr: 'À propos' },
          })
        }),
      },
    }

    await expect(
      resolvePublishedLocaleSlugs({ collection: 'pages', id: 42, req } as never),
    ).resolves.toEqual({ de: 'ueber-uns', en: 'about-us' })
    expect(req.locale).toBe('de')
    expect(req.payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: false,
        fallbackLocale: false,
        locale: 'all',
        req,
        select: { _status: true, slug: true, title: true },
      }),
    )
  })

  it('uses a shared post slug but still requires exact localized content', async () => {
    const req = {
      locale: 'en',
      payload: {
        findByID: vi.fn().mockResolvedValue({
          _status: { de: 'published', en: 'published' },
          slug: 'gut-health-basics',
          title: { en: 'Gut health basics' },
        }),
      },
    }

    await expect(
      resolvePublishedLocaleSlugs({ collection: 'posts', id: 7, req } as never),
    ).resolves.toEqual({ en: 'gut-health-basics' })
  })

  it('supports server routes that have a Payload instance instead of a request', async () => {
    const user = { id: 3 }
    const payload = {
      findByID: vi.fn().mockResolvedValue({
        _status: { en: 'published' },
        slug: { en: 'about-us' },
        title: { en: 'About us' },
      }),
    }

    await expect(
      resolvePublishedLocaleSlugs({
        collection: 'pages',
        id: 42,
        payload,
        user,
      } as never),
    ).resolves.toEqual({ en: 'about-us' })
    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        fallbackLocale: false,
        locale: 'all',
        overrideAccess: false,
        user,
      }),
    )
  })

  it('recognizes both flattened and all-locale status values in hooks', () => {
    expect(isPublishedForActiveLocale('published', 'de')).toBe(true)
    expect(isPublishedForActiveLocale({ de: 'published', en: 'draft' }, 'de')).toBe(true)
    expect(isPublishedForActiveLocale({ de: 'published', en: 'draft' }, 'en')).toBe(false)
  })
})
