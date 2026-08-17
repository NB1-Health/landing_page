import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { assertLocalizedStatusDisabled } from '@/utilities/assertLocalizedStatusDisabled'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pages_meta_seo_overrides_excluded_locales"
      AS ENUM ('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
    CREATE TYPE "public"."enum_pages_meta_seo_overrides_x_default_locale"
      AS ENUM ('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
    CREATE TYPE "public"."enum__pages_v_version_meta_seo_overrides_excluded_locales"
      AS ENUM ('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');
    CREATE TYPE "public"."enum__pages_v_version_meta_seo_overrides_x_default_locale"
      AS ENUM ('en', 'de', 'fr', 'nl', 'ch', 'be', 'uk', 'uae');

    ALTER TABLE "pages"
      ADD COLUMN "meta_seo_overrides_enabled" boolean DEFAULT false,
      ADD COLUMN "meta_seo_overrides_x_default_locale"
        "enum_pages_meta_seo_overrides_x_default_locale";

    CREATE TABLE "pages_meta_seo_overrides_excluded_locales" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_pages_meta_seo_overrides_excluded_locales",
      "id" serial PRIMARY KEY NOT NULL
    );
    ALTER TABLE "pages_meta_seo_overrides_excluded_locales"
      ADD CONSTRAINT "pages_meta_seo_overrides_excluded_locales_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "pages_meta_seo_overrides_excluded_locales_order_idx"
      ON "pages_meta_seo_overrides_excluded_locales" USING btree ("order");
    CREATE INDEX "pages_meta_seo_overrides_excluded_locales_parent_idx"
      ON "pages_meta_seo_overrides_excluded_locales" USING btree ("parent_id");

    ALTER TABLE "_pages_v"
      ADD COLUMN "version_meta_seo_overrides_enabled" boolean DEFAULT false,
      ADD COLUMN "version_meta_seo_overrides_x_default_locale"
        "enum__pages_v_version_meta_seo_overrides_x_default_locale";

    CREATE TABLE "_pages_v_version_meta_seo_overrides_excluded_locales" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__pages_v_version_meta_seo_overrides_excluded_locales",
      "id" serial PRIMARY KEY NOT NULL
    );
    ALTER TABLE "_pages_v_version_meta_seo_overrides_excluded_locales"
      ADD CONSTRAINT "_pages_v_version_meta_seo_overrides_excluded_locales_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "_pages_v_version_meta_seo_overrides_excluded_locales_order_idx"
      ON "_pages_v_version_meta_seo_overrides_excluded_locales" USING btree ("order");
    CREATE INDEX "_pages_v_version_meta_seo_overrides_excluded_locales_parent_idx"
      ON "_pages_v_version_meta_seo_overrides_excluded_locales" USING btree ("parent_id");
  `)
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  assertLocalizedStatusDisabled(payload)

  await db.execute(sql`
    DROP TABLE "_pages_v_version_meta_seo_overrides_excluded_locales" CASCADE;
    ALTER TABLE "_pages_v"
      DROP COLUMN "version_meta_seo_overrides_enabled",
      DROP COLUMN "version_meta_seo_overrides_x_default_locale";

    DROP TABLE "pages_meta_seo_overrides_excluded_locales" CASCADE;
    ALTER TABLE "pages"
      DROP COLUMN "meta_seo_overrides_enabled",
      DROP COLUMN "meta_seo_overrides_x_default_locale";

    DROP TYPE "public"."enum__pages_v_version_meta_seo_overrides_excluded_locales";
    DROP TYPE "public"."enum__pages_v_version_meta_seo_overrides_x_default_locale";
    DROP TYPE "public"."enum_pages_meta_seo_overrides_excluded_locales";
    DROP TYPE "public"."enum_pages_meta_seo_overrides_x_default_locale";
  `)
}
