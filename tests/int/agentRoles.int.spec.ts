import { describe, expect, it } from 'vitest'

import {
  adminOnly,
  adminOrAgentTrash,
  adminOrSelf,
  contentEditor,
  contentEditorOrPublished,
  enforceAgentDraftOperation,
  enforceAgentMediaOperation,
} from '@/access/roles'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { Posts } from '@/collections/Posts'
import { Products } from '@/collections/Products'
import { Users } from '@/collections/Users'

const accessArgs = (role?: string, payloadAPI?: string) =>
  ({
    req: {
      payloadAPI,
      user: role ? { role } : null,
    },
  }) as never

describe('agent editor permissions', () => {
  it('keeps administration restricted to admins', async () => {
    expect(await adminOnly(accessArgs('admin'))).toBe(true)
    expect(await adminOnly(accessArgs('agent-editor'))).toBe(false)
    expect(await adminOnly(accessArgs())).toBe(false)

    expect(await contentEditor(accessArgs('admin'))).toBe(true)
    expect(await contentEditor(accessArgs('agent-editor'))).toBe(false)
    expect(await contentEditor(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await contentEditor(accessArgs('unknown'))).toBe(false)

    expect(await Users.access?.update?.(accessArgs('agent-editor'))).toBe(false)
    expect(await Products.access?.update?.(accessArgs('agent-editor'))).toBe(false)
    expect(await Media.access?.delete?.(accessArgs('agent-editor'))).toBe(false)

    const self = { collection: 'users', id: 42, role: 'agent-editor' }
    expect(await adminOrSelf({ req: { user: self } } as never)).toEqual({
      id: { equals: 42 },
    })
    expect(
      await adminOrSelf({ req: { user: { collection: 'payload-mcp-api-keys', id: 42 } } } as never),
    ).toBe(false)
  })

  it('lets agent editors work only through MCP without granting permanent delete access', async () => {
    expect(await Pages.access?.create?.(accessArgs('agent-editor', 'REST'))).toBe(false)
    expect(await Pages.access?.update?.(accessArgs('agent-editor', 'GraphQL'))).toBe(false)
    expect(await Pages.access?.create?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await Pages.access?.update?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await Pages.access?.delete?.(accessArgs('agent-editor'))).toBe(false)

    expect(await Posts.access?.create?.(accessArgs('agent-editor', 'REST'))).toBe(false)
    expect(await Posts.access?.update?.(accessArgs('agent-editor', 'GraphQL'))).toBe(false)
    expect(await Posts.access?.create?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await Posts.access?.update?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await Posts.access?.delete?.(accessArgs('agent-editor'))).toBe(false)

    expect(await Media.access?.create?.(accessArgs('agent-editor', 'REST'))).toBe(false)
    expect(await Media.access?.update?.(accessArgs('agent-editor', 'GraphQL'))).toBe(false)
    expect(await Media.access?.create?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await Media.access?.update?.(accessArgs('agent-editor', 'MCP'))).toBe(true)
  })

  it('shows drafts only to known content editors', async () => {
    expect(await contentEditorOrPublished(accessArgs('agent-editor', 'MCP'))).toBe(true)
    expect(await contentEditorOrPublished(accessArgs('agent-editor', 'REST'))).toEqual({
      _status: { equals: 'published' },
    })
    expect(await contentEditorOrPublished(accessArgs('unknown'))).toEqual({
      _status: { equals: 'published' },
    })
    expect(await contentEditorOrPublished(accessArgs())).toEqual({
      _status: { equals: 'published' },
    })
  })

  it('rejects every agent write that could touch live content', () => {
    const run = (
      args: unknown,
      operation: string,
      role = 'agent-editor',
      request?: Record<string, unknown>,
    ) =>
      enforceAgentDraftOperation({
        args,
        operation,
        req: { context: {}, user: { role }, ...request },
      } as never)

    expect(() => run({ data: {}, draft: false }, 'create')).toThrow(/only save draft/i)
    expect(() => run({ data: { _status: 'published' }, draft: true }, 'update')).toThrow(
      /only save draft/i,
    )
    expect(() =>
      run({ data: { _status: { de: 'draft', en: 'published' } }, draft: true }, 'update'),
    ).toThrow(/only save draft/i)
    expect(() => run({}, 'restoreVersion')).toThrow(/cannot restore/i)
    expect(() => run({}, 'delete')).toThrow(/cannot permanently delete/i)
    expect(() => run({ data: { deletedAt: null }, draft: true }, 'update')).toThrow(
      /through MCP tools/i,
    )

    expect(() => run({ data: { _status: 'draft' }, draft: true }, 'create')).not.toThrow()
    expect(() => run({ data: { _status: 'published' } }, 'update', 'admin')).not.toThrow()
  })

  it('allows only the narrow MCP trash and restore updates', () => {
    const runPage = (data: unknown, action: 'restore' | 'trash', payloadAPI = 'MCP') =>
      enforceAgentDraftOperation({
        args: { data },
        operation: 'update',
        req: {
          context: { agentTrashAction: action },
          payloadAPI,
          user: { role: 'agent-editor' },
        },
      } as never)
    const runMedia = (data: unknown, action: 'restore' | 'trash', payloadAPI = 'MCP') =>
      enforceAgentMediaOperation({
        args: { data },
        operation: 'update',
        req: {
          context: { agentTrashAction: action },
          payloadAPI,
          user: { role: 'agent-editor' },
        },
      } as never)

    expect(() => runPage({ deletedAt: '2026-08-27T10:00:00.000Z' }, 'trash')).not.toThrow()
    expect(() => runPage({ deletedAt: null }, 'restore')).not.toThrow()
    expect(() => runMedia({ deletedAt: '2026-08-27T10:00:00.000Z' }, 'trash')).not.toThrow()
    expect(() => runMedia({ deletedAt: null }, 'restore')).not.toThrow()

    expect(() => runPage({ deletedAt: null }, 'restore', 'REST')).toThrow(/through MCP tools/i)
    expect(() => runPage({ deletedAt: null, title: 'Changed' }, 'restore')).toThrow(
      /through MCP tools/i,
    )
    expect(() => runMedia({ deletedAt: 'not-null' }, 'restore')).toThrow(/through MCP tools/i)

    const trashAccess = (data: unknown, action: unknown = 'trash', payloadAPI = 'MCP') =>
      adminOrAgentTrash({
        data,
        req: {
          context: { agentTrashAction: action },
          payloadAPI,
          user: { role: 'agent-editor' },
        },
      } as never)

    expect(trashAccess({ deletedAt: '2026-08-27T10:00:00.000Z' })).toBe(true)
    expect(trashAccess(undefined)).toBe(false)
    expect(trashAccess({ deletedAt: null }, 'restore')).toBe(false)
    expect(trashAccess({ deletedAt: '2026-08-27T10:00:00.000Z', title: 'Changed' })).toBe(false)
    expect(trashAccess({ deletedAt: '2026-08-27T10:00:00.000Z' }, 'trash', 'REST')).toBe(false)
  })

  it('keeps recovery and Payload performance guardrails enabled', () => {
    expect(Pages.trash).toBe(true)
    expect(Posts.trash).toBe(true)
    expect(Media.trash).toBe(true)
    expect(Pages.admin?.enableListViewSelectAPI).toBe(true)
    expect(Posts.admin?.enableListViewSelectAPI).toBe(true)
    expect(Pages.versions).toMatchObject({ maxPerDoc: 10 })
    expect(Posts.versions).toMatchObject({ drafts: { autosave: { interval: 5000 } } })
  })

  it('keeps version-history endpoints admin-only', async () => {
    for (const collection of [Pages, Posts, Products]) {
      expect(await collection.access?.readVersions?.(accessArgs('admin'))).toBe(true)
      expect(await collection.access?.readVersions?.(accessArgs('agent-editor', 'REST'))).toBe(
        false,
      )
      expect(await collection.access?.readVersions?.(accessArgs('agent-editor', 'MCP'))).toBe(false)
    }
  })
})
