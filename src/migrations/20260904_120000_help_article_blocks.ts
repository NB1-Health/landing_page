import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Help / FAQ article block kit: helpNav (hnv), helpHero (hhr), helpSteps (hst),
// helpFaq (hfq), helpCta (hct), plus the nested arrays hst_st (steps),
// hst_st_nt (step callouts) and hfq_qs (questions).
//
// Hand-written, like 20260828_120000_customer_reviews_block. The last schema
// snapshot in this folder is 20260827, and every schema change since then has
// been a hand-written migration, so `migrate:create` diffs against a stale
// snapshot and re-emits all of that drift (an it-locale enum, customerReviews,
// the editor role...). The statements below were taken verbatim from what the
// generator produced for these blocks and reduced to the new objects only.
//
// NOTE on dbName: in this adapter a block's `dbName` replaces the WHOLE table
// name (see rff, prh, cvr), not just the block segment — which is why the array
// dbNames are fully qualified (hst_st, not st).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_hst_st_nt_variant" AS ENUM('info', 'quiet');
  CREATE TYPE "public"."enum__hst_st_nt_v_variant" AS ENUM('info', 'quiet');

  CREATE TABLE "hhr" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "image_id" integer,
   "block_name" varchar
  );

  CREATE TABLE "hhr_locales" (
   "also_read_tag" varchar DEFAULT 'Also read',
   "also_read_label" varchar,
   "also_read_url" varchar,
   "eyebrow" varchar,
   "heading" varchar,
   "dek" varchar,
   "image_caption" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hnv" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "min_headings" numeric DEFAULT 2,
   "block_name" varchar
  );

  CREATE TABLE "hnv_locales" (
   "label" varchar DEFAULT 'On this page',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hst_st_nt" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "variant" "enum_hst_st_nt_variant" DEFAULT 'info'
  );

  CREATE TABLE "hst_st_nt_locales" (
   "title" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hst_st" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "anchor" varchar,
   "code_value" varchar,
   "media_id" integer
  );

  CREATE TABLE "hst_st_locales" (
   "title" varchar,
   "body" jsonb,
   "code_label" varchar DEFAULT 'Code sample',
   "code_link_label" varchar,
   "code_link_url" varchar,
   "media_caption" varchar,
   "media_placeholder" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hst" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "intro_image_id" integer,
   "block_name" varchar
  );

  CREATE TABLE "hst_locales" (
   "intro_image_caption" varchar,
   "intro" jsonb,
   "outro_done_text" varchar,
   "outro_note" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hfq_qs" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "hfq_qs_locales" (
   "question" varchar,
   "answer" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hfq" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "anchor" varchar DEFAULT 'faq',
   "block_name" varchar
  );

  CREATE TABLE "hfq_locales" (
   "title" varchar DEFAULT 'Common questions',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "hct" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "block_name" varchar
  );

  CREATE TABLE "hct_locales" (
   "heading" varchar,
   "body" varchar,
   "fine" jsonb,
   "cta_label" varchar DEFAULT 'Contact support',
   "cta_url" varchar DEFAULT '/contact',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_hhr_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "image_id" integer,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hhr_v_locales" (
   "also_read_tag" varchar DEFAULT 'Also read',
   "also_read_label" varchar,
   "also_read_url" varchar,
   "eyebrow" varchar,
   "heading" varchar,
   "dek" varchar,
   "image_caption" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hnv_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "min_headings" numeric DEFAULT 2,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hnv_v_locales" (
   "label" varchar DEFAULT 'On this page',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hst_st_nt_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "variant" "enum__hst_st_nt_v_variant" DEFAULT 'info',
   "_uuid" varchar
  );

  CREATE TABLE "_hst_st_nt_v_locales" (
   "title" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hst_st_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "anchor" varchar,
   "code_value" varchar,
   "media_id" integer,
   "_uuid" varchar
  );

  CREATE TABLE "_hst_st_v_locales" (
   "title" varchar,
   "body" jsonb,
   "code_label" varchar DEFAULT 'Code sample',
   "code_link_label" varchar,
   "code_link_url" varchar,
   "media_caption" varchar,
   "media_placeholder" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hst_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "intro_image_id" integer,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hst_v_locales" (
   "intro_image_caption" varchar,
   "intro" jsonb,
   "outro_done_text" varchar,
   "outro_note" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hfq_qs_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar
  );

  CREATE TABLE "_hfq_qs_v_locales" (
   "question" varchar,
   "answer" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hfq_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "reserve_toc_space" boolean DEFAULT true,
   "anchor" varchar DEFAULT 'faq',
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hfq_v_locales" (
   "title" varchar DEFAULT 'Common questions',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_hct_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_hct_v_locales" (
   "heading" varchar,
   "body" varchar,
   "fine" jsonb,
   "cta_label" varchar DEFAULT 'Contact support',
   "cta_url" varchar DEFAULT '/contact',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  ALTER TABLE "hhr" ADD CONSTRAINT "hhr_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hhr" ADD CONSTRAINT "hhr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hhr_locales" ADD CONSTRAINT "hhr_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hhr"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hnv" ADD CONSTRAINT "hnv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hnv_locales" ADD CONSTRAINT "hnv_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hnv"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_nt" ADD CONSTRAINT "hst_st_nt_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_nt_locales" ADD CONSTRAINT "hst_st_nt_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st_nt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st" ADD CONSTRAINT "hst_st_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hst_st" ADD CONSTRAINT "hst_st_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_st_locales" ADD CONSTRAINT "hst_st_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst_st"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst" ADD CONSTRAINT "hst_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hst" ADD CONSTRAINT "hst_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hst_locales" ADD CONSTRAINT "hst_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hst"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hfq_qs" ADD CONSTRAINT "hfq_qs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hfq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hfq_qs_locales" ADD CONSTRAINT "hfq_qs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hfq_qs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hfq" ADD CONSTRAINT "hfq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hfq_locales" ADD CONSTRAINT "hfq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hfq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hct" ADD CONSTRAINT "hct_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hct_locales" ADD CONSTRAINT "hct_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hct"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hhr_v" ADD CONSTRAINT "_hhr_v_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hhr_v" ADD CONSTRAINT "_hhr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hhr_v_locales" ADD CONSTRAINT "_hhr_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hhr_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hnv_v" ADD CONSTRAINT "_hnv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hnv_v_locales" ADD CONSTRAINT "_hnv_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hnv_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_nt_v" ADD CONSTRAINT "_hst_st_nt_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_nt_v_locales" ADD CONSTRAINT "_hst_st_nt_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_nt_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_v" ADD CONSTRAINT "_hst_st_v_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hst_st_v" ADD CONSTRAINT "_hst_st_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_st_v_locales" ADD CONSTRAINT "_hst_st_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_st_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_v" ADD CONSTRAINT "_hst_v_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_hst_v" ADD CONSTRAINT "_hst_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hst_v_locales" ADD CONSTRAINT "_hst_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hst_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hfq_qs_v" ADD CONSTRAINT "_hfq_qs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hfq_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hfq_qs_v_locales" ADD CONSTRAINT "_hfq_qs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hfq_qs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hfq_v" ADD CONSTRAINT "_hfq_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hfq_v_locales" ADD CONSTRAINT "_hfq_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hfq_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hct_v" ADD CONSTRAINT "_hct_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hct_v_locales" ADD CONSTRAINT "_hct_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hct_v"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "hhr_order_idx" ON "hhr" USING btree ("_order");
  CREATE INDEX "hhr_parent_id_idx" ON "hhr" USING btree ("_parent_id");
  CREATE INDEX "hhr_path_idx" ON "hhr" USING btree ("_path");
  CREATE INDEX "hhr_image_idx" ON "hhr" USING btree ("image_id");
  CREATE UNIQUE INDEX "hhr_locales_locale_parent_id_unique" ON "hhr_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hnv_order_idx" ON "hnv" USING btree ("_order");
  CREATE INDEX "hnv_parent_id_idx" ON "hnv" USING btree ("_parent_id");
  CREATE INDEX "hnv_path_idx" ON "hnv" USING btree ("_path");
  CREATE UNIQUE INDEX "hnv_locales_locale_parent_id_unique" ON "hnv_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hst_st_nt_order_idx" ON "hst_st_nt" USING btree ("_order");
  CREATE INDEX "hst_st_nt_parent_id_idx" ON "hst_st_nt" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hst_st_nt_locales_locale_parent_id_unique" ON "hst_st_nt_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hst_st_order_idx" ON "hst_st" USING btree ("_order");
  CREATE INDEX "hst_st_parent_id_idx" ON "hst_st" USING btree ("_parent_id");
  CREATE INDEX "hst_st_media_idx" ON "hst_st" USING btree ("media_id");
  CREATE UNIQUE INDEX "hst_st_locales_locale_parent_id_unique" ON "hst_st_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hst_order_idx" ON "hst" USING btree ("_order");
  CREATE INDEX "hst_parent_id_idx" ON "hst" USING btree ("_parent_id");
  CREATE INDEX "hst_path_idx" ON "hst" USING btree ("_path");
  CREATE INDEX "hst_intro_image_idx" ON "hst" USING btree ("intro_image_id");
  CREATE UNIQUE INDEX "hst_locales_locale_parent_id_unique" ON "hst_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hfq_qs_order_idx" ON "hfq_qs" USING btree ("_order");
  CREATE INDEX "hfq_qs_parent_id_idx" ON "hfq_qs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hfq_qs_locales_locale_parent_id_unique" ON "hfq_qs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hfq_order_idx" ON "hfq" USING btree ("_order");
  CREATE INDEX "hfq_parent_id_idx" ON "hfq" USING btree ("_parent_id");
  CREATE INDEX "hfq_path_idx" ON "hfq" USING btree ("_path");
  CREATE UNIQUE INDEX "hfq_locales_locale_parent_id_unique" ON "hfq_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hct_order_idx" ON "hct" USING btree ("_order");
  CREATE INDEX "hct_parent_id_idx" ON "hct" USING btree ("_parent_id");
  CREATE INDEX "hct_path_idx" ON "hct" USING btree ("_path");
  CREATE UNIQUE INDEX "hct_locales_locale_parent_id_unique" ON "hct_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hhr_v_order_idx" ON "_hhr_v" USING btree ("_order");
  CREATE INDEX "_hhr_v_parent_id_idx" ON "_hhr_v" USING btree ("_parent_id");
  CREATE INDEX "_hhr_v_path_idx" ON "_hhr_v" USING btree ("_path");
  CREATE INDEX "_hhr_v_image_idx" ON "_hhr_v" USING btree ("image_id");
  CREATE UNIQUE INDEX "_hhr_v_locales_locale_parent_id_unique" ON "_hhr_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hnv_v_order_idx" ON "_hnv_v" USING btree ("_order");
  CREATE INDEX "_hnv_v_parent_id_idx" ON "_hnv_v" USING btree ("_parent_id");
  CREATE INDEX "_hnv_v_path_idx" ON "_hnv_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hnv_v_locales_locale_parent_id_unique" ON "_hnv_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_st_nt_v_order_idx" ON "_hst_st_nt_v" USING btree ("_order");
  CREATE INDEX "_hst_st_nt_v_parent_id_idx" ON "_hst_st_nt_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hst_st_nt_v_locales_locale_parent_id_unique" ON "_hst_st_nt_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_st_v_order_idx" ON "_hst_st_v" USING btree ("_order");
  CREATE INDEX "_hst_st_v_parent_id_idx" ON "_hst_st_v" USING btree ("_parent_id");
  CREATE INDEX "_hst_st_v_media_idx" ON "_hst_st_v" USING btree ("media_id");
  CREATE UNIQUE INDEX "_hst_st_v_locales_locale_parent_id_unique" ON "_hst_st_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hst_v_order_idx" ON "_hst_v" USING btree ("_order");
  CREATE INDEX "_hst_v_parent_id_idx" ON "_hst_v" USING btree ("_parent_id");
  CREATE INDEX "_hst_v_path_idx" ON "_hst_v" USING btree ("_path");
  CREATE INDEX "_hst_v_intro_image_idx" ON "_hst_v" USING btree ("intro_image_id");
  CREATE UNIQUE INDEX "_hst_v_locales_locale_parent_id_unique" ON "_hst_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hfq_qs_v_order_idx" ON "_hfq_qs_v" USING btree ("_order");
  CREATE INDEX "_hfq_qs_v_parent_id_idx" ON "_hfq_qs_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hfq_qs_v_locales_locale_parent_id_unique" ON "_hfq_qs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hfq_v_order_idx" ON "_hfq_v" USING btree ("_order");
  CREATE INDEX "_hfq_v_parent_id_idx" ON "_hfq_v" USING btree ("_parent_id");
  CREATE INDEX "_hfq_v_path_idx" ON "_hfq_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hfq_v_locales_locale_parent_id_unique" ON "_hfq_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hct_v_order_idx" ON "_hct_v" USING btree ("_order");
  CREATE INDEX "_hct_v_parent_id_idx" ON "_hct_v" USING btree ("_parent_id");
  CREATE INDEX "_hct_v_path_idx" ON "_hct_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_hct_v_locales_locale_parent_id_unique" ON "_hct_v_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "hst_st_nt_locales";
  DROP TABLE IF EXISTS "hst_st_nt";
  DROP TABLE IF EXISTS "hst_st_locales";
  DROP TABLE IF EXISTS "hst_st";
  DROP TABLE IF EXISTS "hst_locales";
  DROP TABLE IF EXISTS "hst";
  DROP TABLE IF EXISTS "hfq_qs_locales";
  DROP TABLE IF EXISTS "hfq_qs";
  DROP TABLE IF EXISTS "hfq_locales";
  DROP TABLE IF EXISTS "hfq";
  DROP TABLE IF EXISTS "hnv_locales";
  DROP TABLE IF EXISTS "hnv";
  DROP TABLE IF EXISTS "hhr_locales";
  DROP TABLE IF EXISTS "hhr";
  DROP TABLE IF EXISTS "hct_locales";
  DROP TABLE IF EXISTS "hct";
  DROP TABLE IF EXISTS "_hst_st_nt_v_locales";
  DROP TABLE IF EXISTS "_hst_st_nt_v";
  DROP TABLE IF EXISTS "_hst_st_v_locales";
  DROP TABLE IF EXISTS "_hst_st_v";
  DROP TABLE IF EXISTS "_hst_v_locales";
  DROP TABLE IF EXISTS "_hst_v";
  DROP TABLE IF EXISTS "_hfq_qs_v_locales";
  DROP TABLE IF EXISTS "_hfq_qs_v";
  DROP TABLE IF EXISTS "_hfq_v_locales";
  DROP TABLE IF EXISTS "_hfq_v";
  DROP TABLE IF EXISTS "_hnv_v_locales";
  DROP TABLE IF EXISTS "_hnv_v";
  DROP TABLE IF EXISTS "_hhr_v_locales";
  DROP TABLE IF EXISTS "_hhr_v";
  DROP TABLE IF EXISTS "_hct_v_locales";
  DROP TABLE IF EXISTS "_hct_v";

  DROP TYPE IF EXISTS "public"."enum_hst_st_nt_variant";
  DROP TYPE IF EXISTS "public"."enum__hst_st_nt_v_variant";
  `)
}
