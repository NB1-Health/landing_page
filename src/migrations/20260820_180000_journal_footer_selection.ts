import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// Footer selection for the Journal, mirroring the fields Pages already has:
//
//   posts.footer_id / posts.hide_footer                 per-article
//   site_settings.journal_footer_id / _hide_footer      the Journal index
//
// Both are non-localized, matching the Pages footer field — the footer document
// carries its own localized content, so there is nothing per-locale to store
// here. That means they live on the main tables, not the `_locales` ones.
//
// Blank means "use the site default", which is the Footer flagged isDefault.
// Note there is no single-default enforcement on Footers (Headers has
// `enforceSingleDefault`; Footers does not), so if two are flagged the lookup
// `where: { isDefault: { equals: true } }, limit: 1` has no deterministic
// winner. Worth fixing separately.
//
// Column and constraint names follow what Payload generates, so a later
// snapshot resync sees no spurious diff.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- ── posts ────────────────────────────────────────────────────────────────
    ALTER TABLE "posts"
      ADD COLUMN IF NOT EXISTS "footer_id" integer,
      ADD COLUMN IF NOT EXISTS "hide_footer" boolean DEFAULT false;

    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_footer_id_footers_id_fk";
    ALTER TABLE "posts"
      ADD CONSTRAINT "posts_footer_id_footers_id_fk"
      FOREIGN KEY ("footer_id") REFERENCES "public"."footers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "posts_footer_idx" ON "posts" USING btree ("footer_id");

    -- ── post versions ────────────────────────────────────────────────────────
    ALTER TABLE "_posts_v"
      ADD COLUMN IF NOT EXISTS "version_footer_id" integer,
      ADD COLUMN IF NOT EXISTS "version_hide_footer" boolean DEFAULT false;

    ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_footer_id_footers_id_fk";
    ALTER TABLE "_posts_v"
      ADD CONSTRAINT "_posts_v_version_footer_id_footers_id_fk"
      FOREIGN KEY ("version_footer_id") REFERENCES "public"."footers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "_posts_v_version_version_footer_idx"
      ON "_posts_v" USING btree ("version_footer_id");

    -- ── site settings ────────────────────────────────────────────────────────
    ALTER TABLE "site_settings"
      ADD COLUMN IF NOT EXISTS "journal_footer_id" integer,
      ADD COLUMN IF NOT EXISTS "journal_hide_footer" boolean DEFAULT false;

    ALTER TABLE "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_journal_footer_id_footers_id_fk";
    ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_journal_footer_id_footers_id_fk"
      FOREIGN KEY ("journal_footer_id") REFERENCES "public"."footers"("id")
      ON DELETE set null ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "site_settings_journal_footer_idx"
      ON "site_settings" USING btree ("journal_footer_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP CONSTRAINT IF EXISTS "site_settings_journal_footer_id_footers_id_fk";
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "journal_footer_id",
      DROP COLUMN IF EXISTS "journal_hide_footer";

    ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_footer_id_footers_id_fk";
    ALTER TABLE "_posts_v"
      DROP COLUMN IF EXISTS "version_footer_id",
      DROP COLUMN IF EXISTS "version_hide_footer";

    ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_footer_id_footers_id_fk";
    ALTER TABLE "posts"
      DROP COLUMN IF EXISTS "footer_id",
      DROP COLUMN IF EXISTS "hide_footer";
  `)
}
