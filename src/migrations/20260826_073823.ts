import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_disclaimers_weight" AS ENUM('note', 'standard', 'health', 'fine');
  ALTER TABLE "disclaimers" ADD COLUMN "weight" "enum_disclaimers_weight" DEFAULT 'standard' NOT NULL;
  ALTER TABLE "conversion_blocks" ADD COLUMN "disclaimer_id" integer;
  ALTER TABLE "conversion_blocks_locales" ADD COLUMN "lede" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "lead" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "study_design_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "study_design_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "key_findings_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "key_findings_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "mechanism_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "mechanism_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "clinical_implications_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "clinical_implications_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "in_plain_language_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "in_plain_language_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_lead" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_study_design_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_study_design_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_key_findings_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_key_findings_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_mechanism_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_mechanism_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_clinical_implications_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_clinical_implications_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_in_plain_language_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_in_plain_language_body" jsonb;
  ALTER TABLE "conversion_blocks" ADD CONSTRAINT "conversion_blocks_disclaimer_id_disclaimers_id_fk" FOREIGN KEY ("disclaimer_id") REFERENCES "public"."disclaimers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "conversion_blocks_disclaimer_idx" ON "conversion_blocks" USING btree ("disclaimer_id");
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "plain_language";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "methods_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "methods_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "findings_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "findings_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "interpretation_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "interpretation_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "evidence_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "evidence_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "takeaways_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "takeaways_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_plain_language";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_methods_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_methods_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_findings_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_findings_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_interpretation_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_interpretation_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_evidence_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_evidence_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_takeaways_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_takeaways_body";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "conversion_blocks" DROP CONSTRAINT "conversion_blocks_disclaimer_id_disclaimers_id_fk";
  
  DROP INDEX "conversion_blocks_disclaimer_idx";
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "plain_language" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "methods_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "methods_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "findings_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "findings_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "interpretation_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "interpretation_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "evidence_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "evidence_body" jsonb;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "takeaways_heading" varchar;
  ALTER TABLE "scientific_articles_locales" ADD COLUMN "takeaways_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_plain_language" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_methods_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_methods_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_findings_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_findings_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_interpretation_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_interpretation_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_evidence_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_evidence_body" jsonb;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_takeaways_heading" varchar;
  ALTER TABLE "_scientific_articles_v_locales" ADD COLUMN "version_takeaways_body" jsonb;
  ALTER TABLE "disclaimers" DROP COLUMN "weight";
  ALTER TABLE "conversion_blocks" DROP COLUMN "disclaimer_id";
  ALTER TABLE "conversion_blocks_locales" DROP COLUMN "lede";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "lead";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "study_design_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "study_design_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "key_findings_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "key_findings_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "mechanism_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "mechanism_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "clinical_implications_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "clinical_implications_body";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "in_plain_language_heading";
  ALTER TABLE "scientific_articles_locales" DROP COLUMN "in_plain_language_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_lead";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_study_design_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_study_design_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_key_findings_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_key_findings_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_mechanism_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_mechanism_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_clinical_implications_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_clinical_implications_body";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_in_plain_language_heading";
  ALTER TABLE "_scientific_articles_v_locales" DROP COLUMN "version_in_plain_language_body";
  DROP TYPE "public"."enum_disclaimers_weight";`)
}
