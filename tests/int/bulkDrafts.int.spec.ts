import { APIError, type PayloadRequest } from 'payload'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const content = vi.hoisted(() => ({
  clonePageDraft: vi.fn(),
  createPostDraft: vi.fn(),
  patchPageDraft: vi.fn(),
  updatePostDraft: vi.fn(),
}))

vi.mock('@/mcp/contentOperations', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/mcp/contentOperations')>()),
  ...content,
}))

import { commitBulkDrafts, planBulkDrafts } from '@/mcp/bulkDrafts'
import { hashStableJSON } from '@/mcp/runIdempotentMutation'

const postCreate = {
  contentHtml: '<h2>Body</h2><p>Copy</p>',
  introHtml: '<p>Intro</p>',
  metaDescription: 'A useful draft article.',
  metaTitle: 'Draft article',
  slug: 'draft-article',
  title: 'Draft article',
  type: 'post-create' as const,
}

type MockPayload = ReturnType<typeof makePayload>

function makePayload() {
  const transactionDB = {}
  const payload = {
    count: vi.fn(async () => ({ totalDocs: 0 })),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 99, ...data })),
    db: {
      beginTransaction: vi.fn(async () => 'bulk-transaction'),
      commitTransaction: vi.fn(async () => undefined),
      execute: vi.fn(async () => undefined),
      rollbackTransaction: vi.fn(async () => undefined),
      sessions: {
        'bulk-transaction': { db: transactionDB },
        'outer-transaction': { db: transactionDB },
      },
    },
    find: vi.fn(async (): Promise<{ docs: Record<string, unknown>[] }> => ({ docs: [] })),
    findByID: vi.fn(async (): Promise<unknown> => undefined),
    update: vi.fn(async ({ data, id }: { data: Record<string, unknown>; id: number | string }) => ({
      id,
      ...data,
    })),
  }
  return payload
}

function makeRequest(payload: MockPayload): PayloadRequest {
  return {
    context: {},
    payload,
    payloadAPI: 'MCP',
    user: { id: 42, role: 'agent-editor' },
  } as unknown as PayloadRequest
}

