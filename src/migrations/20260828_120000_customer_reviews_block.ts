import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// customerReviews block (dbName 'cvr') — the Trustpilot-style review carousel.
// Table/column/index/constraint names copied verbatim from Payload's computed
// schema (`payload generate:db-schema`), not guessed. The short dbName keeps the
// nested `reviews` array's locale index names under Postgres's 63-char limit.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "cvr" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "block_name" varchar
  );

  CREATE TABLE "cvr_locales" (
   "heading" jsonb,
   "see_more_label" varchar DEFAULT 'See more',
   "see_less_label" varchar DEFAULT 'See less',
   "prev_aria_label" varchar DEFAULT 'Previous reviews',
   "next_aria_label" varchar DEFAULT 'Next reviews',
   "rail_aria_label" varchar DEFAULT 'Member reviews',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "cvr_reviews" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "photo_id" integer
  );

  CREATE TABLE "cvr_reviews_locales" (
   "quote" varchar,
   "body" varchar,
   "author_name" varchar,
   "author_meta" varchar DEFAULT 'NB1 customer',
   "initials" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_cvr_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_cvr_v_locales" (
   "heading" jsonb,
   "see_more_label" varchar DEFAULT 'See more',
   "see_less_label" varchar DEFAULT 'See less',
   "prev_aria_label" varchar DEFAULT 'Previous reviews',
   "next_aria_label" varchar DEFAULT 'Next reviews',
   "rail_aria_label" varchar DEFAULT 'Member reviews',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_cvr_v_reviews" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "photo_id" integer,
   "_uuid" varchar
  );

  CREATE TABLE "_cvr_v_reviews_locales" (
   "quote" varchar,
   "body" varchar,
   "author_name" varchar,
   "author_meta" varchar DEFAULT 'NB1 customer',
   "initials" varchar,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  ALTER TABLE "cvr" ADD CONSTRAINT "cvr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvr_locales" ADD CONSTRAINT "cvr_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvr"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvr_reviews" ADD CONSTRAINT "cvr_reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cvr_reviews" ADD CONSTRAINT "cvr_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvr"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cvr_reviews_locales" ADD CONSTRAINT "cvr_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cvr_reviews"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "_cvr_v" ADD CONSTRAINT "_cvr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cvr_v_locales" ADD CONSTRAINT "_cvr_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cvr_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cvr_v_reviews" ADD CONSTRAINT "_cvr_v_reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cvr_v_reviews" ADD CONSTRAINT "_cvr_v_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cvr_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cvr_v_reviews_locales" ADD CONSTRAINT "_cvr_v_reviews_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cvr_v_reviews"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "cvr_order_idx" ON "cvr" USING btree ("_order");
  CREATE INDEX "cvr_parent_id_idx" ON "cvr" USING btree ("_parent_id");
  CREATE INDEX "cvr_path_idx" ON "cvr" USING btree ("_path");
  CREATE UNIQUE INDEX "cvr_locales_locale_parent_id_unique" ON "cvr_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "cvr_reviews_order_idx" ON "cvr_reviews" USING btree ("_order");
  CREATE INDEX "cvr_reviews_parent_id_idx" ON "cvr_reviews" USING btree ("_parent_id");
  CREATE INDEX "cvr_reviews_photo_idx" ON "cvr_reviews" USING btree ("photo_id");
  CREATE UNIQUE INDEX "cvr_reviews_locales_locale_parent_id_unique" ON "cvr_reviews_locales" USING btree ("_locale","_parent_id");

  CREATE INDEX "_cvr_v_order_idx" ON "_cvr_v" USING btree ("_order");
  CREATE INDEX "_cvr_v_parent_id_idx" ON "_cvr_v" USING btree ("_parent_id");
  CREATE INDEX "_cvr_v_path_idx" ON "_cvr_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_cvr_v_locales_locale_parent_id_unique" ON "_cvr_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cvr_v_reviews_order_idx" ON "_cvr_v_reviews" USING btree ("_order");
  CREATE INDEX "_cvr_v_reviews_parent_id_idx" ON "_cvr_v_reviews" USING btree ("_parent_id");
  CREATE INDEX "_cvr_v_reviews_photo_idx" ON "_cvr_v_reviews" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_cvr_v_reviews_locales_locale_parent_id_unique" ON "_cvr_v_reviews_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "cvr_reviews_locales";
  DROP TABLE IF EXISTS "cvr_reviews";
  DROP TABLE IF EXISTS "cvr_locales";
  DROP TABLE IF EXISTS "cvr";

  DROP TABLE IF EXISTS "_cvr_v_reviews_locales";
  DROP TABLE IF EXISTS "_cvr_v_reviews";
  DROP TABLE IF EXISTS "_cvr_v_locales";
  DROP TABLE IF EXISTS "_cvr_v";
  `)
}
