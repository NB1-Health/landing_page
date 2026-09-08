import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_plan_cards_plan_family" AS ENUM('core', 'advanced');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_plan_cards_cta_style" AS ENUM('out', 'cta');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_sections_rows_cell" AS ENUM('checkbox', 'oneLine', 'twoLine');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_cards_plan_family" AS ENUM('core', 'advanced');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_cards_cta_style" AS ENUM('out', 'lime');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_guarantee_items_icon" AS ENUM('clock', 'cycle', 'capsule', 'none');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_background_color" AS ENUM('cream', 'paper', 'off', 'navy', 'navyDeep', 'teal', 'custom');
  CREATE TYPE "public"."enum_inf_tpl_blocks_yp_plans_background_type" AS ENUM('color', 'image');
  CREATE TYPE "public"."enum_inf_tpl_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_plan_cards_plan_family" AS ENUM('core', 'advanced');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_plan_cards_cta_style" AS ENUM('out', 'cta');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_sections_rows_cell" AS ENUM('checkbox', 'oneLine', 'twoLine');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_cards_plan_family" AS ENUM('core', 'advanced');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_cards_cta_style" AS ENUM('out', 'lime');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_guarantee_items_icon" AS ENUM('clock', 'cycle', 'capsule', 'none');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_background_color" AS ENUM('cream', 'paper', 'off', 'navy', 'navyDeep', 'teal', 'custom');
  CREATE TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_background_type" AS ENUM('color', 'image');
  CREATE TYPE "public"."enum__inf_tpl_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__inf_tpl_v_published_locale" AS ENUM('en', 'de', 'fr', 'nl', 'it', 'ch', 'be', 'uk', 'uae');
  CREATE TABLE "inf_tpl_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gift" boolean DEFAULT false
  );
  
  CREATE TABLE "inf_tpl_timeline_locales" (
  	"when" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_scientists" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"portrait_id" integer
  );
  
  CREATE TABLE "inf_tpl_blocks_outcomes_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"delta_chip" varchar,
  	"value_before" varchar,
  	"value_after" varchar,
  	"value_unit" varchar,
  	"track_seg_left" varchar,
  	"track_seg_right" varchar,
  	"track_dot_before" varchar,
  	"track_dot_after" varchar
  );
  
  CREATE TABLE "inf_tpl_blocks_outcomes_cards_locales" (
  	"category" varchar,
  	"front_title" varchar,
  	"track_footnote" varchar,
  	"back_eyebrow" varchar,
  	"back_body" varchar,
  	"flip_aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"gauge_score" varchar,
  	"gauge_max" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "inf_tpl_blocks_outcomes_locales" (
  	"heading" jsonb,
  	"subheading" varchar,
  	"gauge_label" varchar,
  	"delta_label" varchar,
  	"delta_from" varchar,
  	"built_in_text" jsonb,
  	"felt_text" jsonb,
  	"footnote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_plan_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"featured" boolean DEFAULT false,
  	"plan_family" "enum_inf_tpl_blocks_yp_plans_plan_cards_plan_family",
  	"cta_style" "enum_inf_tpl_blocks_yp_plans_plan_cards_cta_style" DEFAULT 'out'
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_plan_cards_locales" (
  	"badge" varchar,
  	"name" varchar,
  	"tag" varchar,
  	"monthly" varchar,
  	"commit" varchar,
  	"list_label" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cell" "enum_inf_tpl_blocks_yp_plans_comparison_sections_rows_cell" DEFAULT 'checkbox'
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_sections_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"plan_family" "enum_inf_tpl_blocks_yp_plans_comparison_cards_plan_family",
  	"highlight" boolean DEFAULT false,
  	"cta_style" "enum_inf_tpl_blocks_yp_plans_comparison_cards_cta_style" DEFAULT 'out'
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_comparison_cards_locales" (
  	"label" varchar,
  	"features" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_guarantee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_inf_tpl_blocks_yp_plans_guarantee_items_icon" DEFAULT 'clock'
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_guarantee_items_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "enum_inf_tpl_blocks_yp_plans_background_color" DEFAULT 'cream',
  	"background_color_custom" varchar,
  	"background_type" "enum_inf_tpl_blocks_yp_plans_background_type" DEFAULT 'color',
  	"background_image_id" integer,
  	"grain" boolean DEFAULT true,
  	"show_comparison" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "inf_tpl_blocks_yp_plans_locales" (
  	"eyebrow" varchar,
  	"heading" jsonb,
  	"lede" jsonb,
  	"comparison_toggle_label_closed" varchar,
  	"comparison_toggle_label_open" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page_id" integer
  );
  
  CREATE TABLE "inf_tpl_footer_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "inf_tpl" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"key" varchar,
  	"logo_id" integer,
  	"offer_background_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_inf_tpl_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "inf_tpl_locales" (
  	"timeline_heading" varchar,
  	"timeline_accent" varchar,
  	"science_heading" varchar,
  	"science_copy" varchar,
  	"offer_badge" varchar,
  	"offer_fine_print" varchar,
  	"footer_copy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_version_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"gift" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_version_timeline_locales" (
  	"when" varchar,
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_version_scientists" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"portrait_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_outcomes_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"delta_chip" varchar,
  	"value_before" varchar,
  	"value_after" varchar,
  	"value_unit" varchar,
  	"track_seg_left" varchar,
  	"track_seg_right" varchar,
  	"track_dot_before" varchar,
  	"track_dot_after" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_outcomes_cards_locales" (
  	"category" varchar,
  	"front_title" varchar,
  	"track_footnote" varchar,
  	"back_eyebrow" varchar,
  	"back_body" varchar,
  	"flip_aria_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"gauge_score" varchar,
  	"gauge_max" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_outcomes_locales" (
  	"heading" jsonb,
  	"subheading" varchar,
  	"gauge_label" varchar,
  	"delta_label" varchar,
  	"delta_from" varchar,
  	"built_in_text" jsonb,
  	"felt_text" jsonb,
  	"footnote" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"featured" boolean DEFAULT false,
  	"plan_family" "enum__inf_tpl_v_blocks_yp_plans_plan_cards_plan_family",
  	"cta_style" "enum__inf_tpl_v_blocks_yp_plans_plan_cards_cta_style" DEFAULT 'out',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_locales" (
  	"badge" varchar,
  	"name" varchar,
  	"tag" varchar,
  	"monthly" varchar,
  	"commit" varchar,
  	"list_label" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cell" "enum__inf_tpl_v_blocks_yp_plans_comparison_sections_rows_cell" DEFAULT 'checkbox',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales" (
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"plan_family" "enum__inf_tpl_v_blocks_yp_plans_comparison_cards_plan_family",
  	"highlight" boolean DEFAULT false,
  	"cta_style" "enum__inf_tpl_v_blocks_yp_plans_comparison_cards_cta_style" DEFAULT 'out',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales" (
  	"label" varchar,
  	"features" jsonb,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__inf_tpl_v_blocks_yp_plans_guarantee_items_icon" DEFAULT 'clock',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales" (
  	"title" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_color" "enum__inf_tpl_v_blocks_yp_plans_background_color" DEFAULT 'cream',
  	"background_color_custom" varchar,
  	"background_type" "enum__inf_tpl_v_blocks_yp_plans_background_type" DEFAULT 'color',
  	"background_image_id" integer,
  	"grain" boolean DEFAULT true,
  	"show_comparison" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_blocks_yp_plans_locales" (
  	"eyebrow" varchar,
  	"heading" jsonb,
  	"lede" jsonb,
  	"comparison_toggle_label_closed" varchar,
  	"comparison_toggle_label_open" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_inf_tpl_v_version_footer_links_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_inf_tpl_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_key" varchar,
  	"version_logo_id" integer,
  	"version_offer_background_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__inf_tpl_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__inf_tpl_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_inf_tpl_v_locales" (
  	"version_timeline_heading" varchar,
  	"version_timeline_accent" varchar,
  	"version_science_heading" varchar,
  	"version_science_copy" varchar,
  	"version_offer_badge" varchar,
  	"version_offer_fine_print" varchar,
  	"version_footer_copy" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "influencer_landing_pages" ADD COLUMN "template_id" integer;
  ALTER TABLE "influencer_landing_pages_locales" ADD COLUMN "offer_fine_print" varchar;
  ALTER TABLE "_influencer_landing_pages_v" ADD COLUMN "version_template_id" integer;
  ALTER TABLE "_influencer_landing_pages_v_locales" ADD COLUMN "version_offer_fine_print" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "inf_tpl_id" integer;
  ALTER TABLE "inf_tpl_timeline" ADD CONSTRAINT "inf_tpl_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_timeline_locales" ADD CONSTRAINT "inf_tpl_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_scientists" ADD CONSTRAINT "inf_tpl_scientists_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl_scientists" ADD CONSTRAINT "inf_tpl_scientists_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_outcomes_cards" ADD CONSTRAINT "inf_tpl_blocks_outcomes_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_outcomes_cards" ADD CONSTRAINT "inf_tpl_blocks_outcomes_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_outcomes_cards_locales" ADD CONSTRAINT "inf_tpl_blocks_outcomes_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_outcomes_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_outcomes" ADD CONSTRAINT "inf_tpl_blocks_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_outcomes_locales" ADD CONSTRAINT "inf_tpl_blocks_outcomes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_plan_cards_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_plan_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_plan_cards_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_plan_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_plan_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_plan_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_comparison_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_comparison_sections_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_sections_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_comparison_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_cards" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_cards_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_comparison_cards_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_comparison_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_guarantee_items" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_guarantee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_guarantee_items_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_guarantee_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans_guarantee_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_blocks_yp_plans_locales" ADD CONSTRAINT "inf_tpl_blocks_yp_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_footer_links" ADD CONSTRAINT "inf_tpl_footer_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl_footer_links" ADD CONSTRAINT "inf_tpl_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl_footer_links_locales" ADD CONSTRAINT "inf_tpl_footer_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl_footer_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inf_tpl" ADD CONSTRAINT "inf_tpl_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl" ADD CONSTRAINT "inf_tpl_offer_background_id_media_id_fk" FOREIGN KEY ("offer_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inf_tpl_locales" ADD CONSTRAINT "inf_tpl_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_timeline" ADD CONSTRAINT "_inf_tpl_v_version_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_timeline_locales" ADD CONSTRAINT "_inf_tpl_v_version_timeline_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_version_timeline"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_scientists" ADD CONSTRAINT "_inf_tpl_v_version_scientists_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_scientists" ADD CONSTRAINT "_inf_tpl_v_version_scientists_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_cards" ADD CONSTRAINT "_inf_tpl_v_blocks_outcomes_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_cards" ADD CONSTRAINT "_inf_tpl_v_blocks_outcomes_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_cards_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_outcomes_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_outcomes_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes" ADD CONSTRAINT "_inf_tpl_v_blocks_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_outcomes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_outcomes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_plan_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_plan_cards_list_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_plan_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_plan_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_plan_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_comparison_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_local_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_comparison_sections_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_comparison_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_comparison_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_guarantee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans_guarantee_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_locales" ADD CONSTRAINT "_inf_tpl_v_blocks_yp_plans_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_blocks_yp_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_footer_links" ADD CONSTRAINT "_inf_tpl_v_version_footer_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_footer_links" ADD CONSTRAINT "_inf_tpl_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_version_footer_links_locales" ADD CONSTRAINT "_inf_tpl_v_version_footer_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v_version_footer_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v" ADD CONSTRAINT "_inf_tpl_v_parent_id_inf_tpl_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."inf_tpl"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v" ADD CONSTRAINT "_inf_tpl_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v" ADD CONSTRAINT "_inf_tpl_v_version_offer_background_id_media_id_fk" FOREIGN KEY ("version_offer_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_inf_tpl_v_locales" ADD CONSTRAINT "_inf_tpl_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_inf_tpl_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "inf_tpl_timeline_order_idx" ON "inf_tpl_timeline" USING btree ("_order");
  CREATE INDEX "inf_tpl_timeline_parent_id_idx" ON "inf_tpl_timeline" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_timeline_locales_locale_parent_id_unique" ON "inf_tpl_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_scientists_order_idx" ON "inf_tpl_scientists" USING btree ("_order");
  CREATE INDEX "inf_tpl_scientists_parent_id_idx" ON "inf_tpl_scientists" USING btree ("_parent_id");
  CREATE INDEX "inf_tpl_scientists_portrait_idx" ON "inf_tpl_scientists" USING btree ("portrait_id");
  CREATE INDEX "inf_tpl_blocks_outcomes_cards_order_idx" ON "inf_tpl_blocks_outcomes_cards" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_outcomes_cards_parent_id_idx" ON "inf_tpl_blocks_outcomes_cards" USING btree ("_parent_id");
  CREATE INDEX "inf_tpl_blocks_outcomes_cards_image_idx" ON "inf_tpl_blocks_outcomes_cards" USING btree ("image_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_outcomes_cards_locales_locale_parent_id_uniqu" ON "inf_tpl_blocks_outcomes_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_outcomes_order_idx" ON "inf_tpl_blocks_outcomes" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_outcomes_parent_id_idx" ON "inf_tpl_blocks_outcomes" USING btree ("_parent_id");
  CREATE INDEX "inf_tpl_blocks_outcomes_path_idx" ON "inf_tpl_blocks_outcomes" USING btree ("_path");
  CREATE UNIQUE INDEX "inf_tpl_blocks_outcomes_locales_locale_parent_id_unique" ON "inf_tpl_blocks_outcomes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_plan_cards_list_items_order_idx" ON "inf_tpl_blocks_yp_plans_plan_cards_list_items" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_plan_cards_list_items_parent_id_idx" ON "inf_tpl_blocks_yp_plans_plan_cards_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales_locale" ON "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_plan_cards_order_idx" ON "inf_tpl_blocks_yp_plans_plan_cards" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_plan_cards_parent_id_idx" ON "inf_tpl_blocks_yp_plans_plan_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_plan_cards_locales_locale_parent_id_" ON "inf_tpl_blocks_yp_plans_plan_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_rows_order_idx" ON "inf_tpl_blocks_yp_plans_comparison_sections_rows" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_rows_parent_id_idx" ON "inf_tpl_blocks_yp_plans_comparison_sections_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales_loc" ON "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_order_idx" ON "inf_tpl_blocks_yp_plans_comparison_sections" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_parent_id_idx" ON "inf_tpl_blocks_yp_plans_comparison_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_comparison_sections_locales_locale_p" ON "inf_tpl_blocks_yp_plans_comparison_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_cards_order_idx" ON "inf_tpl_blocks_yp_plans_comparison_cards" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_comparison_cards_parent_id_idx" ON "inf_tpl_blocks_yp_plans_comparison_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_comparison_cards_locales_locale_pare" ON "inf_tpl_blocks_yp_plans_comparison_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_guarantee_items_order_idx" ON "inf_tpl_blocks_yp_plans_guarantee_items" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_guarantee_items_parent_id_idx" ON "inf_tpl_blocks_yp_plans_guarantee_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_guarantee_items_locales_locale_paren" ON "inf_tpl_blocks_yp_plans_guarantee_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_order_idx" ON "inf_tpl_blocks_yp_plans" USING btree ("_order");
  CREATE INDEX "inf_tpl_blocks_yp_plans_parent_id_idx" ON "inf_tpl_blocks_yp_plans" USING btree ("_parent_id");
  CREATE INDEX "inf_tpl_blocks_yp_plans_path_idx" ON "inf_tpl_blocks_yp_plans" USING btree ("_path");
  CREATE INDEX "inf_tpl_blocks_yp_plans_background_image_idx" ON "inf_tpl_blocks_yp_plans" USING btree ("background_image_id");
  CREATE UNIQUE INDEX "inf_tpl_blocks_yp_plans_locales_locale_parent_id_unique" ON "inf_tpl_blocks_yp_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "inf_tpl_footer_links_order_idx" ON "inf_tpl_footer_links" USING btree ("_order");
  CREATE INDEX "inf_tpl_footer_links_parent_id_idx" ON "inf_tpl_footer_links" USING btree ("_parent_id");
  CREATE INDEX "inf_tpl_footer_links_page_idx" ON "inf_tpl_footer_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "inf_tpl_footer_links_locales_locale_parent_id_unique" ON "inf_tpl_footer_links_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "inf_tpl_key_idx" ON "inf_tpl" USING btree ("key");
  CREATE INDEX "inf_tpl_logo_idx" ON "inf_tpl" USING btree ("logo_id");
  CREATE INDEX "inf_tpl_offer_background_idx" ON "inf_tpl" USING btree ("offer_background_id");
  CREATE INDEX "inf_tpl_updated_at_idx" ON "inf_tpl" USING btree ("updated_at");
  CREATE INDEX "inf_tpl_created_at_idx" ON "inf_tpl" USING btree ("created_at");
  CREATE INDEX "inf_tpl__status_idx" ON "inf_tpl" USING btree ("_status");
  CREATE UNIQUE INDEX "inf_tpl_locales_locale_parent_id_unique" ON "inf_tpl_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_version_timeline_order_idx" ON "_inf_tpl_v_version_timeline" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_version_timeline_parent_id_idx" ON "_inf_tpl_v_version_timeline" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_version_timeline_locales_locale_parent_id_unique" ON "_inf_tpl_v_version_timeline_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_version_scientists_order_idx" ON "_inf_tpl_v_version_scientists" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_version_scientists_parent_id_idx" ON "_inf_tpl_v_version_scientists" USING btree ("_parent_id");
  CREATE INDEX "_inf_tpl_v_version_scientists_portrait_idx" ON "_inf_tpl_v_version_scientists" USING btree ("portrait_id");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_cards_order_idx" ON "_inf_tpl_v_blocks_outcomes_cards" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_cards_parent_id_idx" ON "_inf_tpl_v_blocks_outcomes_cards" USING btree ("_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_cards_image_idx" ON "_inf_tpl_v_blocks_outcomes_cards" USING btree ("image_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_outcomes_cards_locales_locale_parent_id_un" ON "_inf_tpl_v_blocks_outcomes_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_order_idx" ON "_inf_tpl_v_blocks_outcomes" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_parent_id_idx" ON "_inf_tpl_v_blocks_outcomes" USING btree ("_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_outcomes_path_idx" ON "_inf_tpl_v_blocks_outcomes" USING btree ("_path");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_outcomes_locales_locale_parent_id_unique" ON "_inf_tpl_v_blocks_outcomes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_order_idx" ON "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales_loc" ON "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_order_idx" ON "_inf_tpl_v_blocks_yp_plans_plan_cards" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_plan_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_plan_cards_locales_locale_parent_" ON "_inf_tpl_v_blocks_yp_plans_plan_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_order_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales_" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_order_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales_local" ON "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_cards_order_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_cards" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_cards_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_comparison_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales_locale_p" ON "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_guarantee_items_order_idx" ON "_inf_tpl_v_blocks_yp_plans_guarantee_items" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_guarantee_items_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans_guarantee_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales_locale_pa" ON "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_order_idx" ON "_inf_tpl_v_blocks_yp_plans" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_parent_id_idx" ON "_inf_tpl_v_blocks_yp_plans" USING btree ("_parent_id");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_path_idx" ON "_inf_tpl_v_blocks_yp_plans" USING btree ("_path");
  CREATE INDEX "_inf_tpl_v_blocks_yp_plans_background_image_idx" ON "_inf_tpl_v_blocks_yp_plans" USING btree ("background_image_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_blocks_yp_plans_locales_locale_parent_id_unique" ON "_inf_tpl_v_blocks_yp_plans_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_version_footer_links_order_idx" ON "_inf_tpl_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_inf_tpl_v_version_footer_links_parent_id_idx" ON "_inf_tpl_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_inf_tpl_v_version_footer_links_page_idx" ON "_inf_tpl_v_version_footer_links" USING btree ("page_id");
  CREATE UNIQUE INDEX "_inf_tpl_v_version_footer_links_locales_locale_parent_id_uni" ON "_inf_tpl_v_version_footer_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_inf_tpl_v_parent_idx" ON "_inf_tpl_v" USING btree ("parent_id");
  CREATE INDEX "_inf_tpl_v_version_version_key_idx" ON "_inf_tpl_v" USING btree ("version_key");
  CREATE INDEX "_inf_tpl_v_version_version_logo_idx" ON "_inf_tpl_v" USING btree ("version_logo_id");
  CREATE INDEX "_inf_tpl_v_version_version_offer_background_idx" ON "_inf_tpl_v" USING btree ("version_offer_background_id");
  CREATE INDEX "_inf_tpl_v_version_version_updated_at_idx" ON "_inf_tpl_v" USING btree ("version_updated_at");
  CREATE INDEX "_inf_tpl_v_version_version_created_at_idx" ON "_inf_tpl_v" USING btree ("version_created_at");
  CREATE INDEX "_inf_tpl_v_version_version__status_idx" ON "_inf_tpl_v" USING btree ("version__status");
  CREATE INDEX "_inf_tpl_v_created_at_idx" ON "_inf_tpl_v" USING btree ("created_at");
  CREATE INDEX "_inf_tpl_v_updated_at_idx" ON "_inf_tpl_v" USING btree ("updated_at");
  CREATE INDEX "_inf_tpl_v_snapshot_idx" ON "_inf_tpl_v" USING btree ("snapshot");
  CREATE INDEX "_inf_tpl_v_published_locale_idx" ON "_inf_tpl_v" USING btree ("published_locale");
  CREATE INDEX "_inf_tpl_v_latest_idx" ON "_inf_tpl_v" USING btree ("latest");
  CREATE INDEX "_inf_tpl_v_autosave_idx" ON "_inf_tpl_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_inf_tpl_v_locales_locale_parent_id_unique" ON "_inf_tpl_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "influencer_landing_pages" ADD CONSTRAINT "influencer_landing_pages_template_id_inf_tpl_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."inf_tpl"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_influencer_landing_pages_v" ADD CONSTRAINT "_influencer_landing_pages_v_version_template_id_inf_tpl_id_fk" FOREIGN KEY ("version_template_id") REFERENCES "public"."inf_tpl"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_influencer_templates_fk" FOREIGN KEY ("inf_tpl_id") REFERENCES "public"."inf_tpl"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "influencer_landing_pages_template_idx" ON "influencer_landing_pages" USING btree ("template_id");
  CREATE INDEX "_influencer_landing_pages_v_version_version_template_idx" ON "_influencer_landing_pages_v" USING btree ("version_template_id");
  CREATE INDEX "payload_locked_documents_rels_inf_tpl_id_idx" ON "payload_locked_documents_rels" USING btree ("inf_tpl_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "inf_tpl_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_timeline_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_scientists" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_outcomes_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_outcomes_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_outcomes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_plan_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_comparison_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_guarantee_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_guarantee_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_blocks_yp_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_footer_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "inf_tpl_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_version_timeline" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_version_timeline_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_version_scientists" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_outcomes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_blocks_yp_plans_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_version_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_version_footer_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_inf_tpl_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "inf_tpl_timeline" CASCADE;
  DROP TABLE "inf_tpl_timeline_locales" CASCADE;
  DROP TABLE "inf_tpl_scientists" CASCADE;
  DROP TABLE "inf_tpl_blocks_outcomes_cards" CASCADE;
  DROP TABLE "inf_tpl_blocks_outcomes_cards_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_outcomes" CASCADE;
  DROP TABLE "inf_tpl_blocks_outcomes_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_plan_cards_list_items_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_plan_cards" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_plan_cards_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_sections_rows_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_sections" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_sections_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_cards" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_comparison_cards_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_guarantee_items" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_guarantee_items_locales" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans" CASCADE;
  DROP TABLE "inf_tpl_blocks_yp_plans_locales" CASCADE;
  DROP TABLE "inf_tpl_footer_links" CASCADE;
  DROP TABLE "inf_tpl_footer_links_locales" CASCADE;
  DROP TABLE "inf_tpl" CASCADE;
  DROP TABLE "inf_tpl_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_version_timeline" CASCADE;
  DROP TABLE "_inf_tpl_v_version_timeline_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_version_scientists" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_outcomes_cards" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_outcomes_cards_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_outcomes" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_outcomes_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_list_items_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_plan_cards_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_rows_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_sections_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_comparison_cards_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_guarantee_items_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans" CASCADE;
  DROP TABLE "_inf_tpl_v_blocks_yp_plans_locales" CASCADE;
  DROP TABLE "_inf_tpl_v_version_footer_links" CASCADE;
  DROP TABLE "_inf_tpl_v_version_footer_links_locales" CASCADE;
  DROP TABLE "_inf_tpl_v" CASCADE;
  DROP TABLE "_inf_tpl_v_locales" CASCADE;
  ALTER TABLE "influencer_landing_pages" DROP CONSTRAINT "influencer_landing_pages_template_id_inf_tpl_id_fk";
  
  ALTER TABLE "_influencer_landing_pages_v" DROP CONSTRAINT "_influencer_landing_pages_v_version_template_id_inf_tpl_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_influencer_templates_fk";
  
  DROP INDEX "influencer_landing_pages_template_idx";
  DROP INDEX "_influencer_landing_pages_v_version_version_template_idx";
  DROP INDEX "payload_locked_documents_rels_inf_tpl_id_idx";
  ALTER TABLE "influencer_landing_pages" DROP COLUMN "template_id";
  ALTER TABLE "influencer_landing_pages_locales" DROP COLUMN "offer_fine_print";
  ALTER TABLE "_influencer_landing_pages_v" DROP COLUMN "version_template_id";
  ALTER TABLE "_influencer_landing_pages_v_locales" DROP COLUMN "version_offer_fine_print";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "inf_tpl_id";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_plan_cards_plan_family";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_plan_cards_cta_style";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_sections_rows_cell";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_cards_plan_family";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_comparison_cards_cta_style";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_guarantee_items_icon";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_background_color";
  DROP TYPE "public"."enum_inf_tpl_blocks_yp_plans_background_type";
  DROP TYPE "public"."enum_inf_tpl_status";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_plan_cards_plan_family";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_plan_cards_cta_style";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_sections_rows_cell";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_cards_plan_family";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_comparison_cards_cta_style";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_guarantee_items_icon";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_background_color";
  DROP TYPE "public"."enum__inf_tpl_v_blocks_yp_plans_background_type";
  DROP TYPE "public"."enum__inf_tpl_v_version_status";
  DROP TYPE "public"."enum__inf_tpl_v_published_locale";`)
}
