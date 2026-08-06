import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

async function seedPublishedVersions({ payload, req }: Pick<MigrateUpArgs, 'payload' | 'req'>) {
  const timestamp = new Date().toISOString()

  for (const collection of ['headers', 'footers'] as const) {
    const { docs } = await payload.db.find({
      collection,
      limit: 0,
      locale: 'all',
      pagination: false,
      req,
    })

    for (const doc of docs) {
      await payload.db.createVersion({
        autosave: false,
        collectionSlug: collection,
        createdAt: timestamp,
        parent: doc.id,
        req,
        updatedAt: timestamp,
        versionData: doc,
      })
    }
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_headers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__headers_v_version_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__headers_v_version_discover_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__headers_v_version_variants_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__headers_v_version_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__headers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__headers_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
  CREATE TYPE "public"."enum_footers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footers_v_version_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__footers_v_version_variants_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__footers_v_version_theme" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum__footers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__footers_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
  CREATE TABLE "_headers_v_version_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__headers_v_version_nav_items_link_type" DEFAULT 'reference',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar,
    "link_localized_label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_headers_v_version_section_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "section_id" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_headers_v_version_section_nav_items_locales" (
    "label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_headers_v_version_discover_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__headers_v_version_discover_nav_items_link_type" DEFAULT 'reference',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar,
    "link_localized_label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_headers_v_version_variants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "variant_key" varchar,
    "theme" "enum__headers_v_version_variants_theme",
    "login_text_color" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_headers_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_is_default" boolean DEFAULT false,
    "version_logo_id" integer,
    "version_logo_dark_id" integer,
    "version_theme" "enum__headers_v_version_theme" DEFAULT 'light',
    "version_dark_hero" boolean DEFAULT false,
    "version_login_text_color" varchar,
    "version_section_nav_enabled" boolean DEFAULT false,
    "version_discover_nav_enabled" boolean DEFAULT false,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__headers_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__headers_v_published_locale",
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_headers_v_locales" (
    "version_cta_label" varchar,
    "version_cta_url" varchar,
    "version_login_text" varchar,
    "version_login_url" varchar,
    "version_discover_nav_label" varchar DEFAULT 'Discover',
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_headers_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "locale" "_locales",
    "pages_id" integer,
    "posts_id" integer
  );

  CREATE TABLE "_footers_v_version_explore_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_footers_v_version_explore_links_locales" (
    "label" varchar,
    "url" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_footers_v_version_get_started_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_footers_v_version_get_started_links_locales" (
    "label" varchar,
    "url" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_footers_v_version_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__footers_v_version_nav_items_link_type" DEFAULT 'reference',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_footers_v_version_nav_items_locales" (
    "link_localized_label" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_footers_v_version_legal_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_locale" "_locales" NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar,
    "url" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_footers_v_version_variants" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "variant_key" varchar,
    "theme" "enum__footers_v_version_variants_theme",
    "link_color" varchar,
    "logo_id" integer,
    "_uuid" varchar
  );

  CREATE TABLE "_footers_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar,
    "version_is_default" boolean DEFAULT false,
    "version_logo_id" integer,
    "version_theme" "enum__footers_v_version_theme" DEFAULT 'light',
    "version_link_color" varchar,
    "version_instagram_url" varchar,
    "version_form_id" integer,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "version__status" "enum__footers_v_version_status" DEFAULT 'draft',
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "snapshot" boolean,
    "published_locale" "enum__footers_v_published_locale",
    "latest" boolean,
    "autosave" boolean
  );

  CREATE TABLE "_footers_v_locales" (
    "version_tagline" varchar,
    "version_subnote" varchar,
    "version_address" varchar,
    "version_copyright_text" varchar,
    "version_disclaimer" varchar,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_footers_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "pages_id" integer,
    "posts_id" integer
  );

  ALTER TABLE "headers_nav_items" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "headers_variants" ALTER COLUMN "variant_key" DROP NOT NULL;
  ALTER TABLE "headers_variants" ALTER COLUMN "theme" DROP NOT NULL;
  ALTER TABLE "headers" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "footers_explore_links_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "footers_explore_links_locales" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "footers_get_started_links_locales" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "footers_get_started_links_locales" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "footers_nav_items" ALTER COLUMN "link_label" DROP NOT NULL;
  ALTER TABLE "footers_legal_links" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "footers_legal_links" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "footers_variants" ALTER COLUMN "variant_key" DROP NOT NULL;
  ALTER TABLE "footers_variants" ALTER COLUMN "theme" DROP NOT NULL;
  ALTER TABLE "footers" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "headers" ADD COLUMN "_status" "enum_headers_status" DEFAULT 'draft';
  ALTER TABLE "footers" ADD COLUMN "_status" "enum_footers_status" DEFAULT 'draft';
  -- Header and Footer documents predate drafts, so every existing row is live
  -- content and must remain visible when published-only access is enabled.
  UPDATE "headers" SET "_status" = 'published';
  UPDATE "footers" SET "_status" = 'published';
  -- Keep the most recently edited default if legacy data contains duplicates.
  WITH ranked AS (
    SELECT "id", row_number() OVER (ORDER BY "updated_at" DESC, "id" DESC) AS position
    FROM "headers"
    WHERE "is_default" = true
  )
  UPDATE "headers" SET "is_default" = false
  WHERE "id" IN (SELECT "id" FROM ranked WHERE position > 1);
  WITH ranked AS (
    SELECT "id", row_number() OVER (ORDER BY "updated_at" DESC, "id" DESC) AS position
    FROM "footers"
    WHERE "is_default" = true
  )
  UPDATE "footers" SET "is_default" = false
  WHERE "id" IN (SELECT "id" FROM ranked WHERE position > 1);
  ALTER TABLE "_headers_v_version_nav_items" ADD CONSTRAINT "_headers_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_version_section_nav_items" ADD CONSTRAINT "_headers_v_version_section_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_version_section_nav_items_locales" ADD CONSTRAINT "_headers_v_version_section_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v_version_section_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_version_discover_nav_items" ADD CONSTRAINT "_headers_v_version_discover_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_version_variants" ADD CONSTRAINT "_headers_v_version_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v" ADD CONSTRAINT "_headers_v_parent_id_headers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."headers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_headers_v" ADD CONSTRAINT "_headers_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_headers_v" ADD CONSTRAINT "_headers_v_version_logo_dark_id_media_id_fk" FOREIGN KEY ("version_logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_headers_v_locales" ADD CONSTRAINT "_headers_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_rels" ADD CONSTRAINT "_headers_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_headers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_rels" ADD CONSTRAINT "_headers_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_headers_v_rels" ADD CONSTRAINT "_headers_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_explore_links" ADD CONSTRAINT "_footers_v_version_explore_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_explore_links_locales" ADD CONSTRAINT "_footers_v_version_explore_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v_version_explore_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_get_started_links" ADD CONSTRAINT "_footers_v_version_get_started_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_get_started_links_locales" ADD CONSTRAINT "_footers_v_version_get_started_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v_version_get_started_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_nav_items" ADD CONSTRAINT "_footers_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_nav_items_locales" ADD CONSTRAINT "_footers_v_version_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v_version_nav_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_legal_links" ADD CONSTRAINT "_footers_v_version_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_version_variants" ADD CONSTRAINT "_footers_v_version_variants_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footers_v_version_variants" ADD CONSTRAINT "_footers_v_version_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v" ADD CONSTRAINT "_footers_v_parent_id_footers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footers_v" ADD CONSTRAINT "_footers_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footers_v" ADD CONSTRAINT "_footers_v_version_form_id_forms_id_fk" FOREIGN KEY ("version_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_footers_v_locales" ADD CONSTRAINT "_footers_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_rels" ADD CONSTRAINT "_footers_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_footers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_rels" ADD CONSTRAINT "_footers_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footers_v_rels" ADD CONSTRAINT "_footers_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_headers_v_version_nav_items_order_idx" ON "_headers_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_headers_v_version_nav_items_parent_id_idx" ON "_headers_v_version_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_headers_v_version_nav_items_locale_idx" ON "_headers_v_version_nav_items" USING btree ("_locale");
  CREATE INDEX "_headers_v_version_section_nav_items_order_idx" ON "_headers_v_version_section_nav_items" USING btree ("_order");
  CREATE INDEX "_headers_v_version_section_nav_items_parent_id_idx" ON "_headers_v_version_section_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_headers_v_version_section_nav_items_locales_locale_parent_i" ON "_headers_v_version_section_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_headers_v_version_discover_nav_items_order_idx" ON "_headers_v_version_discover_nav_items" USING btree ("_order");
  CREATE INDEX "_headers_v_version_discover_nav_items_parent_id_idx" ON "_headers_v_version_discover_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_headers_v_version_discover_nav_items_locale_idx" ON "_headers_v_version_discover_nav_items" USING btree ("_locale");
  CREATE INDEX "_headers_v_version_variants_order_idx" ON "_headers_v_version_variants" USING btree ("_order");
  CREATE INDEX "_headers_v_version_variants_parent_id_idx" ON "_headers_v_version_variants" USING btree ("_parent_id");
  CREATE INDEX "_headers_v_parent_idx" ON "_headers_v" USING btree ("parent_id");
  CREATE INDEX "_headers_v_version_version_logo_idx" ON "_headers_v" USING btree ("version_logo_id");
  CREATE INDEX "_headers_v_version_version_logo_dark_idx" ON "_headers_v" USING btree ("version_logo_dark_id");
  CREATE INDEX "_headers_v_version_version_updated_at_idx" ON "_headers_v" USING btree ("version_updated_at");
  CREATE INDEX "_headers_v_version_version_created_at_idx" ON "_headers_v" USING btree ("version_created_at");
  CREATE INDEX "_headers_v_version_version__status_idx" ON "_headers_v" USING btree ("version__status");
  CREATE INDEX "_headers_v_created_at_idx" ON "_headers_v" USING btree ("created_at");
  CREATE INDEX "_headers_v_updated_at_idx" ON "_headers_v" USING btree ("updated_at");
  CREATE INDEX "_headers_v_snapshot_idx" ON "_headers_v" USING btree ("snapshot");
  CREATE INDEX "_headers_v_published_locale_idx" ON "_headers_v" USING btree ("published_locale");
  CREATE INDEX "_headers_v_latest_idx" ON "_headers_v" USING btree ("latest");
  CREATE INDEX "_headers_v_autosave_idx" ON "_headers_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_headers_v_locales_locale_parent_id_unique" ON "_headers_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_headers_v_rels_order_idx" ON "_headers_v_rels" USING btree ("order");
  CREATE INDEX "_headers_v_rels_parent_idx" ON "_headers_v_rels" USING btree ("parent_id");
  CREATE INDEX "_headers_v_rels_path_idx" ON "_headers_v_rels" USING btree ("path");
  CREATE INDEX "_headers_v_rels_locale_idx" ON "_headers_v_rels" USING btree ("locale");
  CREATE INDEX "_headers_v_rels_pages_id_idx" ON "_headers_v_rels" USING btree ("pages_id","locale");
  CREATE INDEX "_headers_v_rels_posts_id_idx" ON "_headers_v_rels" USING btree ("posts_id","locale");
  CREATE INDEX "_footers_v_version_explore_links_order_idx" ON "_footers_v_version_explore_links" USING btree ("_order");
  CREATE INDEX "_footers_v_version_explore_links_parent_id_idx" ON "_footers_v_version_explore_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footers_v_version_explore_links_locales_locale_parent_id_un" ON "_footers_v_version_explore_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footers_v_version_get_started_links_order_idx" ON "_footers_v_version_get_started_links" USING btree ("_order");
  CREATE INDEX "_footers_v_version_get_started_links_parent_id_idx" ON "_footers_v_version_get_started_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footers_v_version_get_started_links_locales_locale_parent_i" ON "_footers_v_version_get_started_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footers_v_version_nav_items_order_idx" ON "_footers_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_footers_v_version_nav_items_parent_id_idx" ON "_footers_v_version_nav_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_footers_v_version_nav_items_locales_locale_parent_id_unique" ON "_footers_v_version_nav_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footers_v_version_legal_links_order_idx" ON "_footers_v_version_legal_links" USING btree ("_order");
  CREATE INDEX "_footers_v_version_legal_links_parent_id_idx" ON "_footers_v_version_legal_links" USING btree ("_parent_id");
  CREATE INDEX "_footers_v_version_legal_links_locale_idx" ON "_footers_v_version_legal_links" USING btree ("_locale");
  CREATE INDEX "_footers_v_version_variants_order_idx" ON "_footers_v_version_variants" USING btree ("_order");
  CREATE INDEX "_footers_v_version_variants_parent_id_idx" ON "_footers_v_version_variants" USING btree ("_parent_id");
  CREATE INDEX "_footers_v_version_variants_logo_idx" ON "_footers_v_version_variants" USING btree ("logo_id");
  CREATE INDEX "_footers_v_parent_idx" ON "_footers_v" USING btree ("parent_id");
  CREATE INDEX "_footers_v_version_version_logo_idx" ON "_footers_v" USING btree ("version_logo_id");
  CREATE INDEX "_footers_v_version_version_form_idx" ON "_footers_v" USING btree ("version_form_id");
  CREATE INDEX "_footers_v_version_version_updated_at_idx" ON "_footers_v" USING btree ("version_updated_at");
  CREATE INDEX "_footers_v_version_version_created_at_idx" ON "_footers_v" USING btree ("version_created_at");
  CREATE INDEX "_footers_v_version_version__status_idx" ON "_footers_v" USING btree ("version__status");
  CREATE INDEX "_footers_v_created_at_idx" ON "_footers_v" USING btree ("created_at");
  CREATE INDEX "_footers_v_updated_at_idx" ON "_footers_v" USING btree ("updated_at");
  CREATE INDEX "_footers_v_snapshot_idx" ON "_footers_v" USING btree ("snapshot");
  CREATE INDEX "_footers_v_published_locale_idx" ON "_footers_v" USING btree ("published_locale");
  CREATE INDEX "_footers_v_latest_idx" ON "_footers_v" USING btree ("latest");
  CREATE INDEX "_footers_v_autosave_idx" ON "_footers_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_footers_v_locales_locale_parent_id_unique" ON "_footers_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_footers_v_rels_order_idx" ON "_footers_v_rels" USING btree ("order");
  CREATE INDEX "_footers_v_rels_parent_idx" ON "_footers_v_rels" USING btree ("parent_id");
  CREATE INDEX "_footers_v_rels_path_idx" ON "_footers_v_rels" USING btree ("path");
  CREATE INDEX "_footers_v_rels_pages_id_idx" ON "_footers_v_rels" USING btree ("pages_id");
  CREATE INDEX "_footers_v_rels_posts_id_idx" ON "_footers_v_rels" USING btree ("posts_id");
  CREATE INDEX "headers__status_idx" ON "headers" USING btree ("_status");
  CREATE INDEX "footers__status_idx" ON "footers" USING btree ("_status");`)

  // Payload saves only the post-edit state, so legacy chrome needs a baseline
  // version before editors can safely use native rollback.
  await seedPublishedVersions({ payload, req })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_headers_v_version_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_version_section_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_version_section_nav_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_version_discover_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_version_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_headers_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_explore_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_explore_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_get_started_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_get_started_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_nav_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_legal_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_version_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footers_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_headers_v_version_nav_items" CASCADE;
  DROP TABLE "_headers_v_version_section_nav_items" CASCADE;
  DROP TABLE "_headers_v_version_section_nav_items_locales" CASCADE;
  DROP TABLE "_headers_v_version_discover_nav_items" CASCADE;
  DROP TABLE "_headers_v_version_variants" CASCADE;
  DROP TABLE "_headers_v" CASCADE;
  DROP TABLE "_headers_v_locales" CASCADE;
  DROP TABLE "_headers_v_rels" CASCADE;
  DROP TABLE "_footers_v_version_explore_links" CASCADE;
  DROP TABLE "_footers_v_version_explore_links_locales" CASCADE;
  DROP TABLE "_footers_v_version_get_started_links" CASCADE;
  DROP TABLE "_footers_v_version_get_started_links_locales" CASCADE;
  DROP TABLE "_footers_v_version_nav_items" CASCADE;
  DROP TABLE "_footers_v_version_nav_items_locales" CASCADE;
  DROP TABLE "_footers_v_version_legal_links" CASCADE;
  DROP TABLE "_footers_v_version_variants" CASCADE;
  DROP TABLE "_footers_v" CASCADE;
  DROP TABLE "_footers_v_locales" CASCADE;
  DROP TABLE "_footers_v_rels" CASCADE;
  DROP INDEX "headers__status_idx";
  DROP INDEX "footers__status_idx";
  ALTER TABLE "headers_nav_items" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "headers_variants" ALTER COLUMN "variant_key" SET NOT NULL;
  ALTER TABLE "headers_variants" ALTER COLUMN "theme" SET NOT NULL;
  ALTER TABLE "headers" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "footers_explore_links_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "footers_explore_links_locales" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "footers_get_started_links_locales" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "footers_get_started_links_locales" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "footers_nav_items" ALTER COLUMN "link_label" SET NOT NULL;
  ALTER TABLE "footers_legal_links" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "footers_legal_links" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "footers_variants" ALTER COLUMN "variant_key" SET NOT NULL;
  ALTER TABLE "footers_variants" ALTER COLUMN "theme" SET NOT NULL;
  ALTER TABLE "footers" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "headers" DROP COLUMN "_status";
  ALTER TABLE "footers" DROP COLUMN "_status";
  DROP TYPE "public"."enum_headers_status";
  DROP TYPE "public"."enum__headers_v_version_nav_items_link_type";
  DROP TYPE "public"."enum__headers_v_version_discover_nav_items_link_type";
  DROP TYPE "public"."enum__headers_v_version_variants_theme";
  DROP TYPE "public"."enum__headers_v_version_theme";
  DROP TYPE "public"."enum__headers_v_version_status";
  DROP TYPE "public"."enum__headers_v_published_locale";
  DROP TYPE "public"."enum_footers_status";
  DROP TYPE "public"."enum__footers_v_version_nav_items_link_type";
  DROP TYPE "public"."enum__footers_v_version_variants_theme";
  DROP TYPE "public"."enum__footers_v_version_theme";
  DROP TYPE "public"."enum__footers_v_version_status";
  DROP TYPE "public"."enum__footers_v_published_locale";`)
}
