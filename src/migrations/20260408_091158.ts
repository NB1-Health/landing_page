import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

const BRIDGE_MARKER = 'payload-migration:20260408_091158:fresh-replay'

type BridgeState = {
  hasLegacyPostTitle: boolean
  hasLocalizedPostTitle: boolean
  hasPageHeroLocales: boolean
  hasPostMetaTitle: boolean
  hasVersionPageHeroLocales: boolean
  marker: string | null
}

async function readBridgeState(db: MigrateUpArgs['db']): Promise<BridgeState> {
  const result = await db.execute<BridgeState>(sql`
    SELECT
      to_regclass('public.pages_hero_links_locales') IS NOT NULL AS "hasPageHeroLocales",
      to_regclass('public._pages_v_version_hero_links_locales') IS NOT NULL AS "hasVersionPageHeroLocales",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts_locales'
          AND column_name = 'title'
      ) AS "hasLocalizedPostTitle",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'meta_title'
      ) AS "hasPostMetaTitle",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = 'title'
      ) AS "hasLegacyPostTitle",
      obj_description(
        to_regclass('public.pages_hero_links_locales'),
        'pg_class'
      ) AS "marker"
  `)

  return (
    result.rows[0] ?? {
      hasLegacyPostTitle: false,
      hasLocalizedPostTitle: false,
      hasPageHeroLocales: false,
      hasPostMetaTitle: false,
      hasVersionPageHeroLocales: false,
      marker: null,
    }
  )
}

