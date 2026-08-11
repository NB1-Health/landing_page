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
    ['pg_dump "$STG_DB"', 'database dump'],
    ['pg_restore snapshot.dump', 'database restore'],
    ['DROP SCHEMA public CASCADE', 'destructive schema operation'],
    ['source .env.stg', 'staging database environment'],
    ['npm run db:sync-stg', 'database synchronization command'],
  ])('rejects %s', (source, finding) => {
    expect(findUnsafeProductionDeployPatterns(source)).toContain(finding)
  })
})
