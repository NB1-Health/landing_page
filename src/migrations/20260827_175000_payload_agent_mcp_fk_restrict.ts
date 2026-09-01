import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agent_operations"
      DROP CONSTRAINT "agent_operations_actor_id_users_id_fk";
    ALTER TABLE "agent_operations"
      ADD CONSTRAINT "agent_operations_actor_id_users_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;

    ALTER TABLE "payload_mcp_api_keys"
      DROP CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk";
    ALTER TABLE "payload_mcp_api_keys"
      ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "agent_operations"
      DROP CONSTRAINT "agent_operations_actor_id_users_id_fk";
    ALTER TABLE "agent_operations"
      ADD CONSTRAINT "agent_operations_actor_id_users_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload_mcp_api_keys"
      DROP CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk";
    ALTER TABLE "payload_mcp_api_keys"
      ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  `)
}