/**
 * This migration's snapshot was committed without its generated TypeScript.
 *
 * Existing staging/production databases received this schema historically, so
 * replaying the raw DDL there would fail or overwrite later schema changes.
 * Fresh databases only have the preceding snapshot and need the exact generated
 * diff below. The persistent page-hero locale tables plus the Posts move form a
 * stable fingerprint: later migrations retain them, while the preceding
 * snapshot has none of them.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const state = await readBridgeState(db)
  const targetAlreadyPresent =
    state.hasPageHeroLocales &&
    state.hasVersionPageHeroLocales &&
    state.hasLocalizedPostTitle &&
    state.hasPostMetaTitle &&
    !state.hasLegacyPostTitle

  if (targetAlreadyPresent) {
    payload.logger.info(
      'Skipping 20260408_091158 replay: its historical schema is already present.',
    )
    return
  }

  const partiallyPresent =
    state.hasPageHeroLocales ||
    state.hasVersionPageHeroLocales ||
    state.hasLocalizedPostTitle ||
    state.hasPostMetaTitle ||
    !state.hasLegacyPostTitle

  if (partiallyPresent) {
    throw new Error(
      'Cannot safely replay 20260408_091158 because its schema fingerprint is only partially present: ' +
        JSON.stringify(state),
    )
  }

  // The preceding migration file creates only en/de even though its matching
  // snapshot already declares fr. Reconcile that historical file/snapshot gap
  // here so the next migration can safely cast and insert the fr locale.
  await db.execute(sql`
    ALTER TYPE "public"."_locales" ADD VALUE IF NOT EXISTS 'fr';
  `)

  await db.execute(sql`
CREATE TYPE "public"."enum_pages_blocks_data_table_variant" AS ENUM('glossary', 'comparison');
CREATE TYPE "public"."enum__pages_v_blocks_data_table_variant" AS ENUM('glossary', 'comparison');
CREATE TABLE "pages_hero_links_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_cta_links_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_content_columns_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_box_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"icon_id" integer
);

CREATE TABLE "pages_blocks_box_card_items_list_locales" (
	"text_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_box_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"note" varchar,
	"background_image_web_id" integer,
	"background_image_mobile_id" integer,
	"box_image_web_id" integer,
	"box_image_mobile_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_box_card_locales" (
	"title" jsonb,
	"description" jsonb,
	"button_label" varchar,
	"button_redirect" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_formula_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_formula_card_items_list_locales" (
	"text_label1" jsonb,
	"text_label2" jsonb,
	"text_label3" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_formula_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"kit_image_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_formula_card_locales" (
	"title" jsonb,
	"description" jsonb,
	"button_button_text" varchar,
	"button_button_link" varchar,
	"note" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_results_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"icon_id" integer
);

CREATE TABLE "pages_blocks_results_card_items_list_locales" (
	"item_title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_results_card_results_cards" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"result_image_id" integer
);

CREATE TABLE "pages_blocks_results_card_results_cards_locales" (
	"result_title" varchar,
	"result_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_results_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_results_card_locales" (
	"title" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_review_card_reviews" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"review_icon_id" integer
);

CREATE TABLE "pages_blocks_review_card_reviews_locales" (
	"review_title" varchar,
	"reviewer_name" varchar,
	"reviewer_country" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_review_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"navigation_right_id" integer,
	"navigation_left_id" integer,
	"note_note_icon_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_review_card_locales" (
	"title" jsonb,
	"description" varchar,
	"note_note_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_steps_card_steps" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"step_number_id" integer,
	"icon_id" integer
);

CREATE TABLE "pages_blocks_steps_card_steps_locales" (
	"step_title" varchar,
	"step_description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_steps_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_steps_card_locales" (
	"title" jsonb,
	"note" varchar,
	"button_label" varchar,
	"button_redirect_url" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_symptoms_card_symptoms" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_symptoms_card_symptoms_locales" (
	"symptom" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_symptoms_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"symptoms_image_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_symptoms_card_locales" (
	"title" jsonb,
	"more_button" varchar,
	"description" varchar,
	"test_button_button_text" varchar,
	"test_button_button_link" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_video_card_reviews" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"video_id" integer,
	"thumbnail_id" integer
);

CREATE TABLE "pages_blocks_video_card_reviews_locales" (
	"name" varchar,
	"description" varchar,
	"review" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_video_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"navigation_right_id" integer,
	"navigation_left_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_video_card_locales" (
	"title" jsonb,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_key_takeaways_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_key_takeaways_items_locales" (
	"lead_in" varchar,
	"explanation" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_key_takeaways" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_faq_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_faq_items_locales" (
	"question" varchar,
	"answer" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_faq" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_data_table_column_headers" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_data_table_column_headers_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_data_table_rows_cells" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_data_table_rows_cells_locales" (
	"value" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_data_table_rows" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_data_table" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"variant" "enum_pages_blocks_data_table_variant" DEFAULT 'glossary',
	"highlight_column" numeric,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_data_table_locales" (
	"section_title" varchar,
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_cta_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"button_url" varchar DEFAULT '/order',
	"block_name" varchar
);

CREATE TABLE "pages_blocks_cta_block_locales" (
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_bullet_list_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_bullet_list_items_locales" (
	"lead_in" varchar,
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_bullet_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_bullet_list_locales" (
	"section_title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_contact_form" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"recipient_email" varchar,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_contact_form_locales" (
	"title" varchar,
	"description" varchar,
	"form_title" varchar,
	"form_description" varchar,
	"labels_first_name" varchar DEFAULT 'First Name',
	"labels_last_name" varchar DEFAULT 'Last Name',
	"labels_email" varchar DEFAULT 'Email',
	"labels_message" varchar DEFAULT 'Message',
	"placeholders_first_name" varchar DEFAULT 'Enter your first name',
	"placeholders_last_name" varchar DEFAULT 'Enter your last name',
	"placeholders_email" varchar DEFAULT 'Enter your email address',
	"placeholders_message" varchar DEFAULT 'Write your message here...',
	"submit_label" varchar DEFAULT 'Send Message',
	"success_message" varchar DEFAULT 'Thank you! Your message has been sent. We will get back to you shortly.',
	"error_message" varchar DEFAULT 'Something went wrong. Please try again.',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_contact_info_social_links" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"platform" varchar,
	"url" varchar
);

CREATE TABLE "pages_blocks_contact_info" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"phone" varchar,
	"email" varchar,
	"background_image_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_contact_info_locales" (
	"title" varchar,
	"description" varchar,
	"phone_label" varchar DEFAULT 'Phone',
	"email_label" varchar DEFAULT 'Email',
	"address" varchar,
	"address_label" varchar DEFAULT 'Address',
	"hours" varchar,
	"hours_label" varchar DEFAULT 'Business Hours',
	"socials_label" varchar DEFAULT 'Follow Us',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_contact_section_info_social_links" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"platform" varchar,
	"url" varchar
);

CREATE TABLE "pages_blocks_contact_section" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"form_recipient_email" varchar,
	"info_phone" varchar,
	"info_email" varchar,
	"info_background_image_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_contact_section_locales" (
	"form_title" varchar,
	"form_description" varchar,
	"form_form_title" varchar,
	"form_form_description" varchar,
	"form_labels_first_name" varchar DEFAULT 'First Name',
	"form_labels_last_name" varchar DEFAULT 'Last Name',
	"form_labels_email" varchar DEFAULT 'Email',
	"form_labels_message" varchar DEFAULT 'Message',
	"form_placeholders_first_name" varchar DEFAULT 'Enter your first name',
	"form_placeholders_last_name" varchar DEFAULT 'Enter your last name',
	"form_placeholders_email" varchar DEFAULT 'Enter your email address',
	"form_placeholders_message" varchar DEFAULT 'Write your message here...',
	"form_submit_label" varchar DEFAULT 'Send Message',
	"form_success_message" varchar DEFAULT 'Thank you! Your message has been sent. We will get back to you shortly.',
	"form_error_message" varchar DEFAULT 'Something went wrong. Please try again.',
	"info_title" varchar,
	"info_description" varchar,
	"info_phone_label" varchar DEFAULT 'Phone',
	"info_email_label" varchar DEFAULT 'Email',
	"info_address" varchar,
	"info_address_label" varchar DEFAULT 'Address',
	"info_hours" varchar,
	"info_hours_label" varchar DEFAULT 'Business Hours',
	"info_socials_label" varchar DEFAULT 'Follow Us',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_benefits_banner_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"icon_id" integer
);

CREATE TABLE "pages_blocks_benefits_banner_items_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_benefits_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_steps_banner_steps" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"icon_id" integer
);

CREATE TABLE "pages_blocks_steps_banner_steps_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_steps_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"arrow_icon_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_steps_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_banner_carousel_text" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_product_banner_carousel_text_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"form_id" integer,
	"enable_intro" boolean DEFAULT false,
	"banner_image_id" integer,
	"banner_background_id" integer,
	"mobile_banner_background_id" integer,
	"logo_id" integer,
	"login_button_show" boolean DEFAULT false,
	"login_button_url" varchar,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_product_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"form_text" varchar,
	"button_text" varchar,
	"intro_content" jsonb,
	"login_button_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_access_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"form_id" integer,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_access_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"quote" varchar,
	"form_text" varchar,
	"button_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase_panel_thumbnails" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"image_id" integer
);

CREATE TABLE "pages_blocks_product_showcase_plans_features" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"highlighted" boolean DEFAULT false
);

CREATE TABLE "pages_blocks_product_showcase_plans_features_locales" (
	"text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase_plans_prices" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"is_default" boolean DEFAULT false
);

CREATE TABLE "pages_blocks_product_showcase_plans_prices_locales" (
	"duration_label" varchar,
	"price_label" varchar,
	"per_day_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase_plans" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"badge_highlighted" boolean DEFAULT false,
	"button_link" varchar
);

CREATE TABLE "pages_blocks_product_showcase_plans_locales" (
	"badge_label" varchar,
	"card_title" varchar,
	"button_label" varchar DEFAULT 'Add to cart',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase_faq_items" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase_faq_items_locales" (
	"question" varchar,
	"answer" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "pages_blocks_product_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
);

CREATE TABLE "pages_blocks_product_showcase_locales" (
	"title" jsonb,
	"badge" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "_pages_v_version_hero_links_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_cta_links_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_content_columns_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_box_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_box_card_items_list_locales" (
	"text_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_box_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"note" varchar,
	"background_image_web_id" integer,
	"background_image_mobile_id" integer,
	"box_image_web_id" integer,
	"box_image_mobile_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_box_card_locales" (
	"title" jsonb,
	"description" jsonb,
	"button_label" varchar,
	"button_redirect" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_formula_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_formula_card_items_list_locales" (
	"text_label1" jsonb,
	"text_label2" jsonb,
	"text_label3" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_formula_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"kit_image_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_formula_card_locales" (
	"title" jsonb,
	"description" jsonb,
	"button_button_text" varchar,
	"button_button_link" varchar,
	"note" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_results_card_items_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_results_card_items_list_locales" (
	"item_title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_results_card_results_cards" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"result_image_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_results_card_results_cards_locales" (
	"result_title" varchar,
	"result_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_results_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_results_card_locales" (
	"title" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_review_card_reviews" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"review_icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_review_card_reviews_locales" (
	"review_title" varchar,
	"reviewer_name" varchar,
	"reviewer_country" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_review_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"navigation_right_id" integer,
	"navigation_left_id" integer,
	"note_note_icon_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_review_card_locales" (
	"title" jsonb,
	"description" varchar,
	"note_note_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_steps_card_steps" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"step_number_id" integer,
	"icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_steps_card_steps_locales" (
	"step_title" varchar,
	"step_description" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_steps_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_steps_card_locales" (
	"title" jsonb,
	"note" varchar,
	"button_label" varchar,
	"button_redirect_url" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_symptoms_card_symptoms" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_symptoms_card_symptoms_locales" (
	"symptom" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_symptoms_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"symptoms_image_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_symptoms_card_locales" (
	"title" jsonb,
	"more_button" varchar,
	"description" varchar,
	"test_button_button_text" varchar,
	"test_button_button_link" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_video_card_reviews" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"video_id" integer,
	"thumbnail_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_video_card_reviews_locales" (
	"name" varchar,
	"description" varchar,
	"review" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_video_card" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"navigation_right_id" integer,
	"navigation_left_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_video_card_locales" (
	"title" jsonb,
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_key_takeaways_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_key_takeaways_items_locales" (
	"lead_in" varchar,
	"explanation" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_key_takeaways" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_faq_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_faq_items_locales" (
	"question" varchar,
	"answer" jsonb,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_faq" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_data_table_column_headers" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_data_table_column_headers_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_data_table_rows_cells" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_data_table_rows_cells_locales" (
	"value" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_data_table_rows" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_data_table" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"variant" "enum__pages_v_blocks_data_table_variant" DEFAULT 'glossary',
	"highlight_column" numeric,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_data_table_locales" (
	"section_title" varchar,
	"caption" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_cta_block" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"button_url" varchar DEFAULT '/order',
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_cta_block_locales" (
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_bullet_list_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_bullet_list_items_locales" (
	"lead_in" varchar,
	"body" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_bullet_list" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_bullet_list_locales" (
	"section_title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_contact_form" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"recipient_email" varchar,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_contact_form_locales" (
	"title" varchar,
	"description" varchar,
	"form_title" varchar,
	"form_description" varchar,
	"labels_first_name" varchar DEFAULT 'First Name',
	"labels_last_name" varchar DEFAULT 'Last Name',
	"labels_email" varchar DEFAULT 'Email',
	"labels_message" varchar DEFAULT 'Message',
	"placeholders_first_name" varchar DEFAULT 'Enter your first name',
	"placeholders_last_name" varchar DEFAULT 'Enter your last name',
	"placeholders_email" varchar DEFAULT 'Enter your email address',
	"placeholders_message" varchar DEFAULT 'Write your message here...',
	"submit_label" varchar DEFAULT 'Send Message',
	"success_message" varchar DEFAULT 'Thank you! Your message has been sent. We will get back to you shortly.',
	"error_message" varchar DEFAULT 'Something went wrong. Please try again.',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_contact_info_social_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar,
	"url" varchar,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_contact_info" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar,
	"email" varchar,
	"background_image_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_contact_info_locales" (
	"title" varchar,
	"description" varchar,
	"phone_label" varchar DEFAULT 'Phone',
	"email_label" varchar DEFAULT 'Email',
	"address" varchar,
	"address_label" varchar DEFAULT 'Address',
	"hours" varchar,
	"hours_label" varchar DEFAULT 'Business Hours',
	"socials_label" varchar DEFAULT 'Follow Us',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_contact_section_info_social_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar,
	"url" varchar,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_contact_section" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"form_recipient_email" varchar,
	"info_phone" varchar,
	"info_email" varchar,
	"info_background_image_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_contact_section_locales" (
	"form_title" varchar,
	"form_description" varchar,
	"form_form_title" varchar,
	"form_form_description" varchar,
	"form_labels_first_name" varchar DEFAULT 'First Name',
	"form_labels_last_name" varchar DEFAULT 'Last Name',
	"form_labels_email" varchar DEFAULT 'Email',
	"form_labels_message" varchar DEFAULT 'Message',
	"form_placeholders_first_name" varchar DEFAULT 'Enter your first name',
	"form_placeholders_last_name" varchar DEFAULT 'Enter your last name',
	"form_placeholders_email" varchar DEFAULT 'Enter your email address',
	"form_placeholders_message" varchar DEFAULT 'Write your message here...',
	"form_submit_label" varchar DEFAULT 'Send Message',
	"form_success_message" varchar DEFAULT 'Thank you! Your message has been sent. We will get back to you shortly.',
	"form_error_message" varchar DEFAULT 'Something went wrong. Please try again.',
	"info_title" varchar,
	"info_description" varchar,
	"info_phone_label" varchar DEFAULT 'Phone',
	"info_email_label" varchar DEFAULT 'Email',
	"info_address" varchar,
	"info_address_label" varchar DEFAULT 'Address',
	"info_hours" varchar,
	"info_hours_label" varchar DEFAULT 'Business Hours',
	"info_socials_label" varchar DEFAULT 'Follow Us',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_benefits_banner_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_benefits_banner_items_locales" (
	"title" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_benefits_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_steps_banner_steps" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"icon_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_steps_banner_steps_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_steps_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"arrow_icon_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_steps_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_banner_carousel_text" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_banner_carousel_text_locales" (
	"label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer,
	"enable_intro" boolean DEFAULT false,
	"banner_image_id" integer,
	"banner_background_id" integer,
	"mobile_banner_background_id" integer,
	"logo_id" integer,
	"login_button_show" boolean DEFAULT false,
	"login_button_url" varchar,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_product_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"form_text" varchar,
	"button_text" varchar,
	"intro_content" jsonb,
	"login_button_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_access_banner" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_access_banner_locales" (
	"title" jsonb,
	"subtitle" varchar,
	"quote" varchar,
	"form_text" varchar,
	"button_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_showcase_panel_thumbnails" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" integer,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans_features" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"highlighted" boolean DEFAULT false,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans_features_locales" (
	"text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans_prices" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"is_default" boolean DEFAULT false,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans_prices_locales" (
	"duration_label" varchar,
	"price_label" varchar,
	"per_day_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"badge_highlighted" boolean DEFAULT false,
	"button_link" varchar,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_plans_locales" (
	"badge_label" varchar,
	"card_title" varchar,
	"button_label" varchar DEFAULT 'Add to cart',
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_showcase_faq_items" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_faq_items_locales" (
	"question" varchar,
	"answer" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "_pages_v_blocks_product_showcase" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
);

CREATE TABLE "_pages_v_blocks_product_showcase_locales" (
	"title" jsonb,
	"badge" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

CREATE TABLE "footer_nav_items_locales" (
	"link_localized_label" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
);

CREATE TABLE "footer_locales" (
	"copyright_text" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" integer NOT NULL
);

ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
ALTER TABLE "posts" ADD COLUMN "focus_keyword" varchar;
ALTER TABLE "posts_locales" ADD COLUMN "title" varchar;
ALTER TABLE "posts_locales" ADD COLUMN "subtitle" varchar;
ALTER TABLE "posts_locales" ADD COLUMN "intro" jsonb;
ALTER TABLE "posts_locales" ADD COLUMN "content" jsonb;
ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_focus_keyword" varchar;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_title" varchar;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_subtitle" varchar;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_intro" jsonb;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_content" jsonb;
ALTER TABLE "header_nav_items" ADD COLUMN "link_localized_label" varchar;
ALTER TABLE "footer" ADD COLUMN "logo_id" integer;
ALTER TABLE "pages_hero_links_locales" ADD CONSTRAINT "pages_hero_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_hero_links"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_cta_links_locales" ADD CONSTRAINT "pages_blocks_cta_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_links"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_content_columns_locales" ADD CONSTRAINT "pages_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card_items_list" ADD CONSTRAINT "pages_blocks_box_card_items_list_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card_items_list" ADD CONSTRAINT "pages_blocks_box_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_box_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card_items_list_locales" ADD CONSTRAINT "pages_blocks_box_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_box_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card" ADD CONSTRAINT "pages_blocks_box_card_background_image_web_id_media_id_fk" FOREIGN KEY ("background_image_web_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card" ADD CONSTRAINT "pages_blocks_box_card_background_image_mobile_id_media_id_fk" FOREIGN KEY ("background_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card" ADD CONSTRAINT "pages_blocks_box_card_box_image_web_id_media_id_fk" FOREIGN KEY ("box_image_web_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card" ADD CONSTRAINT "pages_blocks_box_card_box_image_mobile_id_media_id_fk" FOREIGN KEY ("box_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card" ADD CONSTRAINT "pages_blocks_box_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_box_card_locales" ADD CONSTRAINT "pages_blocks_box_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_box_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_formula_card_items_list" ADD CONSTRAINT "pages_blocks_formula_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_formula_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_formula_card_items_list_locales" ADD CONSTRAINT "pages_blocks_formula_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_formula_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_formula_card" ADD CONSTRAINT "pages_blocks_formula_card_kit_image_id_media_id_fk" FOREIGN KEY ("kit_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_formula_card" ADD CONSTRAINT "pages_blocks_formula_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_formula_card_locales" ADD CONSTRAINT "pages_blocks_formula_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_formula_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_items_list" ADD CONSTRAINT "pages_blocks_results_card_items_list_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_items_list" ADD CONSTRAINT "pages_blocks_results_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_items_list_locales" ADD CONSTRAINT "pages_blocks_results_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_results_cards" ADD CONSTRAINT "pages_blocks_results_card_results_cards_result_image_id_media_id_fk" FOREIGN KEY ("result_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_results_cards" ADD CONSTRAINT "pages_blocks_results_card_results_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_results_cards_locales" ADD CONSTRAINT "pages_blocks_results_card_results_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_card_results_cards"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card" ADD CONSTRAINT "pages_blocks_results_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_results_card_locales" ADD CONSTRAINT "pages_blocks_results_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card_reviews" ADD CONSTRAINT "pages_blocks_review_card_reviews_review_icon_id_media_id_fk" FOREIGN KEY ("review_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card_reviews" ADD CONSTRAINT "pages_blocks_review_card_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_review_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card_reviews_locales" ADD CONSTRAINT "pages_blocks_review_card_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_review_card_reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card" ADD CONSTRAINT "pages_blocks_review_card_navigation_right_id_media_id_fk" FOREIGN KEY ("navigation_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card" ADD CONSTRAINT "pages_blocks_review_card_navigation_left_id_media_id_fk" FOREIGN KEY ("navigation_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card" ADD CONSTRAINT "pages_blocks_review_card_note_note_icon_id_media_id_fk" FOREIGN KEY ("note_note_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card" ADD CONSTRAINT "pages_blocks_review_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_review_card_locales" ADD CONSTRAINT "pages_blocks_review_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_review_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card_steps" ADD CONSTRAINT "pages_blocks_steps_card_steps_step_number_id_media_id_fk" FOREIGN KEY ("step_number_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card_steps" ADD CONSTRAINT "pages_blocks_steps_card_steps_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card_steps" ADD CONSTRAINT "pages_blocks_steps_card_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card_steps_locales" ADD CONSTRAINT "pages_blocks_steps_card_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_card_steps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card" ADD CONSTRAINT "pages_blocks_steps_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_card_locales" ADD CONSTRAINT "pages_blocks_steps_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_symptoms_card_symptoms" ADD CONSTRAINT "pages_blocks_symptoms_card_symptoms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_symptoms_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_symptoms_card_symptoms_locales" ADD CONSTRAINT "pages_blocks_symptoms_card_symptoms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_symptoms_card_symptoms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_symptoms_card" ADD CONSTRAINT "pages_blocks_symptoms_card_symptoms_image_id_media_id_fk" FOREIGN KEY ("symptoms_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_symptoms_card" ADD CONSTRAINT "pages_blocks_symptoms_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_symptoms_card_locales" ADD CONSTRAINT "pages_blocks_symptoms_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_symptoms_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card_reviews" ADD CONSTRAINT "pages_blocks_video_card_reviews_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card_reviews" ADD CONSTRAINT "pages_blocks_video_card_reviews_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card_reviews" ADD CONSTRAINT "pages_blocks_video_card_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_video_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card_reviews_locales" ADD CONSTRAINT "pages_blocks_video_card_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_video_card_reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card" ADD CONSTRAINT "pages_blocks_video_card_navigation_right_id_media_id_fk" FOREIGN KEY ("navigation_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card" ADD CONSTRAINT "pages_blocks_video_card_navigation_left_id_media_id_fk" FOREIGN KEY ("navigation_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card" ADD CONSTRAINT "pages_blocks_video_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_video_card_locales" ADD CONSTRAINT "pages_blocks_video_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_video_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_key_takeaways_items" ADD CONSTRAINT "pages_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_key_takeaways_items_locales" ADD CONSTRAINT "pages_blocks_key_takeaways_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_key_takeaways_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_key_takeaways" ADD CONSTRAINT "pages_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_faq_items_locales" ADD CONSTRAINT "pages_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_column_headers" ADD CONSTRAINT "pages_blocks_data_table_column_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_column_headers_locales" ADD CONSTRAINT "pages_blocks_data_table_column_headers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table_column_headers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_rows_cells" ADD CONSTRAINT "pages_blocks_data_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table_rows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_rows_cells_locales" ADD CONSTRAINT "pages_blocks_data_table_rows_cells_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table_rows_cells"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_rows" ADD CONSTRAINT "pages_blocks_data_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table" ADD CONSTRAINT "pages_blocks_data_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_data_table_locales" ADD CONSTRAINT "pages_blocks_data_table_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_cta_block" ADD CONSTRAINT "pages_blocks_cta_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_cta_block_locales" ADD CONSTRAINT "pages_blocks_cta_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_block"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_bullet_list_items" ADD CONSTRAINT "pages_blocks_bullet_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_bullet_list_items_locales" ADD CONSTRAINT "pages_blocks_bullet_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bullet_list_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_bullet_list" ADD CONSTRAINT "pages_blocks_bullet_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_bullet_list_locales" ADD CONSTRAINT "pages_blocks_bullet_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_form" ADD CONSTRAINT "pages_blocks_contact_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_form_locales" ADD CONSTRAINT "pages_blocks_contact_form_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_form"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_info_social_links" ADD CONSTRAINT "pages_blocks_contact_info_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_info"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_info" ADD CONSTRAINT "pages_blocks_contact_info_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_info" ADD CONSTRAINT "pages_blocks_contact_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_info_locales" ADD CONSTRAINT "pages_blocks_contact_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_info"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_section_info_social_links" ADD CONSTRAINT "pages_blocks_contact_section_info_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_section"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_section" ADD CONSTRAINT "pages_blocks_contact_section_info_background_image_id_media_id_fk" FOREIGN KEY ("info_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_section" ADD CONSTRAINT "pages_blocks_contact_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_contact_section_locales" ADD CONSTRAINT "pages_blocks_contact_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_contact_section"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_benefits_banner_items" ADD CONSTRAINT "pages_blocks_benefits_banner_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_benefits_banner_items" ADD CONSTRAINT "pages_blocks_benefits_banner_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_benefits_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_benefits_banner_items_locales" ADD CONSTRAINT "pages_blocks_benefits_banner_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_benefits_banner_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_benefits_banner" ADD CONSTRAINT "pages_blocks_benefits_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner_steps" ADD CONSTRAINT "pages_blocks_steps_banner_steps_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner_steps" ADD CONSTRAINT "pages_blocks_steps_banner_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner_steps_locales" ADD CONSTRAINT "pages_blocks_steps_banner_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_banner_steps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner" ADD CONSTRAINT "pages_blocks_steps_banner_arrow_icon_id_media_id_fk" FOREIGN KEY ("arrow_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner" ADD CONSTRAINT "pages_blocks_steps_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_steps_banner_locales" ADD CONSTRAINT "pages_blocks_steps_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner_carousel_text" ADD CONSTRAINT "pages_blocks_product_banner_carousel_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner_carousel_text_locales" ADD CONSTRAINT "pages_blocks_product_banner_carousel_text_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_banner_carousel_text"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_banner_background_id_media_id_fk" FOREIGN KEY ("banner_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_mobile_banner_background_id_media_id_fk" FOREIGN KEY ("mobile_banner_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner" ADD CONSTRAINT "pages_blocks_product_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_banner_locales" ADD CONSTRAINT "pages_blocks_product_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_access_banner" ADD CONSTRAINT "pages_blocks_access_banner_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_access_banner" ADD CONSTRAINT "pages_blocks_access_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_access_banner_locales" ADD CONSTRAINT "pages_blocks_access_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_access_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_panel_thumbnails" ADD CONSTRAINT "pages_blocks_product_showcase_panel_thumbnails_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_panel_thumbnails" ADD CONSTRAINT "pages_blocks_product_showcase_panel_thumbnails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans_features" ADD CONSTRAINT "pages_blocks_product_showcase_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans_features_locales" ADD CONSTRAINT "pages_blocks_product_showcase_plans_features_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_plans_features"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans_prices" ADD CONSTRAINT "pages_blocks_product_showcase_plans_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans_prices_locales" ADD CONSTRAINT "pages_blocks_product_showcase_plans_prices_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_plans_prices"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans" ADD CONSTRAINT "pages_blocks_product_showcase_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_plans_locales" ADD CONSTRAINT "pages_blocks_product_showcase_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_faq_items" ADD CONSTRAINT "pages_blocks_product_showcase_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_faq_items_locales" ADD CONSTRAINT "pages_blocks_product_showcase_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase_faq_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase" ADD CONSTRAINT "pages_blocks_product_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "pages_blocks_product_showcase_locales" ADD CONSTRAINT "pages_blocks_product_showcase_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_version_hero_links_locales" ADD CONSTRAINT "_pages_v_version_hero_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_hero_links"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_cta_links_locales" ADD CONSTRAINT "_pages_v_blocks_cta_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta_links"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_content_columns_locales" ADD CONSTRAINT "_pages_v_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card_items_list" ADD CONSTRAINT "_pages_v_blocks_box_card_items_list_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card_items_list" ADD CONSTRAINT "_pages_v_blocks_box_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_box_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card_items_list_locales" ADD CONSTRAINT "_pages_v_blocks_box_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_box_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card" ADD CONSTRAINT "_pages_v_blocks_box_card_background_image_web_id_media_id_fk" FOREIGN KEY ("background_image_web_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card" ADD CONSTRAINT "_pages_v_blocks_box_card_background_image_mobile_id_media_id_fk" FOREIGN KEY ("background_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card" ADD CONSTRAINT "_pages_v_blocks_box_card_box_image_web_id_media_id_fk" FOREIGN KEY ("box_image_web_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card" ADD CONSTRAINT "_pages_v_blocks_box_card_box_image_mobile_id_media_id_fk" FOREIGN KEY ("box_image_mobile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card" ADD CONSTRAINT "_pages_v_blocks_box_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_box_card_locales" ADD CONSTRAINT "_pages_v_blocks_box_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_box_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_formula_card_items_list" ADD CONSTRAINT "_pages_v_blocks_formula_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_formula_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_formula_card_items_list_locales" ADD CONSTRAINT "_pages_v_blocks_formula_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_formula_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_formula_card" ADD CONSTRAINT "_pages_v_blocks_formula_card_kit_image_id_media_id_fk" FOREIGN KEY ("kit_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_formula_card" ADD CONSTRAINT "_pages_v_blocks_formula_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_formula_card_locales" ADD CONSTRAINT "_pages_v_blocks_formula_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_formula_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_items_list" ADD CONSTRAINT "_pages_v_blocks_results_card_items_list_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_items_list" ADD CONSTRAINT "_pages_v_blocks_results_card_items_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_items_list_locales" ADD CONSTRAINT "_pages_v_blocks_results_card_items_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_card_items_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_results_cards" ADD CONSTRAINT "_pages_v_blocks_results_card_results_cards_result_image_id_media_id_fk" FOREIGN KEY ("result_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_results_cards" ADD CONSTRAINT "_pages_v_blocks_results_card_results_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_results_cards_locales" ADD CONSTRAINT "_pages_v_blocks_results_card_results_cards_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_card_results_cards"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card" ADD CONSTRAINT "_pages_v_blocks_results_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_results_card_locales" ADD CONSTRAINT "_pages_v_blocks_results_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_results_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card_reviews" ADD CONSTRAINT "_pages_v_blocks_review_card_reviews_review_icon_id_media_id_fk" FOREIGN KEY ("review_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card_reviews" ADD CONSTRAINT "_pages_v_blocks_review_card_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_review_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card_reviews_locales" ADD CONSTRAINT "_pages_v_blocks_review_card_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_review_card_reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card" ADD CONSTRAINT "_pages_v_blocks_review_card_navigation_right_id_media_id_fk" FOREIGN KEY ("navigation_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card" ADD CONSTRAINT "_pages_v_blocks_review_card_navigation_left_id_media_id_fk" FOREIGN KEY ("navigation_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card" ADD CONSTRAINT "_pages_v_blocks_review_card_note_note_icon_id_media_id_fk" FOREIGN KEY ("note_note_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card" ADD CONSTRAINT "_pages_v_blocks_review_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_review_card_locales" ADD CONSTRAINT "_pages_v_blocks_review_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_review_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card_steps" ADD CONSTRAINT "_pages_v_blocks_steps_card_steps_step_number_id_media_id_fk" FOREIGN KEY ("step_number_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card_steps" ADD CONSTRAINT "_pages_v_blocks_steps_card_steps_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card_steps" ADD CONSTRAINT "_pages_v_blocks_steps_card_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card_steps_locales" ADD CONSTRAINT "_pages_v_blocks_steps_card_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_card_steps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card" ADD CONSTRAINT "_pages_v_blocks_steps_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_card_locales" ADD CONSTRAINT "_pages_v_blocks_steps_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_symptoms_card_symptoms" ADD CONSTRAINT "_pages_v_blocks_symptoms_card_symptoms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_symptoms_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_symptoms_card_symptoms_locales" ADD CONSTRAINT "_pages_v_blocks_symptoms_card_symptoms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_symptoms_card_symptoms"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_symptoms_card" ADD CONSTRAINT "_pages_v_blocks_symptoms_card_symptoms_image_id_media_id_fk" FOREIGN KEY ("symptoms_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_symptoms_card" ADD CONSTRAINT "_pages_v_blocks_symptoms_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_symptoms_card_locales" ADD CONSTRAINT "_pages_v_blocks_symptoms_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_symptoms_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card_reviews" ADD CONSTRAINT "_pages_v_blocks_video_card_reviews_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card_reviews" ADD CONSTRAINT "_pages_v_blocks_video_card_reviews_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card_reviews" ADD CONSTRAINT "_pages_v_blocks_video_card_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_video_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card_reviews_locales" ADD CONSTRAINT "_pages_v_blocks_video_card_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_video_card_reviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card" ADD CONSTRAINT "_pages_v_blocks_video_card_navigation_right_id_media_id_fk" FOREIGN KEY ("navigation_right_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card" ADD CONSTRAINT "_pages_v_blocks_video_card_navigation_left_id_media_id_fk" FOREIGN KEY ("navigation_left_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card" ADD CONSTRAINT "_pages_v_blocks_video_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_video_card_locales" ADD CONSTRAINT "_pages_v_blocks_video_card_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_video_card"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_key_takeaways_items" ADD CONSTRAINT "_pages_v_blocks_key_takeaways_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_key_takeaways"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_key_takeaways_items_locales" ADD CONSTRAINT "_pages_v_blocks_key_takeaways_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_key_takeaways_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_key_takeaways" ADD CONSTRAINT "_pages_v_blocks_key_takeaways_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_faq_items" ADD CONSTRAINT "_pages_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_faq_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_faq" ADD CONSTRAINT "_pages_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_column_headers" ADD CONSTRAINT "_pages_v_blocks_data_table_column_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_column_headers_locales" ADD CONSTRAINT "_pages_v_blocks_data_table_column_headers_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table_column_headers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_rows_cells" ADD CONSTRAINT "_pages_v_blocks_data_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table_rows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_rows_cells_locales" ADD CONSTRAINT "_pages_v_blocks_data_table_rows_cells_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table_rows_cells"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_rows" ADD CONSTRAINT "_pages_v_blocks_data_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table" ADD CONSTRAINT "_pages_v_blocks_data_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_data_table_locales" ADD CONSTRAINT "_pages_v_blocks_data_table_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_data_table"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_cta_block" ADD CONSTRAINT "_pages_v_blocks_cta_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_cta_block_locales" ADD CONSTRAINT "_pages_v_blocks_cta_block_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta_block"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_bullet_list_items" ADD CONSTRAINT "_pages_v_blocks_bullet_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_bullet_list_items_locales" ADD CONSTRAINT "_pages_v_blocks_bullet_list_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_bullet_list_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_bullet_list" ADD CONSTRAINT "_pages_v_blocks_bullet_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_bullet_list_locales" ADD CONSTRAINT "_pages_v_blocks_bullet_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_form" ADD CONSTRAINT "_pages_v_blocks_contact_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_form_locales" ADD CONSTRAINT "_pages_v_blocks_contact_form_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_form"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_info_social_links" ADD CONSTRAINT "_pages_v_blocks_contact_info_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_info"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_info" ADD CONSTRAINT "_pages_v_blocks_contact_info_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_info" ADD CONSTRAINT "_pages_v_blocks_contact_info_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_info_locales" ADD CONSTRAINT "_pages_v_blocks_contact_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_info"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_section_info_social_links" ADD CONSTRAINT "_pages_v_blocks_contact_section_info_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_section"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_section" ADD CONSTRAINT "_pages_v_blocks_contact_section_info_background_image_id_media_id_fk" FOREIGN KEY ("info_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_section" ADD CONSTRAINT "_pages_v_blocks_contact_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_contact_section_locales" ADD CONSTRAINT "_pages_v_blocks_contact_section_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_contact_section"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_benefits_banner_items" ADD CONSTRAINT "_pages_v_blocks_benefits_banner_items_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_benefits_banner_items" ADD CONSTRAINT "_pages_v_blocks_benefits_banner_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_benefits_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_benefits_banner_items_locales" ADD CONSTRAINT "_pages_v_blocks_benefits_banner_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_benefits_banner_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_benefits_banner" ADD CONSTRAINT "_pages_v_blocks_benefits_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner_steps" ADD CONSTRAINT "_pages_v_blocks_steps_banner_steps_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner_steps" ADD CONSTRAINT "_pages_v_blocks_steps_banner_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner_steps_locales" ADD CONSTRAINT "_pages_v_blocks_steps_banner_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_banner_steps"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner" ADD CONSTRAINT "_pages_v_blocks_steps_banner_arrow_icon_id_media_id_fk" FOREIGN KEY ("arrow_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner" ADD CONSTRAINT "_pages_v_blocks_steps_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_steps_banner_locales" ADD CONSTRAINT "_pages_v_blocks_steps_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner_carousel_text" ADD CONSTRAINT "_pages_v_blocks_product_banner_carousel_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner_carousel_text_locales" ADD CONSTRAINT "_pages_v_blocks_product_banner_carousel_text_locales_pare_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_banner_carousel_text"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_banner_image_id_media_id_fk" FOREIGN KEY ("banner_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_banner_background_id_media_id_fk" FOREIGN KEY ("banner_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_mobile_banner_background_id_media_id_fk" FOREIGN KEY ("mobile_banner_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner" ADD CONSTRAINT "_pages_v_blocks_product_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_banner_locales" ADD CONSTRAINT "_pages_v_blocks_product_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_access_banner" ADD CONSTRAINT "_pages_v_blocks_access_banner_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_access_banner" ADD CONSTRAINT "_pages_v_blocks_access_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_access_banner_locales" ADD CONSTRAINT "_pages_v_blocks_access_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_access_banner"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_panel_thumbnails" ADD CONSTRAINT "_pages_v_blocks_product_showcase_panel_thumbnails_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_panel_thumbnails" ADD CONSTRAINT "_pages_v_blocks_product_showcase_panel_thumbnails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_features" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_features_locales" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_features_locales_p_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_plans_features"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_prices" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_prices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_prices_locales" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_prices_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_plans_prices"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_locales" ADD CONSTRAINT "_pages_v_blocks_product_showcase_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_plans"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_faq_items" ADD CONSTRAINT "_pages_v_blocks_product_showcase_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_faq_items_locales" ADD CONSTRAINT "_pages_v_blocks_product_showcase_faq_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase_faq_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase" ADD CONSTRAINT "_pages_v_blocks_product_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "_pages_v_blocks_product_showcase_locales" ADD CONSTRAINT "_pages_v_blocks_product_showcase_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_product_showcase"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "footer_nav_items_locales" ADD CONSTRAINT "footer_nav_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_nav_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "pages_hero_links_locales_locale_parent_id_unique" ON "pages_hero_links_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "pages_blocks_cta_links_locales_locale_parent_id_unique" ON "pages_blocks_cta_links_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "pages_blocks_content_columns_locales_locale_parent_id_unique" ON "pages_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_box_card_items_list_order_idx" ON "pages_blocks_box_card_items_list" USING btree ("_order");
CREATE INDEX "pages_blocks_box_card_items_list_parent_id_idx" ON "pages_blocks_box_card_items_list" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_box_card_items_list_icon_idx" ON "pages_blocks_box_card_items_list" USING btree ("icon_id");
CREATE UNIQUE INDEX "pages_blocks_box_card_items_list_locales_locale_parent_id_un" ON "pages_blocks_box_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_box_card_order_idx" ON "pages_blocks_box_card" USING btree ("_order");
CREATE INDEX "pages_blocks_box_card_parent_id_idx" ON "pages_blocks_box_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_box_card_path_idx" ON "pages_blocks_box_card" USING btree ("_path");
CREATE INDEX "pages_blocks_box_card_background_image_background_image__idx" ON "pages_blocks_box_card" USING btree ("background_image_web_id");
CREATE INDEX "pages_blocks_box_card_background_image_background_imag_1_idx" ON "pages_blocks_box_card" USING btree ("background_image_mobile_id");
CREATE INDEX "pages_blocks_box_card_box_image_box_image_web_idx" ON "pages_blocks_box_card" USING btree ("box_image_web_id");
CREATE INDEX "pages_blocks_box_card_box_image_box_image_mobile_idx" ON "pages_blocks_box_card" USING btree ("box_image_mobile_id");
CREATE UNIQUE INDEX "pages_blocks_box_card_locales_locale_parent_id_unique" ON "pages_blocks_box_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_formula_card_items_list_order_idx" ON "pages_blocks_formula_card_items_list" USING btree ("_order");
CREATE INDEX "pages_blocks_formula_card_items_list_parent_id_idx" ON "pages_blocks_formula_card_items_list" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_formula_card_items_list_locales_locale_parent_i" ON "pages_blocks_formula_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_formula_card_order_idx" ON "pages_blocks_formula_card" USING btree ("_order");
CREATE INDEX "pages_blocks_formula_card_parent_id_idx" ON "pages_blocks_formula_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_formula_card_path_idx" ON "pages_blocks_formula_card" USING btree ("_path");
CREATE INDEX "pages_blocks_formula_card_kit_image_idx" ON "pages_blocks_formula_card" USING btree ("kit_image_id");
CREATE UNIQUE INDEX "pages_blocks_formula_card_locales_locale_parent_id_unique" ON "pages_blocks_formula_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_results_card_items_list_order_idx" ON "pages_blocks_results_card_items_list" USING btree ("_order");
CREATE INDEX "pages_blocks_results_card_items_list_parent_id_idx" ON "pages_blocks_results_card_items_list" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_results_card_items_list_icon_idx" ON "pages_blocks_results_card_items_list" USING btree ("icon_id");
CREATE UNIQUE INDEX "pages_blocks_results_card_items_list_locales_locale_parent_i" ON "pages_blocks_results_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_results_card_results_cards_order_idx" ON "pages_blocks_results_card_results_cards" USING btree ("_order");
CREATE INDEX "pages_blocks_results_card_results_cards_parent_id_idx" ON "pages_blocks_results_card_results_cards" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_results_card_results_cards_result_image_idx" ON "pages_blocks_results_card_results_cards" USING btree ("result_image_id");
CREATE UNIQUE INDEX "pages_blocks_results_card_results_cards_locales_locale_paren" ON "pages_blocks_results_card_results_cards_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_results_card_order_idx" ON "pages_blocks_results_card" USING btree ("_order");
CREATE INDEX "pages_blocks_results_card_parent_id_idx" ON "pages_blocks_results_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_results_card_path_idx" ON "pages_blocks_results_card" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_results_card_locales_locale_parent_id_unique" ON "pages_blocks_results_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_review_card_reviews_order_idx" ON "pages_blocks_review_card_reviews" USING btree ("_order");
CREATE INDEX "pages_blocks_review_card_reviews_parent_id_idx" ON "pages_blocks_review_card_reviews" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_review_card_reviews_review_icon_idx" ON "pages_blocks_review_card_reviews" USING btree ("review_icon_id");
CREATE UNIQUE INDEX "pages_blocks_review_card_reviews_locales_locale_parent_id_un" ON "pages_blocks_review_card_reviews_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_review_card_order_idx" ON "pages_blocks_review_card" USING btree ("_order");
CREATE INDEX "pages_blocks_review_card_parent_id_idx" ON "pages_blocks_review_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_review_card_path_idx" ON "pages_blocks_review_card" USING btree ("_path");
CREATE INDEX "pages_blocks_review_card_navigation_navigation_right_idx" ON "pages_blocks_review_card" USING btree ("navigation_right_id");
CREATE INDEX "pages_blocks_review_card_navigation_navigation_left_idx" ON "pages_blocks_review_card" USING btree ("navigation_left_id");
CREATE INDEX "pages_blocks_review_card_note_note_note_icon_idx" ON "pages_blocks_review_card" USING btree ("note_note_icon_id");
CREATE UNIQUE INDEX "pages_blocks_review_card_locales_locale_parent_id_unique" ON "pages_blocks_review_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_steps_card_steps_order_idx" ON "pages_blocks_steps_card_steps" USING btree ("_order");
CREATE INDEX "pages_blocks_steps_card_steps_parent_id_idx" ON "pages_blocks_steps_card_steps" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_steps_card_steps_step_number_idx" ON "pages_blocks_steps_card_steps" USING btree ("step_number_id");
CREATE INDEX "pages_blocks_steps_card_steps_icon_idx" ON "pages_blocks_steps_card_steps" USING btree ("icon_id");
CREATE UNIQUE INDEX "pages_blocks_steps_card_steps_locales_locale_parent_id_uniqu" ON "pages_blocks_steps_card_steps_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_steps_card_order_idx" ON "pages_blocks_steps_card" USING btree ("_order");
CREATE INDEX "pages_blocks_steps_card_parent_id_idx" ON "pages_blocks_steps_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_steps_card_path_idx" ON "pages_blocks_steps_card" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_steps_card_locales_locale_parent_id_unique" ON "pages_blocks_steps_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_symptoms_card_symptoms_order_idx" ON "pages_blocks_symptoms_card_symptoms" USING btree ("_order");
CREATE INDEX "pages_blocks_symptoms_card_symptoms_parent_id_idx" ON "pages_blocks_symptoms_card_symptoms" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_symptoms_card_symptoms_locales_locale_parent_id" ON "pages_blocks_symptoms_card_symptoms_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_symptoms_card_order_idx" ON "pages_blocks_symptoms_card" USING btree ("_order");
CREATE INDEX "pages_blocks_symptoms_card_parent_id_idx" ON "pages_blocks_symptoms_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_symptoms_card_path_idx" ON "pages_blocks_symptoms_card" USING btree ("_path");
CREATE INDEX "pages_blocks_symptoms_card_symptoms_image_idx" ON "pages_blocks_symptoms_card" USING btree ("symptoms_image_id");
CREATE UNIQUE INDEX "pages_blocks_symptoms_card_locales_locale_parent_id_unique" ON "pages_blocks_symptoms_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_video_card_reviews_order_idx" ON "pages_blocks_video_card_reviews" USING btree ("_order");
CREATE INDEX "pages_blocks_video_card_reviews_parent_id_idx" ON "pages_blocks_video_card_reviews" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_video_card_reviews_video_idx" ON "pages_blocks_video_card_reviews" USING btree ("video_id");
CREATE INDEX "pages_blocks_video_card_reviews_thumbnail_idx" ON "pages_blocks_video_card_reviews" USING btree ("thumbnail_id");
CREATE UNIQUE INDEX "pages_blocks_video_card_reviews_locales_locale_parent_id_uni" ON "pages_blocks_video_card_reviews_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_video_card_order_idx" ON "pages_blocks_video_card" USING btree ("_order");
CREATE INDEX "pages_blocks_video_card_parent_id_idx" ON "pages_blocks_video_card" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_video_card_path_idx" ON "pages_blocks_video_card" USING btree ("_path");
CREATE INDEX "pages_blocks_video_card_navigation_navigation_right_idx" ON "pages_blocks_video_card" USING btree ("navigation_right_id");
CREATE INDEX "pages_blocks_video_card_navigation_navigation_left_idx" ON "pages_blocks_video_card" USING btree ("navigation_left_id");
CREATE UNIQUE INDEX "pages_blocks_video_card_locales_locale_parent_id_unique" ON "pages_blocks_video_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_key_takeaways_items_order_idx" ON "pages_blocks_key_takeaways_items" USING btree ("_order");
CREATE INDEX "pages_blocks_key_takeaways_items_parent_id_idx" ON "pages_blocks_key_takeaways_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_key_takeaways_items_locales_locale_parent_id_un" ON "pages_blocks_key_takeaways_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_key_takeaways_order_idx" ON "pages_blocks_key_takeaways" USING btree ("_order");
CREATE INDEX "pages_blocks_key_takeaways_parent_id_idx" ON "pages_blocks_key_takeaways" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_key_takeaways_path_idx" ON "pages_blocks_key_takeaways" USING btree ("_path");
CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_faq_items_locales_locale_parent_id_unique" ON "pages_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
CREATE INDEX "pages_blocks_data_table_column_headers_order_idx" ON "pages_blocks_data_table_column_headers" USING btree ("_order");
CREATE INDEX "pages_blocks_data_table_column_headers_parent_id_idx" ON "pages_blocks_data_table_column_headers" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_data_table_column_headers_locales_locale_parent" ON "pages_blocks_data_table_column_headers_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_data_table_rows_cells_order_idx" ON "pages_blocks_data_table_rows_cells" USING btree ("_order");
CREATE INDEX "pages_blocks_data_table_rows_cells_parent_id_idx" ON "pages_blocks_data_table_rows_cells" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_data_table_rows_cells_locales_locale_parent_id_" ON "pages_blocks_data_table_rows_cells_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_data_table_rows_order_idx" ON "pages_blocks_data_table_rows" USING btree ("_order");
CREATE INDEX "pages_blocks_data_table_rows_parent_id_idx" ON "pages_blocks_data_table_rows" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_data_table_order_idx" ON "pages_blocks_data_table" USING btree ("_order");
CREATE INDEX "pages_blocks_data_table_parent_id_idx" ON "pages_blocks_data_table" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_data_table_path_idx" ON "pages_blocks_data_table" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_data_table_locales_locale_parent_id_unique" ON "pages_blocks_data_table_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_cta_block_order_idx" ON "pages_blocks_cta_block" USING btree ("_order");
CREATE INDEX "pages_blocks_cta_block_parent_id_idx" ON "pages_blocks_cta_block" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_cta_block_path_idx" ON "pages_blocks_cta_block" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_cta_block_locales_locale_parent_id_unique" ON "pages_blocks_cta_block_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_bullet_list_items_order_idx" ON "pages_blocks_bullet_list_items" USING btree ("_order");
CREATE INDEX "pages_blocks_bullet_list_items_parent_id_idx" ON "pages_blocks_bullet_list_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_bullet_list_items_locales_locale_parent_id_uniq" ON "pages_blocks_bullet_list_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_bullet_list_order_idx" ON "pages_blocks_bullet_list" USING btree ("_order");
CREATE INDEX "pages_blocks_bullet_list_parent_id_idx" ON "pages_blocks_bullet_list" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_bullet_list_path_idx" ON "pages_blocks_bullet_list" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_bullet_list_locales_locale_parent_id_unique" ON "pages_blocks_bullet_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_contact_form_order_idx" ON "pages_blocks_contact_form" USING btree ("_order");
CREATE INDEX "pages_blocks_contact_form_parent_id_idx" ON "pages_blocks_contact_form" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_contact_form_path_idx" ON "pages_blocks_contact_form" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_contact_form_locales_locale_parent_id_unique" ON "pages_blocks_contact_form_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_contact_info_social_links_order_idx" ON "pages_blocks_contact_info_social_links" USING btree ("_order");
CREATE INDEX "pages_blocks_contact_info_social_links_parent_id_idx" ON "pages_blocks_contact_info_social_links" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_contact_info_order_idx" ON "pages_blocks_contact_info" USING btree ("_order");
CREATE INDEX "pages_blocks_contact_info_parent_id_idx" ON "pages_blocks_contact_info" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_contact_info_path_idx" ON "pages_blocks_contact_info" USING btree ("_path");
CREATE INDEX "pages_blocks_contact_info_background_image_idx" ON "pages_blocks_contact_info" USING btree ("background_image_id");
CREATE UNIQUE INDEX "pages_blocks_contact_info_locales_locale_parent_id_unique" ON "pages_blocks_contact_info_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_contact_section_info_social_links_order_idx" ON "pages_blocks_contact_section_info_social_links" USING btree ("_order");
CREATE INDEX "pages_blocks_contact_section_info_social_links_parent_id_idx" ON "pages_blocks_contact_section_info_social_links" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_contact_section_order_idx" ON "pages_blocks_contact_section" USING btree ("_order");
CREATE INDEX "pages_blocks_contact_section_parent_id_idx" ON "pages_blocks_contact_section" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_contact_section_path_idx" ON "pages_blocks_contact_section" USING btree ("_path");
CREATE INDEX "pages_blocks_contact_section_info_info_background_image_idx" ON "pages_blocks_contact_section" USING btree ("info_background_image_id");
CREATE UNIQUE INDEX "pages_blocks_contact_section_locales_locale_parent_id_unique" ON "pages_blocks_contact_section_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_benefits_banner_items_order_idx" ON "pages_blocks_benefits_banner_items" USING btree ("_order");
CREATE INDEX "pages_blocks_benefits_banner_items_parent_id_idx" ON "pages_blocks_benefits_banner_items" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_benefits_banner_items_icon_idx" ON "pages_blocks_benefits_banner_items" USING btree ("icon_id");
CREATE UNIQUE INDEX "pages_blocks_benefits_banner_items_locales_locale_parent_id_" ON "pages_blocks_benefits_banner_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_benefits_banner_order_idx" ON "pages_blocks_benefits_banner" USING btree ("_order");
CREATE INDEX "pages_blocks_benefits_banner_parent_id_idx" ON "pages_blocks_benefits_banner" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_benefits_banner_path_idx" ON "pages_blocks_benefits_banner" USING btree ("_path");
CREATE INDEX "pages_blocks_steps_banner_steps_order_idx" ON "pages_blocks_steps_banner_steps" USING btree ("_order");
CREATE INDEX "pages_blocks_steps_banner_steps_parent_id_idx" ON "pages_blocks_steps_banner_steps" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_steps_banner_steps_icon_idx" ON "pages_blocks_steps_banner_steps" USING btree ("icon_id");
CREATE UNIQUE INDEX "pages_blocks_steps_banner_steps_locales_locale_parent_id_uni" ON "pages_blocks_steps_banner_steps_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_steps_banner_order_idx" ON "pages_blocks_steps_banner" USING btree ("_order");
CREATE INDEX "pages_blocks_steps_banner_parent_id_idx" ON "pages_blocks_steps_banner" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_steps_banner_path_idx" ON "pages_blocks_steps_banner" USING btree ("_path");
CREATE INDEX "pages_blocks_steps_banner_arrow_icon_idx" ON "pages_blocks_steps_banner" USING btree ("arrow_icon_id");
CREATE UNIQUE INDEX "pages_blocks_steps_banner_locales_locale_parent_id_unique" ON "pages_blocks_steps_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_banner_carousel_text_order_idx" ON "pages_blocks_product_banner_carousel_text" USING btree ("_order");
CREATE INDEX "pages_blocks_product_banner_carousel_text_parent_id_idx" ON "pages_blocks_product_banner_carousel_text" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_product_banner_carousel_text_locales_locale_par" ON "pages_blocks_product_banner_carousel_text_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_banner_order_idx" ON "pages_blocks_product_banner" USING btree ("_order");
CREATE INDEX "pages_blocks_product_banner_parent_id_idx" ON "pages_blocks_product_banner" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_product_banner_path_idx" ON "pages_blocks_product_banner" USING btree ("_path");
CREATE INDEX "pages_blocks_product_banner_form_idx" ON "pages_blocks_product_banner" USING btree ("form_id");
CREATE INDEX "pages_blocks_product_banner_banner_image_idx" ON "pages_blocks_product_banner" USING btree ("banner_image_id");
CREATE INDEX "pages_blocks_product_banner_banner_background_idx" ON "pages_blocks_product_banner" USING btree ("banner_background_id");
CREATE INDEX "pages_blocks_product_banner_mobile_banner_background_idx" ON "pages_blocks_product_banner" USING btree ("mobile_banner_background_id");
CREATE INDEX "pages_blocks_product_banner_logo_idx" ON "pages_blocks_product_banner" USING btree ("logo_id");
CREATE UNIQUE INDEX "pages_blocks_product_banner_locales_locale_parent_id_unique" ON "pages_blocks_product_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_access_banner_order_idx" ON "pages_blocks_access_banner" USING btree ("_order");
CREATE INDEX "pages_blocks_access_banner_parent_id_idx" ON "pages_blocks_access_banner" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_access_banner_path_idx" ON "pages_blocks_access_banner" USING btree ("_path");
CREATE INDEX "pages_blocks_access_banner_form_idx" ON "pages_blocks_access_banner" USING btree ("form_id");
CREATE UNIQUE INDEX "pages_blocks_access_banner_locales_locale_parent_id_unique" ON "pages_blocks_access_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_showcase_panel_thumbnails_order_idx" ON "pages_blocks_product_showcase_panel_thumbnails" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_panel_thumbnails_parent_id_idx" ON "pages_blocks_product_showcase_panel_thumbnails" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_product_showcase_panel_thumbnails_image_idx" ON "pages_blocks_product_showcase_panel_thumbnails" USING btree ("image_id");
CREATE INDEX "pages_blocks_product_showcase_plans_features_order_idx" ON "pages_blocks_product_showcase_plans_features" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_plans_features_parent_id_idx" ON "pages_blocks_product_showcase_plans_features" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_product_showcase_plans_features_locales_locale_" ON "pages_blocks_product_showcase_plans_features_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_showcase_plans_prices_order_idx" ON "pages_blocks_product_showcase_plans_prices" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_plans_prices_parent_id_idx" ON "pages_blocks_product_showcase_plans_prices" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_product_showcase_plans_prices_locales_locale_pa" ON "pages_blocks_product_showcase_plans_prices_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_showcase_plans_order_idx" ON "pages_blocks_product_showcase_plans" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_plans_parent_id_idx" ON "pages_blocks_product_showcase_plans" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_product_showcase_plans_locales_locale_parent_id" ON "pages_blocks_product_showcase_plans_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_showcase_faq_items_order_idx" ON "pages_blocks_product_showcase_faq_items" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_faq_items_parent_id_idx" ON "pages_blocks_product_showcase_faq_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "pages_blocks_product_showcase_faq_items_locales_locale_paren" ON "pages_blocks_product_showcase_faq_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "pages_blocks_product_showcase_order_idx" ON "pages_blocks_product_showcase" USING btree ("_order");
CREATE INDEX "pages_blocks_product_showcase_parent_id_idx" ON "pages_blocks_product_showcase" USING btree ("_parent_id");
CREATE INDEX "pages_blocks_product_showcase_path_idx" ON "pages_blocks_product_showcase" USING btree ("_path");
CREATE UNIQUE INDEX "pages_blocks_product_showcase_locales_locale_parent_id_uniqu" ON "pages_blocks_product_showcase_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "_pages_v_version_hero_links_locales_locale_parent_id_unique" ON "_pages_v_version_hero_links_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_cta_links_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_links_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_content_columns_locales_locale_parent_id_uni" ON "_pages_v_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_box_card_items_list_order_idx" ON "_pages_v_blocks_box_card_items_list" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_box_card_items_list_parent_id_idx" ON "_pages_v_blocks_box_card_items_list" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_box_card_items_list_icon_idx" ON "_pages_v_blocks_box_card_items_list" USING btree ("icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_box_card_items_list_locales_locale_parent_id" ON "_pages_v_blocks_box_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_box_card_order_idx" ON "_pages_v_blocks_box_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_box_card_parent_id_idx" ON "_pages_v_blocks_box_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_box_card_path_idx" ON "_pages_v_blocks_box_card" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_box_card_background_image_background_ima_idx" ON "_pages_v_blocks_box_card" USING btree ("background_image_web_id");
CREATE INDEX "_pages_v_blocks_box_card_background_image_background_i_1_idx" ON "_pages_v_blocks_box_card" USING btree ("background_image_mobile_id");
CREATE INDEX "_pages_v_blocks_box_card_box_image_box_image_web_idx" ON "_pages_v_blocks_box_card" USING btree ("box_image_web_id");
CREATE INDEX "_pages_v_blocks_box_card_box_image_box_image_mobile_idx" ON "_pages_v_blocks_box_card" USING btree ("box_image_mobile_id");
CREATE UNIQUE INDEX "_pages_v_blocks_box_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_box_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_formula_card_items_list_order_idx" ON "_pages_v_blocks_formula_card_items_list" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_formula_card_items_list_parent_id_idx" ON "_pages_v_blocks_formula_card_items_list" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_formula_card_items_list_locales_locale_paren" ON "_pages_v_blocks_formula_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_formula_card_order_idx" ON "_pages_v_blocks_formula_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_formula_card_parent_id_idx" ON "_pages_v_blocks_formula_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_formula_card_path_idx" ON "_pages_v_blocks_formula_card" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_formula_card_kit_image_idx" ON "_pages_v_blocks_formula_card" USING btree ("kit_image_id");
CREATE UNIQUE INDEX "_pages_v_blocks_formula_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_formula_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_items_list_order_idx" ON "_pages_v_blocks_results_card_items_list" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_results_card_items_list_parent_id_idx" ON "_pages_v_blocks_results_card_items_list" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_items_list_icon_idx" ON "_pages_v_blocks_results_card_items_list" USING btree ("icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_results_card_items_list_locales_locale_paren" ON "_pages_v_blocks_results_card_items_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_results_cards_order_idx" ON "_pages_v_blocks_results_card_results_cards" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_results_card_results_cards_parent_id_idx" ON "_pages_v_blocks_results_card_results_cards" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_results_cards_result_image_idx" ON "_pages_v_blocks_results_card_results_cards" USING btree ("result_image_id");
CREATE UNIQUE INDEX "_pages_v_blocks_results_card_results_cards_locales_locale_pa" ON "_pages_v_blocks_results_card_results_cards_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_order_idx" ON "_pages_v_blocks_results_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_results_card_parent_id_idx" ON "_pages_v_blocks_results_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_results_card_path_idx" ON "_pages_v_blocks_results_card" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_results_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_results_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_review_card_reviews_order_idx" ON "_pages_v_blocks_review_card_reviews" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_review_card_reviews_parent_id_idx" ON "_pages_v_blocks_review_card_reviews" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_review_card_reviews_review_icon_idx" ON "_pages_v_blocks_review_card_reviews" USING btree ("review_icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_review_card_reviews_locales_locale_parent_id" ON "_pages_v_blocks_review_card_reviews_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_review_card_order_idx" ON "_pages_v_blocks_review_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_review_card_parent_id_idx" ON "_pages_v_blocks_review_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_review_card_path_idx" ON "_pages_v_blocks_review_card" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_review_card_navigation_navigation_right_idx" ON "_pages_v_blocks_review_card" USING btree ("navigation_right_id");
CREATE INDEX "_pages_v_blocks_review_card_navigation_navigation_left_idx" ON "_pages_v_blocks_review_card" USING btree ("navigation_left_id");
CREATE INDEX "_pages_v_blocks_review_card_note_note_note_icon_idx" ON "_pages_v_blocks_review_card" USING btree ("note_note_icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_review_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_review_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_steps_card_steps_order_idx" ON "_pages_v_blocks_steps_card_steps" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_steps_card_steps_parent_id_idx" ON "_pages_v_blocks_steps_card_steps" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_steps_card_steps_step_number_idx" ON "_pages_v_blocks_steps_card_steps" USING btree ("step_number_id");
CREATE INDEX "_pages_v_blocks_steps_card_steps_icon_idx" ON "_pages_v_blocks_steps_card_steps" USING btree ("icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_steps_card_steps_locales_locale_parent_id_un" ON "_pages_v_blocks_steps_card_steps_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_steps_card_order_idx" ON "_pages_v_blocks_steps_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_steps_card_parent_id_idx" ON "_pages_v_blocks_steps_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_steps_card_path_idx" ON "_pages_v_blocks_steps_card" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_steps_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_steps_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_symptoms_card_symptoms_order_idx" ON "_pages_v_blocks_symptoms_card_symptoms" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_symptoms_card_symptoms_parent_id_idx" ON "_pages_v_blocks_symptoms_card_symptoms" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_symptoms_card_symptoms_locales_locale_parent" ON "_pages_v_blocks_symptoms_card_symptoms_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_symptoms_card_order_idx" ON "_pages_v_blocks_symptoms_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_symptoms_card_parent_id_idx" ON "_pages_v_blocks_symptoms_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_symptoms_card_path_idx" ON "_pages_v_blocks_symptoms_card" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_symptoms_card_symptoms_image_idx" ON "_pages_v_blocks_symptoms_card" USING btree ("symptoms_image_id");
CREATE UNIQUE INDEX "_pages_v_blocks_symptoms_card_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_symptoms_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_video_card_reviews_order_idx" ON "_pages_v_blocks_video_card_reviews" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_video_card_reviews_parent_id_idx" ON "_pages_v_blocks_video_card_reviews" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_video_card_reviews_video_idx" ON "_pages_v_blocks_video_card_reviews" USING btree ("video_id");
CREATE INDEX "_pages_v_blocks_video_card_reviews_thumbnail_idx" ON "_pages_v_blocks_video_card_reviews" USING btree ("thumbnail_id");
CREATE UNIQUE INDEX "_pages_v_blocks_video_card_reviews_locales_locale_parent_id_" ON "_pages_v_blocks_video_card_reviews_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_video_card_order_idx" ON "_pages_v_blocks_video_card" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_video_card_parent_id_idx" ON "_pages_v_blocks_video_card" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_video_card_path_idx" ON "_pages_v_blocks_video_card" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_video_card_navigation_navigation_right_idx" ON "_pages_v_blocks_video_card" USING btree ("navigation_right_id");
CREATE INDEX "_pages_v_blocks_video_card_navigation_navigation_left_idx" ON "_pages_v_blocks_video_card" USING btree ("navigation_left_id");
CREATE UNIQUE INDEX "_pages_v_blocks_video_card_locales_locale_parent_id_unique" ON "_pages_v_blocks_video_card_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_key_takeaways_items_order_idx" ON "_pages_v_blocks_key_takeaways_items" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_key_takeaways_items_parent_id_idx" ON "_pages_v_blocks_key_takeaways_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_key_takeaways_items_locales_locale_parent_id" ON "_pages_v_blocks_key_takeaways_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_key_takeaways_order_idx" ON "_pages_v_blocks_key_takeaways" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_key_takeaways_parent_id_idx" ON "_pages_v_blocks_key_takeaways" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_key_takeaways_path_idx" ON "_pages_v_blocks_key_takeaways" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_faq_items_order_idx" ON "_pages_v_blocks_faq_items" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_faq_items_parent_id_idx" ON "_pages_v_blocks_faq_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_faq_items_locales_locale_parent_id_unique" ON "_pages_v_blocks_faq_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_faq_order_idx" ON "_pages_v_blocks_faq" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_faq_parent_id_idx" ON "_pages_v_blocks_faq" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_faq_path_idx" ON "_pages_v_blocks_faq" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_data_table_column_headers_order_idx" ON "_pages_v_blocks_data_table_column_headers" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_data_table_column_headers_parent_id_idx" ON "_pages_v_blocks_data_table_column_headers" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_data_table_column_headers_locales_locale_par" ON "_pages_v_blocks_data_table_column_headers_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_data_table_rows_cells_order_idx" ON "_pages_v_blocks_data_table_rows_cells" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_data_table_rows_cells_parent_id_idx" ON "_pages_v_blocks_data_table_rows_cells" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_data_table_rows_cells_locales_locale_parent_" ON "_pages_v_blocks_data_table_rows_cells_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_data_table_rows_order_idx" ON "_pages_v_blocks_data_table_rows" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_data_table_rows_parent_id_idx" ON "_pages_v_blocks_data_table_rows" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_data_table_order_idx" ON "_pages_v_blocks_data_table" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_data_table_parent_id_idx" ON "_pages_v_blocks_data_table" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_data_table_path_idx" ON "_pages_v_blocks_data_table" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_data_table_locales_locale_parent_id_unique" ON "_pages_v_blocks_data_table_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_cta_block_order_idx" ON "_pages_v_blocks_cta_block" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_cta_block_parent_id_idx" ON "_pages_v_blocks_cta_block" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_cta_block_path_idx" ON "_pages_v_blocks_cta_block" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_cta_block_locales_locale_parent_id_unique" ON "_pages_v_blocks_cta_block_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_bullet_list_items_order_idx" ON "_pages_v_blocks_bullet_list_items" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_bullet_list_items_parent_id_idx" ON "_pages_v_blocks_bullet_list_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_bullet_list_items_locales_locale_parent_id_u" ON "_pages_v_blocks_bullet_list_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_bullet_list_order_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_bullet_list_parent_id_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_bullet_list_path_idx" ON "_pages_v_blocks_bullet_list" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_bullet_list_locales_locale_parent_id_unique" ON "_pages_v_blocks_bullet_list_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_contact_form_order_idx" ON "_pages_v_blocks_contact_form" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_contact_form_parent_id_idx" ON "_pages_v_blocks_contact_form" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_contact_form_path_idx" ON "_pages_v_blocks_contact_form" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_contact_form_locales_locale_parent_id_unique" ON "_pages_v_blocks_contact_form_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_contact_info_social_links_order_idx" ON "_pages_v_blocks_contact_info_social_links" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_contact_info_social_links_parent_id_idx" ON "_pages_v_blocks_contact_info_social_links" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_contact_info_order_idx" ON "_pages_v_blocks_contact_info" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_contact_info_parent_id_idx" ON "_pages_v_blocks_contact_info" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_contact_info_path_idx" ON "_pages_v_blocks_contact_info" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_contact_info_background_image_idx" ON "_pages_v_blocks_contact_info" USING btree ("background_image_id");
CREATE UNIQUE INDEX "_pages_v_blocks_contact_info_locales_locale_parent_id_unique" ON "_pages_v_blocks_contact_info_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_contact_section_info_social_links_order_idx" ON "_pages_v_blocks_contact_section_info_social_links" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_contact_section_info_social_links_parent_id_idx" ON "_pages_v_blocks_contact_section_info_social_links" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_contact_section_order_idx" ON "_pages_v_blocks_contact_section" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_contact_section_parent_id_idx" ON "_pages_v_blocks_contact_section" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_contact_section_path_idx" ON "_pages_v_blocks_contact_section" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_contact_section_info_info_background_ima_idx" ON "_pages_v_blocks_contact_section" USING btree ("info_background_image_id");
CREATE UNIQUE INDEX "_pages_v_blocks_contact_section_locales_locale_parent_id_uni" ON "_pages_v_blocks_contact_section_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_benefits_banner_items_order_idx" ON "_pages_v_blocks_benefits_banner_items" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_benefits_banner_items_parent_id_idx" ON "_pages_v_blocks_benefits_banner_items" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_benefits_banner_items_icon_idx" ON "_pages_v_blocks_benefits_banner_items" USING btree ("icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_benefits_banner_items_locales_locale_parent_" ON "_pages_v_blocks_benefits_banner_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_benefits_banner_order_idx" ON "_pages_v_blocks_benefits_banner" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_benefits_banner_parent_id_idx" ON "_pages_v_blocks_benefits_banner" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_benefits_banner_path_idx" ON "_pages_v_blocks_benefits_banner" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_steps_banner_steps_order_idx" ON "_pages_v_blocks_steps_banner_steps" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_steps_banner_steps_parent_id_idx" ON "_pages_v_blocks_steps_banner_steps" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_steps_banner_steps_icon_idx" ON "_pages_v_blocks_steps_banner_steps" USING btree ("icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_steps_banner_steps_locales_locale_parent_id_" ON "_pages_v_blocks_steps_banner_steps_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_steps_banner_order_idx" ON "_pages_v_blocks_steps_banner" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_steps_banner_parent_id_idx" ON "_pages_v_blocks_steps_banner" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_steps_banner_path_idx" ON "_pages_v_blocks_steps_banner" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_steps_banner_arrow_icon_idx" ON "_pages_v_blocks_steps_banner" USING btree ("arrow_icon_id");
CREATE UNIQUE INDEX "_pages_v_blocks_steps_banner_locales_locale_parent_id_unique" ON "_pages_v_blocks_steps_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_banner_carousel_text_order_idx" ON "_pages_v_blocks_product_banner_carousel_text" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_banner_carousel_text_parent_id_idx" ON "_pages_v_blocks_product_banner_carousel_text" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_banner_carousel_text_locales_locale_" ON "_pages_v_blocks_product_banner_carousel_text_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_banner_order_idx" ON "_pages_v_blocks_product_banner" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_banner_parent_id_idx" ON "_pages_v_blocks_product_banner" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_product_banner_path_idx" ON "_pages_v_blocks_product_banner" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_product_banner_form_idx" ON "_pages_v_blocks_product_banner" USING btree ("form_id");
CREATE INDEX "_pages_v_blocks_product_banner_banner_image_idx" ON "_pages_v_blocks_product_banner" USING btree ("banner_image_id");
CREATE INDEX "_pages_v_blocks_product_banner_banner_background_idx" ON "_pages_v_blocks_product_banner" USING btree ("banner_background_id");
CREATE INDEX "_pages_v_blocks_product_banner_mobile_banner_background_idx" ON "_pages_v_blocks_product_banner" USING btree ("mobile_banner_background_id");
CREATE INDEX "_pages_v_blocks_product_banner_logo_idx" ON "_pages_v_blocks_product_banner" USING btree ("logo_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_banner_locales_locale_parent_id_uniq" ON "_pages_v_blocks_product_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_access_banner_order_idx" ON "_pages_v_blocks_access_banner" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_access_banner_parent_id_idx" ON "_pages_v_blocks_access_banner" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_access_banner_path_idx" ON "_pages_v_blocks_access_banner" USING btree ("_path");
CREATE INDEX "_pages_v_blocks_access_banner_form_idx" ON "_pages_v_blocks_access_banner" USING btree ("form_id");
CREATE UNIQUE INDEX "_pages_v_blocks_access_banner_locales_locale_parent_id_uniqu" ON "_pages_v_blocks_access_banner_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_panel_thumbnails_order_idx" ON "_pages_v_blocks_product_showcase_panel_thumbnails" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_panel_thumbnails_parent_id_idx" ON "_pages_v_blocks_product_showcase_panel_thumbnails" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_panel_thumbnails_image_idx" ON "_pages_v_blocks_product_showcase_panel_thumbnails" USING btree ("image_id");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_features_order_idx" ON "_pages_v_blocks_product_showcase_plans_features" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_features_parent_id_idx" ON "_pages_v_blocks_product_showcase_plans_features" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_showcase_plans_features_locales_loca" ON "_pages_v_blocks_product_showcase_plans_features_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_prices_order_idx" ON "_pages_v_blocks_product_showcase_plans_prices" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_prices_parent_id_idx" ON "_pages_v_blocks_product_showcase_plans_prices" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_showcase_plans_prices_locales_locale" ON "_pages_v_blocks_product_showcase_plans_prices_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_order_idx" ON "_pages_v_blocks_product_showcase_plans" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_plans_parent_id_idx" ON "_pages_v_blocks_product_showcase_plans" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_showcase_plans_locales_locale_parent" ON "_pages_v_blocks_product_showcase_plans_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_faq_items_order_idx" ON "_pages_v_blocks_product_showcase_faq_items" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_faq_items_parent_id_idx" ON "_pages_v_blocks_product_showcase_faq_items" USING btree ("_parent_id");
CREATE UNIQUE INDEX "_pages_v_blocks_product_showcase_faq_items_locales_locale_pa" ON "_pages_v_blocks_product_showcase_faq_items_locales" USING btree ("_locale","_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_order_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_order");
CREATE INDEX "_pages_v_blocks_product_showcase_parent_id_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_parent_id");
CREATE INDEX "_pages_v_blocks_product_showcase_path_idx" ON "_pages_v_blocks_product_showcase" USING btree ("_path");
CREATE UNIQUE INDEX "_pages_v_blocks_product_showcase_locales_locale_parent_id_un" ON "_pages_v_blocks_product_showcase_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "footer_nav_items_locales_locale_parent_id_unique" ON "footer_nav_items_locales" USING btree ("_locale","_parent_id");
CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
ALTER TABLE "footer" ADD CONSTRAINT "footer_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "footer_logo_idx" ON "footer" USING btree ("logo_id");
ALTER TABLE "posts" DROP COLUMN "title";
ALTER TABLE "posts" DROP COLUMN "content";
ALTER TABLE "posts_locales" DROP COLUMN "meta_title";
ALTER TABLE "posts_locales" DROP COLUMN "meta_description";
ALTER TABLE "_posts_v" DROP COLUMN "version_title";
ALTER TABLE "_posts_v" DROP COLUMN "version_content";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_meta_title";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_meta_description";
  `)

  await db.execute(sql`
    COMMENT ON TABLE "pages_hero_links_locales" IS 'payload-migration:20260408_091158:fresh-replay';
  `)
}

/**
 * Only reverse schemas created by this bridge. On an existing live database the
 * up migration is a deliberate no-op, so its down migration must also be a
 * no-op rather than dropping historical production tables.
 */
