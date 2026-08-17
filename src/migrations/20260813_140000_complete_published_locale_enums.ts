import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum__pages_v_published_locale" ADD VALUE IF NOT EXISTS 'fr';
    ALTER TYPE "public"."enum__posts_v_published_locale" ADD VALUE IF NOT EXISTS 'fr';
    ALTER TYPE "public"."enum__products_v_published_locale" ADD VALUE IF NOT EXISTS 'fr';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot safely remove an enum value in place. Keeping `fr` is
  // backwards-compatible and avoids invalidating existing version records.
}
