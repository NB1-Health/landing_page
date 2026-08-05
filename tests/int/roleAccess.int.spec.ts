import { describe, expect, it } from 'vitest'

import { canWritePage } from '@/access/pagePublishing'
import { adminOnly, adminOrSelf, editorOrAbove, getUserRole } from '@/access/roles'
import { Pages } from '@/collections/Pages'
import { Users } from '@/collections/Users'
import { Footers } from '@/Footer/config'
import { Headers } from '@/Header/config'
import { FAQ } from '@/globals/FAQ'
import { Navigation } from '@/globals/Navigation'
import { SiteSettings } from '@/globals/SiteSettings'
import { POST as runSeedRoute } from '@/app/(frontend)/[locale]/next/seed/route'
import { canRunDestructiveSeed, isDestructiveSeedEnabled } from '@/utilities/destructiveSeed'

const user = (role?: string) => ({ id: 7, collection: 'users', email: 'local@example.com', role })
const accessArgs = (role?: string) => ({ req: { user: user(role) } }) as never

describe('Payload editorial roles', () => {
  it('defaults legacy sessions to editor and rejects invalid roles', () => {
    expect(getUserRole(user())).toBe('editor')
    expect(getUserRole(user('publisher'))).toBe('publisher')
    expect(getUserRole(user('unexpected'))).toBeNull()
    expect(getUserRole(null)).toBeNull()
  })

  it('keeps editors draft-only, publishers publication-capable, and deletion admin-only', () => {
    expect(canWritePage('editor', { operation: 'create', draft: true })).toBe(true)
    expect(canWritePage('editor', { operation: 'update', draft: true, status: 'published' })).toBe(
      false,
    )
    expect(canWritePage('editor', { operation: 'update', draft: false, status: 'published' })).toBe(
      false,
    )
    expect(canWritePage('editor', { operation: 'restoreVersion' })).toBe(false)
    expect(canWritePage('publisher', { operation: 'update', status: 'published' })).toBe(true)
    expect(canWritePage('publisher', { operation: 'update', status: 'draft' })).toBe(true)
    expect(canWritePage('publisher', { operation: 'restoreVersion' })).toBe(true)
    expect(canWritePage('publisher', { operation: 'delete' })).toBe(false)
    expect(canWritePage('admin', { operation: 'delete' })).toBe(true)
    expect(canWritePage(null, { operation: 'update', overrideAccess: true })).toBe(true)
  })

  it('registers matching collection access and the server-side page guard', async () => {
    expect(await Pages.access?.create?.(accessArgs('editor'))).toBe(true)
    expect(await Pages.access?.delete?.(accessArgs('publisher'))).toBe(false)
    expect(await Pages.access?.delete?.(accessArgs('admin'))).toBe(true)
    expect(Pages.hooks?.beforeOperation?.[0]?.name).toBe('enforcePageWriteRole')
  })

  it('enforces the page role matrix in the registered server hook', async () => {
    const guard = Pages.hooks?.beforeOperation?.[0]
    expect(guard).toBeDefined()

    await expect(
      guard?.({
        args: { data: { _status: 'draft' }, draft: true, overrideAccess: false },
        operation: 'update',
        req: { user: user('editor') },
      } as never),
    ).resolves.toBeUndefined()

    await expect(
      guard?.({
        args: { data: { _status: 'published' }, draft: false, overrideAccess: false },
        operation: 'update',
        req: { user: user('editor') },
      } as never),
    ).rejects.toMatchObject({ isPublic: true, status: 403 })

    await expect(
      guard?.({
        args: { data: { _status: 'published' }, draft: false, overrideAccess: false },
        operation: 'update',
        req: { user: user('publisher') },
      } as never),
    ).resolves.toBeUndefined()
  })

  it('limits user administration while retaining self-service account access', async () => {
    expect(await adminOnly(accessArgs('publisher'))).toBe(false)
    expect(await adminOnly(accessArgs('admin'))).toBe(true)
    expect(await editorOrAbove(accessArgs('editor'))).toBe(true)
    expect(await adminOrSelf(accessArgs('editor'))).toEqual({ id: { equals: 7 } })
    expect(await adminOrSelf(accessArgs('admin'))).toBe(true)

    expect(Users.access?.create).toBe(adminOnly)
    expect(Users.access?.delete).toBe(adminOnly)
    expect(Users.access?.read).toBe(adminOrSelf)
    expect(Users.access?.update).toBe(adminOrSelf)
    const roleField = Users.fields.find((field) => 'name' in field && field.name === 'role')
    expect(roleField && 'defaultValue' in roleField ? roleField.defaultValue : undefined).toBe(
      'editor',
    )
  })

  it('makes shared chrome and site configuration admin-only', () => {
    for (const collection of [Headers, Footers]) {
      expect(collection.access?.create).toBe(adminOnly)
      expect(collection.access?.delete).toBe(adminOnly)
      expect(collection.access?.update).toBe(adminOnly)
    }
    for (const global of [Navigation, SiteSettings, FAQ]) {
      expect(global.access?.update).toBe(adminOnly)
    }
  })
})

describe('destructive seed gate', () => {
  const optedInDevelopment = { ENABLE_DESTRUCTIVE_SEED: 'true', NODE_ENV: 'development' }

  it('is hidden unless local development explicitly opts in', () => {
    expect(isDestructiveSeedEnabled({ NODE_ENV: 'development' })).toBe(false)
    expect(
      isDestructiveSeedEnabled({ ENABLE_DESTRUCTIVE_SEED: 'true', NODE_ENV: 'production' }),
    ).toBe(false)
    expect(isDestructiveSeedEnabled(optedInDevelopment)).toBe(true)
  })

  it('requires an administrator even after development opts in', () => {
    expect(canRunDestructiveSeed(user('editor'), optedInDevelopment)).toBe(false)
    expect(canRunDestructiveSeed(user('publisher'), optedInDevelopment)).toBe(false)
    expect(canRunDestructiveSeed(user('admin'), optedInDevelopment)).toBe(true)
  })

  it('returns 404 before initializing Payload when the gate is disabled', async () => {
    const response = await runSeedRoute()
    expect(response.status).toBe(404)
  })
})
