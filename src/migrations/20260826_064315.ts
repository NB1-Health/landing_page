import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_scientific_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__scientific_articles_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
  CREATE TYPE "public"."enum__scientific_articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "scientific_articles_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "scientific_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hub_id" integer,
  	"reviewer_id" integer,
  	"source_title" varchar,
  	"source_journal" varchar,
  	"study_year" numeric,
  	"doi" varchar,
  	"published_at" timestamp(3) with time zone,
  	"noindex" boolean DEFAULT false,
  	"external_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "scientific_articles_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"standfirst" varchar,
  	"plain_language" jsonb,
  	"background_heading" varchar,
  	"background_body" jsonb,
  	"methods_heading" varchar,
  	"methods_body" jsonb,
  	"findings_heading" varchar,
  	"findings_body" jsonb,
  	"interpretation_heading" varchar,
  	"interpretation_body" jsonb,
  	"limitations_heading" varchar,
  	"limitations_body" jsonb,
  	"evidence_heading" varchar,
  	"evidence_body" jsonb,
  	"takeaways_heading" varchar,
  	"takeaways_body" jsonb,
  	"_status" "enum_scientific_articles_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "scientific_articles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  CREATE TABLE "_scientific_articles_v_version_references" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_scientific_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_hub_id" integer,
  	"version_reviewer_id" integer,
  	"version_source_title" varchar,
  	"version_source_journal" varchar,
  	"version_study_year" numeric,
  	"version_doi" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_noindex" boolean DEFAULT false,
  	"version_external_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__scientific_articles_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_scientific_articles_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_standfirst" varchar,
  	"version_plain_language" jsonb,
  	"version_background_heading" varchar,
  	"version_background_body" jsonb,
  	"version_methods_heading" varchar,
  	"version_methods_body" jsonb,
  	"version_findings_heading" varchar,
  	"version_findings_body" jsonb,
  	"version_interpretation_heading" varchar,
  	"version_interpretation_body" jsonb,
  	"version_limitations_heading" varchar,
  	"version_limitations_body" jsonb,
  	"version_evidence_heading" varchar,
  	"version_evidence_body" jsonb,
  	"version_takeaways_heading" varchar,
  	"version_takeaways_body" jsonb,
  	"version__status" "enum__scientific_articles_v_version_status" DEFAULT 'draft',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_scientific_articles_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"authors_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "scientific_articles_id" integer;
  ALTER TABLE "scientific_articles_references" ADD CONSTRAINT "scientific_articles_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scientific_articles" ADD CONSTRAINT "scientific_articles_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scientific_articles" ADD CONSTRAINT "scientific_articles_reviewer_id_authors_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "scientific_articles_locales" ADD CONSTRAINT "scientific_articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scientific_articles_rels" ADD CONSTRAINT "scientific_articles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scientific_articles_rels" ADD CONSTRAINT "scientific_articles_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v_version_references" ADD CONSTRAINT "_scientific_articles_v_version_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_scientific_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v" ADD CONSTRAINT "_scientific_articles_v_parent_id_scientific_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."scientific_articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v" ADD CONSTRAINT "_scientific_articles_v_version_hub_id_hubs_id_fk" FOREIGN KEY ("version_hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v" ADD CONSTRAINT "_scientific_articles_v_version_reviewer_id_authors_id_fk" FOREIGN KEY ("version_reviewer_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v_locales" ADD CONSTRAINT "_scientific_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_scientific_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v_rels" ADD CONSTRAINT "_scientific_articles_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_scientific_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v_rels" ADD CONSTRAINT "_scientific_articles_v_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "scientific_articles_references_order_idx" ON "scientific_articles_references" USING btree ("_order");
  CREATE INDEX "scientific_articles_references_parent_id_idx" ON "scientific_articles_references" USING btree ("_parent_id");
  CREATE INDEX "scientific_articles_references_locale_idx" ON "scientific_articles_references" USING btree ("_locale");
  CREATE INDEX "scientific_articles_hub_idx" ON "scientific_articles" USING btree ("hub_id");
  CREATE INDEX "scientific_articles_reviewer_idx" ON "scientific_articles" USING btree ("reviewer_id");
  CREATE INDEX "scientific_articles_doi_idx" ON "scientific_articles" USING btree ("doi");
  CREATE UNIQUE INDEX "scientific_articles_external_id_idx" ON "scientific_articles" USING btree ("external_id");
  CREATE INDEX "scientific_articles_updated_at_idx" ON "scientific_articles" USING btree ("updated_at");
  CREATE INDEX "scientific_articles_created_at_idx" ON "scientific_articles" USING btree ("created_at");
  CREATE INDEX "scientific_articles_slug_idx" ON "scientific_articles_locales" USING btree ("slug","_locale");
  CREATE INDEX "scientific_articles__status_idx" ON "scientific_articles_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "scientific_articles_locales_locale_parent_id_unique" ON "scientific_articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "scientific_articles_rels_order_idx" ON "scientific_articles_rels" USING btree ("order");
  CREATE INDEX "scientific_articles_rels_parent_idx" ON "scientific_articles_rels" USING btree ("parent_id");
  CREATE INDEX "scientific_articles_rels_path_idx" ON "scientific_articles_rels" USING btree ("path");
  CREATE INDEX "scientific_articles_rels_authors_id_idx" ON "scientific_articles_rels" USING btree ("authors_id");
  CREATE INDEX "_scientific_articles_v_version_references_order_idx" ON "_scientific_articles_v_version_references" USING btree ("_order");
  CREATE INDEX "_scientific_articles_v_version_references_parent_id_idx" ON "_scientific_articles_v_version_references" USING btree ("_parent_id");
  CREATE INDEX "_scientific_articles_v_version_references_locale_idx" ON "_scientific_articles_v_version_references" USING btree ("_locale");
  CREATE INDEX "_scientific_articles_v_parent_idx" ON "_scientific_articles_v" USING btree ("parent_id");
  CREATE INDEX "_scientific_articles_v_version_version_hub_idx" ON "_scientific_articles_v" USING btree ("version_hub_id");
  CREATE INDEX "_scientific_articles_v_version_version_reviewer_idx" ON "_scientific_articles_v" USING btree ("version_reviewer_id");
  CREATE INDEX "_scientific_articles_v_version_version_doi_idx" ON "_scientific_articles_v" USING btree ("version_doi");
  CREATE INDEX "_scientific_articles_v_version_version_external_id_idx" ON "_scientific_articles_v" USING btree ("version_external_id");
  CREATE INDEX "_scientific_articles_v_version_version_updated_at_idx" ON "_scientific_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_scientific_articles_v_version_version_created_at_idx" ON "_scientific_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_scientific_articles_v_created_at_idx" ON "_scientific_articles_v" USING btree ("created_at");
  CREATE INDEX "_scientific_articles_v_updated_at_idx" ON "_scientific_articles_v" USING btree ("updated_at");
  CREATE INDEX "_scientific_articles_v_snapshot_idx" ON "_scientific_articles_v" USING btree ("snapshot");
  CREATE INDEX "_scientific_articles_v_published_locale_idx" ON "_scientific_articles_v" USING btree ("published_locale");
  CREATE INDEX "_scientific_articles_v_latest_idx" ON "_scientific_articles_v" USING btree ("latest");
  CREATE INDEX "_scientific_articles_v_version_version_slug_idx" ON "_scientific_articles_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_scientific_articles_v_version_version__status_idx" ON "_scientific_articles_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_scientific_articles_v_locales_locale_parent_id_unique" ON "_scientific_articles_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_scientific_articles_v_rels_order_idx" ON "_scientific_articles_v_rels" USING btree ("order");
  CREATE INDEX "_scientific_articles_v_rels_parent_idx" ON "_scientific_articles_v_rels" USING btree ("parent_id");
  CREATE INDEX "_scientific_articles_v_rels_path_idx" ON "_scientific_articles_v_rels" USING btree ("path");
  CREATE INDEX "_scientific_articles_v_rels_authors_id_idx" ON "_scientific_articles_v_rels" USING btree ("authors_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scientific_articles_fk" FOREIGN KEY ("scientific_articles_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_scientific_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("scientific_articles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "scientific_articles_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scientific_articles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scientific_articles_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scientific_articles_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scientific_articles_v_version_references" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scientific_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scientific_articles_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scientific_articles_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "scientific_articles_references" CASCADE;
  DROP TABLE "scientific_articles" CASCADE;
  DROP TABLE "scientific_articles_locales" CASCADE;
  DROP TABLE "scientific_articles_rels" CASCADE;
  DROP TABLE "_scientific_articles_v_version_references" CASCADE;
  DROP TABLE "_scientific_articles_v" CASCADE;
  DROP TABLE "_scientific_articles_v_locales" CASCADE;
  DROP TABLE "_scientific_articles_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_scientific_articles_fk";
  
  DROP INDEX "payload_locked_documents_rels_scientific_articles_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "scientific_articles_id";
  DROP TYPE "public"."enum_scientific_articles_status";
  DROP TYPE "public"."enum__scientific_articles_v_published_locale";
  DROP TYPE "public"."enum__scientific_articles_v_version_status";`)
}
