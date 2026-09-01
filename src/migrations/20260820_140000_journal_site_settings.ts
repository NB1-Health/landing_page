import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Site Settings gains a `journal` group holding the editable copy for the
// Journal index at /library: hero headline, hero lede, and optional SEO title /
// description overrides. All four are localized, so they live in
// `site_settings_locales`.
//
// That table may not exist yet: Site Settings previously had exactly one field
// (`organizationJsonLd`, not localized), so Payload had no reason to create it.
// Hence `CREATE TABLE IF NOT EXISTS` with the columns inline, followed by
// `ADD COLUMN IF NOT EXISTS` for each — correct whether the table is new or
// already present. Constraints use drop-then-add rather than a DO block, since
// Postgres has no `ADD CONSTRAINT IF NOT EXISTS`.
//
// Every column is nullable on purpose. The frontend falls back to the shipped
// i18n translation per field (see utilities/journalCopy.ts), so an unfilled
// locale renders the built-in copy rather than an empty hero.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "site_settings_locales" (
      "journal_hero_title" varchar,
      "journal_hero_lede" varchar,
      "journal_meta_title" varchar,
      "journal_meta_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "site_settings_locales"
      ADD COLUMN IF NOT EXISTS "journal_hero_title" varchar,
      ADD COLUMN IF NOT EXISTS "journal_hero_lede" varchar,
      ADD COLUMN IF NOT EXISTS "journal_meta_title" varchar,
      ADD COLUMN IF NOT EXISTS "journal_meta_description" varchar;

    ALTER TABLE "site_settings_locales"
      DROP CONSTRAINT IF EXISTS "site_settings_locales_parent_id_fk";
    ALTER TABLE "site_settings_locales"
      ADD CONSTRAINT "site_settings_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX IF NOT EXISTS "site_settings_locales_locale_parent_id_unique"
      ON "site_settings_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only the journal columns are dropped. The table itself is left in place —
  // by the time this runs, other localized Site Settings fields may depend on
  // it, and dropping a shared table to reverse one feature is not a safe
  // rollback.
  await db.execute(sql`
    ALTER TABLE "site_settings_locales"
      DROP COLUMN IF EXISTS "journal_hero_title",
      DROP COLUMN IF EXISTS "journal_hero_lede",
      DROP COLUMN IF EXISTS "journal_meta_title",
      DROP COLUMN IF EXISTS "journal_meta_description";
  `)
}
