import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * `rdChk.steps.backSlugCore` and `.backSlugAdvanced`.
 *
 * WHY TWO FIELDS FOR ONE BUTTON. The funnel is Plan -> Duration -> Checkout,
 * but the middle step is TWO pages: `duration-core` and `duration-advanced`.
 * Checkout is one page reached from either, so "go back one step" has no single
 * answer — it depends on the plan the visitor is carrying. `window.history
 * .back()` was standing in for that, and it is not the same thing: it returns
 * to whatever was last in the tab, which after a reload, a deep link, a
 * redirect-return from Klarna or a payment retry is not the duration page at
 * all, and sometimes leaves the funnel entirely.
 *
 * Localized, like every other destination field in the redesign: one stored
 * slug per locale, and the locale prefix is added when the page renders.
 *
 * ADDITIVE AND IDEMPOTENT. Two nullable columns on the two `_locales` tables;
 * an empty value falls back to the old history behaviour, so a page that has
 * not been reseeded behaves exactly as it does today.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_chk_locales" ADD COLUMN IF NOT EXISTS "steps_back_slug_core" varchar;
  ALTER TABLE "pages_blocks_rd_chk_locales" ADD COLUMN IF NOT EXISTS "steps_back_slug_advanced" varchar;
  ALTER TABLE "_pages_v_blocks_rd_chk_locales" ADD COLUMN IF NOT EXISTS "steps_back_slug_core" varchar;
  ALTER TABLE "_pages_v_blocks_rd_chk_locales" ADD COLUMN IF NOT EXISTS "steps_back_slug_advanced" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_chk_locales" DROP COLUMN IF EXISTS "steps_back_slug_core";
  ALTER TABLE "pages_blocks_rd_chk_locales" DROP COLUMN IF EXISTS "steps_back_slug_advanced";
  ALTER TABLE "_pages_v_blocks_rd_chk_locales" DROP COLUMN IF EXISTS "steps_back_slug_core";
  ALTER TABLE "_pages_v_blocks_rd_chk_locales" DROP COLUMN IF EXISTS "steps_back_slug_advanced";`)
}
