import { APIError, type PayloadRequest } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { parsePagePatch, patchPageDraft } from '@/mcp/contentOperations'

const heroEdit = {
  blockID: 'hero-1',
  blockType: 'heroBanner',
  patch: { heading: 'New hero copy' },
}

function expectBadRequest(value: unknown) {
  try {
    parsePagePatch(JSON.stringify(value))
    throw new Error('Expected Page patch to be rejected.')
  } catch (error) {
    expect(error).toBeInstanceOf(APIError)
    expect((error as APIError).status).toBe(400)
  }
}

function richText(text: string) {
  return {
    root: {
      children: [
        {
          children: text
            ? [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text,
                  type: 'text',
                  version: 1,
                },
              ]
            : [],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function requestFor(current: Record<string, unknown>) {
  const findByID = vi
    .fn()
    .mockResolvedValueOnce(current)
    .mockResolvedValueOnce({ ...current, updatedAt: '2026-08-27T12:01:00.000Z' })
  const update = vi.fn().mockResolvedValue({ id: current.id })
  const execute = vi.fn().mockResolvedValue(undefined)
  const req = {
    context: {},
    payload: {
      db: {
        execute,
        sessions: { 'outer-transaction': { db: {} } },
      },
      findByID,
      update,
    },
    payloadAPI: 'MCP',
    transactionID: 'outer-transaction',
    user: { id: 42, role: 'agent-editor' },
  } as unknown as PayloadRequest

  return { execute, findByID, req, update }
}

describe('Page copy edit input', () => {
  it('accepts only the bounded copy allowlist for existing landing blocks', () => {
    // heroBanner is the whole allowlist now — the other nine blocks this case
    // used to cover were deleted once verified unused on staging and production.
    // What is still worth asserting is that EVERY field the allowlist declares
    // is accepted and round-trips unchanged: the breadth moved from block types
    // to fields rather than disappearing.
    const copyEdits = [
      heroEdit,
      { blockID: 'hero-2', blockType: 'heroBanner', patch: { ctaButtonText: 'Reserve' } },
      { blockID: 'hero-3', blockType: 'heroBanner', patch: { description: 'Standfirst copy' } },
      { blockID: 'hero-4', blockType: 'heroBanner', patch: { pillText: 'New pill' } },
    ]

    expect(parsePagePatch(JSON.stringify({ copyEdits }))).toEqual({ copyEdits })
  })

  it('strictly rejects structural, unsafe, ambiguous, and unbounded edits', () => {
    const unsafePatches = [
      { copyEdits: [] },
      {
        copyEdits: Array.from({ length: 21 }, (_, index) => ({
          ...heroEdit,
          blockID: `hero-${index}`,
        })),
      },
      { copyEdits: [heroEdit, heroEdit] },
      { copyEdits: [{ ...heroEdit, extra: true }] },
      { copyEdits: [{ ...heroEdit, blockID: 1 }] },
      { copyEdits: [{ ...heroEdit, blockType: 'checkoutForm' }] },
      { copyEdits: [{ ...heroEdit, patch: {} }] },
      { copyEdits: [{ ...heroEdit, patch: { heading: { root: {} } } }] },
      { copyEdits: [{ ...heroEdit, patch: { variants: [] } }] },
      { copyEdits: [{ ...heroEdit, patch: { backgroundImage: 12 } }] },
      { copyEdits: [{ ...heroEdit, patch: { id: 'replacement' } }] },
      { copyEdits: [{ ...heroEdit, patch: { order: 0 } }] },
      // a field the allowlist does not declare, on a block it DOES declare —
      // deliberately distinct from the unknown-blockType case above
      { copyEdits: [{ ...heroEdit, patch: { buttonHref: 'https://example.com' } }] },
      { copyEdits: [{ ...heroEdit, patch: { heading: 'x'.repeat(301) } }] },
      { copyEdits: [{ ...heroEdit, patch: { heading: '   ' } }] },
    ]

    unsafePatches.forEach(expectBadRequest)
  })
})

describe('Page copy edit application', () => {
  it('merges constrained SEO copy without dropping existing media metadata', async () => {
    const current = {
      id: 10,
      meta: { description: 'Old description', image: 91, robots: 'index,follow' },
      updatedAt: '2026-08-27T12:00:00.000Z',
    }
    const { req, update } = requestFor(current)

    await patchPageDraft({
      expectedUpdatedAt: current.updatedAt,
      id: current.id,
      locale: 'en',
      patch: parsePagePatch(JSON.stringify({ meta: { title: 'New SEO title' } })),
      req,
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          _status: 'draft',
          meta: {
            description: 'Old description',
            image: 91,
            robots: 'index,follow',
            title: 'New SEO title',
          },
        },
      }),
    )
  })

  it('changes only allowed leaves and builds plain canonical Lexical content', async () => {
    const current = {
      id: 10,
      layout: [
        {
          backgroundImage: 91,
          backgroundType: 'image',
          blockType: 'heroBanner',
          ctaButtonText: 'Old CTA',
          form: 7,
          heading: { existing: 'rich text' },
          id: 'hero-1',
          variants: [{ heading: { existing: 'variant copy' }, id: 'variant-1' }],
        },
        {
          blockType: 'heroBanner',
          ctaButtonText: 'Old second CTA',
          id: 'hero-2',
          variants: [{ ctaButtonText: 'Old variant CTA', id: 'variant-2' }],
        },
        {
          blockType: 'checkoutForm',
          form: 8,
          id: 'checkout-1',
        },
      ],
      updatedAt: '2026-08-27T12:00:00.000Z',
    }
    const originalLayout = structuredClone(current.layout)
    const { execute, req, update } = requestFor(current)
    const patch = parsePagePatch(
      JSON.stringify({
        copyEdits: [
          {
            blockID: 'hero-1',
            blockType: 'heroBanner',
            patch: {
              ctaButtonText: 'Reserve now',
              heading: '<script>alert(1)</script>',
            },
          },
          {
            blockID: 'hero-2',
            blockType: 'heroBanner',
            patch: { ctaButtonText: 'New second CTA' },
          },
        ],
      }),
    )

    await patchPageDraft({
      expectedUpdatedAt: current.updatedAt,
      id: current.id,
      locale: 'en',
      patch,
      req,
    })

    expect(update).toHaveBeenCalledOnce()
    const updateArgs = update.mock.calls[0]?.[0] as { data: Record<string, unknown> }
    expect(updateArgs.data).toEqual({
      _status: 'draft',
      layout: [
        {
          ...originalLayout[0],
          ctaButtonText: 'Reserve now',
          heading: richText('<script>alert(1)</script>'),
        },
        { ...originalLayout[1], ctaButtonText: 'New second CTA' },
        originalLayout[2],
      ],
    })
    expect(updateArgs.data).not.toHaveProperty('copyEdits')
    expect(current.layout).toEqual(originalLayout)
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ raw: expect.stringMatching(/pages.*FOR UPDATE/) }),
    )
  })

  it('rejects a stale block ID or blockType without writing', async () => {
    const current = {
      id: 10,
      layout: [{ blockType: 'twoModels', id: 'two-1' }],
      updatedAt: '2026-08-27T12:00:00.000Z',
    }

    for (const edit of [
      { ...heroEdit, blockID: 'missing' },
      { ...heroEdit, blockID: 'two-1' },
    ]) {
      const { req, update } = requestFor(current)
      await expect(
        patchPageDraft({
          expectedUpdatedAt: current.updatedAt,
          id: current.id,
          locale: 'en',
          patch: parsePagePatch(JSON.stringify({ copyEdits: [edit] })),
          req,
        }),
      ).rejects.toMatchObject({ status: 409 })
      expect(update).not.toHaveBeenCalled()
    }
  })
})
