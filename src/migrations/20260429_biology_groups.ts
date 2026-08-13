import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── 1. Drop old biology_eyebrow columns ───────────────────────────────────
  await db.execute(sql`
    ALTER TABLE "pages_blocks_evolution_band_locales"
      DROP COLUMN IF EXISTS "biology_eyebrow";
    ALTER TABLE "_pages_v_blocks_evolution_band_locales"
      DROP COLUMN IF EXISTS "biology_eyebrow";
    ALTER TABLE "pages_blocks_evolution_band_variants_locales"
      DROP COLUMN IF EXISTS "biology_eyebrow";
    ALTER TABLE "_pages_v_blocks_evolution_band_variants_locales"
      DROP COLUMN IF EXISTS "biology_eyebrow";
  `)

  // ── 2. Drop old biologyDeltas tables ─────────────────────────────────────
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_biology_deltas_locales" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_biology_deltas" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_biology_deltas_locales" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_biology_deltas" CASCADE;
  `)

  // ── 3. Create direction enums ─────────────────────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_pages_blocks_evolution_band_bio_groups_rows_direction"
        AS ENUM ('up', 'down', 'new');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "enum__pages_v_blocks_evolution_band_bio_groups_rows_direction"
        AS ENUM ('up', 'down', 'new');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  // ── 4. Create biologyGroups tables (live) ────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_evolution_band_bio_groups" (
      "_order"     integer NOT NULL,
      "_parent_id" varchar NOT NULL
        REFERENCES "pages_blocks_evolution_band" ("id") ON DELETE CASCADE,
      "id"         varchar PRIMARY KEY,
      "_uuid"      varchar
    );
    CREATE INDEX IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_order_idx"
      ON "pages_blocks_evolution_band_bio_groups" ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_parent_idx"
      ON "pages_blocks_evolution_band_bio_groups" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_locales" (
      "eyebrow"    varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
        REFERENCES "pages_blocks_evolution_band_bio_groups" ("id") ON DELETE CASCADE,
      CONSTRAINT "pages_blocks_evolution_band_bio_groups_locales_unique"
        UNIQUE ("_parent_id", "_locale")
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_rows" (
      "_order"     integer NOT NULL,
      "_parent_id" varchar NOT NULL
        REFERENCES "pages_blocks_evolution_band_bio_groups" ("id") ON DELETE CASCADE,
      "id"         varchar PRIMARY KEY,
      "_uuid"      varchar,
      "delta"      varchar,
      "direction"  "enum_pages_blocks_evolution_band_bio_groups_rows_direction"
    );
    CREATE INDEX IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_rows_order_idx"
      ON "pages_blocks_evolution_band_bio_groups_rows" ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_rows_parent_idx"
      ON "pages_blocks_evolution_band_bio_groups_rows" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_evolution_band_bio_groups_rows_locales" (
      "label"      varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
        REFERENCES "pages_blocks_evolution_band_bio_groups_rows" ("id") ON DELETE CASCADE,
      CONSTRAINT "pages_blocks_evolution_band_bio_groups_rows_locales_unique"
        UNIQUE ("_parent_id", "_locale")
    );
  `)

  // ── 5. Create biologyGroups tables (versions) ────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_pages_v_blocks_evolution_band" ("id") ON DELETE CASCADE,
      "id"         serial PRIMARY KEY,
      "_uuid"      varchar
    );
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_order_idx"
      ON "_pages_v_blocks_evolution_band_bio_groups" ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_parent_idx"
      ON "_pages_v_blocks_evolution_band_bio_groups" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_locales" (
      "eyebrow"    varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_pages_v_blocks_evolution_band_bio_groups" ("id") ON DELETE CASCADE,
      CONSTRAINT "_pages_v_blocks_evolution_band_bio_groups_locales_unique"
        UNIQUE ("_parent_id", "_locale")
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_pages_v_blocks_evolution_band_bio_groups" ("id") ON DELETE CASCADE,
      "id"         serial PRIMARY KEY,
      "_uuid"      varchar,
      "delta"      varchar,
      "direction"  "enum__pages_v_blocks_evolution_band_bio_groups_rows_direction"
    );
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows_order_idx"
      ON "_pages_v_blocks_evolution_band_bio_groups_rows" ("_order");
    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows_parent_idx"
      ON "_pages_v_blocks_evolution_band_bio_groups_rows" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows_locales" (
      "label"      varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
        REFERENCES "_pages_v_blocks_evolution_band_bio_groups_rows" ("id") ON DELETE CASCADE,
      CONSTRAINT "_pages_v_blocks_evolution_band_bio_groups_rows_locales_unique"
        UNIQUE ("_parent_id", "_locale")
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_bio_groups_rows_locales" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_bio_groups_rows" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_bio_groups_locales" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_evolution_band_bio_groups" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows_locales" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_rows" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups_locales" CASCADE;
    DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_bio_groups" CASCADE;
    DROP TYPE IF EXISTS "enum_pages_blocks_evolution_band_bio_groups_rows_direction";
    DROP TYPE IF EXISTS "enum__pages_v_blocks_evolution_band_bio_groups_rows_direction";
  `)

  await db.execute(sql`
    ALTER TABLE "pages_blocks_evolution_band_locales"             ADD COLUMN IF NOT EXISTS "biology_eyebrow" varchar;
    ALTER TABLE "_pages_v_blocks_evolution_band_locales"          ADD COLUMN IF NOT EXISTS "biology_eyebrow" varchar;
    ALTER TABLE "pages_blocks_evolution_band_variants_locales"    ADD COLUMN IF NOT EXISTS "biology_eyebrow" varchar;
    ALTER TABLE "_pages_v_blocks_evolution_band_variants_locales" ADD COLUMN IF NOT EXISTS "biology_eyebrow" varchar;
  `)
}
