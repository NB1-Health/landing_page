import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { parsePagePatch, uploadMedia } from '@/mcp/contentOperations'

async function loadOptions(enabled: string) {
  vi.stubEnv('MCP_ENABLED', enabled)
  vi.resetModules()
  return (await import('@/plugins/agentMcp')).agentMcpOptions
}

function testRequest(payload: Record<string, unknown>) {
  return {
    context: {},
    payload,
    payloadAPI: 'MCP',
    user: { id: 42, role: 'agent-editor' },
  } as unknown as PayloadRequest
}

function errorStatus(run: () => unknown): number | undefined {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(APIError)
    return (error as APIError).status
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('agent MCP configuration', () => {
  it('is opt-in and exposes only the constrained custom tool surface', async () => {
    expect((await loadOptions('')).disabled).toBe(true)

    const options = await loadOptions('true')
    expect(options.disabled).toBe(false)
    expect(options.collections).toEqual({})
    expect(options.globals).toEqual({})

    const names = options.mcp?.tools?.map(({ name }) => name) ?? []
    expect(names).toEqual(
      expect.arrayContaining([
        'find_content',
        'get_content',
        'create_post_draft',
        'update_post_draft',
        'clone_page_draft',
        'patch_page_draft',
        'upload_media',
        'trash_content',
        'restore_content',
      ]),
    )
    expect(names.some((name) => /delete|publish/i.test(name))).toBe(false)
  })

  it('makes API-key administration admin-only and custom tools opt-in per key', async () => {
    const options = await loadOptions('true')
    const source = {
      slug: 'payload-mcp-api-keys',
      fields: [
        {
          type: 'collapsible',
          label: 'Tools',
          fields: [
            {
              name: 'payload-mcp-tool',
              type: 'group',
              fields: [
                { name: 'findContent', type: 'checkbox', defaultValue: true },
                { name: 'createPostDraft', type: 'checkbox', defaultValue: true },
              ],
            },
          ],
        },
      ],
    } as CollectionConfig
    const collection = options.overrideApiKeyCollection?.(source)

    expect(collection).toBeDefined()
    const access = collection?.access as Record<
      string,
      (args: { req: { user?: unknown } }) => boolean
    >
    for (const rule of ['admin', 'create', 'delete', 'read', 'update']) {
      expect(access[rule]?.({ req: { user: { role: 'admin' } } })).toBe(true)
      expect(access[rule]?.({ req: { user: { role: 'agent-editor' } } })).toBe(false)
      expect(access[rule]?.({ req: {} })).toBe(false)
    }

    const collapsible = collection?.fields.find((field) => field.type === 'collapsible')
    const toolGroup =
      collapsible && 'fields' in collapsible
        ? collapsible.fields.find((field) => 'name' in field && field.name === 'payload-mcp-tool')
        : undefined
    const toolFields = toolGroup && 'fields' in toolGroup ? toolGroup.fields : []
    expect(toolFields).toHaveLength(2)
    expect(
      toolFields.every((field) => field.type !== 'checkbox' || field.defaultValue === false),
    ).toBe(true)
  })

  it('attaches a valid key owner and rejects disabled, expired, or non-editor keys', async () => {
    const options = await loadOptions('true')
    const overrideAuth = options.overrideAuth
    expect(overrideAuth).toBeTypeOf('function')

    const user = { id: 42, role: 'agent-editor' }
    const validSettings = {
      enabled: true,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user,
    }
    const req = { user: null } as unknown as PayloadRequest
    const settings = await overrideAuth?.(req, vi.fn().mockResolvedValue(validSettings) as never)
    expect(settings).toBe(validSettings)
    expect(req.user).toBe(user)

    const invalidSettings = [
      { ...validSettings, enabled: false },
      { ...validSettings, expiresAt: new Date(Date.now() - 60_000).toISOString() },
      { ...validSettings, user: { id: 43, role: 'admin' } },
      { ...validSettings, user: { id: 43, role: 'viewer' } },
    ]
    for (const invalid of invalidSettings) {
      await expect(
        overrideAuth?.(
          { user: null } as unknown as PayloadRequest,
          vi.fn().mockResolvedValue(invalid) as never,
        ),
      ).rejects.toMatchObject({ status: 401 })
    }
  })
})

describe('agent MCP input boundaries', () => {
  it('accepts only the Page patch root allowlist', () => {
    const patch = {
      meta: { title: 'SEO title' },
      slug: 'new-page',
      title: 'New page',
    }
    expect(parsePagePatch(JSON.stringify(patch))).toEqual(patch)

    expect(errorStatus(() => parsePagePatch('{"_status":"published"}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"publishedAt":"2026-01-01"}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"layout":[]}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"hero":{"type":"none"}}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"unknown":true}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"title":{"raw":"no"}}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"slug":"Not Safe"}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"meta":{}}'))).toBe(400)
    expect(errorStatus(() => parsePagePatch('{"meta":{"robots":"noindex,nofollow"}}'))).toBe(400)
    expect(
      errorStatus(() => parsePagePatch('{"meta":{"canonicalURL":"https://example.com"}}')),
    ).toBe(400)
    expect(errorStatus(() => parsePagePatch(JSON.stringify({ title: 'x'.repeat(250_001) })))).toBe(
      400,
    )
  })

  it('uploads matching base64 image bytes with access control enabled', async () => {
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    )
    const create = vi.fn().mockResolvedValue({
      filename: 'pixel.png',
      filesize: pngBytes.length,
      id: 12,
      mimeType: 'image/png',
      updatedAt: '2026-08-27T00:00:00.000Z',
    })
    const req = testRequest({ create })

    await expect(
      uploadMedia({
        alt: 'Pixel',
        base64: pngBytes.toString('base64'),
        filename: 'pixel.png',
        locale: 'en',
        mimeType: 'image/png',
        req,
      }),
    ).resolves.toEqual({
      filename: 'pixel.png',
      id: 12,
      mimeType: 'image/png',
      size: pngBytes.length,
      updatedAt: '2026-08-27T00:00:00.000Z',
    })
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'media',
        data: { alt: 'Pixel' },
        file: expect.objectContaining({
          data: pngBytes,
          mimetype: 'image/png',
          name: 'pixel.png',
          size: pngBytes.length,
        }),
        locale: 'en',
        overrideAccess: false,
        req,
      }),
    )
  })

  it('rejects malformed base64 and mismatched image signatures before upload', async () => {
    const create = vi.fn()
    const req = testRequest({ create })
    const input = {
      alt: 'Pixel',
      filename: 'pixel.png',
      locale: 'en' as const,
      mimeType: 'image/png' as const,
      req,
    }

    await expect(uploadMedia({ ...input, base64: '!!!!' })).rejects.toMatchObject({ status: 400 })
    await expect(
      uploadMedia({ ...input, base64: Buffer.from('GIF89a').toString('base64') }),
    ).rejects.toMatchObject({ status: 400 })
    expect(create).not.toHaveBeenCalled()
  })
})
