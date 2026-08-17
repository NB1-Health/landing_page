import { describe, expect, it, vi } from 'vitest'

import { down as rollbackPostOverrides } from '@/migrations/20260813_150000_post_seo_overrides'

function migrationArgs(localizeStatus: boolean, globalLocalizeStatus = localizeStatus) {
  return {
    db: { execute: vi.fn().mockResolvedValue(undefined) },
    payload: {
      config: {
        experimental: { localizeStatus: globalLocalizeStatus },
        collections: [
          {
            slug: 'pages',
            versions: { drafts: { localizeStatus } },
          },
          {
            slug: 'posts',
            versions: { drafts: { localizeStatus } },
          },
        ],
      },
    },
  }
}

describe('localized status migration rollback', () => {
  it('fails before removing any schema while localized status is enabled', async () => {
    const args = migrationArgs(true)

    await expect(rollbackPostOverrides(args as never)).rejects.toThrow(
      /Disable experimental\.localizeStatus/,
    )
    expect(args.db.execute).not.toHaveBeenCalled()
  })

  it('also refuses while only the global experimental flag remains enabled', async () => {
    const args = migrationArgs(false, true)

    await expect(rollbackPostOverrides(args as never)).rejects.toThrow(
      /Disable experimental\.localizeStatus/,
    )
    expect(args.db.execute).not.toHaveBeenCalled()
  })

  it('allows the migration batch to roll back after localized status is disabled', async () => {
    const args = migrationArgs(false)

    await expect(rollbackPostOverrides(args as never)).resolves.toBeUndefined()
    expect(args.db.execute).toHaveBeenCalledOnce()
  })
})
