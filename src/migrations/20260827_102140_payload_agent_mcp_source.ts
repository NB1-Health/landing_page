import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Additive schema for the app-owned Payload MCP surface.
 *
 * This migration is intentionally hand-trimmed. The generated Drizzle snapshot
 * predates several already-applied hand-written migrations and otherwise tries
 * to recreate unrelated Page block tables.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'agent-editor');
    CREATE TYPE "public"."enum_agent_operations_status" AS ENUM('planned', 'running', 'succeeded', 'failed');
    CREATE TYPE "public"."enum_agent_operations_target_collection" AS ENUM('pages', 'posts', 'media');
    CREATE TYPE "public"."enum_agent_operations_approval_status" AS ENUM('not-required', 'pending', 'approved', 'rejected');

    ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'admin' NOT NULL;

    ALTER TABLE "pages" ADD COLUMN "deleted_at" timestamp(3) with time zone;
    ALTER TABLE "_pages_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
    ALTER TABLE "posts" ADD COLUMN "deleted_at" timestamp(3) with time zone;
    ALTER TABLE "_posts_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
    ALTER TABLE "media" ADD COLUMN "deleted_at" timestamp(3) with time zone;

    CREATE TABLE "agent_operations" (
      "id" serial PRIMARY KEY NOT NULL,
      "operation_key" varchar NOT NULL,
      "idempotency_key" varchar NOT NULL,
      "request_hash" varchar NOT NULL,
      "tool" varchar NOT NULL,
      "status" "enum_agent_operations_status" DEFAULT 'running' NOT NULL,
      "actor_id" integer NOT NULL,
      "locale" varchar,
      "target_collection" "enum_agent_operations_target_collection",
      "target_i_ds" jsonb,
      "plan" jsonb,
      "plan_hash" varchar,
      "approval_status" "enum_agent_operations_approval_status" DEFAULT 'not-required' NOT NULL,
      "expires_at" timestamp(3) with time zone,
      "result" jsonb,
      "error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "payload_mcp_api_keys" (
      "id" serial PRIMARY KEY NOT NULL,
      "enabled" boolean DEFAULT true NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "user_id" integer NOT NULL,
      "label" varchar,
      "description" varchar,
      "payload_mcp_tool_find_content" boolean DEFAULT false,
      "payload_mcp_tool_get_content" boolean DEFAULT false,
      "payload_mcp_tool_create_post_draft" boolean DEFAULT false,
      "payload_mcp_tool_update_post_draft" boolean DEFAULT false,
      "payload_mcp_tool_clone_page_draft" boolean DEFAULT false,
      "payload_mcp_tool_patch_page_draft" boolean DEFAULT false,
      "payload_mcp_tool_upload_media" boolean DEFAULT false,
      "payload_mcp_tool_trash_content" boolean DEFAULT false,
      "payload_mcp_tool_restore_content" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "enable_a_p_i_key" boolean,
      "api_key" varchar,
      "api_key_index" varchar
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_operations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;
    ALTER TABLE "payload_preferences_rels" ADD COLUMN "payload_mcp_api_keys_id" integer;

    ALTER TABLE "agent_operations"
      ADD CONSTRAINT "agent_operations_actor_id_users_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_mcp_api_keys"
      ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_agent_operations_fk"
      FOREIGN KEY ("agent_operations_id") REFERENCES "public"."agent_operations"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk"
      FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_preferences_rels"
      ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk"
      FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "agent_operations_operation_key_idx" ON "agent_operations" USING btree ("operation_key");
    CREATE INDEX "agent_operations_tool_idx" ON "agent_operations" USING btree ("tool");
    CREATE INDEX "agent_operations_status_idx" ON "agent_operations" USING btree ("status");
    CREATE INDEX "agent_operations_actor_idx" ON "agent_operations" USING btree ("actor_id");
    CREATE INDEX "agent_operations_updated_at_idx" ON "agent_operations" USING btree ("updated_at");
    CREATE INDEX "agent_operations_created_at_idx" ON "agent_operations" USING btree ("created_at");

    CREATE INDEX "payload_mcp_api_keys_enabled_idx" ON "payload_mcp_api_keys" USING btree ("enabled");
    CREATE INDEX "payload_mcp_api_keys_expires_at_idx" ON "payload_mcp_api_keys" USING btree ("expires_at");
    CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
    CREATE UNIQUE INDEX "payload_mcp_api_keys_api_key_index_idx" ON "payload_mcp_api_keys" USING btree ("api_key_index");
    CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
    CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");

    CREATE INDEX "pages_deleted_at_idx" ON "pages" USING btree ("deleted_at");
    CREATE INDEX "_pages_v_version_version_deleted_at_idx" ON "_pages_v" USING btree ("version_deleted_at");
    CREATE INDEX "posts_deleted_at_idx" ON "posts" USING btree ("deleted_at");
    CREATE INDEX "_posts_v_version_version_deleted_at_idx" ON "_posts_v" USING btree ("version_deleted_at");
    CREATE INDEX "media_deleted_at_idx" ON "media" USING btree ("deleted_at");

    CREATE INDEX "payload_locked_documents_rels_agent_operations_id_idx"
      ON "payload_locked_documents_rels" USING btree ("agent_operations_id");
    CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx"
      ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
    CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx"
      ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_operations_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk";
    ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk";

    DROP INDEX "payload_locked_documents_rels_agent_operations_id_idx";
    DROP INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx";
    DROP INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_operations_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_mcp_api_keys_id";
    ALTER TABLE "payload_preferences_rels" DROP COLUMN "payload_mcp_api_keys_id";

    DROP TABLE "agent_operations" CASCADE;
    DROP TABLE "payload_mcp_api_keys" CASCADE;

    DROP INDEX "pages_deleted_at_idx";
    DROP INDEX "_pages_v_version_version_deleted_at_idx";
    DROP INDEX "posts_deleted_at_idx";
    DROP INDEX "_posts_v_version_version_deleted_at_idx";
    DROP INDEX "media_deleted_at_idx";
    ALTER TABLE "pages" DROP COLUMN "deleted_at";
    ALTER TABLE "_pages_v" DROP COLUMN "version_deleted_at";
    ALTER TABLE "posts" DROP COLUMN "deleted_at";
    ALTER TABLE "_posts_v" DROP COLUMN "version_deleted_at";
    ALTER TABLE "media" DROP COLUMN "deleted_at";

    ALTER TABLE "users" DROP COLUMN "role";
    DROP TYPE "public"."enum_users_role";
    DROP TYPE "public"."enum_agent_operations_status";
    DROP TYPE "public"."enum_agent_operations_target_collection";
    DROP TYPE "public"."enum_agent_operations_approval_status";
  `)
}
