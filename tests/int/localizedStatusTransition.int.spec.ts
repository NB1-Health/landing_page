import type { MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { createLocalReq, initTransaction, killTransaction, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  down as restoreLegacyPublicationStatus,
  up as localizeLegacyPublicationStatus,
} from '@/migrations/20260813_120000_localize_pages_posts_status'
import { resolvePublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'

const testDatabaseURL = process.env.TEST_DATABASE_URL
const describeTransition =
  testDatabaseURL && process.env.RUN_LOCALIZED_STATUS_TRANSITION === 'true'
    ? describe
    : describe.skip

function validateTestDatabaseURL(value: string): string {
  const url = new URL(value)
  const databaseName = decodeURIComponent(url.pathname.slice(1))

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('TEST_DATABASE_URL must use PostgreSQL.')
  }
  if (!new Set(['localhost', '127.0.0.1', '::1', '[::1]']).has(url.hostname)) {
    throw new Error('TEST_DATABASE_URL must point to localhost; remote databases are refused.')
  }
  if (!/(test|tmp|ci|migration[_-]?chain)/i.test(databaseName)) {
    throw new Error('TEST_DATABASE_URL must name a disposable test database.')
  }

  return url.toString()
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

function legacyConfigPayload(payload: Payload): Payload {
  const collections = payload.config.collections.map((collection) => {
    if (collection.slug !== 'pages' && collection.slug !== 'posts') return collection

    const versions = collection.versions
    const drafts = typeof versions === 'object' ? versions.drafts : undefined
    if (!drafts || typeof drafts !== 'object') {
      throw new Error(`${collection.slug} must have localized drafts enabled.`)
    }

    return {
      ...collection,
      versions: { ...versions, drafts: { ...drafts, localizeStatus: false } },
    }
  })

  return {
    config: {
      ...payload.config,
      collections,
      experimental: { ...payload.config.experimental, localizeStatus: false },
    },
    db: payload.db,
    logger: payload.logger,
  } as Payload
}

describeTransition('legacy localized-status transition (Postgres)', () => {
  let payload: Payload
  const originalDatabaseURL = process.env.DATABASE_URL
  const originalPayloadSecret = process.env.PAYLOAD_SECRET

  beforeAll(async () => {
    const connectionString = validateTestDatabaseURL(testDatabaseURL!)
    process.env.DATABASE_URL = connectionString
    process.env.PAYLOAD_SECRET ||= 'localized-status-transition-test-secret'

    const [{ postgresAdapter }, { getPayload }, { default: configPromise }] = await Promise.all([
      import('@payloadcms/db-postgres'),
      import('payload'),
      import('@/payload.config'),
    ])
    const config = await configPromise

    payload = await getPayload({
      key: 'localized-status-transition',
      config: {
        ...config,
        db: postgresAdapter({
          pool: { connectionString, max: 10, ssl: false },
          push: false,
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

  it('preserves legacy live and intentionally unpublished boundaries', async () => {
    const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const published = {
      en: { slug: `legacy-live-en-${suffix}`, title: 'Legacy live EN' },
      de: { slug: `legacy-live-de-${suffix}`, title: 'Legacy live DE' },
    } as const
    const draftTitle = 'Unreleased autosave EN'
    let pageID: number | undefined
    let draftOnlyPageID: number | undefined
    let unpublishedPageID: number | undefined

    try {
      const page = await payload.create({
        collection: 'pages',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          ...published.en,
          hero: { type: 'lowImpact' },
          layout: [{ blockType: 'content', columns: [] }],
        },
      })
      pageID = page.id

      await payload.update({
        collection: 'pages',
        id: pageID,
        locale: 'de',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: published.de,
      })
      await payload.update({
        collection: 'pages',
        id: pageID,
        locale: 'en',
        publishAllLocales: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { _status: 'published' },
      })
      await payload.update({
        collection: 'pages',
        id: pageID,
        locale: 'en',
        draft: true,
        autosave: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          _status: 'draft',
          title: draftTitle,
          layout: [
            { blockType: 'content', columns: [] },
            { blockType: 'content', columns: [] },
          ],
        },
      })
      const draftOnlyPage = await payload.create({
        collection: 'pages',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          slug: `legacy-draft-only-${suffix}`,
          title: 'Legacy draft only',
          hero: { type: 'lowImpact' },
          layout: [{ blockType: 'content', columns: [] }],
        },
      })
      draftOnlyPageID = draftOnlyPage.id

      const unpublishedPage = await payload.create({
        collection: 'pages',
        locale: 'en',
        draft: true,
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          slug: `legacy-unpublished-en-${suffix}`,
          title: 'Legacy unpublished EN',
          hero: { type: 'lowImpact' },
          layout: [{ blockType: 'content', columns: [] }],
        },
      })
      unpublishedPageID = unpublishedPage.id
      await payload.update({
        collection: 'pages',
        id: unpublishedPageID,
        locale: 'en',
        publishSpecificLocale: 'en',
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { _status: 'published' },
      })
      await payload.update({
        collection: 'pages',
        id: unpublishedPageID,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { _status: 'draft' },
      })

      const publicBefore = await payload.findByID({
        collection: 'pages',
        id: pageID,
        locale: 'en',
        fallbackLocale: false,
        draft: false,
        depth: 0,
        overrideAccess: false,
        select: { layout: true, title: true },
      })
      expect(publicBefore).toMatchObject({ title: published.en.title })
      expect(publicBefore.layout).toHaveLength(1)
      await expect(
        payload.findByID({
          collection: 'pages',
          id: unpublishedPageID,
          locale: 'en',
          fallbackLocale: false,
          draft: false,
          depth: 0,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toBeNull()

      const req = await createLocalReq({}, payload)
      await initTransaction(req)

      try {
        const transactionID = await req.transactionID
        const db = transactionID
          ? (
              payload.db as unknown as {
                sessions?: Record<string, { db: MigrateUpArgs['db'] }>
              }
            ).sessions?.[transactionID]?.db
          : undefined
        if (!db) throw new Error('The Postgres test transaction was not available.')

        const versionsBefore = await db.execute(sql`
          SELECT COUNT(*)::integer AS count FROM _pages_v WHERE parent_id = ${pageID}
        `)

        await restoreLegacyPublicationStatus({
          db,
          payload: legacyConfigPayload(payload),
          req,
        })

        const legacyMain = await db.execute(sql`
          SELECT _status::text AS status FROM pages WHERE id = ${pageID}
        `)
        const legacyAutosave = await db.execute(sql`
          SELECT version__status::text AS status
          FROM _pages_v
          WHERE parent_id = ${pageID} AND autosave = true
          ORDER BY created_at DESC
          LIMIT 1
        `)
        const legacyDraftOnly = await db.execute(sql`
          SELECT _status::text AS status FROM pages WHERE id = ${draftOnlyPageID}
        `)
        expect(legacyMain.rows[0]?.status).toBe('published')
        expect(legacyAutosave.rows[0]?.status).toBe('draft')
        expect(legacyDraftOnly.rows[0]?.status).toBe('draft')

        const legacyUnpublished = await db.execute(sql`
          SELECT _status::text AS status FROM pages WHERE id = ${unpublishedPageID}
        `)
        const olderPublishedVersions = await db.execute(sql`
          SELECT COUNT(*)::integer AS count
          FROM _pages_v
          WHERE parent_id = ${unpublishedPageID} AND version__status = 'published'
        `)
        expect(legacyUnpublished.rows[0]?.status).toBe('draft')
        expect(Number(olderPublishedVersions.rows[0]?.count)).toBeGreaterThan(0)

        await localizeLegacyPublicationStatus({ db, payload, req })

        const publicAfter = await payload.findByID({
          collection: 'pages',
          id: pageID,
          locale: 'en',
          fallbackLocale: false,
          draft: false,
          depth: 0,
          overrideAccess: false,
          req,
          select: { layout: true, title: true },
        })
        expect(publicAfter).toMatchObject({ title: published.en.title })
        expect(publicAfter.layout).toHaveLength(1)
        await expect(
          resolvePublishedLocaleSlugs({ collection: 'pages', id: pageID, req }),
        ).resolves.toEqual({ en: published.en.slug, de: published.de.slug })
        await expect(
          payload.findByID({
            collection: 'pages',
            id: draftOnlyPageID,
            locale: 'en',
            fallbackLocale: false,
            draft: false,
            depth: 0,
            disableErrors: true,
            overrideAccess: false,
            req,
          }),
        ).resolves.toBeNull()
        await expect(
          resolvePublishedLocaleSlugs({ collection: 'pages', id: draftOnlyPageID, req }),
        ).resolves.toEqual({})
        await expect(
          resolvePublishedLocaleSlugs({ collection: 'pages', id: unpublishedPageID, req }),
        ).resolves.toEqual({})
        const draftAfter = await payload.findByID({
          collection: 'pages',
          id: pageID,
          locale: 'en',
          fallbackLocale: false,
          draft: true,
          depth: 0,
          overrideAccess: true,
          req,
          select: { _status: true, layout: true, title: true },
        })
        expect(draftAfter).toMatchObject({ _status: 'draft', title: draftTitle })
        expect(draftAfter.layout).toHaveLength(2)

        const localizedAutosave = await db.execute(sql`
          SELECT locale.version__status AS status
          FROM _pages_v AS version
          JOIN _pages_v_locales AS locale ON locale._parent_id = version.id
          WHERE version.parent_id = ${pageID} AND version.autosave = true
          ORDER BY version.created_at DESC
        `)
        expect(localizedAutosave.rows.length).toBeGreaterThan(0)
        expect(new Set(localizedAutosave.rows.map((row) => row.status))).toEqual(new Set(['draft']))

        const versionsAfter = await db.execute(sql`
          SELECT COUNT(*)::integer AS count FROM _pages_v WHERE parent_id = ${pageID}
        `)
        expect(versionsAfter.rows[0]?.count).toBe(versionsBefore.rows[0]?.count)
      } finally {
        await killTransaction(req)
      }
    } finally {
      for (const id of [pageID, draftOnlyPageID]) {
        if (id === undefined) continue
        await payload.delete({
          collection: 'pages',
          id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
      if (unpublishedPageID !== undefined) {
        await payload.delete({
          collection: 'pages',
          id: unpublishedPageID,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    }
  }, 600_000)
})
