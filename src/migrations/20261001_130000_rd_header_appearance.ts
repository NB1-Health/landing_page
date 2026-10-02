import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add the redesign header's two appearance flags.
 *
 * `transparent` — the header sits straight on the hero: no bar, no blur, no
 * hairline, for a full-bleed photo or a dark block.
 * `light_text`  — cool-grey wordmark, links and menu icon, with the soft dark
 * fade across the top 140px that keeps them readable on any image.
 *
 * TWO COLUMNS, NOT A THEME ENUM. The spec draws three header pictures and they
 * are only two headers: "dark over a dark hero" and "see-through over a photo"
 * are the same transparent header with light text, and what differs between the
 * two pictures is what sits behind it. An enum would have asked an editor to
 * choose between two names for one thing.
 *
 * `rd_headers` is a flat table — no versions, no locales for these two, because
 * an appearance is not copy and does not vary by language. So this is two
 * columns and nothing else.
 *
 * Both are nullable with no DEFAULT, deliberately: every header that exists
 * today reads NULL, `Boolean(null)` is false, and false is the solid pale bar —
 * which is exactly what those headers render now. Nothing already seeded
 * changes appearance when this runs.
 *
 * Idempotent: ADD COLUMN IF NOT EXISTS, so it is safe to re-run over a
 * partially applied attempt.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_headers" ADD COLUMN IF NOT EXISTS "transparent" boolean;
  ALTER TABLE "rd_headers" ADD COLUMN IF NOT EXISTS "light_text" boolean;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_headers" DROP COLUMN IF EXISTS "light_text";
  ALTER TABLE "rd_headers" DROP COLUMN IF EXISTS "transparent";`)
}
