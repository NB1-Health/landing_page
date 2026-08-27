import { APIError, type PayloadRequest } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { hashStableJSON, runIdempotentMutation, stableStringify } from '@/mcp/runIdempotentMutation'

const makeRequest = (payload: Record<string, unknown>) =>
  ({ payload, user: { id: 42 } }) as unknown as PayloadRequest

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('runIdempotentMutation', () => {
  it('replays a succeeded result for the same stable request hash', async () => {
    const args = { nested: { b: 2, a: 1 } }
    const payload = {
      count: vi.fn(),
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 7,
            requestHash: hashStableJSON(args),
            result: { id: 99 },
            status: 'succeeded',
          },
        ],
      }),
      update: vi.fn(),
    }
    const run = vi.fn()
    const req = makeRequest(payload)

    await expect(
      runIdempotentMutation({ args, idempotencyKey: 'same-key', req, run, tool: 'create_post' }),
    ).resolves.toEqual({ id: 99 })
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }))
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: true, req }),
    )
    expect(payload.count).not.toHaveBeenCalled()
    expect(run).not.toHaveBeenCalled()
  })

  it('rejects reuse of a key with a different request hash', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 7,
            requestHash: hashStableJSON({ contentHtml: '<p>old body</p>', title: 'same' }),
            status: 'succeeded',
          },
        ],
      }),
    }

    const error = await runIdempotentMutation({
      args: { contentHtml: '<p>new body</p>', title: 'same' },
      idempotencyKey: 'reused-key',
      req: makeRequest(payload),
      run: vi.fn(),
      tool: 'create_post',
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).status).toBe(409)
  })

  it('enforces the configured rolling per-actor quota', async () => {
    vi.stubEnv('MCP_WRITES_PER_MINUTE', '2')
    const payload = {
      count: vi.fn().mockResolvedValue({ totalDocs: 2 }),
      create: vi.fn(),
      find: vi.fn().mockResolvedValue({ docs: [] }),
    }
    const run = vi.fn()
    const req = makeRequest(payload)

    const error = await runIdempotentMutation({
      args: {},
      idempotencyKey: 'limited-key',
      req,
      run,
      tool: 'trash_content',
    }).catch((caught) => caught)

    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).status).toBe(429)
    expect(payload.count).toHaveBeenCalledWith(
      expect.objectContaining({
        overrideAccess: true,
        req,
        where: expect.objectContaining({ actor: { equals: 42 } }),
      }),
    )
    expect(payload.create).not.toHaveBeenCalled()
    expect(run).not.toHaveBeenCalled()
  })

  it('marks a failed operation without persisting prompt text and rethrows the cause', async () => {
    const cause = new Error('Could not process TOP SECRET PROMPT')
    const payload = {
      count: vi.fn().mockResolvedValue({ totalDocs: 0 }),
      create: vi.fn().mockResolvedValue({ id: 8, requestHash: 'hash', status: 'running' }),
      find: vi.fn().mockResolvedValue({ docs: [] }),
      update: vi.fn().mockResolvedValue({ id: 8, requestHash: 'hash', status: 'failed' }),
    }
    const req = makeRequest(payload)

    const error = await runIdempotentMutation({
      args: { prompt: 'TOP SECRET PROMPT' },
      idempotencyKey: 'failing-key',
      req,
      run: async () => {
        throw cause
      },
      tool: 'patch_page',
    }).catch((caught) => caught)

    expect(error).toBe(cause)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          error: 'Error: Could not process [REDACTED]',
          status: 'failed',
        }),
        id: 8,
        overrideAccess: true,
        req,
      }),
    )
    const failure = payload.update.mock.calls[0]?.[0]?.data.error
    expect(failure).not.toContain('TOP SECRET PROMPT')
    expect(failure.length).toBeLessThanOrEqual(500)
  })
})
