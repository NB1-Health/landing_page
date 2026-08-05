import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move the classic Hero and generic Content rich text into their existing
 * locale tables. Current shared values become English, preserving all
 * existing content while allowing every other locale to diverge safely.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_content_columns_locales"
      ADD COLUMN IF NOT EXISTS "rich_text" jsonb;
    ALTER TABLE "_pages_v_blocks_content_columns_locales"
      ADD COLUMN IF NOT EXISTS "rich_text" jsonb;

    INSERT INTO "pages_blocks_content_columns_locales" ("rich_text", "_locale", "_parent_id")
    SELECT "rich_text", 'en', "id" FROM "pages_blocks_content_columns"
    ON CONFLICT ("_locale", "_parent_id")
      DO UPDATE SET "rich_text" = EXCLUDED."rich_text";

    INSERT INTO "_pages_v_blocks_content_columns_locales" ("rich_text", "_locale", "_parent_id")
    SELECT "rich_text", 'en', "id" FROM "_pages_v_blocks_content_columns"
    ON CONFLICT ("_locale", "_parent_id")
      DO UPDATE SET "rich_text" = EXCLUDED."rich_text";

    ALTER TABLE "pages_blocks_content_columns" DROP COLUMN IF EXISTS "rich_text";
    ALTER TABLE "_pages_v_blocks_content_columns" DROP COLUMN IF EXISTS "rich_text";

    ALTER TABLE "pages_locales" ADD COLUMN IF NOT EXISTS "hero_rich_text" jsonb;
    ALTER TABLE "_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_hero_rich_text" jsonb;

    INSERT INTO "pages_locales" ("hero_rich_text", "_locale", "_parent_id")
    SELECT "hero_rich_text", 'en', "id" FROM "pages"
    ON CONFLICT ("_locale", "_parent_id")
      DO UPDATE SET "hero_rich_text" = EXCLUDED."hero_rich_text";

    INSERT INTO "_pages_v_locales" ("version_hero_rich_text", "_locale", "_parent_id")
    SELECT "version_hero_rich_text", 'en', "id" FROM "_pages_v"
    ON CONFLICT ("_locale", "_parent_id")
      DO UPDATE SET "version_hero_rich_text" = EXCLUDED."version_hero_rich_text";

    ALTER TABLE "pages" DROP COLUMN IF EXISTS "hero_rich_text";
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_hero_rich_text";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_content_columns" ADD COLUMN IF NOT EXISTS "rich_text" jsonb;
    ALTER TABLE "_pages_v_blocks_content_columns" ADD COLUMN IF NOT EXISTS "rich_text" jsonb;

    UPDATE "pages_blocks_content_columns" AS content
    SET "rich_text" = locale."rich_text"
    FROM "pages_blocks_content_columns_locales" AS locale
    WHERE locale."_parent_id" = content."id" AND locale."_locale" = 'en';

    UPDATE "_pages_v_blocks_content_columns" AS content
    SET "rich_text" = locale."rich_text"
    FROM "_pages_v_blocks_content_columns_locales" AS locale
    WHERE locale."_parent_id" = content."id" AND locale."_locale" = 'en';

    ALTER TABLE "pages_blocks_content_columns_locales" DROP COLUMN IF EXISTS "rich_text";
    ALTER TABLE "_pages_v_blocks_content_columns_locales" DROP COLUMN IF EXISTS "rich_text";

    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_rich_text" jsonb;
    ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_hero_rich_text" jsonb;

    UPDATE "pages" AS page
    SET "hero_rich_text" = locale."hero_rich_text"
    FROM "pages_locales" AS locale
    WHERE locale."_parent_id" = page."id" AND locale."_locale" = 'en';

    UPDATE "_pages_v" AS page
    SET "version_hero_rich_text" = locale."version_hero_rich_text"
    FROM "_pages_v_locales" AS locale
    WHERE locale."_parent_id" = page."id" AND locale."_locale" = 'en';

    ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "hero_rich_text";
    ALTER TABLE "_pages_v_locales" DROP COLUMN IF EXISTS "version_hero_rich_text";
  `)
}
