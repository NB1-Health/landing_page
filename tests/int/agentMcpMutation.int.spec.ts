import { randomUUID } from 'node:crypto'

import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { createPostDraft, setContentTrashState, updatePostDraft } from '@/mcp/contentOperations'
import { runIdempotentMutation } from '@/mcp/runIdempotentMutation'

describe('agent MCP mutation (Postgres)', () => {
  let payload: Payload
  let req: PayloadRequest
  let secondReq: PayloadRequest
  let userID: number
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
    req = await createLocalReq({ user }, payload)
    req.payloadAPI = 'MCP'
    secondReq = await createLocalReq({ user }, payload)
    secondReq.payloadAPI = 'MCP'
  }, 600_000)

  afterAll(async () => {
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
    await payload?.destroy()
  })

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
})
