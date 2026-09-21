import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Second wave of the help-article kit, for the blood-kit instructions page:
//
//   - new block  helpCallout (hcl) — the standalone "Before you start" /
//     "What to never do" panel
//   - helpSteps  steps[].flow  (hst_st_fl) — the numbered illustration strip
//   - helpSteps  steps[].guide (hst_st_gd) — the grey "too small / perfect"
//     example panel
//   - helpSteps  steps[].codes (hst_st_cd) — repeatable code chips, replacing
//     the single `code` group (kept, so the stool article is untouched)
//   - helpSteps  steps[].mediaPosition / mediaWidth / subnote
//
// Hand-written, like 20260904_120000_help_article_blocks: the schema snapshot
// in this folder is stale, so `migrate:create` diffs against it and re-emits
// all the drift since 20260827.
//
// Two naming rules taken from the existing schema rather than guessed:
//   - a block's `dbName` replaces the WHOLE table name in this adapter, which
//     is why every array dbName is fully qualified (hst_st_fl, not fl)
//   - a localized upload column lives on the `_locales` table, its FK named
//     after that table (hst_st_fl_locales_image_id_media_id_fk) while the INDEX
//     keeps the base-table prefix (hst_st_fl_image_idx). That asymmetry is
//     Payload's; see 20260904_140000_help_localize_images.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_hst_st_media_position" AS ENUM('below', 'above');
  CREATE TYPE "public"."enum__hst_st_v_media_position" AS ENUM('below', 'above');
  CREATE TYPE "public"."enum_hst_st_media_width" AS ENUM('full', 'medium', 'small');
  CREATE TYPE "public"."enum__hst_st_v_media_width" AS ENUM('full', 'medium', 'small');
  CREATE TYPE "public"."enum_hcl_variant" AS ENUM('info', 'quiet');
  CREATE TYPE "public"."enum__hcl_v_variant" AS ENUM('info', 'quiet');

  -- ── helpSteps: steps[].flow ────────────────────────────────────────────────
  CREATE TABLE "hst_st_fl" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "hst_st_fl_locales" (
   "image_id" integer,
   "label" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_hst_st_fl_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar
  );

  CREATE TABLE "_hst_st_fl_v_locales" (
   "image_id" integer,
   "label" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  -- ── helpSteps: steps[].guide ───────────────────────────────────────────────
  CREATE TABLE "hst_st_gd" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "hst_st_gd_locales" (
   "image_id" integer,
   "label" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_hst_st_gd_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar
  );

  CREATE TABLE "_hst_st_gd_v_locales" (
   "image_id" integer,
   "label" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  -- ── helpSteps: steps[].codes ───────────────────────────────────────────────
  -- The "value" column is a literal code sample and deliberately not
  -- localized, so it stays on the base table. (No backticks in here: this is
  -- inside a template literal.)
  CREATE TABLE "hst_st_cd" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "value" varchar
  );

  CREATE TABLE "hst_st_cd_locales" (
   "label" varchar DEFAULT 'Example',
   "link_label" varchar,
   "link_url" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_hst_st_cd_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "value" varchar,
   "_uuid" varchar
  );

  CREATE TABLE "_hst_st_cd_v_locales" (
   "label" varchar DEFAULT 'Example',
   "link_label" varchar,
   "link_url" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  -- ── helpCallout ───────────────────────────────────────────────────────────
  CREATE TABLE "hcl" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "variant" "enum_hcl_variant" DEFAULT 'info',
   "show_in_nav" boolean DEFAULT false,
   "anchor" varchar,
   "block_name" varchar
  );

  CREATE TABLE "hcl_locales" (
   "heading" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_hcl_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "variant" "enum__hcl_v_variant" DEFAULT 'info',
   "show_in_nav" boolean DEFAULT false,
   "anchor" varchar,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hcl_v_locales" (
   "heading" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  -- ── new columns on the existing step tables ───────────────────────────────
  ALTER TABLE "hst_st" ADD COLUMN "media_position" "enum_hst_st_media_position" DEFAULT 'below';
  ALTER TABLE "hst_st" ADD COLUMN "media_width" "enum_hst_st_media_width" DEFAULT 'full';
  ALTER TABLE "hst_st_locales" ADD COLUMN "subnote" varchar;
  ALTER TABLE "_hst_st_v" ADD COLUMN "media_position" "enum__hst_st_v_media_position" DEFAULT 'below';
  ALTER TABLE "_hst_st_v" ADD COLUMN "media_width" "enum__hst_st_v_media_width" DEFAULT 'full';
  ALTER TABLE "_hst_st_v_locales" ADD COLUMN "subnote" varchar;

  -- ── constraints ───────────────────────────────────────────────────────────
  ALTER TABLE "hst_st_fl" ADD CONSTRAINT "hst_st_fl_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_fl_locales" ADD CONSTRAINT "hst_st_fl_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hst_st_fl_locales" ADD CONSTRAINT "hst_st_fl_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st_fl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_fl_v" ADD CONSTRAINT "_hst_st_fl_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_fl_v_locales" ADD CONSTRAINT "_hst_st_fl_v_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hst_st_fl_v_locales" ADD CONSTRAINT "_hst_st_fl_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_fl_v"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "hst_st_gd" ADD CONSTRAINT "hst_st_gd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_gd_locales" ADD CONSTRAINT "hst_st_gd_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hst_st_gd_locales" ADD CONSTRAINT "hst_st_gd_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st_gd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_gd_v" ADD CONSTRAINT "_hst_st_gd_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_gd_v_locales" ADD CONSTRAINT "_hst_st_gd_v_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hst_st_gd_v_locales" ADD CONSTRAINT "_hst_st_gd_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_gd_v"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "hst_st_cd" ADD CONSTRAINT "hst_st_cd_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_cd_locales" ADD CONSTRAINT "hst_st_cd_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st_cd"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_cd_v" ADD CONSTRAINT "_hst_st_cd_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_cd_v_locales" ADD CONSTRAINT "_hst_st_cd_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_cd_v"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "hcl" ADD CONSTRAINT "hcl_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hcl_locales" ADD CONSTRAINT "hcl_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hcl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hcl_v" ADD CONSTRAINT "_hcl_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hcl_v_locales" ADD CONSTRAINT "_hcl_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hcl_v"("id") ON DELETE cascade ON UPDATE no action;

  -- ── indexes ───────────────────────────────────────────────────────────────
  CREATE INDEX "hst_st_fl_order_idx" ON "hst_st_fl" USING btree ("_order");
  CREATE INDEX "hst_st_fl_parent_id_idx" ON "hst_st_fl" USING btree ("_parent_id");
  CREATE INDEX "hst_st_fl_image_idx" ON "hst_st_fl_locales" USING btree ("image_id");
  CREATE UNIQUE INDEX "hst_st_fl_locales_locale_parent_id_unique" ON "hst_st_fl_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_st_fl_v_order_idx" ON "_hst_st_fl_v" USING btree ("_order");
  CREATE INDEX "_hst_st_fl_v_parent_id_idx" ON "_hst_st_fl_v" USING btree ("_parent_id");
  CREATE INDEX "_hst_st_fl_v_image_idx" ON "_hst_st_fl_v_locales" USING btree ("image_id");
  CREATE UNIQUE INDEX "_hst_st_fl_v_locales_locale_parent_id_unique" ON "_hst_st_fl_v_locales" USING btree ("_locale","_parent_id");

  CREATE INDEX "hst_st_gd_order_idx" ON "hst_st_gd" USING btree ("_order");
  CREATE INDEX "hst_st_gd_parent_id_idx" ON "hst_st_gd" USING btree ("_parent_id");
  CREATE INDEX "hst_st_gd_image_idx" ON "hst_st_gd_locales" USING btree ("image_id");
  CREATE UNIQUE INDEX "hst_st_gd_locales_locale_parent_id_unique" ON "hst_st_gd_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_st_gd_v_order_idx" ON "_hst_st_gd_v" USING btree ("_order");
  CREATE INDEX "_hst_st_gd_v_parent_id_idx" ON "_hst_st_gd_v" USING btree ("_parent_id");
  CREATE INDEX "_hst_st_gd_v_image_idx" ON "_hst_st_gd_v_locales" USING btree ("image_id");
  CREATE UNIQUE INDEX "_hst_st_gd_v_locales_locale_parent_id_unique" ON "_hst_st_gd_v_locales" USING btree ("_locale","_parent_id");

  CREATE INDEX "hst_st_cd_order_idx" ON "hst_st_cd" USING btree ("_order");
  CREATE INDEX "hst_st_cd_parent_id_idx" ON "hst_st_cd" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hst_st_cd_locales_locale_parent_id_unique" ON "hst_st_cd_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_st_cd_v_order_idx" ON "_hst_st_cd_v" USING btree ("_order");
  CREATE INDEX "_hst_st_cd_v_parent_id_idx" ON "_hst_st_cd_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hst_st_cd_v_locales_locale_parent_id_unique" ON "_hst_st_cd_v_locales" USING btree ("_locale","_parent_id");

  CREATE INDEX "hcl_order_idx" ON "hcl" USING btree ("_order");
  CREATE INDEX "hcl_parent_id_idx" ON "hcl" USING btree ("_parent_id");
  CREATE INDEX "hcl_path_idx" ON "hcl" USING btree ("_path");
  CREATE UNIQUE INDEX "hcl_locales_locale_parent_id_unique" ON "hcl_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hcl_v_order_idx" ON "_hcl_v" USING btree ("_order");
  CREATE INDEX "_hcl_v_parent_id_idx" ON "_hcl_v" USING btree ("_parent_id");
  CREATE INDEX "_hcl_v_path_idx" ON "_hcl_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hcl_v_locales_locale_parent_id_unique" ON "_hcl_v_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "hst_st_fl_locales";
  DROP TABLE IF EXISTS "hst_st_fl";
  DROP TABLE IF EXISTS "_hst_st_fl_v_locales";
  DROP TABLE IF EXISTS "_hst_st_fl_v";
  DROP TABLE IF EXISTS "hst_st_gd_locales";
  DROP TABLE IF EXISTS "hst_st_gd";
  DROP TABLE IF EXISTS "_hst_st_gd_v_locales";
  DROP TABLE IF EXISTS "_hst_st_gd_v";
  DROP TABLE IF EXISTS "hst_st_cd_locales";
  DROP TABLE IF EXISTS "hst_st_cd";
  DROP TABLE IF EXISTS "_hst_st_cd_v_locales";
  DROP TABLE IF EXISTS "_hst_st_cd_v";
  DROP TABLE IF EXISTS "hcl_locales";
  DROP TABLE IF EXISTS "hcl";
  DROP TABLE IF EXISTS "_hcl_v_locales";
  DROP TABLE IF EXISTS "_hcl_v";

  ALTER TABLE "hst_st" DROP COLUMN IF EXISTS "media_position";
  ALTER TABLE "hst_st" DROP COLUMN IF EXISTS "media_width";
  ALTER TABLE "hst_st_locales" DROP COLUMN IF EXISTS "subnote";
  ALTER TABLE "_hst_st_v" DROP COLUMN IF EXISTS "media_position";
  ALTER TABLE "_hst_st_v" DROP COLUMN IF EXISTS "media_width";
  ALTER TABLE "_hst_st_v_locales" DROP COLUMN IF EXISTS "subnote";

  DROP TYPE IF EXISTS "public"."enum_hst_st_media_position";
  DROP TYPE IF EXISTS "public"."enum__hst_st_v_media_position";
  DROP TYPE IF EXISTS "public"."enum_hst_st_media_width";
  DROP TYPE IF EXISTS "public"."enum__hst_st_v_media_width";
  DROP TYPE IF EXISTS "public"."enum_hcl_variant";
  DROP TYPE IF EXISTS "public"."enum__hcl_v_variant";
  `)
}
