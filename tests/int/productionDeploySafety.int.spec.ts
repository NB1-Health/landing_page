import { describe, expect, it } from 'vitest'

import {
  assertSafeProductionDeploy,
  findUnsafeProductionDeployPatterns,
} from '../../scripts/check-production-deploy-safety.mjs'

describe('production deployment safety', () => {
  it('keeps the checked-in production deployment code-only', () => {
    expect(() => assertSafeProductionDeploy()).not.toThrow()
  })

  it.each([
    ['database dumps', 'pg_dump "$STAGING_DATABASE"'],
    ['database restores', 'pg_restore --clean dump.sql'],
    ['schema drops', 'DROP SCHEMA public CASCADE'],
    ['staging environment reads', 'source .env.stg'],
    ['indirect staging synchronization', 'npm run db:sync-stg'],
  ])('rejects %s', (_label, source) => {
    expect(findUnsafeProductionDeployPatterns(source)).not.toHaveLength(0)
  })
})
