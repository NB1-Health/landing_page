import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "article_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "article_categories_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "scientific_articles" ADD COLUMN "category_id" integer;
  ALTER TABLE "_scientific_articles_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "article_categories_id" integer;
  ALTER TABLE "article_categories_locales" ADD CONSTRAINT "article_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "article_categories_key_idx" ON "article_categories" USING btree ("key");
  CREATE INDEX "article_categories_updated_at_idx" ON "article_categories" USING btree ("updated_at");
  CREATE INDEX "article_categories_created_at_idx" ON "article_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "article_categories_locales_locale_parent_id_unique" ON "article_categories_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "scientific_articles" ADD CONSTRAINT "scientific_articles_category_id_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."article_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_scientific_articles_v" ADD CONSTRAINT "_scientific_articles_v_version_category_id_article_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."article_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_article_categories_fk" FOREIGN KEY ("article_categories_id") REFERENCES "public"."article_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "scientific_articles_category_idx" ON "scientific_articles" USING btree ("category_id");
  CREATE INDEX "_scientific_articles_v_version_version_category_idx" ON "_scientific_articles_v" USING btree ("version_category_id");
  CREATE INDEX "payload_locked_documents_rels_article_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("article_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "article_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "article_categories_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "article_categories" CASCADE;
  DROP TABLE "article_categories_locales" CASCADE;
  ALTER TABLE "scientific_articles" DROP CONSTRAINT "scientific_articles_category_id_article_categories_id_fk";
  
  ALTER TABLE "_scientific_articles_v" DROP CONSTRAINT "_scientific_articles_v_version_category_id_article_categories_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_article_categories_fk";
  
  DROP INDEX "scientific_articles_category_idx";
  DROP INDEX "_scientific_articles_v_version_version_category_idx";
  DROP INDEX "payload_locked_documents_rels_article_categories_id_idx";
  ALTER TABLE "scientific_articles" DROP COLUMN "category_id";
  ALTER TABLE "_scientific_articles_v" DROP COLUMN "version_category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "article_categories_id";`)
}