function approvedPlan(items: unknown[] = [postCreate]) {
  return {
    actor: 42,
    approvalStatus: 'approved' as const,
    expiresAt: '2026-08-28T12:00:00.000Z',
    id: 7,
    idempotencyKey: 'plan-key',
    locale: 'en',
    operationKey: 'plan-operation',
    plan: items,
    planHash: hashStableJSON(items),
    requestHash: hashStableJSON({ locale: 'en', plan: items }),
    status: 'planned' as const,
    tool: 'plan_bulk_drafts',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('bulk draft planning', () => {
  it('stores a bounded, normalized plan for explicit admin approval', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)

    const result = await planBulkDrafts({
      idempotencyKey: 'upload-1',
      itemsJson: JSON.stringify([postCreate]),
      locale: 'en',
      req,
    })

    expect(result).toEqual({
      count: 1,
      instructions: expect.stringMatching(/admin must review/i),
      planHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      planID: 99,
      summary: {
        'page-clone': 0,
        'page-update': 0,
        'post-create': 1,
        'post-update': 0,
      },
    })
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'agent-operations',
        data: expect.objectContaining({
          actor: 42,
          approvalStatus: 'pending',
          expiresAt: '2026-08-28T12:00:00.000Z',
          locale: 'en',
          plan: [postCreate],
          status: 'planned',
          tool: 'plan_bulk_drafts',
        }),
        overrideAccess: true,
        req,
      }),
    )
  })

  it('replays the same plan and rejects changed input under the same key', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    const first = await planBulkDrafts({
      idempotencyKey: 'upload-1',
      itemsJson: JSON.stringify([postCreate]),
      locale: 'en',
      req,
    })
    const stored = payload.create.mock.results[0]?.value
    payload.find.mockResolvedValue({ docs: [await stored] })

    await expect(
      planBulkDrafts({
        idempotencyKey: 'upload-1',
        itemsJson: JSON.stringify([postCreate]),
        locale: 'en',
        req,
      }),
    ).resolves.toEqual(first)

    const error = await planBulkDrafts({
      idempotencyKey: 'upload-1',
      itemsJson: JSON.stringify([{ ...postCreate, title: 'Changed title' }]),
      locale: 'en',
      req,
    }).catch((caught) => caught)
    expect(error).toBeInstanceOf(APIError)
    expect(error.status).toBe(409)
    expect(payload.create).toHaveBeenCalledTimes(1)
  })

  it('rejects oversized batches and fields that could bypass the draft-only schema', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    const tooMany = Array.from({ length: 21 }, () => postCreate)

    const countError = await planBulkDrafts({
      idempotencyKey: 'too-many',
      itemsJson: JSON.stringify(tooMany),
      locale: 'en',
      req,
    }).catch((caught) => caught)
    expect(countError).toBeInstanceOf(APIError)
    expect(countError.status).toBe(400)

    const publishError = await planBulkDrafts({
      idempotencyKey: 'publish-attempt',
      itemsJson: JSON.stringify([{ ...postCreate, _status: 'published' }]),
      locale: 'en',
      req,
    }).catch((caught) => caught)
    expect(publishError).toBeInstanceOf(APIError)
    expect(publishError.status).toBe(400)

    const sizeError = await planBulkDrafts({
      idempotencyKey: 'oversized',
      itemsJson: `${' '.repeat(250_001)}[]`,
      locale: 'en',
      req,
    }).catch((caught) => caught)
    expect(sizeError).toBeInstanceOf(APIError)
    expect(sizeError.status).toBe(413)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects Post fields above the individual MCP tool limits before planning', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    const limits = [
      ['focusKeyword', 100],
      ['introHtml', 25_000],
      ['metaDescription', 155],
      ['metaTitle', 60],
      ['subtitle', 180],
    ] as const

    for (const [field, limit] of limits) {
      const value = 'x'.repeat(limit + 1)
      const items = [
        { ...postCreate, [field]: value },
        {
          expectedUpdatedAt: '2026-08-27T12:00:00.000Z',
          id: 12,
          patch: { [field]: value },
          type: 'post-update',
        },
      ]

      for (const item of items) {
        const error = await planBulkDrafts({
          idempotencyKey: `over-limit-${field}-${item.type}`,
          itemsJson: JSON.stringify([item]),
          locale: 'en',
          req,
        }).catch((caught) => caught)

        expect(error).toBeInstanceOf(APIError)
        expect(error.status).toBe(400)
      }
    }

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects relationship IDs above the individual MCP tool limit before planning', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    const oversizedID = 'x'.repeat(65)
    const items = [
      { ...postCreate, authorIDs: [oversizedID] },
      {
        expectedUpdatedAt: '2026-08-27T12:00:00.000Z',
        id: 12,
        patch: { heroImageID: oversizedID },
        type: 'post-update',
      },
    ]

    for (const item of items) {
      await expect(
        planBulkDrafts({
          idempotencyKey: `over-limit-id-${item.type}`,
          itemsJson: JSON.stringify([item]),
          locale: 'en',
          req,
        }),
      ).rejects.toMatchObject({ status: 400 })
    }

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('rejects Page clone titles above the individual MCP tool limit before planning', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)

    await expect(
      planBulkDrafts({
        idempotencyKey: 'over-limit-page-clone-title',
        itemsJson: JSON.stringify([
          {
            slug: 'bulk-page-clone',
            sourcePageID: 12,
            title: 'x'.repeat(121),
            type: 'page-clone',
          },
        ]),
        locale: 'en',
        req,
      }),
    ).rejects.toMatchObject({ status: 400 })

    expect(payload.create).not.toHaveBeenCalled()
  })

  it('uses the Page copy-edit parser for bulk page updates', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    const item = {
      expectedUpdatedAt: '2026-08-27T12:00:00.000Z',
      id: 12,
      patch: {
        copyEdits: [
          {
            blockID: 'hero-1',
            blockType: 'heroBanner',
            patch: { heading: '  Updated hero  ' },
          },
        ],
      },
      type: 'page-update',
    }

    await planBulkDrafts({
      idempotencyKey: 'page-copy',
      itemsJson: JSON.stringify([item]),
      locale: 'en',
      req,
    })

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: [
            {
              ...item,
              patch: {
                copyEdits: [
                  {
                    blockID: 'hero-1',
                    blockType: 'heroBanner',
                    patch: { heading: 'Updated hero' },
                  },
                ],
              },
            },
          ],
        }),
      }),
    )

    await expect(
      planBulkDrafts({
        idempotencyKey: 'unsafe-page-copy',
        itemsJson: JSON.stringify([
          {
            ...item,
            patch: {
              copyEdits: [
                {
                  blockID: 'hero-1',
                  blockType: 'heroBanner',
                  patch: { variants: [] },
                },
              ],
            },
          },
        ]),
        locale: 'en',
        req,
      }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('rate-limits new plans per actor without blocking idempotent replays', async () => {
    const payload = makePayload()
    payload.count.mockResolvedValue({ totalDocs: 10 })
    const req = makeRequest(payload)

    const error = await planBulkDrafts({
      idempotencyKey: 'rate-limited-plan',
      itemsJson: JSON.stringify([postCreate]),
      locale: 'en',
      req,
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(APIError)
    if (!(error instanceof APIError)) throw error
    expect(error.status).toBe(429)
    expect(payload.count).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        req,
        where: expect.objectContaining({ actor: { equals: 42 } }),
      }),
    )
    expect(payload.create).not.toHaveBeenCalled()
  })
})

