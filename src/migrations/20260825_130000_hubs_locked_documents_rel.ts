import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Adds `payload_locked_documents_rels.hubs_id`, which 20260825_120000_hubs
// should have created and did not.
//
// WHAT WENT WRONG
//
// Payload keeps one polymorphic join table, `payload_locked_documents_rels`,
// with a `<collection>_id` column for EVERY collection in the config — that is
// how admin edit-locks point at a document of any type. Registering a new
// collection therefore changes a table that has nothing to do with that
// collection, and the previous migration only created the `hubs` tables.
//
// The failure is not subtle but it is badly located: Payload builds the SELECT
// from the config, so it asked for `hubs_id` on every admin request and Postgres
// answered `column ... does not exist`. The whole /cms/admin dashboard 500s —
// including the Hubs screen you would go to in order to fix it.
//
// Separate migration rather than an edit to the previous one, because that has
// already been applied and Payload tracks migrations by name: extending an
// applied file would never run the new statements.
//
// Anything else that lists all the collections needs the same treatment. Checked
// against the schema snapshot: `payload_locked_documents_rels` is the only such
// table. The search plugin's own rels table covers only the collections it
// indexes, and Hubs is not one of them.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "hubs_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hubs_fk";

    -- cascade, matching every other collection in this table: deleting a hub
    -- should drop its stale edit-lock rows rather than orphan them.
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_hubs_fk"
      FOREIGN KEY ("hubs_id") REFERENCES "public"."hubs"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_hubs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("hubs_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_hubs_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_hubs_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "hubs_id";
  `)
}
