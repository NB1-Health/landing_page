import { randomUUID } from 'node:crypto'

import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { setContentTrashState, uploadMedia } from '@/mcp/contentOperations'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { parseHtmlToContent } from '@/utilities/parseHtmlToBlocks'

const timeout = 600_000
const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

describe('agent Media safety (Postgres)', () => {
  let payload: Payload
  let admin: User
  let agent: User

  const mediaIDs = new Set<number>()
  const postIDs = new Set<number>()
  const openTransactions = new Set<PayloadRequest>()

  const requestFor = async (user: User, payloadAPI?: PayloadRequest['payloadAPI']) => {
    const req = await createLocalReq({ user }, payload)
    req.context.disableRevalidate = true
    if (payloadAPI) req.payloadAPI = payloadAPI
    return req
  }

  const agentRequest = () => requestFor(agent, 'MCP')
  const adminRequest = () => requestFor(admin)

  const mediaByID = (id: number) =>
    payload.findByID({
      collection: 'media',
      id,
      locale: 'en',
      overrideAccess: true,
      trash: true,
    })

  const upload = async (label: string, request?: PayloadRequest) => {
    const req = request ?? (await agentRequest())
    const result = await uploadMedia({
      alt: `${label} agent Media`,
      base64: png,
      filename: `agent-media-safety-${label}-${randomUUID()}.png`,
      locale: 'en',
      mimeType: 'image/png',
      req,
    })
    const id = Number(result.id)
    mediaIDs.add(id)
    return mediaByID(id)
  }

  const postData = (slug: string, heroImage: number, authors?: number[]) =>
    ({
      _status: 'draft',
      authors,
      heroImage,
      htmlContent: '<p>Agent Media safety content.</p>',
      intro: parseHtmlToContent('<p>Agent Media safety introduction.</p>'),
      meta: {
        description: 'Agent Media safety integration coverage.',
        title: 'Agent Media safety',
      },
      slug,
      source: 'api',
      title: 'Agent Media safety',
    }) as never

  const createHumanPost = async (heroImage: number, slug: string, req: PayloadRequest) => {
    const post = await payload.create({
      collection: 'posts',
      context: { disableRevalidate: true },
      data: postData(slug, heroImage),
      draft: true,
      fallbackLocale: false,
      locale: 'en',
      overrideAccess: false,
      req,
    })
    postIDs.add(post.id)
    return post
  }

  const begin = async (req: PayloadRequest) => {
    expect(await initTransaction(req)).toBe(true)
    openTransactions.add(req)
  }

  const commit = async (req: PayloadRequest) => {
    await commitTransaction(req)
    openTransactions.delete(req)
  }

  const rollback = async (req: PayloadRequest) => {
    if (await req.transactionID) await killTransaction(req)
    openTransactions.delete(req)
  }

  const expectPending = async (promise: Promise<unknown>) => {
    const state = await Promise.race([
      promise.then(
        () => 'settled' as const,
        () => 'settled' as const,
      ),
      new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), 50)),
    ])
    expect(state).toBe('pending')
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    agent = await payload.create({
      collection: 'users',
      data: {
        email: `agent-media-safety-${randomUUID()}@example.invalid`,
        name: 'Agent Media safety test',
        password: randomUUID(),
        role: 'agent-editor',
      },
      overrideAccess: true,
    })
    admin = await payload.create({
      collection: 'users',
      data: {
        email: `admin-media-safety-${randomUUID()}@example.invalid`,
        name: 'Admin Media safety test',
        password: randomUUID(),
        role: 'admin',
      },
      overrideAccess: true,
    })
  }, timeout)

  afterAll(async () => {
    for (const req of openTransactions) await rollback(req).catch(() => undefined)
    for (const id of postIDs) {
      await payload
        .delete({
          collection: 'posts',
          context: { disableRevalidate: true },
          id,
          overrideAccess: true,
          trash: true,
        })
        .catch(() => undefined)
    }
    for (const id of mediaIDs) {
      await payload
        .delete({
          collection: 'media',
          context: { disableRevalidate: true },
          id,
          overrideAccess: true,
          trash: true,
        })
        .catch(() => undefined)
    }
    if (agent?.id) {
      await payload
        .delete({ collection: 'users', id: agent.id, overrideAccess: true })
        .catch(() => undefined)
    }
    if (admin?.id) {
      await payload
        .delete({ collection: 'users', id: admin.id, overrideAccess: true })
        .catch(() => undefined)
    }
    await payload?.destroy()
  }, timeout)

  it(
    'marks MCP uploads eligible and preserves eligibility through agent trash and restore',
    async () => {
      const req = await agentRequest()
      const media = await upload('eligible', req)
      expect(media).toMatchObject({ agentTrashEligible: true, deletedAt: null })

      const trashed = await setContentTrashState({
        action: 'trash',
        collection: 'media',
        expectedUpdatedAt: media.updatedAt,
        id: media.id,
        locale: 'en',
        req,
      })
      expect(await mediaByID(media.id)).toMatchObject({
        agentTrashEligible: true,
        deletedAt: expect.any(String),
      })

      await setContentTrashState({
        action: 'restore',
        collection: 'media',
        expectedUpdatedAt: trashed.updatedAt as string,
        id: media.id,
        locale: 'en',
        req,
      })
      expect(await mediaByID(media.id)).toMatchObject({
        agentTrashEligible: true,
        deletedAt: null,
      })
    },
    timeout,
  )

  it(
    'makes the eligibility latch irreversible for ordinary Media updates',
    async () => {
      const media = await upload('human-update')
      const adminReq = await adminRequest()
      const updated = await payload.update({
        collection: 'media',
        data: { agentTrashEligible: true, alt: 'Human-edited Media' } as never,
        fallbackLocale: false,
        id: media.id,
        locale: 'en',
        overrideAccess: false,
        req: adminReq,
      })
      expect(updated.agentTrashEligible).toBe(false)
      expect((await mediaByID(media.id)).agentTrashEligible).toBe(false)

      await expect(
        setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: updated.updatedAt,
          id: media.id,
          locale: 'en',
          req: await agentRequest(),
        }),
      ).rejects.toMatchObject({ status: 409 })

      const adminTrashed = await payload.update({
        collection: 'media',
        data: { agentTrashEligible: true, deletedAt: new Date().toISOString() } as never,
        fallbackLocale: false,
        id: media.id,
        locale: 'en',
        overrideAccess: false,
        req: adminReq,
      })
      expect(adminTrashed.agentTrashEligible).toBe(false)
      await expect(
        setContentTrashState({
          action: 'restore',
          collection: 'media',
          expectedUpdatedAt: adminTrashed.updatedAt,
          id: media.id,
          locale: 'en',
          req: await agentRequest(),
        }),
      ).rejects.toMatchObject({ status: 409 })
    },
    timeout,
  )

  it(
    'rolls the latch back when a referencing content write fails',
    async () => {
      const media = await upload('rollback')
      const slug = `agent-media-rollback-${randomUUID()}`
      const adminReq = await adminRequest()

      await expect(
        payload.create({
          collection: 'posts',
          context: { disableRevalidate: true },
          data: postData(slug, media.id, [2_147_483_000]),
          draft: true,
          fallbackLocale: false,
          locale: 'en',
          overrideAccess: false,
          req: adminReq,
        }),
      ).rejects.toThrow()

      expect((await mediaByID(media.id)).agentTrashEligible).toBe(true)
      const failedPosts = await payload.find({
        collection: 'posts',
        draft: true,
        limit: 1,
        locale: 'en',
        overrideAccess: true,
        trash: true,
        where: { slug: { equals: slug } },
      })
      expect(failedPosts.totalDocs).toBe(0)
    },
    timeout,
  )

  it(
    'permanently revokes eligibility when a human assigns Media to a Post',
    async () => {
      const media = await upload('human-reference')
      await createHumanPost(
        media.id,
        `agent-media-human-reference-${randomUUID()}`,
        await adminRequest(),
      )

      const referenced = await mediaByID(media.id)
      expect(referenced.agentTrashEligible).toBe(false)
      await expect(
        setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: referenced.updatedAt,
          id: media.id,
          locale: 'en',
          req: await agentRequest(),
        }),
      ).rejects.toMatchObject({ status: 409 })
    },
    timeout,
  )

  it(
    'rejects Post assignments to trashed or missing Media',
    async () => {
      const media = await upload('invalid-assignment')
      const adminReq = await adminRequest()
      await payload.update({
        collection: 'media',
        data: { deletedAt: new Date().toISOString() } as never,
        fallbackLocale: false,
        id: media.id,
        locale: 'en',
        overrideAccess: false,
        req: adminReq,
      })

      await expect(
        createHumanPost(
          media.id,
          `agent-media-trashed-assignment-${randomUUID()}`,
          await adminRequest(),
        ),
      ).rejects.toMatchObject({ status: 409 })
      await expect(
        createHumanPost(
          2_147_483_000,
          `agent-media-missing-assignment-${randomUUID()}`,
          await adminRequest(),
        ),
      ).rejects.toMatchObject({ status: 409 })
    },
    timeout,
  )

  it(
    'lets a referencing content transaction win before a concurrent trash attempt',
    async () => {
      const media = await upload('content-first-race')
      const writerReq = await adminRequest()
      const trashReq = await agentRequest()
      await begin(writerReq)

      try {
        await createHumanPost(media.id, `agent-media-content-first-${randomUUID()}`, writerReq)
        await begin(trashReq)
        const trash = setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: media.updatedAt,
          id: media.id,
          locale: 'en',
          req: trashReq,
        })
        await expectPending(trash)

        await commit(writerReq)
        await expect(trash).rejects.toMatchObject({ status: 409 })
        expect((await mediaByID(media.id)).agentTrashEligible).toBe(false)
      } finally {
        await rollback(writerReq)
        await rollback(trashReq)
      }
    },
    timeout,
  )

  it(
    'lets a trash transaction win before a concurrent content assignment',
    async () => {
      const media = await upload('trash-first-race')
      const trashReq = await agentRequest()
      const writerReq = await adminRequest()
      await begin(trashReq)

      try {
        await setContentTrashState({
          action: 'trash',
          collection: 'media',
          expectedUpdatedAt: media.updatedAt,
          id: media.id,
          locale: 'en',
          req: trashReq,
        })
        await begin(writerReq)
        const write = createHumanPost(
          media.id,
          `agent-media-trash-first-${randomUUID()}`,
          writerReq,
        )
        await expectPending(write)

        await commit(trashReq)
        await expect(write).rejects.toMatchObject({ status: 409 })
        expect(await mediaByID(media.id)).toMatchObject({
          agentTrashEligible: true,
          deletedAt: expect.any(String),
        })
      } finally {
        await rollback(trashReq)
        await rollback(writerReq)
      }
    },
    timeout,
  )
})
