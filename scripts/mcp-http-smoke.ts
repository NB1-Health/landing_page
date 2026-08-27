import { randomBytes } from 'node:crypto'

import 'dotenv/config'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const endpoint = new URL(process.env.MCP_SMOKE_URL ?? 'http://127.0.0.1:3000/cms/api/mcp')
  const apiKey = randomBytes(32).toString('hex')
  const payload = await getPayload({ config })
  let client: Client | undefined
  let keyID: number | undefined
  let mediaID: number | undefined
  let postID: number | undefined
  let report: Record<string, unknown> | undefined
  let userID: number | undefined

  const readToolJSON = (value: unknown): Record<string, unknown> => {
    const result = value as { content?: unknown; isError?: unknown }
    const blocks = Array.isArray(result.content) ? result.content : []
    const text = blocks.find(
      (block) =>
        block &&
        typeof block === 'object' &&
        (block as Record<string, unknown>).type === 'text' &&
        typeof (block as Record<string, unknown>).text === 'string',
    )
    const textValue = (text as Record<string, unknown> | undefined)?.text
    if (result.isError) {
      const detail = typeof textValue === 'string' ? `: ${textValue.slice(0, 500)}` : ''
      throw new Error(`MCP tool returned an error response${detail}`)
    }
    if (typeof textValue !== 'string') throw new Error('MCP tool returned no JSON text block.')
    return JSON.parse(textValue) as Record<string, unknown>
  }

  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `codex-mcp-smoke-${Date.now()}@example.invalid`,
        name: 'Local MCP smoke agent',
        password: randomBytes(24).toString('hex'),
        role: 'agent-editor',
      },
    })
    userID = user.id

    const key = await payload.create({
      collection: 'payload-mcp-api-keys',
      data: {
        apiKey,
        enableAPIKey: true,
        enabled: true,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        label: 'Local MCP HTTP smoke test',
        'payload-mcp-tool': {
          commitBulkDrafts: true,
          createPostDraft: true,
          findContent: true,
          getContent: true,
          planBulkDrafts: true,
          restoreContent: true,
          trashContent: true,
          uploadMedia: true,
          updatePostDraft: true,
        },
        user: user.id,
      },
    })
    keyID = key.id

    const genericAuth = await payload.auth({
      headers: new Headers({
        Authorization: `payload-mcp-api-keys API-Key ${apiKey}`,
      }),
    })
    if (genericAuth.user !== null) {
      throw new Error('MCP key unexpectedly authenticated against the generic Payload API.')
    }

    const invalidResponse = await fetch(endpoint, {
      body: JSON.stringify({
        id: 1,
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {},
          clientInfo: { name: 'invalid-key-check', version: '1.0.0' },
          protocolVersion: '2025-03-26',
        },
      }),
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: 'Bearer deliberately-invalid',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    if (invalidResponse.status !== 401) {
      throw new Error(`Invalid-key request returned ${invalidResponse.status}, expected 401.`)
    }

    client = new Client({ name: 'nb1-local-smoke', version: '1.0.0' })
    const transport = new StreamableHTTPClientTransport(endpoint, {
      requestInit: { headers: { Authorization: `Bearer ${apiKey}` } },
    })
    await client.connect(transport)

    const tools = await client.listTools()
    const toolNames = tools.tools.map(({ name }) => name).sort()
    const expectedTools = [
      'commit_bulk_drafts',
      'create_post_draft',
      'find_content',
      'get_content',
      'plan_bulk_drafts',
      'restore_content',
      'trash_content',
      'update_post_draft',
      'upload_media',
    ]
    if (JSON.stringify(toolNames) !== JSON.stringify(expectedTools)) {
      throw new Error(`Unexpected enabled tool surface: ${toolNames.join(', ')}`)
    }

    const result = await client.callTool({
      arguments: { collection: 'pages', limit: 1, locale: 'en' },
      name: 'find_content',
    })
    if (result.isError) throw new Error('find_content returned an MCP tool error.')

    const unique = Date.now().toString(36)
    const uploaded = readToolJSON(
      await client.callTool({
        arguments: {
          alt: 'Local MCP smoke-test pixel',
          base64:
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          filename: `local-mcp-smoke-${unique}.png`,
          idempotencyKey: `media-${unique}`,
          locale: 'en',
          mimeType: 'image/png',
        },
        name: 'upload_media',
      }),
    )
    if (typeof uploaded.id !== 'number' || uploaded.mimeType !== 'image/png') {
      throw new Error('upload_media returned an invalid media record.')
    }
    mediaID = uploaded.id

    const createArguments = {
      contentHtml: '<h2>Local MCP smoke heading</h2><p>Validated draft body.</p>',
      idempotencyKey: `create-${unique}`,
      introHtml: '<p>Validated local MCP draft introduction.</p>',
      locale: 'en',
      metaDescription: 'Local MCP smoke-test draft. It is deleted after verification.',
      metaTitle: 'Local MCP smoke-test draft',
      slug: `local-mcp-smoke-${unique}`,
      title: 'Local MCP smoke-test draft',
    }
    const created = readToolJSON(
      await client.callTool({ arguments: createArguments, name: 'create_post_draft' }),
    )
    if (typeof created.id !== 'number' || typeof created.updatedAt !== 'string') {
      throw new Error('create_post_draft returned an invalid compact document.')
    }
    postID = created.id

    const replay = readToolJSON(
      await client.callTool({ arguments: createArguments, name: 'create_post_draft' }),
    )
    if (replay.id !== created.id) throw new Error('Idempotent draft replay created another Post.')

    const updated = readToolJSON(
      await client.callTool({
        arguments: {
          expectedUpdatedAt: created.updatedAt,
          id: postID,
          idempotencyKey: `update-${unique}`,
          locale: 'en',
          patch: { title: 'Updated local MCP smoke-test draft' },
        },
        name: 'update_post_draft',
      }),
    )
    if (updated.id !== created.id || typeof updated.updatedAt !== 'string') {
      throw new Error('update_post_draft returned an invalid compact document.')
    }

    const plan = readToolJSON(
      await client.callTool({
        arguments: {
          idempotencyKey: `plan-${unique}`,
          itemsJson: JSON.stringify([
            {
              expectedUpdatedAt: updated.updatedAt,
              id: postID,
              patch: { title: 'Bulk-updated local MCP smoke-test draft' },
              type: 'post-update',
            },
          ]),
          locale: 'en',
        },
        name: 'plan_bulk_drafts',
      }),
    )
    if (typeof plan.planID !== 'number') {
      throw new Error('plan_bulk_drafts returned no numeric plan ID.')
    }
    await payload.update({
      collection: 'agent-operations',
      data: { approvalStatus: 'approved' },
      id: plan.planID,
      overrideAccess: true,
    })
    const committed = readToolJSON(
      await client.callTool({
        arguments: {
          idempotencyKey: `commit-${unique}`,
          planID: plan.planID,
        },
        name: 'commit_bulk_drafts',
      }),
    )
    const committedResults = Array.isArray(committed.results) ? committed.results : []
    const committedItem = committedResults[0] as
      | { result?: { id?: unknown; updatedAt?: unknown } }
      | undefined
    if (
      committed.count !== 1 ||
      committedItem?.result?.id !== postID ||
      typeof committedItem.result.updatedAt !== 'string'
    ) {
      throw new Error('commit_bulk_drafts returned an invalid result.')
    }

    const draft = await payload.findByID({
      collection: 'posts',
      draft: true,
      id: postID,
      locale: 'en',
      overrideAccess: true,
    })
    if (draft._status !== 'draft') throw new Error('MCP-created Post was not a draft.')

    const trashed = readToolJSON(
      await client.callTool({
        arguments: {
          collection: 'posts',
          expectedUpdatedAt: committedItem.result.updatedAt,
          id: postID,
          idempotencyKey: `trash-${unique}`,
          locale: 'en',
        },
        name: 'trash_content',
      }),
    )
    if (typeof trashed.updatedAt !== 'string') {
      throw new Error('trash_content returned no updatedAt value.')
    }

    readToolJSON(
      await client.callTool({
        arguments: {
          collection: 'posts',
          expectedUpdatedAt: trashed.updatedAt,
          id: postID,
          idempotencyKey: `restore-${unique}`,
          locale: 'en',
        },
        name: 'restore_content',
      }),
    )
    const restored = await payload.findByID({
      collection: 'posts',
      draft: true,
      id: postID,
      locale: 'en',
      overrideAccess: true,
    })
    if (restored.deletedAt) throw new Error('Restored Post still has deletedAt set.')
    if (restored._status !== 'draft') throw new Error('Restored Post is no longer a draft.')

    report = {
      draftMutation: 'ok',
      draftUpdate: 'ok',
      bulkApprovalCommit: 'ok',
      genericPayloadAuth: 'rejected',
      idempotentReplay: 'ok',
      invalidKeyStatus: invalidResponse.status,
      listedTools: toolNames,
      mediaUpload: 'ok',
      readToolCall: 'ok',
      trashRestore: 'ok',
    }
  } finally {
    await client?.close().catch(() => undefined)
    if (keyID !== undefined) {
      await payload.delete({ collection: 'payload-mcp-api-keys', id: keyID }).catch(() => undefined)
    }
    if (postID !== undefined) {
      await payload
        .delete({ collection: 'posts', id: postID, overrideAccess: true, trash: true })
        .catch(() => undefined)
    }
    if (mediaID !== undefined) {
      await payload
        .delete({ collection: 'media', id: mediaID, overrideAccess: true, trash: true })
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
      await payload.delete({ collection: 'users', id: userID }).catch(() => undefined)
    }
    await payload.destroy()
  }

  console.log(JSON.stringify(report))
}

void main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : 'Unknown MCP smoke-test failure.')
    process.exit(1)
  },
)
