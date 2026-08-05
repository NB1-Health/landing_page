import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPayload, type Payload, type PayloadRequest } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

import config from '@/payload.config'
import type { Page } from '@/payload-types'

const databaseURL = process.env.DATABASE_URL || ''
const safeLocalDatabase =
  /(?:localhost|127\.0\.0\.1)/.test(databaseURL) && /(?:test|publish)/.test(databaseURL)

const describeWithLocalDatabase = safeLocalDatabase ? describe : describe.skip

type RichText = NonNullable<Page['hero']['richText']>

const richText = (text: string): RichText => ({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text,
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr' as const,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
})

const firstText = (value: unknown) =>
  (value as { root?: { children?: { children?: { text?: string }[] }[] } })?.root?.children?.[0]
    ?.children?.[0]?.text

const contentText = (page: Page) => {
  const block = page.layout?.find(({ blockType }) => blockType === 'content')
  return firstText(block?.blockType === 'content' ? block.columns?.[0]?.richText : undefined)
}

const heroText = (page: Page) => firstText(page.hero?.richText)

describeWithLocalDatabase('Payload page publishing lifecycle', () => {
  let payload: Payload
  let admin: NonNullable<PayloadRequest['user']>
  let editor: NonNullable<PayloadRequest['user']>
  let publisher: NonNullable<PayloadRequest['user']>
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
    const [publisherUser, editorUser, adminUser] = await Promise.all([
      payload.create({
        collection: 'users',
        data: {
          email: `publish-${suffix}@example.com`,
          password: 'local-test-password',
          role: 'publisher',
        },
        overrideAccess: true,
      }),
      payload.create({
        collection: 'users',
        data: {
          email: `editor-${suffix}@example.com`,
          password: 'local-test-password',
          role: 'editor',
        },
        overrideAccess: true,
      }),
      payload.create({
        collection: 'users',
        data: {
          email: `admin-${suffix}@example.com`,
          password: 'local-test-password',
          role: 'admin',
        },
        overrideAccess: true,
      }),
    ])
    publisher = { ...publisherUser, collection: 'users' }
    editor = { ...editorUser, collection: 'users' }
    admin = { ...adminUser, collection: 'users' }
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

  const publisherDraft = async (id: number, locale: 'de' | 'en') =>
    payload.findByID({
      collection: 'pages',
      id,
      draft: true,
      fallbackLocale: false,
      locale,
      overrideAccess: false,
      user: publisher,
    })

  it('keeps drafts private, publishes locales independently, unpublishes, and rolls back', async () => {
    const created = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        hero: { richText: richText('English hero'), type: 'none' },
        layout: [
          {
            blockType: 'content',
            columns: [{ richText: richText('English body'), size: 'full' }],
          },
        ],
        pageType: 'legacy',
        slug: enSlug,
        title: 'Original English',
      },
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      user: publisher,
    })

    expect(await publicPage('en', enSlug)).toBeNull()
    expect((await publisherDraft(created.id, 'en')).title).toBe('Original English')
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
      user: publisher,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect(contentText((await publicPage('en', enSlug))!)).toBe('English body')
    expect(heroText((await publicPage('en', enSlug))!)).toBe('English hero')

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
      user: publisher,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect((await publisherDraft(created.id, 'en')).title).toBe('Updated English')

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
      user: publisher,
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
      user: publisher,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')

    const germanDraft = await publisherDraft(created.id, 'de')
    const germanLayout = germanDraft.layout?.map((block) =>
      block.blockType === 'content'
        ? {
            ...block,
            columns: block.columns?.map((column) => ({
              ...column,
              richText: richText('Deutscher Inhalt'),
            })),
          }
        : block,
    )

    await payload.update({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        hero: { ...germanDraft.hero, richText: richText('Deutscher Hero') },
        layout: germanLayout,
        slug: deSlug,
        title: 'Deutsch Entwurf',
      },
      draft: true,
      fallbackLocale: false,
      locale: 'de',
      overrideAccess: false,
      user: publisher,
    })
    expect(await publicPage('de', deSlug)).toBeNull()
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect(contentText((await publicPage('en', enSlug))!)).toBe('English body')
    expect(heroText((await publicPage('en', enSlug))!)).toBe('English hero')

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
      user: publisher,
    })
    expect((await publicPage('de', deSlug))?.title).toBe('Deutsch Entwurf')
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect(contentText((await publicPage('de', deSlug))!)).toBe('Deutscher Inhalt')
    expect(heroText((await publicPage('de', deSlug))!)).toBe('Deutscher Hero')
    expect(contentText((await publicPage('en', enSlug))!)).toBe('English body')
    expect(heroText((await publicPage('en', enSlug))!)).toBe('English hero')

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
      user: publisher,
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
      user: publisher,
    })
    expect((await publicPage('en', enSlug))?.title).toBe('Original English')
    expect((await publicPage('de', deSlug))?.title).toBe('Deutsch Entwurf')
  }, 120_000)

  it('enforces editor, publisher, and administrator capabilities through the Local API', async () => {
    const roleSlug = `role-page-${suffix}`
    const created = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        hero: { type: 'none' },
        layout: [{ blockType: 'content', columns: [] }],
        pageType: 'legacy',
        slug: roleSlug,
        title: 'Role test draft',
      },
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      user: editor,
    })

    expect(await publicPage('en', roleSlug)).toBeNull()
    await expect(
      payload.update({
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
      }),
    ).rejects.toMatchObject({ status: 403 })

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
      user: publisher,
    })
    expect((await publicPage('en', roleSlug))?.title).toBe('Role test draft')

    await expect(
      payload.delete({
        collection: 'pages',
        id: created.id,
        context: { disableRevalidate: true },
        overrideAccess: false,
        user: publisher,
      }),
    ).rejects.toThrow()

    await payload.delete({
      collection: 'pages',
      id: created.id,
      context: { disableRevalidate: true },
      overrideAccess: false,
      user: admin,
    })
    expect(await publicPage('en', roleSlug)).toBeNull()
  }, 120_000)
})
