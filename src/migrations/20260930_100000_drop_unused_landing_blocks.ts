import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Drop 14 unused landing-page blocks: content, benefitsBanner, stepsBanner,
 * productBanner, accessBanner, evolutionBand, outcomesSection, processDiagram,
 * statBreak, reserveCta, athleteBanner, priceBreak, scienceBoard, floatingCTA.
 *
 * 158 tables and 36 enum types.
 *
 * VERIFIED UNUSED before writing this, on BOTH environments, in all three
 * places a block can hide:
 *
 *              staging   production
 *   published    0 x14      0 x14
 *   drafts       0 x14      0 x14
 *   versions     0 x14      0 x14
 *
 * The version count is the one that matters: Payload SILENTLY DROPS blocks
 * whose type is no longer registered, so a block surviving only in an old
 * version row would vanish from that version with no error and the history
 * would be quietly wrong. Checked via
 * /cms/api/pages/versions?where[version.layout.blockType][equals]=<slug>,
 * with a positive control in every environment (rdHero -> 10 versions on
 * staging, helpHero -> 20 on production) so a zero is a measured zero. A
 * made-up block name returns HTTP 500 rather than 0, which is what makes a
 * 200-with-zero trustworthy.
 *
 * These 14 are registered ONLY on the Pages collection — checked against every
 * collection's imports, not just Pages.
 *
 * WHAT IS DELIBERATELY NOT DROPPED
 * --------------------------------
 * `scienceBoardSection` (the ScienceBoardNew block) is STILL REGISTERED and its
 * tables are named `pages_blocks_science_board_section*` — which start with
 * `pages_blocks_science_board_` and so look exactly like children of the
 * `scienceBoard` block being dropped here. A prefix rule takes 12 of its tables
 * with it.
 *
 * They are separated by COLUMN SIGNATURE instead: a Payload block ROOT table
 * carries `_path` and `block_name`; an array child carries `_parent_id` and
 * `_order` and neither. `pages_blocks_science_board_section` has `_path` and
 * `block_name`, so it is a root — a different block — not a child. Every table
 * here was assigned to the LONGEST root it hangs off, so a child of
 * `..._science_board_section` belongs to that block and stays.
 *
 * Also untouched for the same reason: labScienceBoard, ypScienceBoard.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants_athlete_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_variants_cycle1_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants_athlete_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants_usp_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_variants_cycle1_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_list_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_mock_rows_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section_outcome_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants_usp_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants_athlete_cards" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_list_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_athlete_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_variants_cycle1_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_product_banner_carousel_text_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_mock_rows_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_cycle1_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_cycle2_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_pills_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section_outcome_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants_athlete_cards" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants_usp_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_athlete_cards_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_variants_cycle1_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_product_banner_carousel_text_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_usp_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_list_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_cycle1_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_cycle2_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_pills_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_mock_rows" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta_recap_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section_outcome_cards" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants_usp_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_benefits_banner_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_members_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_usp_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_list_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_athlete_cards" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_price_break_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_product_banner_carousel_text" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_mock_rows" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta_recap_items_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_cycle1_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_cycle2_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps_pills" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_stats_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_stat_break_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section_outcome_cards" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_steps_banner_steps_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_benefits_banner_items_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_members_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_athlete_cards" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_price_break_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_product_banner_carousel_text" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_usp_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_cycle1_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_cycle2_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps_pills" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_stats_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_stat_break_variants_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_content_columns_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta_recap_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_steps_banner_steps_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_floating_c_t_a_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_product_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_access_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_benefits_banner_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram_steps" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_members" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_usp_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_price_break_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_steps_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_content_columns_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta_recap_items" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_price_break_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board_stats" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_stat_break_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_floating_c_t_a_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_product_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_stat_break_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_steps_banner_steps" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_access_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_benefits_banner_items" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram_steps" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_members" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_price_break_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta_variants" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_steps_banner_locales" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_outcomes_section" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_price_break_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board_stats" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_stat_break_variants" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_benefits_banner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_content_columns" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_process_diagram" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_stat_break_locales" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_steps_banner_steps" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_athlete_banner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_evolution_band" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_floating_c_t_a" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_product_banner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_access_banner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_science_board" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_outcomes_section" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_steps_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_benefits_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_content_columns" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_process_diagram" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_price_break" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_reserve_cta" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_athlete_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_evolution_band" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_floating_c_t_a" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_product_banner" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_stat_break" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_access_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_science_board" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_steps_banner" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_price_break" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_reserve_cta" CASCADE;
   DROP TABLE IF EXISTS "_pages_v_blocks_content" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_stat_break" CASCADE;
   DROP TABLE IF EXISTS "pages_blocks_content" CASCADE;

   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_athlete_banner_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_athlete_banner_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_link_appearance";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_link_type";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_content_columns_size";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_evolution_band_cycle2_items_status";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_outcomes_section_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_outcomes_section_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_price_break_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_price_break_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_process_diagram_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_process_diagram_steps_mock_rows_status";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_process_diagram_steps_visual_type";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_process_diagram_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_reserve_cta_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_reserve_cta_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_stat_break_background_color";
   DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_stat_break_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_athlete_banner_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_athlete_banner_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_link_appearance";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_link_type";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_content_columns_size";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_evolution_band_cycle2_items_status";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_outcomes_section_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_outcomes_section_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_price_break_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_price_break_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_process_diagram_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_process_diagram_steps_mock_rows_status";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_process_diagram_steps_visual_type";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_process_diagram_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_reserve_cta_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_reserve_cta_variants_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_stat_break_background_color";
   DROP TYPE IF EXISTS "public"."enum_pages_blocks_stat_break_variants_background_color";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op. Re-creating 158 empty tables would leave them
  // orphaned — the block configs are gone from the codebase, so nothing would
  // read or write them. To genuinely reverse this, restore the block configs
  // from git and re-run the migrations that created them.
}
