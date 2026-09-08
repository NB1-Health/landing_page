import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Header selection to match the footer selection added in
// 20260820_180000_journal_footer_selection, mirroring the fields Pages has:
//
//   posts.header_id / posts.hide_header                 per-article
//   site_settings.journal_header_id / _hide_header      the Journal index
//
// This is a separate migration rather than an edit to the footer one, because
// that may already have been applied — Payload tracks migrations by name, so
// extending an applied file would never run the new statements.
//
// Non-localized, like the Pages header field: the header document carries its
// own localized content. Blank means "use the site default", the Header flagged
// isDefault (Headers does enforce a single default, via enforceSingleDefault).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── posts ────────────────────────────────────────────────────────────────
    ALTER TABLE "posts"
      ADD COLUMN IF NOT EXISTS "header_id" integer,
      ADD COLUMN IF NOT EXISTS "hide_header" boolean DEFAULT false;

    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_header_id_headers_id_fk";
    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_header_id_headers_id_fk"
      FOREIGN KEY ("header_id") REFERENCES "public"."headers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "posts_header_idx" ON "posts" USING btree ("header_id");

    -- ── post versions ────────────────────────────────────────────────────────
    ALTER TABLE "_posts_v"
      ADD COLUMN IF NOT EXISTS "version_header_id" integer,
      ADD COLUMN IF NOT EXISTS "version_hide_header" boolean DEFAULT false;

    ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_header_id_headers_id_fk";
    ALTER TABLE "_posts_v"
      ADD CONSTRAINT "_posts_v_version_header_id_headers_id_fk"
      FOREIGN KEY ("version_header_id") REFERENCES "public"."headers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_header_idx"
      ON "_posts_v" USING btree ("version_header_id");

    -- ── site settings ────────────────────────────────────────────────────────
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "journal_header_id" integer,
      ADD COLUMN IF NOT EXISTS "journal_hide_header" boolean DEFAULT false;

    ALTER TABLE "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_journal_header_id_headers_id_fk";
    ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_journal_header_id_headers_id_fk"
      FOREIGN KEY ("journal_header_id") REFERENCES "public"."headers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "site_settings_journal_header_idx"
      ON "site_settings" USING btree ("journal_header_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_journal_header_id_headers_id_fk";
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "journal_header_id",
      DROP COLUMN IF EXISTS "journal_hide_header";

    ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_header_id_headers_id_fk";
    ALTER TABLE "_posts_v"
      DROP COLUMN IF EXISTS "version_header_id",
      DROP COLUMN IF EXISTS "version_hide_header";

    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_header_id_headers_id_fk";
    ALTER TABLE "posts"
      DROP COLUMN IF EXISTS "header_id",
      DROP COLUMN IF EXISTS "hide_header";
  `)
}
