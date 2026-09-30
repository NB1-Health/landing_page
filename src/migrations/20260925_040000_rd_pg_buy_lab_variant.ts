import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `lab` to `rdPgBuy.variant` — the block is now reused on a THIRD page.
 *
 * Hand-written, not generated. tools/migrate_gen.py --alter emits column adds; an
 * enum that gains a VALUE is a different statement, and there was no precedent in
 * src/migrations to copy from.
 *
 * WHY A THIRD OPTION RATHER THAN REUSING `protocol`. The Lab's #buy section and
 * The Protocol's are as close as two sections get: 47 nodes each, zero structural
 * differences, and one word of copy between them. But the root class also selects
 * the page's TOKENS, and the two pages do not agree on one: `[data-d~="bigh"]`
 * caps the big heading at 58px under `.rd-lb` and 60px under `.rd-pr`. Rendering
 * The Lab's section as `protocol` was measured — 3 nodes differ at 1440px: the
 * heading at 60px/720px against the mockup's 58px/700px, and the section and its
 * container 2px taller for it. As `lab`: 41 nodes, 0 differing at 390, 900, 1440.
 *
 * NOTHING ALREADY SEEDED CHANGES. The column keeps its type, its nullability and
 * every stored value; only the set of values it will accept grows. Both existing
 * pages were re-harnessed against the component that reads the new option — Our
 * Plans 0 of 59 nodes differing at 390/900/1440, The Protocol 0 of 41 — so this
 * migration is additive in the strict sense.
 *
 * NO BACKFILL, deliberately. Postgres will not let a transaction USE an enum value
 * it added in that same transaction, and Payload runs each migration in one. The
 * Lab's row is written by scripts/seed-rd-lab.ts afterwards, in its own
 * transaction, which is where the value is first stored.
 *
 * Idempotent: IF NOT EXISTS on both additions, so a re-run is a no-op.
 *
 * DOWN IS A NO-OP, and that is the honest shape. Postgres cannot drop a value from
 * an enum; the only way back is to recreate the type, which would mean rewriting
 * both tables' columns and silently losing whatever rows say 'lab'. Reverting this
 * migration therefore leaves the extra option in place and harmless — it is a
 * value nothing is required to use — rather than destroying data to tidy a type.
 * To actually remove it, revert the seed first and then recreate the type by hand.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_pages_blocks_rd_pg_buy_variant" ADD VALUE IF NOT EXISTS 'lab';
  ALTER TYPE "public"."enum__pages_v_blocks_rd_pg_buy_variant" ADD VALUE IF NOT EXISTS 'lab';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // See the note above: an enum value cannot be dropped without recreating the
  // type and rewriting both columns, which would discard any row that uses it.
}
