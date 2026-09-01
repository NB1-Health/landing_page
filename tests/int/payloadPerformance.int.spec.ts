import { beforeAll, describe, expect, it, vi } from 'vitest'

import { Posts } from '@/collections/Posts'
import configPromise from '@/payload.config'

let configuredPosts: Awaited<typeof configPromise>['collections'][number]

beforeAll(async () => {
  const config = await configPromise
  const collection = config.collections.find(({ slug }) => slug === 'posts')
  if (!collection) throw new Error('Configured Posts collection not found.')
  configuredPosts = collection
})

describe('Payload performance configuration', () => {
  it('skips all search-index work for autosave requests', async () => {
    const rawHooks = new Set(Posts.hooks?.afterChange ?? [])
    const pluginHooks = (configuredPosts.hooks?.afterChange ?? []).filter(
      (hook) => typeof hook === 'function' && !rawHooks.has(hook),
    )
    expect(pluginHooks).toHaveLength(1)

    for (const autosave of [true, 'true'] as const) {
      const doc = { _status: 'draft', id: 1, title: 'Autosaved Post' }
      const database = {
        create: vi.fn(),
        delete: vi.fn(),
        find: vi.fn(),
        findByID: vi.fn(),
        update: vi.fn(),
      }

      await pluginHooks[0]?.({
        collection: configuredPosts,
        context: {},
        doc,
        operation: 'update',
        previousDoc: doc,
        req: {
          context: {},
          payload: {
            ...database,
            logger: { error: vi.fn() },
          },
          query: { autosave },
        },
      } as never)

      for (const query of Object.values(database)) expect(query).not.toHaveBeenCalled()
    }
  })
})
