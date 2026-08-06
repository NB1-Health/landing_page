import { beforeEach, describe, expect, it, vi } from 'vitest'

const { find, findByID, getPayload, revalidatePath, revalidateTag, unstableCache } = vi.hoisted(
  () => ({
    find: vi.fn(),
    findByID: vi.fn(),
    getPayload: vi.fn(),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstableCache: vi.fn(),
  }),
)

vi.mock('payload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('payload')>()),
  getPayload,
}))

vi.mock('next/cache', () => ({
  revalidatePath,
  revalidateTag,
  unstable_cache: (callback: () => unknown, keys: string[], options: unknown) => {
    unstableCache(keys, options)
    return callback
  },
}))

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { Footers } from '@/Footer/config'
import {
  enforceSingleDefault as enforceSingleDefaultFooter,
  protectDefaultDelete as protectDefaultFooterDelete,
  protectExistingDefaultDraft as protectExistingDefaultFooterDraft,
} from '@/Footer/hooks/enforceSingleDefault'
import { revalidateDeletedFooter, revalidateFooter } from '@/Footer/hooks/revalidateFooter'
import { Headers } from '@/Header/config'
import {
  enforceSingleDefault,
  protectDefaultDelete,
  protectExistingDefaultDraft,
} from '@/Header/hooks/enforceSingleDefault'
import { revalidateDeletedHeader, revalidateHeader } from '@/Header/hooks/revalidateHeader'
import { captureChromeDraftSave } from '@/utilities/chromeDrafts'
import { getFooter, getHeader } from '@/utilities/getHeaderFooter'

const admin = { collection: 'users', id: 1, role: 'admin' }

