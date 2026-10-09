import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The content library over MCP: SEO meta on the hub documents, and the audit log
 * learning the four library collections.
 *
 * Hand-written, like every migration since the 2026-09-22 resync: the drizzle
 * snapshot is stale, so `migrate:create` re-derives unrelated drift (it prompts to
 * rename enums of blocks deleted on 2026-09-30). See scripts/check-schema-drift.ts.
 *
 * 1. `meta.title` / `meta.description` on pillars, scientific articles and lexicon
 *    terms — `metaField()` in fields/contentDocument. Localized, so the columns
 *    land on `_locales`, and on the version `_locales` as `version_meta_*`.
 *
 * 2. `agent-operations.targetCollection` gains pillars, scientific-articles,
 *    lexicon-terms and lexicon-categories, for `upsert_drafts`.
 *
 * 3. The MCP key collection gains the `upsert_drafts` tool checkbox. The plugin
 *    adds one column per tool; off by default, like every other tool on a key.
 *
 * Idempotent: IF NOT EXISTS / IF EXISTS throughout. `down` drops the columns and
 * rebuilds the enum without the new values, clearing them from audit rows first —
 * Postgres cannot drop a value from an enum in place.
 */
const META_TABLES = ['pillars', 'scientific_articles', 'lexicon_terms'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of META_TABLES) {
    await db.execute(
      sql.raw(`
  ALTER TABLE "${table}_locales" ADD COLUMN IF NOT EXISTS "meta_title" varchar;
  ALTER TABLE "${table}_locales" ADD COLUMN IF NOT EXISTS "meta_description" varchar;
  ALTER TABLE "_${table}_v_locales" ADD COLUMN IF NOT EXISTS "version_meta_title" varchar;
  ALTER TABLE "_${table}_v_locales" ADD COLUMN IF NOT EXISTS "version_meta_description" varchar;`),
    )
  }

  await db.execute(sql`
  ALTER TYPE "public"."enum_agent_operations_target_collection" ADD VALUE IF NOT EXISTS 'pillars';
  ALTER TYPE "public"."enum_agent_operations_target_collection" ADD VALUE IF NOT EXISTS 'scientific-articles';
  ALTER TYPE "public"."enum_agent_operations_target_collection" ADD VALUE IF NOT EXISTS 'lexicon-terms';
  ALTER TYPE "public"."enum_agent_operations_target_collection" ADD VALUE IF NOT EXISTS 'lexicon-categories';
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN IF NOT EXISTS "payload_mcp_tool_upsert_drafts" boolean DEFAULT false;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of META_TABLES) {
    await db.execute(
      sql.raw(`
  ALTER TABLE "${table}_locales" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "${table}_locales" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "_${table}_v_locales" DROP COLUMN IF EXISTS "version_meta_title";
  ALTER TABLE "_${table}_v_locales" DROP COLUMN IF EXISTS "version_meta_description";`),
    )
  }

  await db.execute(sql`
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN IF EXISTS "payload_mcp_tool_upsert_drafts";
  UPDATE "agent_operations" SET "target_collection" = NULL
    WHERE "target_collection"::text NOT IN ('pages', 'posts', 'media');
  ALTER TYPE "public"."enum_agent_operations_target_collection" RENAME TO "enum_agent_operations_target_collection_old";
  CREATE TYPE "public"."enum_agent_operations_target_collection" AS ENUM('pages', 'posts', 'media');
  ALTER TABLE "agent_operations" ALTER COLUMN "target_collection" TYPE "public"."enum_agent_operations_target_collection"
    USING "target_collection"::text::"public"."enum_agent_operations_target_collection";
  DROP TYPE "public"."enum_agent_operations_target_collection_old";`)
}
