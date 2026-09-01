import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pillars_locales" ADD COLUMN "hero_caption" varchar;
  ALTER TABLE "pillars_rels" ADD COLUMN "scientific_articles_id" integer;
  ALTER TABLE "_pillars_v_locales" ADD COLUMN "version_hero_caption" varchar;
  ALTER TABLE "_pillars_v_rels" ADD COLUMN "scientific_articles_id" integer;
  ALTER TABLE "pillars_rels" ADD CONSTRAINT "pillars_rels_scientific_articles_fk" FOREIGN KEY ("scientific_articles_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pillars_v_rels" ADD CONSTRAINT "_pillars_v_rels_scientific_articles_fk" FOREIGN KEY ("scientific_articles_id") REFERENCES "public"."scientific_articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pillars_rels_scientific_articles_id_idx" ON "pillars_rels" USING btree ("scientific_articles_id");
  CREATE INDEX "_pillars_v_rels_scientific_articles_id_idx" ON "_pillars_v_rels" USING btree ("scientific_articles_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pillars_rels" DROP CONSTRAINT "pillars_rels_scientific_articles_fk";
  
  ALTER TABLE "_pillars_v_rels" DROP CONSTRAINT "_pillars_v_rels_scientific_articles_fk";
  
  DROP INDEX "pillars_rels_scientific_articles_id_idx";
  DROP INDEX "_pillars_v_rels_scientific_articles_id_idx";
  ALTER TABLE "pillars_locales" DROP COLUMN "hero_caption";
  ALTER TABLE "pillars_rels" DROP COLUMN "scientific_articles_id";
  ALTER TABLE "_pillars_v_locales" DROP COLUMN "version_hero_caption";
  ALTER TABLE "_pillars_v_rels" DROP COLUMN "scientific_articles_id";`)
}
