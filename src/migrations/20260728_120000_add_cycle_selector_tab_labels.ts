import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Adds the three localized label fields introduced with the 1-month-standard
// commitment model on the Cycle Selector block: flexTabLabel, commitTabLabel,
// flexNoteLabel. All nullable varchar (matches every other localized text
// field on this block) — purely additive, no backfill. The retired fields
// (showMonthlyOption, monthlyRate, monthlyCheckoutHref, preferFlexibleLabel,
// chooseFlexiblePrefix) are only hidden in the admin UI, so their columns are
// intentionally left in place and this migration does not touch them.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_cycle_selector_locales" ADD COLUMN "flex_tab_label" varchar;
  ALTER TABLE "pages_blocks_cycle_selector_locales" ADD COLUMN "commit_tab_label" varchar;
  ALTER TABLE "pages_blocks_cycle_selector_locales" ADD COLUMN "flex_note_label" varchar;
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" ADD COLUMN "flex_tab_label" varchar;
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" ADD COLUMN "commit_tab_label" varchar;
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" ADD COLUMN "flex_note_label" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_cycle_selector_locales" DROP COLUMN "flex_tab_label";
  ALTER TABLE "pages_blocks_cycle_selector_locales" DROP COLUMN "commit_tab_label";
  ALTER TABLE "pages_blocks_cycle_selector_locales" DROP COLUMN "flex_note_label";
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" DROP COLUMN "flex_tab_label";
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" DROP COLUMN "commit_tab_label";
  ALTER TABLE "_pages_v_blocks_cycle_selector_locales" DROP COLUMN "flex_note_label";`)
}
