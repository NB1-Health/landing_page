import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lexicon_categories_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lexicon_categories_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
  CREATE TYPE "public"."enum__lexicon_categories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lexicon_terms_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lexicon_terms_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
  CREATE TYPE "public"."enum__lexicon_terms_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "lexicon_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"published_at" timestamp(3) with time zone,
  	"noindex" boolean DEFAULT false,
  	"external_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lexicon_categories_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"intro" varchar,
  	"example_terms" varchar,
  	"_status" "enum_lexicon_categories_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lexicon_categories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_key" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_noindex" boolean DEFAULT false,
  	"version_external_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lexicon_categories_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_lexicon_categories_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_intro" varchar,
  	"version_example_terms" varchar,
  	"version__status" "enum__lexicon_categories_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lexicon_terms_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "lexicon_terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"italic_name" boolean DEFAULT false,
  	"hub_id" integer,
  	"category_id" integer,
  	"is_condition" boolean DEFAULT false,
  	"reviewer_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"published_at" timestamp(3) with time zone,
  	"noindex" boolean DEFAULT false,
  	"external_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lexicon_terms_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"also_known_as" varchar,
  	"definition" varchar,
  	"in_simple_terms_body" jsonb,
  	"scientific_background_body" jsonb,
  	"role_in_gut_health_body" jsonb,
  	"_status" "enum_lexicon_terms_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lexicon_terms_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"lexicon_terms_id" integer
  );
  
  CREATE TABLE "_lexicon_terms_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lexicon_terms_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_italic_name" boolean DEFAULT false,
  	"version_hub_id" integer,
  	"version_category_id" integer,
  	"version_is_condition" boolean DEFAULT false,
  	"version_reviewer_id" integer,
  	"version_reviewed_at" timestamp(3) with time zone,
  	"version_published_at" timestamp(3) with time zone,
  	"version_noindex" boolean DEFAULT false,
  	"version_external_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lexicon_terms_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_lexicon_terms_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_also_known_as" varchar,
  	"version_definition" varchar,
  	"version_in_simple_terms_body" jsonb,
  	"version_scientific_background_body" jsonb,
  	"version_role_in_gut_health_body" jsonb,
  	"version__status" "enum__lexicon_terms_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lexicon_terms_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"lexicon_terms_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lexicon_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "lexicon_terms_id" integer;
  ALTER TABLE "lexicon_categories_locales" ADD CONSTRAINT "lexicon_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lexicon_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lexicon_categories_v" ADD CONSTRAINT "_lexicon_categories_v_parent_id_lexicon_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lexicon_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lexicon_categories_v_locales" ADD CONSTRAINT "_lexicon_categories_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lexicon_categories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lexicon_terms_references" ADD CONSTRAINT "lexicon_terms_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lexicon_terms" ADD CONSTRAINT "lexicon_terms_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lexicon_terms" ADD CONSTRAINT "lexicon_terms_category_id_lexicon_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."lexicon_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lexicon_terms" ADD CONSTRAINT "lexicon_terms_reviewer_id_authors_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lexicon_terms_locales" ADD CONSTRAINT "lexicon_terms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lexicon_terms_rels" ADD CONSTRAINT "lexicon_terms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lexicon_terms_rels" ADD CONSTRAINT "lexicon_terms_rels_lexicon_terms_fk" FOREIGN KEY ("lexicon_terms_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v_version_references" ADD CONSTRAINT "_lexicon_terms_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lexicon_terms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v" ADD CONSTRAINT "_lexicon_terms_v_parent_id_lexicon_terms_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v" ADD CONSTRAINT "_lexicon_terms_v_version_hub_id_hubs_id_fk" FOREIGN KEY ("version_hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v" ADD CONSTRAINT "_lexicon_terms_v_version_category_id_lexicon_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."lexicon_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v" ADD CONSTRAINT "_lexicon_terms_v_version_reviewer_id_authors_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v_locales" ADD CONSTRAINT "_lexicon_terms_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lexicon_terms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v_rels" ADD CONSTRAINT "_lexicon_terms_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lexicon_terms_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lexicon_terms_v_rels" ADD CONSTRAINT "_lexicon_terms_v_rels_lexicon_terms_fk" FOREIGN KEY ("lexicon_terms_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "lexicon_categories_key_idx" ON "lexicon_categories" USING btree ("key");
  CREATE UNIQUE INDEX "lexicon_categories_external_id_idx" ON "lexicon_categories" USING btree ("external_id");
  CREATE INDEX "lexicon_categories_updated_at_idx" ON "lexicon_categories" USING btree ("updated_at");
  CREATE INDEX "lexicon_categories_created_at_idx" ON "lexicon_categories" USING btree ("created_at");
  CREATE INDEX "lexicon_categories_slug_idx" ON "lexicon_categories_locales" USING btree ("slug","_locale");
  CREATE INDEX "lexicon_categories__status_idx" ON "lexicon_categories_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "lexicon_categories_locales_locale_parent_id_unique" ON "lexicon_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lexicon_categories_v_parent_idx" ON "_lexicon_categories_v" USING btree ("parent_id");
  CREATE INDEX "_lexicon_categories_v_version_version_key_idx" ON "_lexicon_categories_v" USING btree ("version_key");
  CREATE INDEX "_lexicon_categories_v_version_version_external_id_idx" ON "_lexicon_categories_v" USING btree ("version_external_id");
  CREATE INDEX "_lexicon_categories_v_version_version_updated_at_idx" ON "_lexicon_categories_v" USING btree ("version_updated_at");
  CREATE INDEX "_lexicon_categories_v_version_version_created_at_idx" ON "_lexicon_categories_v" USING btree ("version_created_at");
  CREATE INDEX "_lexicon_categories_v_created_at_idx" ON "_lexicon_categories_v" USING btree ("created_at");
  CREATE INDEX "_lexicon_categories_v_updated_at_idx" ON "_lexicon_categories_v" USING btree ("updated_at");
  CREATE INDEX "_lexicon_categories_v_snapshot_idx" ON "_lexicon_categories_v" USING btree ("snapshot");
  CREATE INDEX "_lexicon_categories_v_published_locale_idx" ON "_lexicon_categories_v" USING btree ("published_locale");
  CREATE INDEX "_lexicon_categories_v_latest_idx" ON "_lexicon_categories_v" USING btree ("latest");
  CREATE INDEX "_lexicon_categories_v_version_version_slug_idx" ON "_lexicon_categories_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_lexicon_categories_v_version_version__status_idx" ON "_lexicon_categories_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_lexicon_categories_v_locales_locale_parent_id_unique" ON "_lexicon_categories_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lexicon_terms_references_order_idx" ON "lexicon_terms_references" USING btree ("_order");
  CREATE INDEX "lexicon_terms_references_parent_id_idx" ON "lexicon_terms_references" USING btree ("_parent_id");
  CREATE INDEX "lexicon_terms_references_locale_idx" ON "lexicon_terms_references" USING btree ("_locale");
  CREATE INDEX "lexicon_terms_hub_idx" ON "lexicon_terms" USING btree ("hub_id");
  CREATE INDEX "lexicon_terms_category_idx" ON "lexicon_terms" USING btree ("category_id");
  CREATE INDEX "lexicon_terms_reviewer_idx" ON "lexicon_terms" USING btree ("reviewer_id");
  CREATE UNIQUE INDEX "lexicon_terms_external_id_idx" ON "lexicon_terms" USING btree ("external_id");
  CREATE INDEX "lexicon_terms_updated_at_idx" ON "lexicon_terms" USING btree ("updated_at");
  CREATE INDEX "lexicon_terms_created_at_idx" ON "lexicon_terms" USING btree ("created_at");
  CREATE INDEX "lexicon_terms_slug_idx" ON "lexicon_terms_locales" USING btree ("slug","_locale");
  CREATE INDEX "lexicon_terms__status_idx" ON "lexicon_terms_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "lexicon_terms_locales_locale_parent_id_unique" ON "lexicon_terms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lexicon_terms_rels_order_idx" ON "lexicon_terms_rels" USING btree ("order");
  CREATE INDEX "lexicon_terms_rels_parent_idx" ON "lexicon_terms_rels" USING btree ("parent_id");
  CREATE INDEX "lexicon_terms_rels_path_idx" ON "lexicon_terms_rels" USING btree ("path");
  CREATE INDEX "lexicon_terms_rels_lexicon_terms_id_idx" ON "lexicon_terms_rels" USING btree ("lexicon_terms_id");
  CREATE INDEX "_lexicon_terms_v_version_references_order_idx" ON "_lexicon_terms_v_version_references" USING btree ("_order");
  CREATE INDEX "_lexicon_terms_v_version_references_parent_id_idx" ON "_lexicon_terms_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_lexicon_terms_v_version_references_locale_idx" ON "_lexicon_terms_v_version_references" USING btree ("_locale");
  CREATE INDEX "_lexicon_terms_v_parent_idx" ON "_lexicon_terms_v" USING btree ("parent_id");
  CREATE INDEX "_lexicon_terms_v_version_version_hub_idx" ON "_lexicon_terms_v" USING btree ("version_hub_id");
  CREATE INDEX "_lexicon_terms_v_version_version_category_idx" ON "_lexicon_terms_v" USING btree ("version_category_id");
  CREATE INDEX "_lexicon_terms_v_version_version_reviewer_idx" ON "_lexicon_terms_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_lexicon_terms_v_version_version_external_id_idx" ON "_lexicon_terms_v" USING btree ("version_external_id");
  CREATE INDEX "_lexicon_terms_v_version_version_updated_at_idx" ON "_lexicon_terms_v" USING btree ("version_updated_at");
  CREATE INDEX "_lexicon_terms_v_version_version_created_at_idx" ON "_lexicon_terms_v" USING btree ("version_created_at");
  CREATE INDEX "_lexicon_terms_v_created_at_idx" ON "_lexicon_terms_v" USING btree ("created_at");
  CREATE INDEX "_lexicon_terms_v_updated_at_idx" ON "_lexicon_terms_v" USING btree ("updated_at");
  CREATE INDEX "_lexicon_terms_v_snapshot_idx" ON "_lexicon_terms_v" USING btree ("snapshot");
  CREATE INDEX "_lexicon_terms_v_published_locale_idx" ON "_lexicon_terms_v" USING btree ("published_locale");
  CREATE INDEX "_lexicon_terms_v_latest_idx" ON "_lexicon_terms_v" USING btree ("latest");
  CREATE INDEX "_lexicon_terms_v_version_version_slug_idx" ON "_lexicon_terms_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_lexicon_terms_v_version_version__status_idx" ON "_lexicon_terms_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_lexicon_terms_v_locales_locale_parent_id_unique" ON "_lexicon_terms_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lexicon_terms_v_rels_order_idx" ON "_lexicon_terms_v_rels" USING btree ("order");
  CREATE INDEX "_lexicon_terms_v_rels_parent_idx" ON "_lexicon_terms_v_rels" USING btree ("parent_id");
  CREATE INDEX "_lexicon_terms_v_rels_path_idx" ON "_lexicon_terms_v_rels" USING btree ("path");
  CREATE INDEX "_lexicon_terms_v_rels_lexicon_terms_id_idx" ON "_lexicon_terms_v_rels" USING btree ("lexicon_terms_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lexicon_categories_fk" FOREIGN KEY ("lexicon_categories_id") REFERENCES "public"."lexicon_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lexicon_terms_fk" FOREIGN KEY ("lexicon_terms_id") REFERENCES "public"."lexicon_terms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_lexicon_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("lexicon_categories_id");
  CREATE INDEX "payload_locked_documents_rels_lexicon_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("lexicon_terms_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "lexicon_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lexicon_categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_categories_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_categories_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lexicon_terms_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lexicon_terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lexicon_terms_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lexicon_terms_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_terms_v_version_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_terms_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_terms_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lexicon_terms_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "lexicon_categories" CASCADE;
  DROP TABLE "lexicon_categories_locales" CASCADE;
  DROP TABLE "_lexicon_categories_v" CASCADE;
  DROP TABLE "_lexicon_categories_v_locales" CASCADE;
  DROP TABLE "lexicon_terms_references" CASCADE;
  DROP TABLE "lexicon_terms" CASCADE;
  DROP TABLE "lexicon_terms_locales" CASCADE;
  DROP TABLE "lexicon_terms_rels" CASCADE;
  DROP TABLE "_lexicon_terms_v_version_references" CASCADE;
  DROP TABLE "_lexicon_terms_v" CASCADE;
  DROP TABLE "_lexicon_terms_v_locales" CASCADE;
  DROP TABLE "_lexicon_terms_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lexicon_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lexicon_terms_fk";
  
  DROP INDEX "payload_locked_documents_rels_lexicon_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_lexicon_terms_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lexicon_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "lexicon_terms_id";
  DROP TYPE "public"."enum_lexicon_categories_status";
  DROP TYPE "public"."enum__lexicon_categories_v_published_locale";
  DROP TYPE "public"."enum__lexicon_categories_v_version_status";
  DROP TYPE "public"."enum_lexicon_terms_status";
  DROP TYPE "public"."enum__lexicon_terms_v_published_locale";
  DROP TYPE "public"."enum__lexicon_terms_v_version_status";`)
}