describe('Header and Footer drafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    find.mockResolvedValue({ docs: [{ id: 1 }] })
    findByID.mockResolvedValue({ id: 1 })
    getPayload.mockResolvedValue({ find, findByID })
  })

  it('enables native versions while keeping anonymous reads published-only', async () => {
    for (const collection of [Headers, Footers]) {
      expect(collection.versions).toMatchObject({ drafts: {}, maxPerDoc: 10 })
      expect(collection.access?.read).toBe(authenticatedOrPublished)
      expect(collection.access?.read?.({ req: { user: null } } as never)).toEqual({
        _status: { equals: 'published' },
      })
    }
  })

  it('uses cached published reads for public chrome', async () => {
    await getHeader('7', 'de')
    await getFooter(undefined, 'de')

    expect(unstableCache).toHaveBeenCalledTimes(2)
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'headers',
        disableErrors: true,
        draft: false,
        id: '7',
        locale: 'de',
        overrideAccess: false,
        user: null,
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'footers',
        draft: false,
        locale: 'de',
        overrideAccess: false,
        pagination: false,
        user: null,
      }),
    )
  })

  it('bypasses the cache and passes the authenticated user for draft preview', async () => {
    const read = { draft: true, user: admin } as never

    await getHeader('7', 'fr', read)
    await getFooter(undefined, 'fr', read)

    expect(unstableCache).not.toHaveBeenCalled()
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'headers',
        draft: true,
        locale: 'fr',
        overrideAccess: false,
        user: admin,
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'footers',
        draft: true,
        locale: 'fr',
        overrideAccess: false,
        pagination: false,
        user: admin,
      }),
    )
  })

  it('does not trust an unauthenticated draft flag', async () => {
    await getHeader('7', 'en', { draft: true, user: null })

    expect(unstableCache).toHaveBeenCalledOnce()
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ draft: false, overrideAccess: false, user: null }),
    )
  })

  it('does not let a draft default replace the live default', async () => {
    const req = {
      context: {},
      payload: { find, update: vi.fn() },
      query: {},
    }
    captureChromeDraftSave({ args: { draft: true }, operation: 'update', req } as never)

    await enforceSingleDefault({ doc: { _status: 'draft', id: 2, isDefault: true }, req } as never)

    expect(find).not.toHaveBeenCalled()
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('does not mistake Payload bulk publish for a draft save', async () => {
    const update = vi.fn()
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true }] })
    const req = {
      context: {},
      payload: { find, logger: { info: vi.fn() }, update },
      query: { draft: 'true' },
    }
    captureChromeDraftSave({
      args: { data: { _status: 'published' }, draft: true },
      operation: 'update',
      req,
    } as never)

    await enforceSingleDefault({
      doc: { _status: 'published', id: 2, isDefault: true },
      req,
    } as never)
    await revalidateHeader({ doc: { _status: 'published', id: 2 }, req } as never)

    expect(update).toHaveBeenCalledOnce()
    expect(revalidateTag).toHaveBeenCalledWith('header_2')
  })

  it('does not let nested draft reads overwrite the outer publish classification', () => {
    const req = { context: {}, query: { draft: 'true' } }
    captureChromeDraftSave({
      args: { data: { _status: 'published' }, draft: true },
      operation: 'update',
      req,
    } as never)
    captureChromeDraftSave({ args: { draft: true }, operation: 'read', req } as never)

    expect(req.context).toEqual({ chromeDraftSave: false })
  })

  it('unsets the previous default only when the new default is published', async () => {
    const update = vi.fn()
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true }] })
    const req = { context: {}, payload: { find, update }, query: {} }
    captureChromeDraftSave({ args: { draft: false }, operation: 'update', req } as never)

    await enforceSingleDefault({
      doc: { _status: 'published', id: 2, isDefault: true },
      req,
    } as never)

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ draft: false }))
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          and: expect.arrayContaining([{ _status: { equals: 'published' } }]),
        }),
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'headers',
        data: { _status: 'published', isDefault: false },
        draft: false,
        id: 1,
      }),
    )
  })

  it('refuses to hide pending work when switching the default header', async () => {
    const findByID = vi.fn().mockResolvedValue({
      _status: 'draft',
      id: 1,
      isDefault: true,
      name: 'Current default',
    })
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true, name: 'Current default' }] })
    const req = { context: {}, payload: { find, findByID } }

    await expect(
      protectExistingDefaultDraft({
        data: { _status: 'published', isDefault: true, name: 'New default' },
        originalDoc: { id: 2 },
        req,
      } as never),
    ).rejects.toMatchObject({ status: 409 })

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'headers', draft: true, id: 1 }),
    )
  })

  it('checks the existing document when bulk publish sends only a status', async () => {
    const findByID = vi.fn().mockResolvedValue({
      _status: 'draft',
      id: 1,
      isDefault: true,
      name: 'Current default',
    })
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true, name: 'Current default' }] })

    await expect(
      protectExistingDefaultDraft({
        data: { _status: 'published' },
        originalDoc: { id: 2, isDefault: true },
        req: { context: {}, payload: { find, findByID } },
      } as never),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('allows switching the default when the current default has no pending draft', async () => {
    const findByID = vi.fn().mockResolvedValue({
      _status: 'published',
      id: 1,
      isDefault: true,
      name: 'Current default',
    })
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true, name: 'Current default' }] })

    await expect(
      protectExistingDefaultDraft({
        data: { _status: 'published', isDefault: true, name: 'New default' },
        originalDoc: { id: 2 },
        req: { context: {}, payload: { find, findByID } },
      } as never),
    ).resolves.toMatchObject({ _status: 'published', isDefault: true })
  })

  it('applies the same single-default protection to Footers', async () => {
    const update = vi.fn()
    const findByID = vi.fn().mockResolvedValue({
      _status: 'published',
      id: 1,
      isDefault: true,
      name: 'Current footer',
    })
    find.mockResolvedValue({ docs: [{ id: 1, isDefault: true, name: 'Current footer' }] })
    const req = {
      context: { chromeDraftSave: false },
      payload: { find, findByID, update },
      query: {},
    }

    await protectExistingDefaultFooterDraft({
      data: { _status: 'published', isDefault: true },
      originalDoc: { id: 2 },
      req,
    } as never)
    await enforceSingleDefaultFooter({
      doc: { _status: 'published', id: 2, isDefault: true },
      req,
    } as never)

    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'footers', id: 1 }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'footers',
        data: { _status: 'published', isDefault: false },
        id: 1,
      }),
    )
  })

  it('blocks removing or deleting the sole published default', async () => {
    const currentDefault = {
      _status: 'published',
      id: 1,
      isDefault: true,
      name: 'Only default',
    }

    for (const [protectChange, protectDelete] of [
      [protectExistingDefaultDraft, protectDefaultDelete],
      [protectExistingDefaultFooterDraft, protectDefaultFooterDelete],
    ]) {
      const localFind = vi.fn().mockResolvedValue({ docs: [] })
      const localFindByID = vi.fn().mockResolvedValue(currentDefault)
      const req = {
        context: { chromeDraftSave: false },
        payload: { find: localFind, findByID: localFindByID },
      }

      await expect(
        protectChange({
          data: { _status: 'draft' },
          originalDoc: currentDefault,
          req,
        } as never),
      ).rejects.toMatchObject({ status: 409 })
      await expect(protectDelete({ id: 1, req } as never)).rejects.toMatchObject({ status: 409 })
    }
  })

  it('blocks bulk-publishing a draft that unchecks the sole default', async () => {
    const currentDefault = {
      _status: 'published',
      id: 1,
      isDefault: true,
      name: 'Only default',
    }
    const req = {
      context: { chromeDraftSave: false },
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [] }),
        findByID: vi.fn().mockResolvedValue(currentDefault),
      },
    }

    await expect(
      protectExistingDefaultDraft({
        data: { _status: 'published' },
        originalDoc: { ...currentDefault, _status: 'draft', isDefault: false },
        req,
      } as never),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('allows the automatic default handover to unset the previous default', async () => {
    find.mockResolvedValue({ docs: [{ _status: 'published', id: 2, isDefault: true }] })
    findByID.mockResolvedValue({ _status: 'published', id: 1, isDefault: true })
    const req = {
      context: { chromeDraftSave: false },
      payload: { find, findByID },
    }

    await expect(
      protectExistingDefaultDraft({
        data: { _status: 'published', isDefault: false },
        originalDoc: { _status: 'published', id: 1, isDefault: true },
        req,
      } as never),
    ).resolves.toMatchObject({ isDefault: false })

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ pagination: false }))
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ draft: false, id: 1, overrideAccess: true }),
    )
  })

  it('falls back safely when an explicit public chrome document is not published', async () => {
    findByID.mockResolvedValue(null)

    await expect(getHeader('unpublished', 'en')).resolves.toEqual({ id: 1 })
    await expect(getFooter('unpublished', 'en')).resolves.toEqual({ id: 1 })

    expect(findByID).toHaveBeenCalledTimes(2)
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({ disableErrors: true, draft: false, overrideAccess: false }),
    )
    expect(find).toHaveBeenCalledTimes(2)
    expect(unstableCache).toHaveBeenCalledWith(
      ['header', 'unpublished', 'en'],
      expect.objectContaining({ tags: ['header_unpublished', 'header_default'] }),
    )
    expect(unstableCache).toHaveBeenCalledWith(
      ['footer', 'unpublished', 'en'],
      expect.objectContaining({ tags: ['footer_unpublished', 'footer_default'] }),
    )
  })

  it('keeps draft autosaves out of public revalidation', async () => {
    const req = { context: {}, payload: { logger: { info: vi.fn() } }, query: {} }
    captureChromeDraftSave({ args: { draft: true }, operation: 'update', req } as never)

    await revalidateHeader({ doc: { _status: 'draft', id: 1 }, req } as never)
    await revalidateFooter({ doc: { _status: 'draft', id: 1 }, req } as never)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('still revalidates when published chrome is unpublished', async () => {
    const req = { context: {}, payload: { logger: { info: vi.fn() } }, query: {} }
    captureChromeDraftSave({ args: { draft: false }, operation: 'update', req } as never)

    await revalidateHeader({ doc: { _status: 'draft', id: 1 }, req } as never)
    await revalidateFooter({ doc: { _status: 'draft', id: 1 }, req } as never)

    expect(revalidateTag).toHaveBeenCalledWith('header_1')
    expect(revalidateTag).toHaveBeenCalledWith('footer_1')
  })

  it('invalidates public chrome when a Header or Footer is deleted', async () => {
    const req = { context: {}, payload: { logger: { info: vi.fn() } }, query: { draft: 'true' } }

    await revalidateDeletedHeader({ doc: { id: 4 }, req } as never)
    await revalidateDeletedFooter({ doc: { id: 5 }, req } as never)

    expect(revalidateTag).toHaveBeenCalledWith('header_4')
    expect(revalidateTag).toHaveBeenCalledWith('header_default')
    expect(revalidateTag).toHaveBeenCalledWith('footer_5')
    expect(revalidateTag).toHaveBeenCalledWith('footer_default')
  })
})
