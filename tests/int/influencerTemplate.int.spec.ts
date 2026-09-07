import { describe, expect, it, vi } from 'vitest'
import type { Payload } from 'payload'
import type { InfluencerLandingPage } from '@/payload-types'
import { getInfluencerTemplate } from '@/utilities/getInfluencerTemplate'
import { InfluencerTemplates } from '@/collections/InfluencerTemplates'

describe('shared influencer template', () => {
  it('uses the published default for existing records and does not bypass access', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [{ id: 1, title: 'Shared' }] })
    const result = await getInfluencerTemplate(
      { find } as unknown as Payload,
      {} as InfluencerLandingPage,
      { draft: false, user: null },
      'en',
    )
    expect(result?.id).toBe(1)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'influencer-templates',
        overrideAccess: false,
        draft: false,
        where: { and: [{ key: { equals: 'default' } }, { _status: { equals: 'published' } }] },
      }),
    )
  })
  it('queries an explicitly selected template instead of trusting populated draft data', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const result = await getInfluencerTemplate(
      { find } as unknown as Payload,
      { template: { id: 7, _status: 'draft' } } as InfluencerLandingPage,
      { draft: false, user: null },
      'de',
    )
    expect(result).toBeNull()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { and: [{ id: { equals: 7 } }, { _status: { equals: 'published' } }] },
      }),
    )
  })
  it('allows authenticated preview to resolve template drafts', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    await getInfluencerTemplate(
      { find } as unknown as Payload,
      { template: 7 } as InfluencerLandingPage,
      { draft: true, user: null },
      'en',
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: true,
        overrideAccess: false,
        where: { and: [{ id: { equals: 7 } }] },
      }),
    )
  })
  it('keeps public reads published-only and denies anonymous writes', () => {
    const args = { req: { user: null } } as never
    expect(InfluencerTemplates.access?.read?.(args)).toEqual({ _status: { equals: 'published' } })
    expect(InfluencerTemplates.access?.create?.(args)).toBe(false)
    expect(InfluencerTemplates.access?.update?.(args)).toBe(false)
    expect(InfluencerTemplates.access?.delete?.(args)).toBe(false)
  })
})
