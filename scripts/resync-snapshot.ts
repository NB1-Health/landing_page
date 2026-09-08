import fs from 'fs'
import path from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Regenerates the drizzle snapshot baseline from the CURRENT config, so
 * `migrate:create` diffs against reality again.
 *
 * Hand-written migrations change the database without refreshing the snapshot,
 * so the baseline drifts and `migrate:create` starts re-deriving months of
 * hand-made changes — including destructive guesses. This resets the baseline.
 *
 * WHY THE FILENAME IS COMPUTED
 * The previous version of this script wrote to a hardcoded
 * `20260610_120000_resync_baseline.json`. That worked on the day it was written,
 * but `migrate:create` picks the LEXICOGRAPHICALLY LAST `.json` in the folder as
 * its baseline — and later `migrate:create` runs added `20260707_*.json`, which
 * sorts after it. So the resync silently stopped taking effect: the tool was
 * here the whole time, writing to a file nothing read. Stamping the name at run
 * time means the new snapshot always sorts last.
 *
 * A SNAPSHOT-ONLY FILE IS DELIBERATE
 * No `.ts` is written and nothing is registered in migrations/index.ts. The
 * snapshot describes schema for diffing; it must not be an executable migration.
 * This matches the existing `20260610_120000_resync_baseline.json`.
 *
 * RUN THE DRIFT CHECK FIRST
 * Writing this file asserts "the live database already matches the config". If
 * that is false, the difference becomes invisible to every future
 * `migrate:create`. `npm run db:check-drift` verifies that claim.
 *
 * This script does NOT enforce that — it cannot see whether the check was run,
 * and gating on a marker file would be trivially bypassed and misleading. The
 * only guard here is the filename sort order below. Running the check first is
 * on the operator.
 *
 * Run with:  npm run db:resync-snapshot
 */

function stamp(): string {
  // Local time, matching the existing migration filename convention.
  const d = new Date()
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  )
}

const payload = await getPayload({ config })

try {
  const adapter = payload.db as unknown as {
    schema: unknown
    requireDrizzleKit: () => {
      generateDrizzleJson: (schema: unknown) => Promise<unknown>
    }
  }

  const { generateDrizzleJson } = adapter.requireDrizzleKit()
  const json = await generateDrizzleJson(adapter.schema)

  const name = `${stamp()}_resync_baseline.json`
  const file = path.resolve(process.cwd(), 'src/migrations', name)

  const existing = fs
    .readdirSync(path.resolve(process.cwd(), 'src/migrations'))
    .filter((f) => f.endsWith('.json'))
    .sort()
  const previousBaseline = existing[existing.length - 1]

  if (previousBaseline && previousBaseline > name) {
    console.error(
      `REFUSING TO WRITE. ${previousBaseline} sorts after ${name}, so the new\n` +
        `snapshot would be ignored — which is the bug this script used to have.\n` +
        `Check the clock on this machine.`,
    )
    process.exit(1)
  }

  fs.writeFileSync(file, JSON.stringify(json, null, 2))

  console.log(`Previous baseline : ${previousBaseline ?? '(none)'}`)
  console.log(`New baseline      : ${name}`)
  console.log(`Wrote             : ${file}`)
  console.log(
    '\nCommit this .json. Do NOT create a matching .ts and do NOT add it to\n' +
      'migrations/index.ts — it is a diff baseline, not a migration.\n\n' +
      'Verify: `npm run migrate:create -- --name verify_resync` should now produce\n' +
      'an EMPTY migration. If it produces SQL, the resync did not take — delete the\n' +
      'generated pair and investigate before relying on migrate:create again.\n' +
      'Delete the verify pair either way.',
  )
} catch (err) {
  console.error('RESYNC FAILED:', err)
  process.exit(1)
}
