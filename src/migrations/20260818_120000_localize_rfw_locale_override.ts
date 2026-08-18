import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// ReferralWidget (dbName 'rfw') gains its first localized field: `localeOverride`,
// the Mention Me locale (en_GB / de_DE / fr_FR) used for the referrer journey.
// It maps one-to-one onto the page locale, so a single shared value made the
// override unusable on a multi-locale page.
//
// Unlike 20260526_hero_banner_price_localized, the block had no localized field
// before, so there are no `_locales` tables to add a column to — they are created
// here, matching the shape Payload generates for a dbName'd block: `rfw.id` is
// varchar, `_rfw_v.id` is serial, so the two `_parent_id` types differ.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Create the locales tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rfw_locales" (
      "locale_override" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "_rfw_v_locales" (
      "locale_override" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `)

  // 2. Constraints and the locale/parent uniqueness Payload relies on
  await db.execute(sql`
    ALTER TABLE "rfw_locales"
      DROP CONSTRAINT IF EXISTS "rfw_locales_parent_id_fk";
    ALTER TABLE "rfw_locales"
      ADD CONSTRAINT "rfw_locales_parent_id_fk" FOREIGN KEY ("_parent_id")
      REFERENCES "public"."rfw"("id") ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_rfw_v_locales"
      DROP CONSTRAINT IF EXISTS "_rfw_v_locales_parent_id_fk";
    ALTER TABLE "_rfw_v_locales"
      ADD CONSTRAINT "_rfw_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id")
      REFERENCES "public"."_rfw_v"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX IF NOT EXISTS "rfw_locales_locale_parent_id_unique"
      ON "rfw_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "_rfw_v_locales_locale_parent_id_unique"
      ON "_rfw_v_locales" USING btree ("_locale","_parent_id");
  `)

  // 3. Carry any existing value onto the 'en' locale row. The rows do not exist
  //    yet, so this inserts rather than updates, and only where a value was set.
  await db.execute(sql`
    INSERT INTO "rfw_locales" ("locale_override", "_locale", "_parent_id")
    SELECT "locale_override", 'en'::"_locales", "id"
    FROM "rfw"
    WHERE "locale_override" IS NOT NULL
    ON CONFLICT ("_locale","_parent_id") DO NOTHING;

    INSERT INTO "_rfw_v_locales" ("locale_override", "_locale", "_parent_id")
    SELECT "locale_override", 'en'::"_locales", "id"
    FROM "_rfw_v"
    WHERE "locale_override" IS NOT NULL
    ON CONFLICT ("_locale","_parent_id") DO NOTHING;
  `)

  // 4. Drop the now-unlocalized columns
  await db.execute(sql`
    ALTER TABLE "rfw" DROP COLUMN IF EXISTS "locale_override";
    ALTER TABLE "_rfw_v" DROP COLUMN IF EXISTS "locale_override";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // 1. Restore the columns on the main tables
  await db.execute(sql`
    ALTER TABLE "rfw" ADD COLUMN IF NOT EXISTS "locale_override" varchar;
    ALTER TABLE "_rfw_v" ADD COLUMN IF NOT EXISTS "locale_override" varchar;
  `)

  // 2. Copy the 'en' value back; per-locale values other than 'en' are dropped,
  //    which is inherent to collapsing a localized field back to a single column.
  await db.execute(sql`
    UPDATE "rfw" m
    SET "locale_override" = l."locale_override"
    FROM "rfw_locales" l
    WHERE l."_parent_id" = m."id"
      AND l."_locale" = 'en';

    UPDATE "_rfw_v" m
    SET "locale_override" = l."locale_override"
    FROM "_rfw_v_locales" l
    WHERE l."_parent_id" = m."id"
      AND l."_locale" = 'en';
  `)

  // 3. Drop the locales tables (this block has no other localized field)
  await db.execute(sql`
    DROP TABLE IF EXISTS "rfw_locales" CASCADE;
    DROP TABLE IF EXISTS "_rfw_v_locales" CASCADE;
  `)
}
