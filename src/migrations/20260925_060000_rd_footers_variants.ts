import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `rd-footers.variant` and the `tone` group — two more footer layouts.
 *
 * Hand-written. The collection's create migration has already run here and on
 * staging, so new fields need a migration that ALTERs what exists.
 *
 * WHY. The redesign has three footers, not one. The homepage's is 43 elements
 * and 559px; Our Plans' is 9 elements and 117px; The Protocol's and The Lab's
 * are the same 279px stack. Measured against each other, the three share a root
 * element — dark-brown ground, cool-grey ink, one hairline — and nothing else.
 * So it is a layout switch on the existing collection rather than a new one:
 * the footer is chrome, selected per page by a relationship, not placed in
 * `layout` like a block.
 *
 * `variant` and the four `tone` columns are NOT localized, so they all sit on
 * the base table. Nothing goes in `rd_footers_locales`: a layout is not
 * translated, and neither is an opacity. There is no `_rd_footers_v` twin
 * because the collection has no drafts.
 *
 * THE TONE COLUMNS ARE A RECORD OF DRIFT, not a design system. The Protocol and
 * The Lab draw the identical stack with three values different — the tagline at
 * .78 against .72, the copyright at rgba(240,245,255,.62) against .72, and the
 * link row set by `color` on one page and by `opacity` on the other. That last
 * one is a different CSS PROPERTY per page, which is why there are two columns
 * for it rather than one: no single field can express both, and recreating both
 * exactly was the deliberate call.
 *
 * NOTHING ALREADY SHIPPED CHANGES. `variant` is nullable, and the component
 * returns the homepage's markup for any row that is not explicitly 'slim' or
 * 'stack' — which is every row that existed before this migration. The full
 * footer's JSX was verified byte-identical before and after, 7,301 bytes on
 * both sides, with no original line removed.
 *
 * Idempotent: IF NOT EXISTS on the columns, duplicate_object on the type.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
   CREATE TYPE "public"."enum_rd_footers_variant" AS ENUM('full', 'slim', 'stack');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "variant" "enum_rd_footers_variant";
  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "tone_tagline_opacity" varchar;
  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "tone_link_row_color" varchar;
  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "tone_link_row_opacity" varchar;
  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "tone_copyright_color" varchar;

  UPDATE "rd_footers" SET "variant" = 'full' WHERE "variant" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "tone_copyright_color";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "tone_link_row_opacity";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "tone_link_row_color";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "tone_tagline_opacity";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "variant";
  DROP TYPE IF EXISTS "public"."enum_rd_footers_variant";`)
}
