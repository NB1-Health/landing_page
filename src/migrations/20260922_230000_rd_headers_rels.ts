import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add the `rd_headers_rels` table that 20260922_220000 should have created.
 *
 * WHAT WENT WRONG. `rd-headers` carries a `localizedLink()` field (`cta`), and
 * that field has a `reference` relationship to BOTH `pages` and `posts`. Payload
 * stores a polymorphic relationship in a side table named `<collection>_rels`,
 * not in a column — so simply having the field obliges the collection to have
 * one. tools/migrate_gen.py --collections emitted the link's scalar columns
 * (`cta_type`, `cta_new_tab`, and the localized `cta_url` / `cta_label`) and
 * stopped there.
 *
 * Nothing caught it because nothing looked. The migration applied cleanly — the
 * missing table is not referenced by any statement in it — and the failure only
 * appeared on the first READ of the collection, as
 * `relation "rd_headers_rels" does not exist` inside a 3,000-character Drizzle
 * query. The blocks never hit this: they live in `pages_blocks_*` and reuse the
 * `pages_rels` table, which has existed for a year.
 *
 * A SEPARATE migration rather than an edit to 20260922_220000, because that one
 * has already run — tables exist and media rows were created before the seed
 * failed. Editing an applied migration would leave this database and a fresh one
 * on different paths.
 *
 * Shape copied from this repo's own `headers_rels` (20260615_091409), minus the
 * `locale` column: there the reference is localized, here it is not, and the
 * query Payload generates for `rd-headers` selects no locale from this table.
 *
 * Every statement is idempotent.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "rd_headers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  DO $$ BEGIN
   ALTER TABLE "rd_headers_rels" ADD CONSTRAINT "rd_headers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rd_headers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "rd_headers_rels" ADD CONSTRAINT "rd_headers_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "rd_headers_rels" ADD CONSTRAINT "rd_headers_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  CREATE INDEX IF NOT EXISTS "rd_headers_rels_order_idx" ON "rd_headers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "rd_headers_rels_parent_idx" ON "rd_headers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "rd_headers_rels_path_idx" ON "rd_headers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "rd_headers_rels_pages_id_idx" ON "rd_headers_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "rd_headers_rels_posts_id_idx" ON "rd_headers_rels" USING btree ("posts_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "rd_headers_rels" CASCADE;
  `)
}
