import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// The article CTA panel (the brief's `.art-cta`) becomes editable: heading,
// body, button label and target join the existing `journal` group on Site
// Settings. All localized, so they land in `site_settings_locales` — created by
// 20260820_140000_journal_site_settings, hence only ADD COLUMN here.
//
// The target is stored per locale so a market can point at a different page, and
// without a locale prefix (`/your-plan`) — utilities/journalCopy.ts adds it, and
// passes a full https:// URL straight through.
//
// Nullable on purpose: every field falls back to the shipped translation, so an
// unfilled locale renders working copy rather than an empty panel.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings_locales"
      ADD COLUMN IF NOT EXISTS "journal_cta_heading" varchar,
      ADD COLUMN IF NOT EXISTS "journal_cta_body" varchar,
      ADD COLUMN IF NOT EXISTS "journal_cta_label" varchar,
      ADD COLUMN IF NOT EXISTS "journal_cta_url" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings_locales"
      DROP COLUMN IF EXISTS "journal_cta_heading",
      DROP COLUMN IF EXISTS "journal_cta_body",
      DROP COLUMN IF EXISTS "journal_cta_label",
      DROP COLUMN IF EXISTS "journal_cta_url";
  `)
}