describe('bulk draft commit', () => {
  it('commits all draft operations and success audit state in one transaction', async () => {
    const payload = makePayload()
    payload.findByID.mockResolvedValue(approvedPlan())
    const req = makeRequest(payload)
    content.createPostDraft.mockImplementation(async () => {
      expect(await req.transactionID).toBe('bulk-transaction')
      return { id: 301, status: 'draft' }
    })

    const result = await commitBulkDrafts({ idempotencyKey: 'commit-1', planID: 7, req })

    expect(result).toEqual({
      count: 1,
      planID: 7,
      results: [{ index: 0, result: { id: 301, status: 'draft' }, type: 'post-create' }],
    })
    expect(content.createPostDraft).toHaveBeenCalledWith({
      input: {
        contentHtml: postCreate.contentHtml,
        introHtml: postCreate.introHtml,
        metaDescription: postCreate.metaDescription,
        metaTitle: postCreate.metaTitle,
        slug: postCreate.slug,
        title: postCreate.title,
      },
      locale: 'en',
      req,
    })
    expect(payload.db.beginTransaction).toHaveBeenCalledOnce()
    expect(payload.db.commitTransaction).toHaveBeenCalledWith('bulk-transaction')
    expect(payload.db.rollbackTransaction).not.toHaveBeenCalled()
    expect(payload.db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ raw: expect.stringMatching(/agent_operations.*FOR UPDATE/) }),
    )
    expect(req.transactionID).toBeUndefined()
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'succeeded', targetIDs: [301] }),
        id: 7,
        req,
      }),
    )
  })

  it('uses an inherited transaction without committing or rolling it back', async () => {
    const payload = makePayload()
    payload.findByID.mockResolvedValue(approvedPlan())
    const req = makeRequest(payload)
    req.transactionID = 'outer-transaction'
    content.createPostDraft.mockResolvedValue({ id: 302, status: 'draft' })

    await expect(
      commitBulkDrafts({ idempotencyKey: 'commit-outer', planID: 7, req }),
    ).resolves.toEqual(expect.objectContaining({ count: 1 }))

    expect(payload.db.beginTransaction).not.toHaveBeenCalled()
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(payload.db.rollbackTransaction).not.toHaveBeenCalled()
    expect(req.transactionID).toBe('outer-transaction')
  })

  it('rate-limits a new commit before any content write starts', async () => {
    const payload = makePayload()
    payload.count.mockResolvedValue({ totalDocs: 10 })
    payload.findByID.mockResolvedValue(approvedPlan())
    const req = makeRequest(payload)

    const error = await commitBulkDrafts({
      idempotencyKey: 'rate-limited-commit',
      planID: 7,
      req,
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(APIError)
    if (!(error instanceof APIError)) throw error
    expect(error.status).toBe(429)
    expect(payload.create).not.toHaveBeenCalled()
    expect(content.createPostDraft).not.toHaveBeenCalled()
    expect(payload.db.beginTransaction).toHaveBeenCalledOnce()
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('bulk-transaction')
  })

  it('checks the current approval while holding the plan transaction and row lock', async () => {
    const payload = makePayload()
    const req = makeRequest(payload)
    payload.findByID.mockImplementation(async () => {
      expect(await req.transactionID).toBe('bulk-transaction')
      return { ...approvedPlan(), approvalStatus: 'rejected' }
    })

    const error = await commitBulkDrafts({
      idempotencyKey: 'revoked-approval',
      planID: 7,
      req,
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(APIError)
    if (!(error instanceof APIError)) throw error
    expect(error.status).toBe(409)
    expect(payload.db.execute).toHaveBeenCalledWith(
      expect.objectContaining({ raw: expect.stringMatching(/agent_operations.*FOR UPDATE/) }),
    )
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('bulk-transaction')
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
    expect(content.createPostDraft).not.toHaveBeenCalled()
  })

  it('rolls back the batch and records only a sanitized failure', async () => {
    const items = [
      postCreate,
      { slug: 'landing-copy', sourcePageID: 5, title: 'Landing copy', type: 'page-clone' as const },
    ]
    const payload = makePayload()
    payload.findByID.mockResolvedValue(approvedPlan(items))
    const req = makeRequest(payload)
    content.createPostDraft.mockResolvedValue({ id: 303, status: 'draft' })
    content.clonePageDraft.mockRejectedValue(new Error('TOP SECRET upload failed'))

    const error = await commitBulkDrafts({
      idempotencyKey: 'commit-failure',
      planID: 7,
      req,
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(Error)
    expect(payload.db.rollbackTransaction).toHaveBeenCalledWith('bulk-transaction')
    expect(payload.db.commitTransaction).not.toHaveBeenCalled()
    expect(req.transactionID).toBeUndefined()

    const failureUpdates = payload.update.mock.calls
      .map(([call]) => call.data)
      .filter((data) => data.status === 'failed')
    expect(failureUpdates).toEqual([
      { error: 'Error: Bulk draft commit failed.', status: 'failed' },
    ])
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error: 'Error: Bulk draft commit failed.',
          status: 'failed',
          tool: 'commit_bulk_drafts',
        }),
      }),
    )
    expect(JSON.stringify(failureUpdates)).not.toContain('TOP SECRET')
  })
})
