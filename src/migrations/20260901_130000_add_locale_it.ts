import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__pages_v_published_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__posts_v_published_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__products_v_published_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum_pages_meta_seo_overrides_excluded_locales" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum_pages_meta_seo_overrides_x_default_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__pages_v_version_meta_seo_overrides_excluded_locales" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__pages_v_version_meta_seo_overrides_x_default_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum_posts_meta_seo_overrides_excluded_locales" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum_posts_meta_seo_overrides_x_default_locale" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__posts_v_version_meta_seo_overrides_excluded_locales" ADD VALUE IF NOT EXISTS 'it';
    ALTER TYPE "public"."enum__posts_v_version_meta_seo_overrides_x_default_locale" ADD VALUE IF NOT EXISTS 'it';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot safely remove an enum value in place. Keeping `it` is
  // backwards-compatible and avoids invalidating existing version records.
}
