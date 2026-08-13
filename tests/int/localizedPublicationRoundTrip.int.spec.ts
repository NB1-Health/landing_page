import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildHreflangAlternates } from '@/utilities/hreflang'
import { resolvePublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'

const testDatabaseURL = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseURL ? describe : describe.skip

function validateTestDatabaseURL(value: string): URL {
  const url = new URL(value)
  const databaseName = decodeURIComponent(url.pathname.slice(1))
  const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must use PostgreSQL.')
  }

  if (!localHosts.has(url.hostname)) {
    throw new Error('TEST_DATABASE_URL must point to localhost; remote databases are refused.')
  }

  if (!/(test|tmp|ci|migration[_-]?chain)/i.test(databaseName)) {
    throw new Error(
      'TEST_DATABASE_URL database name must include a disposable marker (test, tmp, ci, or migration_chain).',
    )
  }

  return url
}

async function inspectTestDatabase(connectionString: string): Promise<{ isEmpty: boolean }> {
  const { Client } = await import('pg')
  const client = new Client({ connectionString, ssl: false })

  try {
    await client.connect()
    const result = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    const tables = new Set(result.rows.map(({ table_name }) => table_name))

    if (
      tables.size > 0 &&
      !['pages', 'pages_locales', 'payload_migrations'].every((table) => tables.has(table))
    ) {
      throw new Error(
        'TEST_DATABASE_URL is not empty and does not look like an initialized Payload test database.',
      )
    }

    return { isEmpty: tables.size === 0 }
  } finally {
    await client.end()
  }
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describeWithDatabase('localized publication round trip (Postgres)', () => {
  let payload: Payload
  const originalDatabaseURL = process.env.DATABASE_URL
  const originalPayloadSecret = process.env.PAYLOAD_SECRET

  beforeAll(async () => {
    const safeURL = validateTestDatabaseURL(testDatabaseURL!)
    const connectionString = safeURL.toString()
    const { isEmpty } = await inspectTestDatabase(connectionString)

    process.env.DATABASE_URL = connectionString
    process.env.PAYLOAD_SECRET ||= 'localized-publication-test-secret'

    const [{ postgresAdapter }, { getPayload }, { default: configPromise }] = await Promise.all([
      import('@payloadcms/db-postgres'),
      import('payload'),
      import('@/payload.config'),
    ])
    const config = await configPromise

    payload = await getPayload({
      key: 'localized-publication-round-trip',
      config: {
        ...config,
        // An empty, explicitly disposable DB gets the current schema directly.
        // Existing test DBs must already have the current migration state.
        db: postgresAdapter({
          // Page hooks can perform nested Payload operations inside the outer
          // transaction, so keep enough connections to avoid pool starvation.
          pool: { connectionString, max: 10, ssl: false },
          push: isEmpty,
        }) as typeof config.db,
        typescript: { ...config.typescript, autoGenerate: false },
      },
    })
  }, 600_000)

  afterAll(async () => {
    await payload?.destroy()
    restoreEnvironment('DATABASE_URL', originalDatabaseURL)
    restoreEnvironment('PAYLOAD_SECRET', originalPayloadSecret)
  })

  it('publishes, unpublishes, and republishes one locale without changing the others', async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const localized = {
      en: { slug: `publication-test-en-${suffix}`, title: 'Publication test EN' },
      de: { slug: `publication-test-de-${suffix}`, title: 'Publication test DE' },
      fr: { slug: `publication-test-fr-${suffix}`, title: 'Publication test FR' },
    } as const
    const locales = Object.keys(localized) as (keyof typeof localized)[]
    let pageID: number | undefined

    const publish = async (locale: keyof typeof localized): Promise<void> => {
      await payload.update({
        collection: 'pages',
        id: pageID!,
        locale,
        publishSpecificLocale: locale,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          _status: 'published',
          ...localized[locale],
        },
      })
    }

    const expectPublicLocales = async (
      expected: readonly (keyof typeof localized)[],
    ): Promise<void> => {
      const visible = await Promise.all(
        locales.map(async (locale) => ({
          locale,
          page: await payload.findByID({
            collection: 'pages',
            id: pageID!,
            locale,
            fallbackLocale: false,
            draft: false,
            depth: 0,
            disableErrors: true,
            overrideAccess: false,
            select: { title: true },
          }),
        })),
      )

      for (const { locale, page } of visible) {
        if (expected.includes(locale)) expect(page?.id).toBe(pageID)
        else expect(page).toBeNull()
      }
    }

    try {
      const page = await payload.create({
        collection: 'pages',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          ...localized.en,
          hero: { type: 'lowImpact' },
          layout: [{ blockType: 'content', columns: [] }],
        },
      })
      pageID = page.id

      await publish('en')
      await publish('de')
      await publish('fr')

      await expect(
        resolvePublishedLocaleSlugs({ collection: 'pages', id: pageID, payload }),
      ).resolves.toEqual({
        en: localized.en.slug,
        de: localized.de.slug,
        fr: localized.fr.slug,
      })
      await expectPublicLocales(locales)

      await payload.update({
        collection: 'pages',
        id: pageID,
        locale: 'fr',
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { _status: 'draft' },
      })

      const availableAfterUnpublish = await resolvePublishedLocaleSlugs({
        collection: 'pages',
        id: pageID,
        payload,
      })
      expect(availableAfterUnpublish).toEqual({
        en: localized.en.slug,
        de: localized.de.slug,
      })
      expect(
        buildHreflangAlternates({
          pathsByLocale: availableAfterUnpublish,
          siteURL: 'https://nb1.com',
        })?.languages,
      ).not.toHaveProperty('fr-FR')
      await expectPublicLocales(['en', 'de'])

      await publish('fr')

      const availableAfterRepublish = await resolvePublishedLocaleSlugs({
        collection: 'pages',
        id: pageID,
        payload,
      })
      expect(availableAfterRepublish).toEqual({
        en: localized.en.slug,
        de: localized.de.slug,
        fr: localized.fr.slug,
      })
      expect(
        buildHreflangAlternates({
          pathsByLocale: availableAfterRepublish,
          siteURL: 'https://nb1.com',
        })?.languages,
      ).toHaveProperty('fr-FR', `https://nb1.com/fr/${localized.fr.slug}`)
      await expectPublicLocales(locales)
    } finally {
      if (pageID !== undefined) {
        await payload.delete({
          collection: 'pages',
          id: pageID,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    }
  }, 600_000)

  it('keeps Post publication state independent for each locale', async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const slug = `post-publication-test-${suffix}`
    const localized = {
      en: { title: 'Post publication test EN' },
      de: { title: 'Post publication test DE' },
      fr: { title: 'Post publication test FR' },
    } as const
    const locales = Object.keys(localized) as (keyof typeof localized)[]
    const richText = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Localized publication test content.',
                version: 1,
              },
            ],
            direction: 'ltr' as const,
            format: '' as const,
            indent: 0,
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      },
    }
    let postID: number | undefined

    const publish = async (locale: keyof typeof localized): Promise<void> => {
      await payload.update({
        collection: 'posts',
        id: postID!,
        locale,
        publishSpecificLocale: locale,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          _status: 'published',
          title: localized[locale].title,
          intro: richText,
          content: richText,
        },
      })
    }

    const expectPublicLocales = async (
      expected: readonly (keyof typeof localized)[],
    ): Promise<void> => {
      const visible = await Promise.all(
        locales.map(async (locale) => ({
          locale,
          post: await payload.findByID({
            collection: 'posts',
            id: postID!,
            locale,
            fallbackLocale: false,
            draft: false,
            depth: 0,
            disableErrors: true,
            overrideAccess: false,
            select: { title: true },
          }),
        })),
      )

      for (const { locale, post } of visible) {
        if (expected.includes(locale)) expect(post?.id).toBe(postID)
        else expect(post).toBeNull()
      }
    }

    try {
      const post = await payload.create({
        collection: 'posts',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          ...localized.en,
          slug,
          intro: richText,
          content: richText,
          schemaMarkup: { type: 'Article' },
          meta: {
            title: 'Post publication test',
            description: 'A disposable localized publication integration test.',
          },
          source: 'manual',
        },
      })
      postID = post.id

      await publish('en')
      await publish('de')
      await publish('fr')

      await expect(
        resolvePublishedLocaleSlugs({ collection: 'posts', id: postID, payload }),
      ).resolves.toEqual({ en: slug, de: slug, fr: slug })
      await expectPublicLocales(locales)

      await payload.update({
        collection: 'posts',
        id: postID,
        locale: 'fr',
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { _status: 'draft' },
      })

      await expect(
        resolvePublishedLocaleSlugs({ collection: 'posts', id: postID, payload }),
      ).resolves.toEqual({ en: slug, de: slug })
      await expectPublicLocales(['en', 'de'])

      await publish('fr')

      await expect(
        resolvePublishedLocaleSlugs({ collection: 'posts', id: postID, payload }),
      ).resolves.toEqual({ en: slug, de: slug, fr: slug })
      await expectPublicLocales(locales)
    } finally {
      if (postID !== undefined) {
        await payload.delete({
          collection: 'posts',
          id: postID,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    }
  }, 600_000)
})
