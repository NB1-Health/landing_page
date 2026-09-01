import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))

import { capturePostPublication, revalidatePost } from '@/collections/Posts/hooks/revalidatePost'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('post publication revalidation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revalidates the exact locales published by Payload', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: {
        findByID: vi
          .fn()
          .mockResolvedValueOnce({
            _status: { de: 'draft', en: 'published' },
            slug: { de: 'darmgesundheit-grundlagen', en: 'gut-health-basics' },
            title: { de: 'Darmgesundheit', en: 'Gut health basics' },
          })
          .mockResolvedValueOnce({
            _status: { de: 'published', en: 'published', fr: 'published' },
            // `slug` is a per-locale map now, which is what a `locale: 'all'`
            // read returns since migration `20260825_135859`. It used to be one
            // string shared by all eight markets.
            //
            // French carries a slug but no title on purpose: it isolates the
            // title-readiness check below. If `fr` were missing from both, two
            // guards would exclude it and the assertion would no longer say
            // which one did the work.
            slug: {
              de: 'darmgesundheit-grundlagen',
              en: 'gut-health-basics',
              fr: 'bases-sante-intestinale',
            },
            title: { de: 'Darmgesundheit', en: 'Gut health basics' },
          }),
        logger,
      },
      query: { draft: 'true' },
    }

    await capturePostPublication({
      args: { data: { _status: 'published' }, draft: true, id: 7 },
      operation: 'update',
      req,
    } as never)
    await revalidatePost({
      doc: { id: 7, _status: 'published', slug: 'gut-health-basics' },
      previousDoc: { id: 7, _status: 'draft', slug: 'gut-health-basics' },
      req,
    } as never)

    // Posts moved to /journal (JOURNAL_INTEGRATION_PLAN.md, Phase 2).
    //
    // Each locale invalidates ITS OWN slug. Before the slug was localized both
    // of these were the same English string, so this is the first version of
    // this test that could tell a per-locale path from a shared one.
    expect(revalidatePath).toHaveBeenCalledWith('/de/journal/darmgesundheit-grundlagen')
    expect(revalidatePath).toHaveBeenCalledWith('/en/journal/gut-health-basics')

    // No cross-contamination: the German URL must not be invalidated under /en,
    // which is what a scalar slug read as localized would produce.
    expect(revalidatePath).not.toHaveBeenCalledWith('/en/journal/darmgesundheit-grundlagen')
    expect(revalidatePath).not.toHaveBeenCalledWith('/de/journal/gut-health-basics')

    // French has a slug but no title, so it is not ready to serve and is skipped
    // even though Payload reports it published.
    expect(revalidatePath).not.toHaveBeenCalledWith('/fr/journal/bases-sante-intestinale')
    expect(revalidateTag).toHaveBeenCalledWith('posts-sitemap-de')

    // The index is force-static, so publishing has to invalidate it too or the
    // new card does not appear for up to the revalidate window.
    expect(revalidatePath).toHaveBeenCalledWith('/de/journal')
    expect(revalidatePath).toHaveBeenCalledWith('/de/journal/page/[pageNumber]', 'page')

    // No category-archive targets. Those routes were removed per SEO-007 §10,
    // and a stale revalidatePath call against a deleted route is the kind of
    // thing that survives a rename for months without anyone noticing.
    const revalidated = revalidatePath.mock.calls.map((call) => call[0] as string)
    expect(revalidated.some((path) => path.includes('/category/'))).toBe(false)

    // A locale the post is not published in stays untouched entirely.
    expect(revalidatePath).not.toHaveBeenCalledWith('/fr/journal')
  })

  it('does not revalidate a draft autosave', async () => {
    const req = {
      context: {},
      locale: 'de',
      payload: { findByID: vi.fn(), logger },
      query: { draft: 'true' },
    }
    const doc = { id: 7, _status: 'draft', slug: 'gut-health-basics' }

    await capturePostPublication({
      args: { data: { _status: 'draft' }, draft: true, id: 7 },
      operation: 'update',
      req,
    } as never)
    await expect(revalidatePost({ doc, previousDoc: doc, req } as never)).resolves.toBe(doc)

    expect(req.payload.findByID).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
