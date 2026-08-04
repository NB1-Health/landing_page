import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pages_page_type" AS ENUM('legacy', 'legal', 'contact');
    CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('legacy', 'legal', 'contact');
    ALTER TABLE "pages" ADD COLUMN "page_type" "enum_pages_page_type" DEFAULT 'legacy';
    ALTER TABLE "_pages_v" ADD COLUMN "version_page_type" "enum__pages_v_version_page_type" DEFAULT 'legacy';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" DROP COLUMN "page_type";
    ALTER TABLE "_pages_v" DROP COLUMN "version_page_type";
    DROP TYPE "public"."enum_pages_page_type";
    DROP TYPE "public"."enum__pages_v_version_page_type";
  `)
}