export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  const state = await readBridgeState(db)

  if (state.marker !== BRIDGE_MARKER) {
    payload.logger.info(
      'Skipping 20260408_091158 rollback: this bridge did not create the historical schema.',
    )
    return
  }

  await db.execute(sql`
ALTER TABLE "pages_hero_links_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_cta_links_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_box_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_box_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_box_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_box_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_formula_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_formula_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_formula_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_formula_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card_results_cards" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card_results_cards_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_results_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_review_card_reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_review_card_reviews_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_review_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_review_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_card_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_card_steps_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_symptoms_card_symptoms" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_symptoms_card_symptoms_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_symptoms_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_symptoms_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_video_card_reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_video_card_reviews_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_video_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_video_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_key_takeaways_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_faq" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_column_headers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_column_headers_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_rows_cells" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_rows_cells_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_rows" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_data_table_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_cta_block" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_cta_block_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_bullet_list_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_bullet_list_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_bullet_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_bullet_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_form" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_form_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_info_social_links" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_info" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_info_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_section_info_social_links" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_section" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_contact_section_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_benefits_banner_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_benefits_banner_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_benefits_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_banner_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_banner_steps_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_steps_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_banner_carousel_text" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_banner_carousel_text_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_access_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_access_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_panel_thumbnails" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans_features" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans_features_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans_prices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans_prices_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_plans_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_faq_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_faq_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "pages_blocks_product_showcase_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_version_hero_links_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_cta_links_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_box_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_box_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_box_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_box_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_formula_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_formula_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_formula_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_formula_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card_items_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card_items_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card_results_cards" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card_results_cards_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_results_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_review_card_reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_review_card_reviews_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_review_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_review_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_card_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_card_steps_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_symptoms_card_symptoms" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_symptoms_card_symptoms_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_symptoms_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_symptoms_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_video_card_reviews" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_video_card_reviews_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_video_card" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_video_card_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_key_takeaways_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_key_takeaways_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_key_takeaways" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_faq_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_column_headers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_column_headers_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_rows_cells" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_rows_cells_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_rows" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_data_table_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_cta_block" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_cta_block_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_bullet_list_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_bullet_list_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_bullet_list" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_bullet_list_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_form" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_form_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_info_social_links" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_info" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_info_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_section_info_social_links" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_section" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_contact_section_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_benefits_banner_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_benefits_banner_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_benefits_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_banner_steps" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_banner_steps_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_steps_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_banner_carousel_text" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_banner_carousel_text_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_access_banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_access_banner_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_panel_thumbnails" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_features" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_features_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_prices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_prices_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_plans_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_faq_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_faq_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "_pages_v_blocks_product_showcase_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "footer_nav_items_locales" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "footer_locales" DISABLE ROW LEVEL SECURITY;
DROP TABLE "pages_hero_links_locales" CASCADE;
DROP TABLE "pages_blocks_cta_links_locales" CASCADE;
DROP TABLE "pages_blocks_content_columns_locales" CASCADE;
DROP TABLE "pages_blocks_box_card_items_list" CASCADE;
DROP TABLE "pages_blocks_box_card_items_list_locales" CASCADE;
DROP TABLE "pages_blocks_box_card" CASCADE;
DROP TABLE "pages_blocks_box_card_locales" CASCADE;
DROP TABLE "pages_blocks_formula_card_items_list" CASCADE;
DROP TABLE "pages_blocks_formula_card_items_list_locales" CASCADE;
DROP TABLE "pages_blocks_formula_card" CASCADE;
DROP TABLE "pages_blocks_formula_card_locales" CASCADE;
DROP TABLE "pages_blocks_results_card_items_list" CASCADE;
DROP TABLE "pages_blocks_results_card_items_list_locales" CASCADE;
DROP TABLE "pages_blocks_results_card_results_cards" CASCADE;
DROP TABLE "pages_blocks_results_card_results_cards_locales" CASCADE;
DROP TABLE "pages_blocks_results_card" CASCADE;
DROP TABLE "pages_blocks_results_card_locales" CASCADE;
DROP TABLE "pages_blocks_review_card_reviews" CASCADE;
DROP TABLE "pages_blocks_review_card_reviews_locales" CASCADE;
DROP TABLE "pages_blocks_review_card" CASCADE;
DROP TABLE "pages_blocks_review_card_locales" CASCADE;
DROP TABLE "pages_blocks_steps_card_steps" CASCADE;
DROP TABLE "pages_blocks_steps_card_steps_locales" CASCADE;
DROP TABLE "pages_blocks_steps_card" CASCADE;
DROP TABLE "pages_blocks_steps_card_locales" CASCADE;
DROP TABLE "pages_blocks_symptoms_card_symptoms" CASCADE;
DROP TABLE "pages_blocks_symptoms_card_symptoms_locales" CASCADE;
DROP TABLE "pages_blocks_symptoms_card" CASCADE;
DROP TABLE "pages_blocks_symptoms_card_locales" CASCADE;
DROP TABLE "pages_blocks_video_card_reviews" CASCADE;
DROP TABLE "pages_blocks_video_card_reviews_locales" CASCADE;
DROP TABLE "pages_blocks_video_card" CASCADE;
DROP TABLE "pages_blocks_video_card_locales" CASCADE;
DROP TABLE "pages_blocks_key_takeaways_items" CASCADE;
DROP TABLE "pages_blocks_key_takeaways_items_locales" CASCADE;
DROP TABLE "pages_blocks_key_takeaways" CASCADE;
DROP TABLE "pages_blocks_faq_items" CASCADE;
DROP TABLE "pages_blocks_faq_items_locales" CASCADE;
DROP TABLE "pages_blocks_faq" CASCADE;
DROP TABLE "pages_blocks_data_table_column_headers" CASCADE;
DROP TABLE "pages_blocks_data_table_column_headers_locales" CASCADE;
DROP TABLE "pages_blocks_data_table_rows_cells" CASCADE;
DROP TABLE "pages_blocks_data_table_rows_cells_locales" CASCADE;
DROP TABLE "pages_blocks_data_table_rows" CASCADE;
DROP TABLE "pages_blocks_data_table" CASCADE;
DROP TABLE "pages_blocks_data_table_locales" CASCADE;
DROP TABLE "pages_blocks_cta_block" CASCADE;
DROP TABLE "pages_blocks_cta_block_locales" CASCADE;
DROP TABLE "pages_blocks_bullet_list_items" CASCADE;
DROP TABLE "pages_blocks_bullet_list_items_locales" CASCADE;
DROP TABLE "pages_blocks_bullet_list" CASCADE;
DROP TABLE "pages_blocks_bullet_list_locales" CASCADE;
DROP TABLE "pages_blocks_contact_form" CASCADE;
DROP TABLE "pages_blocks_contact_form_locales" CASCADE;
DROP TABLE "pages_blocks_contact_info_social_links" CASCADE;
DROP TABLE "pages_blocks_contact_info" CASCADE;
DROP TABLE "pages_blocks_contact_info_locales" CASCADE;
DROP TABLE "pages_blocks_contact_section_info_social_links" CASCADE;
DROP TABLE "pages_blocks_contact_section" CASCADE;
DROP TABLE "pages_blocks_contact_section_locales" CASCADE;
DROP TABLE "pages_blocks_benefits_banner_items" CASCADE;
DROP TABLE "pages_blocks_benefits_banner_items_locales" CASCADE;
DROP TABLE "pages_blocks_benefits_banner" CASCADE;
DROP TABLE "pages_blocks_steps_banner_steps" CASCADE;
DROP TABLE "pages_blocks_steps_banner_steps_locales" CASCADE;
DROP TABLE "pages_blocks_steps_banner" CASCADE;
DROP TABLE "pages_blocks_steps_banner_locales" CASCADE;
DROP TABLE "pages_blocks_product_banner_carousel_text" CASCADE;
DROP TABLE "pages_blocks_product_banner_carousel_text_locales" CASCADE;
DROP TABLE "pages_blocks_product_banner" CASCADE;
DROP TABLE "pages_blocks_product_banner_locales" CASCADE;
DROP TABLE "pages_blocks_access_banner" CASCADE;
DROP TABLE "pages_blocks_access_banner_locales" CASCADE;
DROP TABLE "pages_blocks_product_showcase_panel_thumbnails" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans_features" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans_features_locales" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans_prices" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans_prices_locales" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans" CASCADE;
DROP TABLE "pages_blocks_product_showcase_plans_locales" CASCADE;
DROP TABLE "pages_blocks_product_showcase_faq_items" CASCADE;
DROP TABLE "pages_blocks_product_showcase_faq_items_locales" CASCADE;
DROP TABLE "pages_blocks_product_showcase" CASCADE;
DROP TABLE "pages_blocks_product_showcase_locales" CASCADE;
DROP TABLE "_pages_v_version_hero_links_locales" CASCADE;
DROP TABLE "_pages_v_blocks_cta_links_locales" CASCADE;
DROP TABLE "_pages_v_blocks_content_columns_locales" CASCADE;
DROP TABLE "_pages_v_blocks_box_card_items_list" CASCADE;
DROP TABLE "_pages_v_blocks_box_card_items_list_locales" CASCADE;
DROP TABLE "_pages_v_blocks_box_card" CASCADE;
DROP TABLE "_pages_v_blocks_box_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_formula_card_items_list" CASCADE;
DROP TABLE "_pages_v_blocks_formula_card_items_list_locales" CASCADE;
DROP TABLE "_pages_v_blocks_formula_card" CASCADE;
DROP TABLE "_pages_v_blocks_formula_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_results_card_items_list" CASCADE;
DROP TABLE "_pages_v_blocks_results_card_items_list_locales" CASCADE;
DROP TABLE "_pages_v_blocks_results_card_results_cards" CASCADE;
DROP TABLE "_pages_v_blocks_results_card_results_cards_locales" CASCADE;
DROP TABLE "_pages_v_blocks_results_card" CASCADE;
DROP TABLE "_pages_v_blocks_results_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_review_card_reviews" CASCADE;
DROP TABLE "_pages_v_blocks_review_card_reviews_locales" CASCADE;
DROP TABLE "_pages_v_blocks_review_card" CASCADE;
DROP TABLE "_pages_v_blocks_review_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_steps_card_steps" CASCADE;
DROP TABLE "_pages_v_blocks_steps_card_steps_locales" CASCADE;
DROP TABLE "_pages_v_blocks_steps_card" CASCADE;
DROP TABLE "_pages_v_blocks_steps_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_symptoms_card_symptoms" CASCADE;
DROP TABLE "_pages_v_blocks_symptoms_card_symptoms_locales" CASCADE;
DROP TABLE "_pages_v_blocks_symptoms_card" CASCADE;
DROP TABLE "_pages_v_blocks_symptoms_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_video_card_reviews" CASCADE;
DROP TABLE "_pages_v_blocks_video_card_reviews_locales" CASCADE;
DROP TABLE "_pages_v_blocks_video_card" CASCADE;
DROP TABLE "_pages_v_blocks_video_card_locales" CASCADE;
DROP TABLE "_pages_v_blocks_key_takeaways_items" CASCADE;
DROP TABLE "_pages_v_blocks_key_takeaways_items_locales" CASCADE;
DROP TABLE "_pages_v_blocks_key_takeaways" CASCADE;
DROP TABLE "_pages_v_blocks_faq_items" CASCADE;
DROP TABLE "_pages_v_blocks_faq_items_locales" CASCADE;
DROP TABLE "_pages_v_blocks_faq" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_column_headers" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_column_headers_locales" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_rows_cells" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_rows_cells_locales" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_rows" CASCADE;
DROP TABLE "_pages_v_blocks_data_table" CASCADE;
DROP TABLE "_pages_v_blocks_data_table_locales" CASCADE;
DROP TABLE "_pages_v_blocks_cta_block" CASCADE;
DROP TABLE "_pages_v_blocks_cta_block_locales" CASCADE;
DROP TABLE "_pages_v_blocks_bullet_list_items" CASCADE;
DROP TABLE "_pages_v_blocks_bullet_list_items_locales" CASCADE;
DROP TABLE "_pages_v_blocks_bullet_list" CASCADE;
DROP TABLE "_pages_v_blocks_bullet_list_locales" CASCADE;
DROP TABLE "_pages_v_blocks_contact_form" CASCADE;
DROP TABLE "_pages_v_blocks_contact_form_locales" CASCADE;
DROP TABLE "_pages_v_blocks_contact_info_social_links" CASCADE;
DROP TABLE "_pages_v_blocks_contact_info" CASCADE;
DROP TABLE "_pages_v_blocks_contact_info_locales" CASCADE;
DROP TABLE "_pages_v_blocks_contact_section_info_social_links" CASCADE;
DROP TABLE "_pages_v_blocks_contact_section" CASCADE;
DROP TABLE "_pages_v_blocks_contact_section_locales" CASCADE;
DROP TABLE "_pages_v_blocks_benefits_banner_items" CASCADE;
DROP TABLE "_pages_v_blocks_benefits_banner_items_locales" CASCADE;
DROP TABLE "_pages_v_blocks_benefits_banner" CASCADE;
DROP TABLE "_pages_v_blocks_steps_banner_steps" CASCADE;
DROP TABLE "_pages_v_blocks_steps_banner_steps_locales" CASCADE;
DROP TABLE "_pages_v_blocks_steps_banner" CASCADE;
DROP TABLE "_pages_v_blocks_steps_banner_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_banner_carousel_text" CASCADE;
DROP TABLE "_pages_v_blocks_product_banner_carousel_text_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_banner" CASCADE;
DROP TABLE "_pages_v_blocks_product_banner_locales" CASCADE;
DROP TABLE "_pages_v_blocks_access_banner" CASCADE;
DROP TABLE "_pages_v_blocks_access_banner_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_panel_thumbnails" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans_features" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans_features_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans_prices" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans_prices_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_plans_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_faq_items" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_faq_items_locales" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase" CASCADE;
DROP TABLE "_pages_v_blocks_product_showcase_locales" CASCADE;
DROP TABLE "footer_nav_items_locales" CASCADE;
DROP TABLE "footer_locales" CASCADE;
ALTER TABLE "footer" DROP CONSTRAINT "footer_logo_id_media_id_fk";

DROP INDEX "footer_logo_idx";
ALTER TABLE "posts" ADD COLUMN "title" varchar;
ALTER TABLE "posts" ADD COLUMN "content" jsonb;
ALTER TABLE "posts_locales" ADD COLUMN "meta_title" varchar;
ALTER TABLE "posts_locales" ADD COLUMN "meta_description" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_title" varchar;
ALTER TABLE "_posts_v" ADD COLUMN "version_content" jsonb;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_meta_title" varchar;
ALTER TABLE "_posts_v_locales" ADD COLUMN "version_meta_description" varchar;
ALTER TABLE "posts" DROP COLUMN "meta_title";
ALTER TABLE "posts" DROP COLUMN "meta_description";
ALTER TABLE "posts" DROP COLUMN "focus_keyword";
ALTER TABLE "posts_locales" DROP COLUMN "title";
ALTER TABLE "posts_locales" DROP COLUMN "subtitle";
ALTER TABLE "posts_locales" DROP COLUMN "intro";
ALTER TABLE "posts_locales" DROP COLUMN "content";
ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";
ALTER TABLE "_posts_v" DROP COLUMN "version_focus_keyword";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_title";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_subtitle";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_intro";
ALTER TABLE "_posts_v_locales" DROP COLUMN "version_content";
ALTER TABLE "header_nav_items" DROP COLUMN "link_localized_label";
ALTER TABLE "footer" DROP COLUMN "logo_id";
DROP TYPE "public"."enum_pages_blocks_data_table_variant";
DROP TYPE "public"."enum__pages_v_blocks_data_table_variant";
  `)
}
