import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys"
      ADD COLUMN "payload_mcp_tool_plan_bulk_drafts" boolean DEFAULT false;
    ALTER TABLE "payload_mcp_api_keys"
      ADD COLUMN "payload_mcp_tool_commit_bulk_drafts" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_plan_bulk_drafts";
    ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_commit_bulk_drafts";
  `)
}
