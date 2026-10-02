import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `rdHeaders.currencyLabel` — the second heading inside the globe menu.
 *
 * The nav spec puts "language and currency in one panel behind the globe", and
 * the panel had only language: the globe button has always printed the currency
 * symbol ("EN · €") while offering no way to change it. The currency half needs
 * its own heading, and a heading is copy, so it is a localized field.
 *
 * ONE COLUMN, on `rd_headers_locales`. The collection is not versioned — there
 * is no `_rd_headers_v` — so unlike a page block this is a single table, with no
 * version twin to keep in step.
 *
 * `applyLabel` is deliberately NOT dropped. The same spec says each tap applies
 * straight away and the header no longer renders an Apply button, so the field
 * is unused — but dropping a column throws away whatever nine locales had typed
 * into it, to save nothing. It stays, marked unused in the admin.
 *
 * Idempotent: IF NOT EXISTS / IF EXISTS throughout.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_headers_locales" ADD COLUMN IF NOT EXISTS "currency_label" varchar;
  UPDATE "rd_headers_locales" SET "currency_label" = 'Currency' WHERE "currency_label" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_headers_locales" DROP COLUMN IF EXISTS "currency_label";`)
}
