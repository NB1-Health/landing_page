import { randomUUID } from 'node:crypto'

import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import {
  createPostDraft,
  setContentTrashState,
  updatePostDraft,
  uploadMedia,
} from '@/mcp/contentOperations'
import { runIdempotentMutation } from '@/mcp/runIdempotentMutation'
import { parseHtmlToContent } from '@/utilities/parseHtmlToBlocks'

describe('agent MCP mutation (Postgres)', () => {
  let payload: Payload
  let req: PayloadRequest
  let secondReq: PayloadRequest
  let editorID: number
  let userID: number
  const lockIDs: number[] = []
  const mediaIDs: number[] = []
  const pageIDs: number[] = []
  const postIDs: number[] = []

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    expect(payload.authStrategies.some(({ name }) => name === 'payload-mcp-api-keys-api-key')).toBe(
      false,
    )
    const lockedAccess = payload.collections['payload-locked-documents']?.config.access
    expect(await lockedAccess?.create?.({ req: { user: { role: 'agent-editor' } } } as never)).toBe(
      false,
    )
    expect(await lockedAccess?.create?.({ req: { user: { role: 'admin' } } } as never)).toBe(true)
    const editorLockRequest = {
      req: { user: { collection: 'users', id: 7, role: 'editor' } },
    } as never
    expect(await lockedAccess?.create?.(editorLockRequest)).toBe(false)
    expect(await lockedAccess?.read?.(editorLockRequest)).toBe(true)
    expect(await lockedAccess?.update?.(editorLockRequest)).toBe(false)
    expect(await lockedAccess?.delete?.(editorLockRequest)).toEqual({
      and: [{ 'user.value': { equals: 7 } }, { 'user.relationTo': { equals: 'users' } }],
    })
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `agent-mcp-mutation-${randomUUID()}@example.invalid`,
        name: 'Agent MCP mutation test',
        password: randomUUID(),
        role: 'agent-editor',
      },
      overrideAccess: true,
    })
    userID = user.id
    const editor = await payload.create({
      collection: 'users',
      data: {
        email: `human-editor-${randomUUID()}@example.invalid`,
        name: 'Human editor integration test',
        password: randomUUID(),
        role: 'editor',
      },
      overrideAccess: true,
    })
    editorID = editor.id
    req = await createLocalReq({ user }, payload)
    req.payloadAPI = 'MCP'
    secondReq = await createLocalReq({ user }, payload)
    secondReq.payloadAPI = 'MCP'
  }, 600_000)

  afterAll(async () => {
    for (const id of lockIDs) {
      await payload
        .delete({ collection: 'payload-locked-documents', id, overrideAccess: true })
        .catch(() => undefined)
    }
    for (const id of postIDs) {
      await payload
        .delete({
          collection: 'posts',
          context: { disableRevalidate: true },
          id,
          overrideAccess: true,
        })
        .catch(() => undefined)
    }
    for (const id of pageIDs) {
      await payload
        .delete({
          collection: 'pages',
          context: { disableRevalidate: true },
          id,
          overrideAccess: true,
          trash: true,
        })
        .catch(() => undefined)
    }
    for (const id of mediaIDs) {
      await payload
        .delete({ collection: 'media', id, overrideAccess: true, trash: true })
        .catch(() => undefined)
    }
    if (userID !== undefined) {
      await payload
        .delete({
          collection: 'agent-operations',
          overrideAccess: true,
          where: { actor: { equals: userID } },
        })
        .catch(() => undefined)
      await payload
        .delete({ collection: 'users', id: userID, overrideAccess: true })
        .catch(() => undefined)
    }
    if (editorID !== undefined) {
      await payload
        .delete({ collection: 'users', id: editorID, overrideAccess: true })
        .catch(() => undefined)
    }
    await payload?.destroy()
  })

  it('persists the human editor role and grants authenticated draft reads', async () => {
    const editor = await payload.findByID({
      collection: 'users',
      id: editorID,
      overrideAccess: true,
    })
    expect(editor).toMatchObject({ id: editorID, role: 'editor' })

    const editorReq = await createLocalReq({ user: editor }, payload)
    await expect(
      payload.find({
        collection: 'pages',
        draft: true,
        limit: 1,
        overrideAccess: false,
        req: editorReq,
      }),
    ).resolves.toMatchObject({ docs: expect.any(Array) })
  })

  it('enforces the human editor lifecycle through Payload operations', async () => {
    const editor = await payload.findByID({
      collection: 'users',
      id: editorID,
      overrideAccess: true,
    })
    const editorReq = await createLocalReq({ user: editor }, payload)
    const suffix = randomUUID().slice(0, 8)
    const created = await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        htmlContent: '<p>Editor lifecycle content.</p>',
        intro: parseHtmlToContent('<p>Editor lifecycle introduction.</p>'),
        meta: {
          description: 'Payload editor lifecycle integration test.',
          title: 'Editor lifecycle',
        },
        slug: `editor-lifecycle-${suffix}`,
        source: 'api',
        title: 'Editor lifecycle',
      } as never,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      req: editorReq,
    })
    postIDs.push(created.id)

    const published = await payload.update({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: { _status: 'published', title: 'Editor lifecycle published' },
      draft: true,
      id: created.id,
      locale: 'en',
      overrideAccess: false,
      publishSpecificLocale: 'en',
      req: editorReq,
    })
    expect(published).toMatchObject({ _status: 'published', title: 'Editor lifecycle published' })

    const versions = await payload.findVersions({
      collection: 'posts',
      limit: 10,
      locale: 'en',
      overrideAccess: false,
      req: editorReq,
      where: { parent: { equals: created.id } },
    })
    expect(versions.docs.length).toBeGreaterThan(0)
    const versionID = versions.docs[0]?.id
    expect(versionID).toBeDefined()
    await expect(
      payload.restoreVersion({
        collection: 'posts',
        draft: true,
        id: String(versionID),
        locale: 'en',
        overrideAccess: false,
        req: editorReq,
      }),
    ).resolves.toMatchObject({ id: created.id })

    const deletedAt = new Date().toISOString()
    await expect(
      payload.update({
        collection: 'posts',
        context: { disableRevalidate: true },
        data: { deletedAt },
        id: created.id,
        locale: 'en',
        overrideAccess: false,
        req: editorReq,
      }),
    ).resolves.toMatchObject({ deletedAt })
    await expect(
      payload.update({
        collection: 'posts',
        context: { disableRevalidate: true },
        data: { deletedAt: null },
        id: created.id,
        locale: 'en',
        overrideAccess: false,
        req: editorReq,
        trash: true,
      }),
    ).resolves.toMatchObject({ deletedAt: null })
    await expect(
      payload.delete({
        collection: 'posts',
        id: created.id,
        overrideAccess: false,
        req: editorReq,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const ownLock = await payload.create({
      collection: 'payload-locked-documents',
      data: {
        document: { relationTo: 'posts', value: created.id },
        user: { relationTo: 'users', value: editorID },
      },
      overrideAccess: true,
    })
    lockIDs.push(ownLock.id)
    const otherLock = await payload.create({
      collection: 'payload-locked-documents',
      data: {
        document: { relationTo: 'posts', value: created.id },
        user: { relationTo: 'users', value: userID },
      },
      overrideAccess: true,
    })
    lockIDs.push(otherLock.id)

    await expect(
      payload.delete({
        collection: 'payload-locked-documents',
        id: ownLock.id,
        overrideAccess: false,
        req: editorReq,
      }),
    ).resolves.toMatchObject({ id: ownLock.id })
    await expect(
      payload.delete({
        collection: 'payload-locked-documents',
        id: otherLock.id,
        overrideAccess: false,
        req: editorReq,
      }),
    ).rejects.toMatchObject({ status: 403 })
  }, 600_000)

  it('creates a draft with access control and replays the idempotent result', async () => {
    const suffix = randomUUID().slice(0, 8)
    const input = {
      contentHtml: '<h2>Agent draft</h2><p>Database-backed mutation coverage.</p>',
      introHtml: '<p>Agent-created introduction.</p>',
      metaDescription: 'A draft created by the MCP mutation integration test.',
      metaTitle: 'Agent MCP draft',
      slug: `agent-mcp-draft-${suffix}`,
      title: 'Agent MCP draft',
    }
    const idempotencyKey = `agent-mcp-create-${suffix}`

    const run = () =>
      runIdempotentMutation({
        args: input,
        idempotencyKey,
        locale: 'en',
        req,
        targetCollection: 'posts',
        tool: 'create_post_draft',
        run: async () => {
          const result = await createPostDraft({ input, locale: 'en', req })
          postIDs.push(result.id as number)
          return { result, targetIDs: [result.id] }
        },
      })

    const created = await run()
    const replayed = await run()

    expect(replayed.id).toBe(created.id)
    const stored = await payload.findByID({
      collection: 'posts',
      draft: true,
      id: created.id,
      locale: 'en',
      overrideAccess: true,
    })
    expect(stored).toMatchObject({ _status: 'draft', slug: input.slug })
    expect(created.updatedAt).toBe(stored.updatedAt)
  }, 600_000)

  it('serializes concurrent edits and rejects the stale writer', async () => {
    const id = postIDs[0]
    const current = await payload.findByID({
      collection: 'posts',
      draft: true,
      id,
      locale: 'en',
      overrideAccess: true,
    })

    const results = await Promise.allSettled([
      updatePostDraft({
        expectedUpdatedAt: current.updatedAt,
        id,
        locale: 'en',
        patch: { title: 'Concurrent edit A' },
        req,
      }),
      updatePostDraft({
        expectedUpdatedAt: current.updatedAt,
        id,
        locale: 'en',
        patch: { title: 'Concurrent edit B' },
        req: secondReq,
      }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find(({ status }) => status === 'rejected')
    expect(rejected).toMatchObject({ reason: { status: 409 }, status: 'rejected' })
  }, 600_000)

  it('cannot trash a live locale hidden behind a newer draft', async () => {
    const id = postIDs[0]
    expect(id).toBeDefined()

    await payload.update({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      depth: 0,
      id,
      locale: 'en',
      overrideAccess: true,
      publishSpecificLocale: 'en',
    })
    await payload.update({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: { _status: 'draft', title: 'Newer agent draft' },
      depth: 0,
      draft: true,
      id,
      locale: 'en',
      overrideAccess: true,
    })
    const latestDraft = await payload.findByID({
      collection: 'posts',
      draft: true,
      id,
      locale: 'en',
      overrideAccess: true,
    })

    await expect(
      setContentTrashState({
        action: 'trash',
        collection: 'posts',
        expectedUpdatedAt: latestDraft.updatedAt,
        id,
        locale: 'en',
        req,
      }),
    ).rejects.toMatchObject({ status: 409 })
  }, 600_000)

  it('trashes and restores only unreferenced Media', async () => {
    const suffix = randomUUID().slice(0, 8)
    const upload = async (label: string) => {
      const media = await uploadMedia({
        alt: `${label} agent media`,
        base64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        filename: `agent-media-${label}-${suffix}.png`,
        locale: 'en',
        mimeType: 'image/png',
        req,
      })
      mediaIDs.push(media.id as number)
      return media
    }
    const inlineUpload = (mediaID: number | string) => ({
      root: {
        children: [
          {
            fields: {},
            format: '',
            id: randomUUID(),
            relationTo: 'media',
            type: 'upload',
            value: mediaID,
            version: 3,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    })

    const directMedia = await upload('direct-reference')
    const richTextMedia = await upload('rich-text-reference')
    const referencedPost = await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        content: {
          root: {
            children: [
              {
                fields: {
                  blockType: 'mediaBlock',
                  id: randomUUID(),
                  media: richTextMedia.id,
                },
                type: 'block',
                version: 2,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        heroImage: directMedia.id,
        intro: parseHtmlToContent('<p>Published Media reference introduction.</p>'),
        meta: {
          description: 'A published Post that protects its referenced Media.',
          title: 'Referenced Media guard',
        },
        slug: `referenced-media-${suffix}`,
        source: 'manual',
        title: 'Referenced Media guard',
      } as never,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: true,
    })
    postIDs.push(referencedPost.id)
    await payload.update({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      depth: 0,
      id: referencedPost.id,
      locale: 'en',
      overrideAccess: true,
      publishSpecificLocale: 'en',
    })

    for (const media of [directMedia, richTextMedia]) {
      await expect(
        setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: media.updatedAt as string,
          id: media.id,
          locale: 'en',
          req,
        }),
      ).rejects.toMatchObject({ status: 409 })
    }

    const bodyMedia = await upload('legal-body-reference')
    const summaryMedia = await upload('legal-summary-reference')
    const pairMedia = await upload('legal-pair-reference')
    const legalPage = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        layout: [
          {
            blockType: 'legalDoc',
            sections: [
              {
                content: [
                  {
                    body: inlineUpload(bodyMedia.id),
                    type: 'clause',
                  },
                  {
                    pairRows: [{ left: 'Protected image', right: inlineUpload(pairMedia.id) }],
                    type: 'keyvalue',
                  },
                ],
                title: 'Media safety',
              },
            ],
            showSummary: true,
            summaryItems: [{ text: inlineUpload(summaryMedia.id) }],
            title: 'Media safety policy',
          },
        ],
        slug: `inline-media-${suffix}`,
        title: 'Inline Media reference guard',
      } as never,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: true,
    })
    pageIDs.push(legalPage.id)
    await payload.update({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: { _status: 'published' },
      depth: 0,
      id: legalPage.id,
      locale: 'en',
      overrideAccess: true,
      publishSpecificLocale: 'en',
    })
    for (const media of [bodyMedia, summaryMedia, pairMedia]) {
      await expect(
        setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: media.updatedAt as string,
          id: media.id,
          locale: 'en',
          req,
        }),
      ).rejects.toMatchObject({ status: 409 })
    }

    const reviewPhoto = await upload('customer-review-reference')
    const reviewsPage = await payload.create({
      collection: 'pages',
      context: { disableRevalidate: true },
      data: {
        _status: 'draft',
        layout: [
          {
            blockType: 'customerReviews',
            reviews: [
              {
                authorName: 'Media safety reviewer',
                photo: reviewPhoto.id,
                quote: 'Referenced review photo',
              },
            ],
          },
        ],
        slug: `customer-review-media-${suffix}`,
        title: 'Customer review Media reference guard',
      } as never,
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: true,
    })
    pageIDs.push(reviewsPage.id)
    await expect(
      payload.findByID({
        collection: 'media',
        id: reviewPhoto.id,
        locale: 'en',
        overrideAccess: true,
        trash: true,
      }),
    ).resolves.toMatchObject({ agentTrashEligible: false })
    await expect(
      setContentTrashState({
        action: 'trash',
        collection: 'media',
        expectedUpdatedAt: reviewPhoto.updatedAt as string,
        id: reviewPhoto.id,
        locale: 'en',
        req,
      }),
    ).rejects.toMatchObject({ status: 409 })

    const unusedMedia = await upload('unused')
    const mediaLock = await payload.create({
      collection: 'payload-locked-documents',
      data: {
        document: { relationTo: 'media', value: unusedMedia.id as number },
        user: { relationTo: 'users', value: userID },
      },
      overrideAccess: true,
    })
    lockIDs.push(mediaLock.id)
    const trashed = await setContentTrashState({
      action: 'trash',
      collection: 'media',
      expectedUpdatedAt: unusedMedia.updatedAt as string,
      id: unusedMedia.id,
      locale: 'en',
      req,
    })
    const inTrash = await payload.findByID({
      collection: 'media',
      id: unusedMedia.id,
      locale: 'en',
      overrideAccess: true,
      trash: true,
    })
    expect(inTrash.deletedAt).toEqual(expect.any(String))

    const postInput = {
      contentHtml: '<p>Trashed Media must not be assignable.</p>',
      heroImageID: unusedMedia.id,
      introHtml: '<p>Media assignment safety test.</p>',
      metaDescription: 'Verifies that trashed Media cannot be assigned to agent-created Posts.',
      metaTitle: 'Trashed Media assignment guard',
      slug: `trashed-media-create-${suffix}`,
      title: 'Trashed Media assignment guard',
    }
    await expect(createPostDraft({ input: postInput, locale: 'en', req })).rejects.toMatchObject({
      status: 409,
    })

    const updateTarget = await createPostDraft({
      input: {
        ...postInput,
        heroImageID: undefined,
        slug: `trashed-media-update-${suffix}`,
      },
      locale: 'en',
      req,
    })
    postIDs.push(updateTarget.id as number)
    await expect(
      updatePostDraft({
        expectedUpdatedAt: updateTarget.updatedAt as string,
        id: updateTarget.id,
        locale: 'en',
        patch: { heroImageID: unusedMedia.id },
        req,
      }),
    ).rejects.toMatchObject({ status: 409 })

    const restored = await setContentTrashState({
      action: 'restore',
      collection: 'media',
      expectedUpdatedAt: trashed.updatedAt as string,
      id: unusedMedia.id,
      locale: 'en',
      req,
    })
    const active = await payload.findByID({
      collection: 'media',
      id: unusedMedia.id,
      locale: 'en',
      overrideAccess: true,
    })
    expect(active).toMatchObject({ deletedAt: null, filename: unusedMedia.filename })

    await expect(
      setContentTrashState({
        action: 'restore',
        collection: 'media',
        expectedUpdatedAt: restored.updatedAt as string,
        id: unusedMedia.id,
        locale: 'en',
        req,
      }),
    ).rejects.toMatchObject({ status: 409 })
  }, 600_000)
})
