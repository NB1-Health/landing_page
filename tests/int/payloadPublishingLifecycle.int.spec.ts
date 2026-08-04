import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

import config from '@/payload.config'

const databaseURL = process.env.DATABASE_URL || ''
const safeLocalDatabase =
  /(?:localhost|127\.0\.0\.1)/.test(databaseURL) && /(?:test|publish)/.test(databaseURL)

const describeWithLocalDatabase = safeLocalDatabase ? describe : describe.skip

describeWithLocalDatabase('Payload page publishing lifecycle', () => {
  let payload: Payload
  let editor: NonNullable<PayloadRequest['user']>
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const enSlug = `publish-en-${suffix}`
  const deSlug = `publish-de-${suffix}`

  beforeAll(async () => {
    const testConfig = await config
    testConfig.db = postgresAdapter({
      pool: { connectionString: databaseURL, ssl: false },
      push: true,
    }) as typeof testConfig.db
    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    payload = await getPayload({ config: testConfig })
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `publish-${suffix}@example.com`,
        password: 'local-test-password',
      },
      overrideAccess: true,
    })
    editor = { ...user, collection: 'users' }
  }, 120_000)

  afterAll(async () => {
    await payload?.destroy()
  })

  const publicPage = async (locale: 'de' | 'en', slug: string) => {
    const result = await payload.find({
      collection: 'pages',
      draft: false,
      fallbackLocale: false,
      locale,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user: null,
      where: { slug: { equals: slug } },
    })
    return result.docs[0] ?? null
  }

  const editorDraft = async (id: number, locale: 'de' | 'en') =>
    payload.findByID({
      collection: 'pages',
      id,
      draft: true,
      fallbackLocale: false,
      locale,
      overrideAccess: false,
      user: editor,
    })

  it('keeps drafts private, publishes locales independently, unpublishes, and rolls back', async () => {
    const created = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [] }],
        pageType: 'legacy',
        slug: enSlug,
        title: 'Original English',
      },
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      user: editor,
    })

    expect(await publicPage('en', enSlug)).toBeNull()
    expect((await editorDraft(created.id, 'en')).title).toBe('Original English')
    await expect(
      payload.findByID({
        collection: 'pages',
        id: created.id,
        draft: true,
        fallbackLocale: false,
        locale: 'en',
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toThrow()

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      draft: false,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      publishSpecificLocale: 'en',
      user: editor,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')

    const firstPublishedVersion = await payload.findVersions({
      collection: 'pages',
      depth: 0,
      limit: 20,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        and: [
          { parent: { equals: created.id } },
          { publishedLocale: { equals: 'en' } },
          { 'version._status': { equals: 'published' } },
        ],
      },
    })
    const originalVersionID = firstPublishedVersion.docs[0]?.id
    expect(originalVersionID).toBeDefined()

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { title: 'Updated English', _status: 'draft' },
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      user: editor,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect((await editorDraft(created.id, 'en')).title).toBe('Updated English')

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      draft: false,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      publishSpecificLocale: 'en',
      user: editor,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Updated English')

    await payload.restoreVersion({
      collection: 'pages',
      id: String(originalVersionID),
      context: { disableRevalidate: true },
      draft: false,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      user: editor,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { slug: deSlug, title: 'Deutsch Entwurf', _status: 'draft' },
      draft: true,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: false,
      user: editor,
    })
    expect(await publicPage('de', deSlug)).toBeNull()
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      draft: false,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: false,
      publishSpecificLocale: 'de',
      user: editor,
    })
    expect((await publicPage('de', deSlug))?.title).toBe('Deutsch Entwurf')
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')

    const latestPublishedVersion = await payload.findVersions({
      collection: 'pages',
      depth: 0,
      limit: 20,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        and: [{ parent: { equals: created.id } }, { 'version._status': { equals: 'published' } }],
      },
    })
    const rollbackVersionID = latestPublishedVersion.docs[0]?.id
    expect(rollbackVersionID).toBeDefined()

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: { _status: 'draft' },
      draft: false,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: false,
      user: editor,
    })
    expect(await publicPage('en', enSlug)).toBeNull()
    expect(await publicPage('de', deSlug)).toBeNull()

    await payload.restoreVersion({
      collection: 'pages',
      id: String(rollbackVersionID),
      context: { disableRevalidate: true },
      draft: false,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: false,
      user: editor,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect((await publicPage('de', deSlug))?.title).toBe('Deutsch Entwurf')
  }, 120_000)
})
