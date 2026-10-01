import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Let the Journal wear a redesign footer, without losing its own navigation.
 *
 * Two columns, for the two halves of that sentence:
 *
 *   site_settings.journal_rd_footer_id   WHICH redesign footer the Journal
 *                                        branch uses. NULL — every existing
 *                                        row — means "none", and every journal
 *                                        page keeps the site footer it already
 *                                        chooses. Nothing changes until it is
 *                                        set.
 *   rd_footers.content_column            WHICH of that footer's three columns
 *                                        is generated from the hubs instead of
 *                                        authored. Defaults to 'none', so every
 *                                        footer that exists today renders
 *                                        exactly as it does now.
 *
 * WHY THE SECOND ONE EXISTS. The site footer's first column is not authored: it
 * is built from the hubs, so creating a hub with a slug makes it appear and
 * removing the slug makes it vanish, with nobody retyping `/de/mikrobiom`. The
 * redesign footer's three columns are plain arrays. Switching the Journal over
 * without this would have been a visual win and a navigation loss — the journal
 * pages would lose Journal / Microbiome / Research / Lexicon, on the pages where
 * those links matter most.
 *
 * The enum is named the way Payload names one for a `select` on a collection,
 * `enum_<table>_<field>`, because Payload resolves it by that name on every
 * subsequent migrate:create. A hand-picked name works until the day someone runs
 * the generator.
 *
 * Idempotent throughout: a duplicate_object guard on the type, IF NOT EXISTS on
 * the columns and the index, and a duplicate_object guard on the foreign key.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
   CREATE TYPE "public"."enum_rd_footers_content_column" AS ENUM('none', 'one', 'two', 'three');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "content_column" "enum_rd_footers_content_column" DEFAULT 'none';

  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "journal_rd_footer_id" integer;

  DO $$ BEGIN
   ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_journal_rd_footer_id_rd_footers_id_fk" FOREIGN KEY ("journal_rd_footer_id") REFERENCES "public"."rd_footers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "site_settings_journal_journal_rd_footer_idx" ON "site_settings" USING btree ("journal_rd_footer_id");`)
}

/**
 * ON DELETE set null, not cascade, on the way up — deleting a footer must not
 * delete the site settings. It is the one FK decision here that is not
 * mechanical, so it is stated rather than left to be read off the DDL.
 */
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "site_settings_journal_journal_rd_footer_idx";
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_journal_rd_footer_id_rd_footers_id_fk";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "journal_rd_footer_id";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "content_column";
  DROP TYPE IF EXISTS "public"."enum_rd_footers_content_column";`)
}
