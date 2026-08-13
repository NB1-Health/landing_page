import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── 1. Drop wrong version tables (wrongly named in previous migration) ────
  await db.execute(sql`
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows_locales" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_locales" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups" CASCADE;
    DROP TYPE IF EXISTS "enum__pages_v_blocks_evolution_band_bio_groups_rows_direction";
  `)

  // ── 2. Create correct direction enum for version table ───────────────────
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum__bio_groups_v_rows_direction" AS ENUM ('up', 'down', 'new');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  // ── 3. Create correctly named version tables ─────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_bio_groups_v" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         serial PRIMARY KEY,
      "_uuid"      varchar
    );
    -- FK to _pages_v_blocks_evolution_band is added by migration 20260430_074534
    CREATE INDEX IF NOT EXISTS "_bio_groups_v_order_idx"
      ON "_bio_groups_v" ("_order");
    CREATE INDEX IF NOT EXISTS "_bio_groups_v_parent_idx"
      ON "_bio_groups_v" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_bio_groups_v_locales" (
      "eyebrow"    varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_bio_groups_v" ("id") ON DELETE CASCADE,
      CONSTRAINT "_bio_groups_v_locales_unique" UNIQUE ("_parent_id", "_locale")
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_bio_groups_v_rows" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_bio_groups_v" ("id") ON DELETE CASCADE,
      "id"         serial PRIMARY KEY,
      "_uuid"      varchar,
      "delta"      varchar,
      "direction"  "enum__bio_groups_v_rows_direction"
    );
    CREATE INDEX IF NOT EXISTS "_bio_groups_v_rows_order_idx"
      ON "_bio_groups_v_rows" ("_order");
    CREATE INDEX IF NOT EXISTS "_bio_groups_v_rows_parent_idx"
      ON "_bio_groups_v_rows" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_bio_groups_v_rows_locales" (
      "label"      varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_bio_groups_v_rows" ("id") ON DELETE CASCADE,
      CONSTRAINT "_bio_groups_v_rows_locales_unique" UNIQUE ("_parent_id", "_locale")
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_bio_groups_v_rows_locales" CASCADE;
    DROP TABLE IF EXISTS "_bio_groups_v_rows" CASCADE;
    DROP TABLE IF EXISTS "_bio_groups_v_locales" CASCADE;
    DROP TABLE IF EXISTS "_bio_groups_v" CASCADE;
    DROP TYPE IF EXISTS "enum__bio_groups_v_rows_direction";
  `)
}
