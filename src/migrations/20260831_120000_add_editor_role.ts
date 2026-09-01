import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'editor' BEFORE 'agent-editor';
  `)
}

// PostgreSQL cannot remove an enum value without recreating the type, so rollback leaves it in place.
export async function down(): Promise<void> {}
