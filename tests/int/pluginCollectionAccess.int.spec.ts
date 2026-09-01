import { beforeAll, describe, expect, it } from 'vitest'

import configPromise from '@/payload.config'

type Operation = 'admin' | 'create' | 'delete' | 'read' | 'update'

const collections = new Map<string, Awaited<typeof configPromise>['collections'][number]>()
const globals = new Map<string, Awaited<typeof configPromise>['globals'][number]>()

beforeAll(async () => {
  const config = await configPromise
  for (const collection of config.collections) collections.set(collection.slug, collection)
  for (const global of config.globals) globals.set(global.slug, global)
})

async function can(slug: string, operation: Operation, role?: string) {
  const access = collections.get(slug)?.access?.[operation]
  if (!access) throw new Error(`Missing ${operation} access for ${slug}`)

  return access({ req: { user: role ? { role } : null } } as never)
}

function isHiddenForRole(
  entity: { admin?: { hidden?: unknown } } | undefined,
  role: string,
): boolean {
  const hidden = entity?.admin?.hidden
  if (typeof hidden === 'function') return hidden({ user: { role } })
  return hidden === true
}

async function visibleCollectionSlugs(role: string): Promise<string[]> {
  const visible: string[] = []
  for (const [slug, collection] of collections) {
    if (isHiddenForRole(collection, role)) continue
    const read = collection.access?.read
    if (!read) continue
    const result = await read({
      req: {
        context: {},
        headers: new Headers(),
        payloadAPI: 'REST',
        user: { collection: 'users', id: 1, role },
      },
    } as never)
    if (result !== false) visible.push(slug)
  }
  return visible.sort()
}

describe('plugin-generated collection access', () => {
  it('shows editors only the three content areas they manage', async () => {
    for (const slug of ['pages', 'posts', 'media']) {
      expect(isHiddenForRole(collections.get(slug), 'editor')).toBe(false)
    }

    for (const slug of [
      'categories',
      'authors',
      'products',
      'headers',
      'footers',
      'redirects',
      'forms',
      'search',
      'users',
    ]) {
      expect(isHiddenForRole(collections.get(slug), 'editor'), slug).toBe(true)
      expect(isHiddenForRole(collections.get(slug), 'admin'), slug).toBe(false)
    }

    for (const slug of ['navigation', 'site-settings', 'faq']) {
      expect(isHiddenForRole(globals.get(slug), 'editor'), slug).toBe(true)
      expect(isHiddenForRole(globals.get(slug), 'admin'), slug).toBe(false)
    }

    for (const slug of ['categories', 'authors']) {
      expect(await can(slug, 'read', 'editor')).toBe(true)
    }

    expect(await visibleCollectionSlugs('editor')).toEqual(['media', 'pages', 'posts'])
  })

  it.each(['redirects', 'forms', 'search'])('%s remains publicly readable', async (slug) => {
    expect(await can(slug, 'read')).toBe(true)
  })

  it.each(['redirects', 'forms', 'search'])(
    '%s allows only admins to mutate or manage it',
    async (slug) => {
      for (const operation of ['admin', 'create', 'delete', 'update'] as const) {
        expect(await can(slug, operation, 'admin')).toBe(true)
        expect(await can(slug, operation, 'editor')).toBe(false)
        expect(await can(slug, operation, 'agent-editor')).toBe(false)
      }
    },
  )

  it('preserves public submissions while preventing agents from reading or managing them', async () => {
    expect(await can('form-submissions', 'create')).toBe(true)
    expect(await can('form-submissions', 'read', 'agent-editor')).toBe(false)

    for (const operation of ['admin', 'delete', 'read', 'update'] as const) {
      expect(await can('form-submissions', operation, 'admin')).toBe(true)
      expect(await can('form-submissions', operation, 'editor')).toBe(false)
      expect(await can('form-submissions', operation, 'agent-editor')).toBe(false)
    }
  })

  it('keeps jobs admin-only', async () => {
    for (const operation of ['admin', 'create', 'delete', 'read', 'update'] as const) {
      expect(await can('payload-jobs', operation, 'admin')).toBe(true)
      expect(await can('payload-jobs', operation, 'editor')).toBe(false)
      expect(await can('payload-jobs', operation, 'agent-editor')).toBe(false)
      expect(await can('payload-jobs', operation)).toBe(false)
    }
  })

  it('lets editors browse folders without managing them', async () => {
    expect(await can('payload-folders', 'read', 'admin')).toBe(true)
    expect(await can('payload-folders', 'read', 'editor')).toBe(true)
    expect(await can('payload-folders', 'read', 'agent-editor')).toBe(false)

    for (const operation of ['admin', 'create', 'delete', 'update'] as const) {
      expect(await can('payload-folders', operation, 'admin')).toBe(true)
      expect(await can('payload-folders', operation, 'editor')).toBe(false)
    }
  })

  it('runs jobs only for admins or a configured cron secret', async () => {
    const config = await configPromise
    const run = config.jobs?.access?.run
    expect(run).toBeTypeOf('function')

    const originalSecret = process.env.CRON_SECRET
    try {
      delete process.env.CRON_SECRET
      expect(
        await run?.({
          req: {
            headers: new Headers({ authorization: 'Bearer undefined' }),
            user: null,
          },
        } as never),
      ).toBe(false)
      expect(
        await run?.({ req: { headers: new Headers(), user: { role: 'agent-editor' } } } as never),
      ).toBe(false)
      expect(
        await run?.({ req: { headers: new Headers(), user: { role: 'editor' } } } as never),
      ).toBe(false)
      expect(
        await run?.({ req: { headers: new Headers(), user: { role: 'admin' } } } as never),
      ).toBe(true)

      process.env.CRON_SECRET = 'job-access-test-secret'
      expect(
        await run?.({
          req: {
            headers: new Headers({ authorization: 'Bearer job-access-test-secret' }),
            user: null,
          },
        } as never),
      ).toBe(true)
    } finally {
      if (originalSecret === undefined) delete process.env.CRON_SECRET
      else process.env.CRON_SECRET = originalSecret
    }
  })
})
