import fs from 'fs'
import path from 'path'

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Reports whether the checked-in drizzle snapshot baseline can safely be
 * resynced — i.e. whether the live database already matches the Payload config.
 *
 * WHY THIS EXISTS
 * `migrate:create` diffs the current config against the most recent `.json`
 * snapshot in src/migrations. Every hand-written migration changes the database
 * without refreshing that snapshot, so the baseline drifts. Once it has,
 * `migrate:create` re-derives months of hand-made changes and guesses at the
 * destructive ones — on 2026-08-20 it proposed dropping `posts._status`, which
 * the localizeStatus migration had deliberately moved to `posts_locales`.
 *
 * The cure is to resync the snapshot (see scripts/resync-snapshot.ts). But a
 * resync ASSERTS "the database already matches the config" — if that is false,
 * the resync permanently hides a genuine pending change. So verify first.
 *
 * WHAT IT DOES
 * 1. Asks drizzle-kit for the SQL it would generate right now (config vs the
 *    newest snapshot). That is the claimed drift.
 * 2. For every object that SQL touches, checks the live database.
 *      - CREATE TABLE x   -> x already exists?  PHANTOM (snapshot stale only)
 *      - ADD COLUMN x.c   -> x.c already exists? PHANTOM
 *      - DROP TABLE x     -> x already gone?     PHANTOM
 *      - DROP COLUMN x.c  -> x.c already gone?   PHANTOM
 * 3. Anything not phantom is REAL: the database genuinely differs from the
 *    config, and a resync would bury it.
 *
 * Exit code 0 = safe to resync. 1 = real drift found, or the check failed.
 *
 * Run with:  npm run db:check-drift
 */

type Finding = { kind: string; table: string; column?: string; real: boolean }

function newestSnapshot(migrationsDir: string): string | null {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
  return files.length ? path.join(migrationsDir, files[files.length - 1]!) : null
}

/** Unquoted identifier from a `"quoted"` capture. */
function ident(raw: string | undefined): string {
  return (raw ?? '').replace(/"/g, '').trim()
}

function parseStatements(sqlText: string): Finding[] {
  const findings: Finding[] = []
  const seen = new Set<string>()

  const push = (kind: string, table: string, column?: string) => {
    if (!table) return
    const key = `${kind}:${table}:${column ?? ''}`
    if (seen.has(key)) return
    seen.add(key)
    findings.push({ kind, table, column, real: false })
  }

  // CREATE TABLE [IF NOT EXISTS] "x"
  for (const m of sqlText.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?("?[\w.]+"?)/gi)) {
    push('create_table', ident(m[1]))
  }

  // DROP TABLE [IF EXISTS] "x"
  for (const m of sqlText.matchAll(/DROP TABLE\s+(?:IF EXISTS\s+)?("?[\w.]+"?)/gi)) {
    push('drop_table', ident(m[1]))
  }

  // ALTER TABLE "x" ... ADD COLUMN / DROP COLUMN (one ALTER may carry several)
  for (const m of sqlText.matchAll(/ALTER TABLE\s+("?[\w.]+"?)([\s\S]*?);/gi)) {
    const table = ident(m[1])
    const body = m[2] ?? ''
    for (const c of body.matchAll(/ADD COLUMN\s+(?:IF NOT EXISTS\s+)?("?\w+"?)/gi)) {
      push('add_column', table, ident(c[1]))
    }
    for (const c of body.matchAll(/DROP COLUMN\s+(?:IF EXISTS\s+)?("?\w+"?)/gi)) {
      push('drop_column', table, ident(c[1]))
    }
  }

  return findings
}

const payload = await getPayload({ config })

try {
  const adapter = payload.db as unknown as {
    schema: unknown
    requireDrizzleKit: () => {
      generateDrizzleJson: (schema: unknown) => Promise<unknown>
      generateMigration: (prev: unknown, cur: unknown) => Promise<string[]>
    }
    execute: (args: { drizzle?: unknown; raw: string }) => Promise<{ rows: unknown[] }>
  }

  const migrationsDir = path.resolve(process.cwd(), 'src/migrations')
  const snapshotPath = newestSnapshot(migrationsDir)

  if (!snapshotPath) {
    console.error('No .json snapshot found in src/migrations — nothing to compare against.')
    process.exit(1)
  }

  console.log(`Baseline snapshot : ${path.basename(snapshotPath)}`)

  const { generateDrizzleJson, generateMigration } = adapter.requireDrizzleKit()
  const previous = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
  const current = await generateDrizzleJson(adapter.schema)
  const statements = await generateMigration(previous, current)

  if (statements.length === 0) {
    console.log('\nNo drift at all. The snapshot already matches the config.')
    console.log('Nothing to do.')
    process.exit(0)
  }

  const sqlText = statements.join('\n')
  const findings = parseStatements(sqlText)

  console.log(`Claimed drift     : ${statements.length} statements, ${findings.length} objects\n`)

  // One round trip for the whole live schema beats a query per object.
  const { rows } = await payload.db.execute({
    drizzle: payload.db.drizzle,
    raw: `SELECT table_name, column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'`,
  })

  const liveTables = new Set<string>()
  const liveColumns = new Set<string>()
  for (const row of rows as { table_name: string; column_name: string }[]) {
    liveTables.add(row.table_name)
    liveColumns.add(`${row.table_name}.${row.column_name}`)
  }

  for (const f of findings) {
    const tableExists = liveTables.has(f.table)
    const columnExists = f.column ? liveColumns.has(`${f.table}.${f.column}`) : false

    switch (f.kind) {
      // The config wants it created; if the DB already has it, the snapshot is
      // simply behind — the object is there.
      case 'create_table':
        f.real = !tableExists
        break
      case 'add_column':
        f.real = !columnExists
        break
      // The config wants it gone; if the DB no longer has it, already done.
      case 'drop_table':
        f.real = tableExists
        break
      case 'drop_column':
        f.real = columnExists
        break
    }
  }

  const real = findings.filter((f) => f.real)
  const phantom = findings.length - real.length

  console.log(`Already applied   : ${phantom} (snapshot stale only — safe)`)
  console.log(`Genuinely missing : ${real.length}\n`)

  if (real.length === 0) {
    console.log('SAFE TO RESYNC. The live database already matches the config.')
    console.log('Next: npm run db:resync-snapshot')
    process.exit(0)
  }

  console.log('DO NOT RESYNC YET. These differences are real:\n')
  for (const f of real) {
    console.log(`  ${f.kind.padEnd(12)} ${f.table}${f.column ? `.${f.column}` : ''}`)
  }
  console.log(
    '\nEach one is either a hand-written migration that was never applied to this\n' +
      'database, or a config change with no migration behind it. Resolve them with\n' +
      'targeted migrations first, then re-run this check.\n\n' +
      'Note: a `drop_*` listed as real means the config no longer wants that object.\n' +
      'Confirm that is intended before dropping anything — this is exactly where the\n' +
      '2026-08-20 generated migration went wrong with `posts._status`.',
  )
  process.exit(1)
} catch (err) {
  console.error('SCHEMA DRIFT CHECK FAILED:', err)
  process.exit(1)
}
