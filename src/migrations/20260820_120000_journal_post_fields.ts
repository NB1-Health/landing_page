import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Journal content model (see JOURNAL_INTEGRATION_PLAN.md, Phase 1).
//
// Posts gains the fields the Journal card and article byline are generated from:
//   posts               primary_category_id, reviewer_id, featured, noindex
//   posts_locales       excerpt, read_time
//   posts_references    the numbered References list at the foot of an article
// plus the matching mirrors on the `_posts_v*` version tables.
//
// WHY THIS IS HAND-WRITTEN, NOT GENERATED
// The checked-in schema snapshot (`20260707_084620.json`) is the last one in the
// repo — every migration since has been hand-written without refreshing it. So
// `payload migrate:create` diffs the live config against a six-week-stale
// baseline and re-derives every hand-made change since, including destructive
// ones (it wanted to DROP "posts"."_status", which the localizeStatus migration
// deliberately moved to posts_locales). This migration therefore carries only
// the Journal DDL, taken from the generated output and trimmed.
//
// Column types, index names and constraint names are copied verbatim from what
// Payload generated, so a future snapshot resync sees no spurious diff.
//
// Note the id types: array rows in the live table use a varchar (UUID) primary
// key, while the version mirror uses serial + a separate `_uuid`. That
// asymmetry is Payload's own convention, not a mistake.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── live tables ──────────────────────────────────────────────────────────
    ALTER TABLE "posts"
      ADD COLUMN IF NOT EXISTS "primary_category_id" integer,
      ADD COLUMN IF NOT EXISTS "reviewer_id" integer,
      ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "noindex" boolean DEFAULT false;

    ALTER TABLE "posts_locales"
      ADD COLUMN IF NOT EXISTS "excerpt" varchar,
      ADD COLUMN IF NOT EXISTS "read_time" numeric;

    CREATE TABLE IF NOT EXISTS "posts_references" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "url" varchar
    );

    CREATE TABLE IF NOT EXISTS "posts_references_locales" (
      "citation" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    -- ── version tables ───────────────────────────────────────────────────────
    ALTER TABLE "_posts_v"
      ADD COLUMN IF NOT EXISTS "version_primary_category_id" integer,
      ADD COLUMN IF NOT EXISTS "version_reviewer_id" integer,
      ADD COLUMN IF NOT EXISTS "version_featured" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "version_noindex" boolean DEFAULT false;

    ALTER TABLE "_posts_v_locales"
      ADD COLUMN IF NOT EXISTS "version_excerpt" varchar,
      ADD COLUMN IF NOT EXISTS "version_read_time" numeric;

    CREATE TABLE IF NOT EXISTS "_posts_v_version_references" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "url" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_posts_v_version_references_locales" (
      "citation" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    -- ── foreign keys ─────────────────────────────────────────────────────────
    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_primary_category_id_categories_id_fk"
      FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_reviewer_id_authors_id_fk"
      FOREIGN KEY ("reviewer_id") REFERENCES "public"."authors"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "posts_references"
      ADD CONSTRAINT "posts_references_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "posts_references_locales"
      ADD CONSTRAINT "posts_references_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_references"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_posts_v"
      ADD CONSTRAINT "_posts_v_version_primary_category_id_categories_id_fk"
      FOREIGN KEY ("version_primary_category_id") REFERENCES "public"."categories"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "_posts_v"
      ADD CONSTRAINT "_posts_v_version_reviewer_id_authors_id_fk"
      FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."authors"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "_posts_v_version_references"
      ADD CONSTRAINT "_posts_v_version_references_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "_posts_v_version_references_locales"
      ADD CONSTRAINT "_posts_v_version_references_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_references"("id")
      ON DELETE cascade ON UPDATE no action;

    -- ── indexes ──────────────────────────────────────────────────────────────
    CREATE INDEX IF NOT EXISTS "posts_primary_category_idx"
      ON "posts" USING btree ("primary_category_id");
    CREATE INDEX IF NOT EXISTS "posts_reviewer_idx"
      ON "posts" USING btree ("reviewer_id");

    CREATE INDEX IF NOT EXISTS "posts_references_order_idx"
      ON "posts_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "posts_references_parent_id_idx"
      ON "posts_references" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "posts_references_locales_locale_parent_id_unique"
      ON "posts_references_locales" USING btree ("_locale","_parent_id");

    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_primary_category_idx"
      ON "_posts_v" USING btree ("version_primary_category_id");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_reviewer_idx"
      ON "_posts_v" USING btree ("version_reviewer_id");

    CREATE INDEX IF NOT EXISTS "_posts_v_version_references_order_idx"
      ON "_posts_v_version_references" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_posts_v_version_references_parent_id_idx"
      ON "_posts_v_version_references" USING btree ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "_posts_v_version_references_locales_locale_parent_id_unique"
      ON "_posts_v_version_references_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_posts_v_version_references_locales" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_references" CASCADE;
    DROP TABLE IF EXISTS "posts_references_locales" CASCADE;
    DROP TABLE IF EXISTS "posts_references" CASCADE;

    ALTER TABLE "_posts_v_locales"
      DROP COLUMN IF EXISTS "version_excerpt",
      DROP COLUMN IF EXISTS "version_read_time";

    ALTER TABLE "_posts_v"
      DROP CONSTRAINT IF EXISTS "_posts_v_version_primary_category_id_categories_id_fk",
      DROP CONSTRAINT IF EXISTS "_posts_v_version_reviewer_id_authors_id_fk";

    ALTER TABLE "_posts_v"
      DROP COLUMN IF EXISTS "version_primary_category_id",
      DROP COLUMN IF EXISTS "version_reviewer_id",
      DROP COLUMN IF EXISTS "version_featured",
      DROP COLUMN IF EXISTS "version_noindex";

    ALTER TABLE "posts_locales"
      DROP COLUMN IF EXISTS "excerpt",
      DROP COLUMN IF EXISTS "read_time";

    ALTER TABLE "posts"
      DROP CONSTRAINT IF EXISTS "posts_primary_category_id_categories_id_fk",
      DROP CONSTRAINT IF EXISTS "posts_reviewer_id_authors_id_fk";

    ALTER TABLE "posts"
      DROP COLUMN IF EXISTS "primary_category_id",
      DROP COLUMN IF EXISTS "reviewer_id",
      DROP COLUMN IF EXISTS "featured",
      DROP COLUMN IF EXISTS "noindex";
  `)
}
