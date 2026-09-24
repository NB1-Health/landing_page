import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add `rdLbMethod.leftFigure` and `.rightFigure` — the two gut clouds become
 * uploads an editor can replace, instead of two files in public/rd-lb/.
 *
 * Hand-written from the shape tools/migrate_gen.py emits for an upload field —
 * the block's create migration has already run here and on staging, so a new
 * field needs a migration that ALTERs what exists. Regenerating the original
 * does nothing, because it is recorded as applied.
 *
 * WHY THE FIELDS EXIST. The clouds shipped as `public/rd-lb/method-16s.svg` and
 * `method-shotgun.svg`, referenced by a hard-coded path. That broke this page's
 * own rule — every image is a CMS field — and it broke quietly: the two files
 * were never tracked by git, so the section rendered two empty panels anywhere
 * the repo had been cloned rather than copied.
 *
 * Mirrors `pages_blocks_rd_lb_lab.image_id` exactly: a nullable integer, a
 * foreign key to media with ON DELETE set null, and an index. Both the live
 * table and its `_pages_v` twin, because a draft save writes the version row
 * and a column missing from one of the pair fails the whole insert.
 *
 * ON DELETE set null, not cascade: deleting a media row must empty the field,
 * never delete the block that referenced it.
 *
 * The columns are NULLABLE and the component renders the panel with no <image>
 * when the field is empty, so the section still lays out — the three tappable
 * microbes stay put — while an editor attaches the files. Nothing already
 * seeded changes: no other block's table is touched.
 *
 * Idempotent: IF NOT EXISTS on the columns and the indexes, duplicate_object
 * guards on the constraints, so a re-run is a no-op.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_lb_method" ADD COLUMN IF NOT EXISTS "left_figure_id" integer;
  ALTER TABLE "pages_blocks_rd_lb_method" ADD COLUMN IF NOT EXISTS "right_figure_id" integer;
  ALTER TABLE "_pages_v_blocks_rd_lb_method" ADD COLUMN IF NOT EXISTS "left_figure_id" integer;
  ALTER TABLE "_pages_v_blocks_rd_lb_method" ADD COLUMN IF NOT EXISTS "right_figure_id" integer;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_rd_lb_method" ADD CONSTRAINT "pages_blocks_rd_lb_method_left_figure_id_media_id_fk" FOREIGN KEY ("left_figure_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "pages_blocks_rd_lb_method" ADD CONSTRAINT "pages_blocks_rd_lb_method_right_figure_id_media_id_fk" FOREIGN KEY ("right_figure_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_rd_lb_method" ADD CONSTRAINT "_pages_v_blocks_rd_lb_method_left_figure_id_media_id_fk" FOREIGN KEY ("left_figure_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_rd_lb_method" ADD CONSTRAINT "_pages_v_blocks_rd_lb_method_right_figure_id_media_id_fk" FOREIGN KEY ("right_figure_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_rd_lb_method_left_figure_idx" ON "pages_blocks_rd_lb_method" USING btree ("left_figure_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_rd_lb_method_right_figure_idx" ON "pages_blocks_rd_lb_method" USING btree ("right_figure_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_rd_lb_method_left_figure_idx" ON "_pages_v_blocks_rd_lb_method" USING btree ("left_figure_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_rd_lb_method_right_figure_idx" ON "_pages_v_blocks_rd_lb_method" USING btree ("right_figure_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "pages_blocks_rd_lb_method_left_figure_idx";
  DROP INDEX IF EXISTS "pages_blocks_rd_lb_method_right_figure_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_rd_lb_method_left_figure_idx";
  DROP INDEX IF EXISTS "_pages_v_blocks_rd_lb_method_right_figure_idx";
  ALTER TABLE "pages_blocks_rd_lb_method" DROP COLUMN IF EXISTS "left_figure_id";
  ALTER TABLE "pages_blocks_rd_lb_method" DROP COLUMN IF EXISTS "right_figure_id";
  ALTER TABLE "_pages_v_blocks_rd_lb_method" DROP COLUMN IF EXISTS "left_figure_id";
  ALTER TABLE "_pages_v_blocks_rd_lb_method" DROP COLUMN IF EXISTS "right_figure_id";`)
}
