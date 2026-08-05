import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Preserve current operators as administrators. The application schema then
 * defaults every subsequently created user to the least-privilege editor role.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_role" AS ENUM('editor', 'publisher', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" "enum_users_role";

    UPDATE "users" SET "role" = 'admin' WHERE "role" IS NULL;

    ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'editor',
      ALTER COLUMN "role" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
    DROP TYPE IF EXISTS "public"."enum_users_role";
  `)
}
