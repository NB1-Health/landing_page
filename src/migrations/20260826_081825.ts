import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pillars" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_pillars_v" ADD COLUMN "version_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "scientific_articles" ADD COLUMN "reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_scientific_articles_v" ADD COLUMN "version_reviewed_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pillars" DROP COLUMN "reviewed_at";
  ALTER TABLE "_pillars_v" DROP COLUMN "version_reviewed_at";
  ALTER TABLE "scientific_articles" DROP COLUMN "reviewed_at";
  ALTER TABLE "_scientific_articles_v" DROP COLUMN "version_reviewed_at";`)
}
