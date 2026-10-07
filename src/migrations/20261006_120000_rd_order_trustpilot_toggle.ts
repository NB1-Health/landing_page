import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `rdOrder.plans.showTrustpilotRating` — the switch that turns the order page's
 * trust row from a drawing into the live widget.
 *
 * WHAT IT REPLACED. The row was five <span> tiles with the fifth split 50/50 by
 * a gradient: a picture of 4.5 stars, baked into the component. The homepage
 * hero already had the right answer — `showTrustpilotRating` plus the real
 * TrustBox — and this gives the order page the same field name, the same
 * default and the same meaning, so the two pages cannot drift.
 *
 * DEFAULT TRUE, and back-filled true. The row is showing a rating today; a
 * migration that left it NULL would read as false in the component and make the
 * row vanish on deploy. `boolean DEFAULT true` covers rows created later, the
 * UPDATE covers the ones that already exist.
 *
 * NOT LOCALIZED, so it sits on the block tables rather than their `_locales`
 * twins — whether the widget shows is a page decision, not a translation. Both
 * tables all the same, because pages are versioned and a column missing from
 * `_pages_v_blocks_rd_order` would make drafts disagree with what is published.
 *
 * `plans_trust_label` is deliberately NOT dropped. The component stopped reading
 * it — the TrustBox prints "Excellent" itself — but the column holds nine
 * locales of copy, and dropping it to tidy away one unread field is a bad
 * trade. It is marked unused in the admin instead.
 *
 * Idempotent: IF NOT EXISTS on the columns, IS NULL on the back-fill.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_order" ADD COLUMN IF NOT EXISTS "plans_show_trustpilot_rating" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_rd_order" ADD COLUMN IF NOT EXISTS "plans_show_trustpilot_rating" boolean DEFAULT true;

  UPDATE "pages_blocks_rd_order" SET "plans_show_trustpilot_rating" = true WHERE "plans_show_trustpilot_rating" IS NULL;
  UPDATE "_pages_v_blocks_rd_order" SET "plans_show_trustpilot_rating" = true WHERE "plans_show_trustpilot_rating" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_order" DROP COLUMN IF EXISTS "plans_show_trustpilot_rating";
  ALTER TABLE "_pages_v_blocks_rd_order" DROP COLUMN IF EXISTS "plans_show_trustpilot_rating";`)
}
