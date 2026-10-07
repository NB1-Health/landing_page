import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The Lab's figure captions and dose-chart sub-labels: four localized columns,
 * back-filled in all nine locales.
 *
 * WHY THEY EXIST. `rdLbFormula` already had `prebiotics.doseTooLittle`,
 * `doseRight` and `doseTooMuch`, translated everywhere — but the chart drew its
 * axis labels as <text> nodes inside the inline SVG, in English, and those three
 * fields only fed the row of words UNDERNEATH the chart. So a French reader saw
 * "too much / right for you / too little" in the chart and "Trop / Pile ce
 * qu'il vous faut / Pas assez" below it, at the same time. The component now
 * reads the fields in both places; these four are the strings that had no field
 * at all to read.
 *
 * TWO TABLES, because pages ARE versioned: `pages_blocks_rd_lb_formula_locales`
 * and its twin `_pages_v_blocks_rd_lb_formula_locales`. Adding a column to only
 * one of them leaves drafts and autosaves missing it.
 *
 * DEFAULTS DO NOT BACK-FILL. A `defaultValue` in the block config applies when a
 * document is created; page 166 already exists, so without these UPDATEs the new
 * columns would be NULL on the live page and the chart would render blank labels
 * — worse than the English it renders today.
 *
 * Values are the rebrand sheet's, "The Lab" rows 195, 196, 255 and 258,
 * verbatim. The four locales with no column of their own take the language they
 * read: ch follows German, be follows Dutch, uk and uae follow English — the
 * same mapping `getDictionary` uses, so the chart cannot disagree with the rest
 * of the page.
 *
 * Idempotent: IF NOT EXISTS on every column, and every UPDATE is guarded on
 * IS NULL so a re-run cannot overwrite an edit made in the admin.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "basics_figure_caption_alone" varchar;
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "basics_figure_caption_fed" varchar;
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "prebiotics_dose_too_much_sub" varchar;
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "prebiotics_dose_too_little_sub" varchar;
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "basics_figure_caption_alone" varchar;
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "basics_figure_caption_fed" varchar;
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "prebiotics_dose_too_much_sub" varchar;
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" ADD COLUMN IF NOT EXISTS "prebiotics_dose_too_little_sub" varchar;`)

  await db.execute(sql`
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'en' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'uk' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'uae' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Allein passiert sie den Darm' WHERE "_locale" = 'de' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Allein passiert sie den Darm' WHERE "_locale" = 'ch' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Sans ça, elles ne font que passer.' WHERE "_locale" = 'fr' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Op zichzelf spoelt het weer door' WHERE "_locale" = 'nl' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Op zichzelf spoelt het weer door' WHERE "_locale" = 'be' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Da solo, attraversa l’intestino' WHERE "_locale" = 'it' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'en' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'uk' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'uae' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Mit der passenden Faser bleibt sie und wirkt' WHERE "_locale" = 'de' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Mit der passenden Faser bleibt sie und wirkt' WHERE "_locale" = 'ch' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Avec la bonne fibre, elles restent et agissent.' WHERE "_locale" = 'fr' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Met de juiste vezel blijft het en werkt het' WHERE "_locale" = 'nl' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Met de juiste vezel blijft het en werkt het' WHERE "_locale" = 'be' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Con la fibra giusta, resta e lavora' WHERE "_locale" = 'it' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'en' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'uk' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'uae' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'Blähungen und Gasbildung' WHERE "_locale" = 'de' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'Blähungen und Gasbildung' WHERE "_locale" = 'ch' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'ballonnements et gaz' WHERE "_locale" = 'fr' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'opgeblazen gevoel en gasvorming' WHERE "_locale" = 'nl' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'opgeblazen gevoel en gasvorming' WHERE "_locale" = 'be' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'gonfiore e gas' WHERE "_locale" = 'it' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'en' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'uk' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'uae' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'gar keine Wirkung' WHERE "_locale" = 'de' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'gar keine Wirkung' WHERE "_locale" = 'ch' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'aucun impact' WHERE "_locale" = 'fr' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'geen enkele impact' WHERE "_locale" = 'nl' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'geen enkele impact' WHERE "_locale" = 'be' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "pages_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'nessun impatto' WHERE "_locale" = 'it' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'en' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'uk' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'On its own, it washes through' WHERE "_locale" = 'uae' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Allein passiert sie den Darm' WHERE "_locale" = 'de' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Allein passiert sie den Darm' WHERE "_locale" = 'ch' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Sans ça, elles ne font que passer.' WHERE "_locale" = 'fr' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Op zichzelf spoelt het weer door' WHERE "_locale" = 'nl' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Op zichzelf spoelt het weer door' WHERE "_locale" = 'be' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_alone" = 'Da solo, attraversa l’intestino' WHERE "_locale" = 'it' AND "basics_figure_caption_alone" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'en' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'uk' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Fed the right fibre, it stays and works' WHERE "_locale" = 'uae' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Mit der passenden Faser bleibt sie und wirkt' WHERE "_locale" = 'de' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Mit der passenden Faser bleibt sie und wirkt' WHERE "_locale" = 'ch' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Avec la bonne fibre, elles restent et agissent.' WHERE "_locale" = 'fr' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Met de juiste vezel blijft het en werkt het' WHERE "_locale" = 'nl' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Met de juiste vezel blijft het en werkt het' WHERE "_locale" = 'be' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "basics_figure_caption_fed" = 'Con la fibra giusta, resta e lavora' WHERE "_locale" = 'it' AND "basics_figure_caption_fed" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'en' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'uk' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'bloating and gas' WHERE "_locale" = 'uae' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'Blähungen und Gasbildung' WHERE "_locale" = 'de' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'Blähungen und Gasbildung' WHERE "_locale" = 'ch' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'ballonnements et gaz' WHERE "_locale" = 'fr' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'opgeblazen gevoel en gasvorming' WHERE "_locale" = 'nl' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'opgeblazen gevoel en gasvorming' WHERE "_locale" = 'be' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_much_sub" = 'gonfiore e gas' WHERE "_locale" = 'it' AND "prebiotics_dose_too_much_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'en' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'uk' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'no impact at all' WHERE "_locale" = 'uae' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'gar keine Wirkung' WHERE "_locale" = 'de' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'gar keine Wirkung' WHERE "_locale" = 'ch' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'aucun impact' WHERE "_locale" = 'fr' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'geen enkele impact' WHERE "_locale" = 'nl' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'geen enkele impact' WHERE "_locale" = 'be' AND "prebiotics_dose_too_little_sub" IS NULL;
  UPDATE "_pages_v_blocks_rd_lb_formula_locales" SET "prebiotics_dose_too_little_sub" = 'nessun impatto' WHERE "_locale" = 'it' AND "prebiotics_dose_too_little_sub" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "basics_figure_caption_alone";
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "basics_figure_caption_fed";
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "prebiotics_dose_too_much_sub";
  ALTER TABLE "pages_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "prebiotics_dose_too_little_sub";
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "basics_figure_caption_alone";
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "basics_figure_caption_fed";
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "prebiotics_dose_too_much_sub";
  ALTER TABLE "_pages_v_blocks_rd_lb_formula_locales" DROP COLUMN IF EXISTS "prebiotics_dose_too_little_sub";`)
}
