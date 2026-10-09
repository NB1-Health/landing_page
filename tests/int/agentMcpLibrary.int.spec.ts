import { randomUUID } from 'node:crypto'

import { createLocalReq, getPayload, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { agentMcpTools } from '@/mcp/tools'
import { getHubDocumentSlugsByLocale } from '@/utilities/hubDocumentQueries'

/**
 * The content library over MCP, end to end through the tool handlers: Postgres,
 * the idempotency/audit wrapper, access control and the collection hooks.
 */

type ToolResult = { content: Array<{ text: string }> }
type Node = { type: string; fields?: Record<string, unknown>; children?: Node[] }

function tool(name: string) {
  const found = agentMcpTools.find((candidate) => candidate.name === name)
  if (!found) throw new Error(`No tool ${name}`)
  return async (args: Record<string, unknown>, req: PayloadRequest) => {
    const result = (await found.handler(args, req)) as ToolResult
    return JSON.parse(result.content[0].text)
  }
}

const upsert = tool('upsert_drafts')
const find = tool('find_content')
const get = tool('get_content')

describe('agent MCP content library (Postgres)', () => {
  let payload: Payload
  const run = randomUUID().slice(0, 8)
  const userIDs: number[] = []
  const termIDs: number[] = []
  const created: Array<{ collection: string; id: number | string }> = []
  let hubIDs: number[] = []

  /** A fresh agent per test: the write quota is per actor per minute. */
  async function agent(): Promise<PayloadRequest> {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `agent-library-${randomUUID()}@example.invalid`,
        name: 'Agent library test',
        password: randomUUID(),
        role: 'agent-editor',
      },
      overrideAccess: true,
    })
    userIDs.push(user.id)
    const req = await createLocalReq({ user }, payload)
    req.payloadAPI = 'MCP'
    // No Next request here, so no cache to revalidate.
    req.context.disableRevalidate = true
    return req
  }

  async function ensureHub(key: 'lexicon' | 'research' | 'microbiome', en: string, de: string) {
    const existing = await payload.find({
      collection: 'hubs',
      where: { key: { equals: key } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) return
    const hub = await payload.create({
      collection: 'hubs',
      locale: 'en',
      data: { key, title: en, slug: en.toLowerCase() } as never,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    await payload.update({
      collection: 'hubs',
      id: hub.id,
      locale: 'de',
      data: { title: de, slug: de.toLowerCase() } as never,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    hubIDs.push(hub.id)
  }

  function term(slug: string, extra: Record<string, unknown> = {}) {
    return {
      externalId: `lex-${run}-${slug}`,
      fields: { category: `cat-${run}` },
      locales: {
        en: {
          title: `Term ${slug}`,
          slug: `${slug}-${run}`,
          definition: `${slug} is a test term.`,
          inSimpleTerms: { body: 'Plain **bold** text with a [link](/en/lexicon/butyrate).' },
          meta: { title: `Meta ${slug}` },
        },
        de: {
          title: `Begriff ${slug}`,
          slug: `${slug}-de-${run}`,
          definition: `${slug} ist ein Testbegriff.`,
        },
      },
      ...extra,
    }
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    hubIDs = []
    await ensureHub('lexicon', 'Lexicon', 'Glossar')

    const category = await payload.create({
      collection: 'lexicon-categories',
      locale: 'en',
      data: { key: `cat-${run}`, title: 'Test category', slug: `cat-${run}` } as never,
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    created.push({ collection: 'lexicon-categories', id: category.id })
  }, 600_000)

  afterAll(async () => {
    for (const id of termIDs) {
      await payload
        .delete({
          collection: 'lexicon-terms',
          id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
        .catch(() => undefined)
    }
    for (const { collection, id } of created.reverse()) {
      await payload
        .delete({
          collection: collection as 'lexicon-categories',
          id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
        .catch(() => undefined)
    }
    for (const id of hubIDs) {
      await payload
        .delete({ collection: 'hubs', id, overrideAccess: true, context: { disableRevalidate: true } })
        .catch(() => undefined)
    }
    for (const id of userIDs) {
      await payload
        .delete({
          collection: 'agent-operations',
          overrideAccess: true,
          where: { actor: { equals: id } },
        })
        .catch(() => undefined)
      await payload.delete({ collection: 'users', id, overrideAccess: true }).catch(() => undefined)
    }
    await payload?.destroy()
  })

  it('creates both locales of one document as a draft, keyed by externalId', async () => {
    const req = await agent()
    const result = await upsert(
      {
        collection: 'lexicon-terms',
        idempotencyKey: `create-${run}`,
        itemsJson: JSON.stringify([
          term('alpha', {
            locales: {
              ...term('alpha').locales,
              en: {
                ...term('alpha').locales.en,
                scientificBackground: {
                  body: [
                    '### Sub-heading',
                    '',
                    '- **Short-chain.** Made by fermentation.',
                    '- **Signalling.** Acts on receptors.',
                    '',
                    'After the list.',
                  ].join('\n'),
                },
              },
            },
          }),
        ]),
      },
      req,
    )

    expect(result.items).toHaveLength(1)
    const [item] = result.items
    expect(item).toMatchObject({ action: 'created', externalId: `lex-${run}-alpha` })
    termIDs.push(item.id)

    const en = await payload.findByID({
      collection: 'lexicon-terms',
      id: item.id,
      locale: 'en',
      draft: true,
      depth: 0,
      overrideAccess: true,
    })
    const de = await payload.findByID({
      collection: 'lexicon-terms',
      id: item.id,
      locale: 'de',
      draft: true,
      depth: 0,
      overrideAccess: true,
    })

    expect(en._status).toBe('draft')
    expect(en.externalId).toBe(`lex-${run}-alpha`)
    expect(en.hub).toBeTruthy()
    expect(en.category).toBeTruthy()
    expect(en.meta?.title).toBe('Meta alpha')
    expect(de.title).toBe('Begriff alpha')

    const body = en.scientificBackground?.body?.root.children as unknown as Node[]
    expect(body.map((node) => node.type)).toEqual(['heading', 'block', 'paragraph'])
    expect(body[1].fields).toMatchObject({
      blockType: 'bulletList',
      items: [
        { leadIn: 'Short-chain.', body: 'Made by fermentation.' },
        { leadIn: 'Signalling.', body: 'Acts on receptors.' },
      ],
    })
    const intro = en.inSimpleTerms?.body?.root.children[0] as unknown as Node
    const link = intro.children?.find((node) => node.type === 'link')
    expect(link?.fields?.url).toBe('/en/lexicon/butyrate')

    // Readable back through the generic tools, with its path for linking.
    const listed = await find(
      { collection: 'lexicon-terms', externalId: `lex-${run}-alpha`, locale: 'en' },
      req,
    )
    expect(listed.docs[0]).toMatchObject({
      externalId: `lex-${run}-alpha`,
      path: `/en/lexicon/alpha-${run}`,
      status: 'draft',
    })
    const read = await get({ collection: 'lexicon-terms', id: item.id, locale: 'de' }, req)
    expect(read.doc.title).toBe('Begriff alpha')
  }, 120_000)

  it('updates only with a fresh expectedUpdatedAt, and never duplicates', async () => {
    const req = await agent()
    const externalId = `lex-${run}-beta`
    const first = await upsert(
      {
        collection: 'lexicon-terms',
        idempotencyKey: `beta-1-${run}`,
        itemsJson: JSON.stringify([term('beta')]),
      },
      req,
    )
    const { id, updatedAt } = first.items[0]
    termIDs.push(id)

    // A re-run that does not say what it last read is refused, not duplicated.
    await expect(
      upsert(
        {
          collection: 'lexicon-terms',
          idempotencyKey: `beta-2-${run}`,
          itemsJson: JSON.stringify([term('beta')]),
        },
        req,
      ),
    ).rejects.toThrow(/already exists/)

    await expect(
      upsert(
        {
          collection: 'lexicon-terms',
          idempotencyKey: `beta-3-${run}`,
          itemsJson: JSON.stringify([
            { ...term('beta'), expectedUpdatedAt: '2020-01-01T00:00:00.000Z' },
          ]),
        },
        req,
      ),
    ).rejects.toThrow(/changed since it was read/)

    const updated = await upsert(
      {
        collection: 'lexicon-terms',
        idempotencyKey: `beta-4-${run}`,
        itemsJson: JSON.stringify([
          {
            externalId,
            expectedUpdatedAt: updatedAt,
            locales: { de: { definition: 'Neue Definition.' } },
          },
        ]),
      },
      req,
    )
    expect(updated.items[0]).toMatchObject({ action: 'updated', id })

    const de = await payload.findByID({
      collection: 'lexicon-terms',
      id,
      locale: 'de',
      draft: true,
      depth: 0,
      overrideAccess: true,
    })
    expect(de.definition).toBe('Neue Definition.')
    expect(de.title).toBe('Begriff beta')

    const all = await payload.find({
      collection: 'lexicon-terms',
      where: { externalId: { equals: externalId } },
      overrideAccess: true,
    })
    expect(all.totalDocs).toBe(1)
  }, 120_000)

  it('rejects the whole batch, listing every problem, and writes nothing', async () => {
    const req = await agent()
    const error = await upsert(
      {
        collection: 'lexicon-terms',
        idempotencyKey: `bad-${run}`,
        itemsJson: JSON.stringify([
          term('gamma', { fields: { category: 'no-such-category' } }),
          term('delta', {
            locales: {
              en: {
                ...term('delta').locales.en,
                slug: `gamma-${run}`,
                inSimpleTerms: { body: '## Too high\n\n| a | b |' },
              },
            },
          }),
        ]),
      },
      req,
    ).catch((caught: Error) => caught)

    expect(error).toBeInstanceOf(Error)
    const message = (error as Error).message
    expect(message).toMatch(/Unknown category key: "no-such-category"/)
    expect(message).toMatch(/h2 headings are not allowed here \(allowed: h3\)/)
    expect(message).toMatch(/is also used by/)

    const written = await payload.find({
      collection: 'lexicon-terms',
      where: { externalId: { in: [`lex-${run}-gamma`, `lex-${run}-delta`] } },
      overrideAccess: true,
    })
    expect(written.totalDocs).toBe(0)
  }, 120_000)

  it('keeps agents to drafts: no publishing, no deleting, no REST writes', async () => {
    const req = await agent()
    const [id] = termIDs

    await expect(
      payload.update({
        collection: 'lexicon-terms',
        id,
        locale: 'en',
        data: { _status: 'published' } as never,
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow(/only save draft content/)

    await expect(
      payload.delete({ collection: 'lexicon-terms', id, overrideAccess: false, req }),
    ).rejects.toThrow()

    const restReq = await agent()
    restReq.payloadAPI = 'REST'
    await expect(
      payload.update({
        collection: 'lexicon-terms',
        id,
        locale: 'en',
        draft: true,
        data: { definition: 'Over REST.' } as never,
        overrideAccess: false,
        req: restReq,
      }),
    ).rejects.toThrow()
    await expect(
      payload.update({
        collection: 'hubs',
        where: { key: { equals: 'lexicon' } },
        data: { intro: 'Over REST.' } as never,
        overrideAccess: false,
        req: restReq,
      }),
    ).rejects.toThrow(/not allowed/)
  }, 120_000)

  it('advertises only locales that are published, not ones that merely have a slug', async () => {
    const req = await agent()
    // German first, so the German slug lands on the main row at create time —
    // the state the old hreflang code read as "German exists".
    const result = await upsert(
      {
        collection: 'lexicon-terms',
        idempotencyKey: `epsilon-${run}`,
        itemsJson: JSON.stringify([
          {
            ...term('epsilon'),
            locales: { de: term('epsilon').locales.de, en: term('epsilon').locales.en },
          },
        ]),
      },
      req,
    )
    const { id } = result.items[0]
    termIDs.push(id)

    await payload.update({
      collection: 'lexicon-terms',
      id,
      locale: 'en',
      data: { _status: 'published' } as never,
      publishSpecificLocale: 'en',
      overrideAccess: true,
      context: { disableRevalidate: true },
    })

    const raw = await payload.findByID({
      collection: 'lexicon-terms',
      id,
      locale: 'all',
      depth: 0,
      overrideAccess: true,
    })
    expect((raw.slug as unknown as Record<string, string>).de).toBe(`epsilon-de-${run}`)

    expect(await getHubDocumentSlugsByLocale(payload, 'lexicon-terms', id)).toEqual({
      en: `epsilon-${run}`,
    })
  }, 120_000)
})
