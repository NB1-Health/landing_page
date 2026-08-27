import { beforeAll, describe, expect, it } from 'vitest'

import configPromise from '@/payload.config'

type Operation = 'admin' | 'create' | 'delete' | 'read' | 'update'

const collections = new Map<string, Awaited<typeof configPromise>['collections'][number]>()

beforeAll(async () => {
  const config = await configPromise
  for (const collection of config.collections) collections.set(collection.slug, collection)
})

async function can(slug: string, operation: Operation, role?: string) {
  const access = collections.get(slug)?.access?.[operation]
  if (!access) throw new Error(`Missing ${operation} access for ${slug}`)

  return access({ req: { user: role ? { role } : null } } as never)
}

describe('plugin-generated collection access', () => {
  it.each(['redirects', 'forms', 'search'])('%s remains publicly readable', async (slug) => {
    expect(await can(slug, 'read')).toBe(true)
  })

  it.each(['redirects', 'forms', 'search'])(
    '%s allows only admins to mutate or manage it',
    async (slug) => {
      for (const operation of ['admin', 'create', 'delete', 'update'] as const) {
        expect(await can(slug, operation, 'admin')).toBe(true)
        expect(await can(slug, operation, 'agent-editor')).toBe(false)
      }
    },
  )

  it('preserves public submissions while preventing agents from reading or managing them', async () => {
    expect(await can('form-submissions', 'create')).toBe(true)
    expect(await can('form-submissions', 'read', 'agent-editor')).toBe(false)

    for (const operation of ['admin', 'delete', 'read', 'update'] as const) {
      expect(await can('form-submissions', operation, 'admin')).toBe(true)
      expect(await can('form-submissions', operation, 'agent-editor')).toBe(false)
    }
  })

  it.each(['payload-folders', 'payload-jobs'])('keeps %s admin-only', async (slug) => {
    for (const operation of ['admin', 'create', 'delete', 'read', 'update'] as const) {
      expect(await can(slug, operation, 'admin')).toBe(true)
      expect(await can(slug, operation, 'agent-editor')).toBe(false)
      expect(await can(slug, operation)).toBe(false)
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
