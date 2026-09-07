import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_influencer_landing_pages_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__influencer_landing_pages_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'it', 'ch', 'be', 'uk', 'uae');
    CREATE TYPE "public"."enum__influencer_landing_pages_v_version_status" AS ENUM('draft', 'published');

    CREATE TABLE "influencer_landing_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "internal_title" varchar,
      "slug" varchar,
      "discount_code" varchar,
      "primary_image_id" integer,
      "video_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "deleted_at" timestamp(3) with time zone
    );

    CREATE TABLE "influencer_landing_pages_locales" (
      "influencer_name" varchar,
      "handle" varchar,
      "hero_headline" varchar,
      "hero_copy" varchar,
      "gift_quote" varchar,
      "testimonial" varchar,
      "testimonial_attribution" varchar,
      "offer_headline" varchar,
      "offer_copy" varchar,
      "cta_label" varchar,
      "_status" "enum_influencer_landing_pages_status" DEFAULT 'draft',
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_influencer_landing_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_internal_title" varchar,
      "version_slug" varchar,
      "version_discount_code" varchar,
      "version_primary_image_id" integer,
      "version_video_url" varchar,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version_deleted_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "snapshot" boolean,
      "published_locale" "enum__influencer_landing_pages_v_published_locale",
      "latest" boolean,
      "autosave" boolean
    );

    CREATE TABLE "_influencer_landing_pages_v_locales" (
      "version_influencer_name" varchar,
      "version_handle" varchar,
      "version_hero_headline" varchar,
      "version_hero_copy" varchar,
      "version_gift_quote" varchar,
      "version_testimonial" varchar,
      "version_testimonial_attribution" varchar,
      "version_offer_headline" varchar,
      "version_offer_copy" varchar,
      "version_cta_label" varchar,
      "version__status" "enum__influencer_landing_pages_v_version_status" DEFAULT 'draft',
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "influencer_landing_pages_id" integer;

    ALTER TABLE "influencer_landing_pages" ADD CONSTRAINT "influencer_landing_pages_primary_image_id_media_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "influencer_landing_pages_locales" ADD CONSTRAINT "influencer_landing_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."influencer_landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_influencer_landing_pages_v" ADD CONSTRAINT "_influencer_landing_pages_v_parent_id_influencer_landing_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."influencer_landing_pages"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_influencer_landing_pages_v" ADD CONSTRAINT "_influencer_landing_pages_v_version_primary_image_id_media_id_fk" FOREIGN KEY ("version_primary_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_influencer_landing_pages_v_locales" ADD CONSTRAINT "_influencer_landing_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_influencer_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_influencer_landing_pages_fk" FOREIGN KEY ("influencer_landing_pages_id") REFERENCES "public"."influencer_landing_pages"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "influencer_landing_pages_slug_idx" ON "influencer_landing_pages" USING btree ("slug");
    CREATE INDEX "influencer_landing_pages_primary_image_idx" ON "influencer_landing_pages" USING btree ("primary_image_id");
    CREATE INDEX "influencer_landing_pages_updated_at_idx" ON "influencer_landing_pages" USING btree ("updated_at");
    CREATE INDEX "influencer_landing_pages_created_at_idx" ON "influencer_landing_pages" USING btree ("created_at");
    CREATE INDEX "influencer_landing_pages_deleted_at_idx" ON "influencer_landing_pages" USING btree ("deleted_at");
    CREATE INDEX "influencer_landing_pages__status_idx" ON "influencer_landing_pages_locales" USING btree ("_status", "_locale");
    CREATE UNIQUE INDEX "influencer_landing_pages_locales_locale_parent_id_unique" ON "influencer_landing_pages_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX "_influencer_landing_pages_v_parent_idx" ON "_influencer_landing_pages_v" USING btree ("parent_id");
    CREATE INDEX "_influencer_landing_pages_v_version_version_slug_idx" ON "_influencer_landing_pages_v" USING btree ("version_slug");
    CREATE INDEX "_influencer_landing_pages_v_version_version_primary_imag_idx" ON "_influencer_landing_pages_v" USING btree ("version_primary_image_id");
    CREATE INDEX "_influencer_landing_pages_v_version_version_updated_at_idx" ON "_influencer_landing_pages_v" USING btree ("version_updated_at");
    CREATE INDEX "_influencer_landing_pages_v_version_version_created_at_idx" ON "_influencer_landing_pages_v" USING btree ("version_created_at");
    CREATE INDEX "_influencer_landing_pages_v_version_version_deleted_at_idx" ON "_influencer_landing_pages_v" USING btree ("version_deleted_at");
    CREATE INDEX "_influencer_landing_pages_v_created_at_idx" ON "_influencer_landing_pages_v" USING btree ("created_at");
    CREATE INDEX "_influencer_landing_pages_v_updated_at_idx" ON "_influencer_landing_pages_v" USING btree ("updated_at");
    CREATE INDEX "_influencer_landing_pages_v_snapshot_idx" ON "_influencer_landing_pages_v" USING btree ("snapshot");
    CREATE INDEX "_influencer_landing_pages_v_published_locale_idx" ON "_influencer_landing_pages_v" USING btree ("published_locale");
    CREATE INDEX "_influencer_landing_pages_v_latest_idx" ON "_influencer_landing_pages_v" USING btree ("latest");
    CREATE INDEX "_influencer_landing_pages_v_autosave_idx" ON "_influencer_landing_pages_v" USING btree ("autosave");
    CREATE INDEX "_influencer_landing_pages_v_version_version__status_idx" ON "_influencer_landing_pages_v_locales" USING btree ("version__status", "_locale");
    CREATE UNIQUE INDEX "_influencer_landing_pages_v_locales_locale_parent_id_unique" ON "_influencer_landing_pages_v_locales" USING btree ("_locale", "_parent_id");
    CREATE INDEX "payload_locked_documents_rels_influencer_landing_pages_i_idx" ON "payload_locked_documents_rels" USING btree ("influencer_landing_pages_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_influencer_landing_pages_fk";
    DROP INDEX "payload_locked_documents_rels_influencer_landing_pages_i_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "influencer_landing_pages_id";

    DROP TABLE "_influencer_landing_pages_v_locales" CASCADE;
    DROP TABLE "_influencer_landing_pages_v" CASCADE;
    DROP TABLE "influencer_landing_pages_locales" CASCADE;
    DROP TABLE "influencer_landing_pages" CASCADE;

    DROP TYPE "public"."enum_influencer_landing_pages_status";
    DROP TYPE "public"."enum__influencer_landing_pages_v_published_locale";
    DROP TYPE "public"."enum__influencer_landing_pages_v_version_status";
  `)
}
