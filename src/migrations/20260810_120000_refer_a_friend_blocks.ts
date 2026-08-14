import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Refer a Friend page — three blocks: referralWidget (dbName 'rfw'),
// referInfo (dbName 'rfi'), referFaq (dbName 'rff'). Table/column/enum/index
// names copied verbatim from Payload's computed schema (payload generate:db-schema),
// not guessed. Short dbNames keep the array+locale index names under Postgres's
// 63-char identifier limit.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_rfi_eligibility_type" AS ENUM('include', 'exclude');
  CREATE TYPE "public"."enum__rfi_v_eligibility_type" AS ENUM('include', 'exclude');

  CREATE TABLE "rfw" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "situation" varchar DEFAULT 'landingpage',
   "locale_override" varchar,
   "show_placeholder" boolean DEFAULT true,
   "block_name" varchar
  );

  CREATE TABLE "rfi" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "media_id" integer,
   "block_name" varchar
  );

  CREATE TABLE "rfi_locales" (
   "heading" jsonb,
   "eligibility_heading" varchar DEFAULT 'Which plans the programme applies to',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "rfi_steps" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "rfi_steps_locales" (
   "title" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "rfi_eligibility" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "type" "enum_rfi_eligibility_type" DEFAULT 'include'
  );

  CREATE TABLE "rfi_eligibility_locales" (
   "text" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "rff" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL,
   "block_name" varchar
  );

  CREATE TABLE "rff_locales" (
   "title" varchar DEFAULT 'FAQs',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "rff_items" (
   "_order" integer NOT NULL,
   "_parent_id" varchar NOT NULL,
   "id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "rff_items_locales" (
   "question" varchar,
   "answer" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" varchar NOT NULL
  );

  CREATE TABLE "_rfw_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "situation" varchar DEFAULT 'landingpage',
   "locale_override" varchar,
   "show_placeholder" boolean DEFAULT true,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_rfi_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "media_id" integer,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_rfi_v_locales" (
   "heading" jsonb,
   "eligibility_heading" varchar DEFAULT 'Which plans the programme applies to',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_rfi_v_steps" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar
  );

  CREATE TABLE "_rfi_v_steps_locales" (
   "title" varchar,
   "body" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_rfi_v_eligibility" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "type" "enum__rfi_v_eligibility_type" DEFAULT 'include',
   "_uuid" varchar
  );

  CREATE TABLE "_rfi_v_eligibility_locales" (
   "text" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_rff_v" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "_path" text NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar,
   "block_name" varchar
  );

  CREATE TABLE "_rff_v_locales" (
   "title" varchar DEFAULT 'FAQs',
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  CREATE TABLE "_rff_v_items" (
   "_order" integer NOT NULL,
   "_parent_id" integer NOT NULL,
   "id" serial PRIMARY KEY NOT NULL,
   "_uuid" varchar
  );

  CREATE TABLE "_rff_v_items_locales" (
   "question" varchar,
   "answer" jsonb,
   "id" serial PRIMARY KEY NOT NULL,
   "_locale" "_locales" NOT NULL,
   "_parent_id" integer NOT NULL
  );

  ALTER TABLE "rfw" ADD CONSTRAINT "rfw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi" ADD CONSTRAINT "rfi_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rfi" ADD CONSTRAINT "rfi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi_locales" ADD CONSTRAINT "rfi_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi_steps" ADD CONSTRAINT "rfi_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi_steps_locales" ADD CONSTRAINT "rfi_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfi_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi_eligibility" ADD CONSTRAINT "rfi_eligibility_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfi"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rfi_eligibility_locales" ADD CONSTRAINT "rfi_eligibility_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rfi_eligibility"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rff" ADD CONSTRAINT "rff_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rff_locales" ADD CONSTRAINT "rff_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rff_items" ADD CONSTRAINT "rff_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rff_items_locales" ADD CONSTRAINT "rff_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rff_items"("id") ON DELETE cascade ON UPDATE no action;

  ALTER TABLE "_rfw_v" ADD CONSTRAINT "_rfw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v" ADD CONSTRAINT "_rfi_v_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rfi_v" ADD CONSTRAINT "_rfi_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v_locales" ADD CONSTRAINT "_rfi_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rfi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v_steps" ADD CONSTRAINT "_rfi_v_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rfi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v_steps_locales" ADD CONSTRAINT "_rfi_v_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rfi_v_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v_eligibility" ADD CONSTRAINT "_rfi_v_eligibility_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rfi_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rfi_v_eligibility_locales" ADD CONSTRAINT "_rfi_v_eligibility_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rfi_v_eligibility"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rff_v" ADD CONSTRAINT "_rff_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rff_v_locales" ADD CONSTRAINT "_rff_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rff_v_items" ADD CONSTRAINT "_rff_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rff_v_items_locales" ADD CONSTRAINT "_rff_v_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rff_v_items"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "rfw_order_idx" ON "rfw" USING btree ("_order");
  CREATE INDEX "rfw_parent_id_idx" ON "rfw" USING btree ("_parent_id");
  CREATE INDEX "rfw_path_idx" ON "rfw" USING btree ("_path");
  CREATE INDEX "rfi_order_idx" ON "rfi" USING btree ("_order");
  CREATE INDEX "rfi_parent_id_idx" ON "rfi" USING btree ("_parent_id");
  CREATE INDEX "rfi_path_idx" ON "rfi" USING btree ("_path");
  CREATE INDEX "rfi_media_idx" ON "rfi" USING btree ("media_id");
  CREATE UNIQUE INDEX "rfi_locales_locale_parent_id_unique" ON "rfi_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rfi_steps_order_idx" ON "rfi_steps" USING btree ("_order");
  CREATE INDEX "rfi_steps_parent_id_idx" ON "rfi_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rfi_steps_locales_locale_parent_id_unique" ON "rfi_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rfi_eligibility_order_idx" ON "rfi_eligibility" USING btree ("_order");
  CREATE INDEX "rfi_eligibility_parent_id_idx" ON "rfi_eligibility" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rfi_eligibility_locales_locale_parent_id_unique" ON "rfi_eligibility_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rff_order_idx" ON "rff" USING btree ("_order");
  CREATE INDEX "rff_parent_id_idx" ON "rff" USING btree ("_parent_id");
  CREATE INDEX "rff_path_idx" ON "rff" USING btree ("_path");
  CREATE UNIQUE INDEX "rff_locales_locale_parent_id_unique" ON "rff_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "rff_items_order_idx" ON "rff_items" USING btree ("_order");
  CREATE INDEX "rff_items_parent_id_idx" ON "rff_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rff_items_locales_locale_parent_id_unique" ON "rff_items_locales" USING btree ("_locale","_parent_id");

  CREATE INDEX "_rfw_v_order_idx" ON "_rfw_v" USING btree ("_order");
  CREATE INDEX "_rfw_v_parent_id_idx" ON "_rfw_v" USING btree ("_parent_id");
  CREATE INDEX "_rfw_v_path_idx" ON "_rfw_v" USING btree ("_path");
  CREATE INDEX "_rfi_v_order_idx" ON "_rfi_v" USING btree ("_order");
  CREATE INDEX "_rfi_v_parent_id_idx" ON "_rfi_v" USING btree ("_parent_id");
  CREATE INDEX "_rfi_v_path_idx" ON "_rfi_v" USING btree ("_path");
  CREATE INDEX "_rfi_v_media_idx" ON "_rfi_v" USING btree ("media_id");
  CREATE UNIQUE INDEX "_rfi_v_locales_locale_parent_id_unique" ON "_rfi_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rfi_v_steps_order_idx" ON "_rfi_v_steps" USING btree ("_order");
  CREATE INDEX "_rfi_v_steps_parent_id_idx" ON "_rfi_v_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rfi_v_steps_locales_locale_parent_id_unique" ON "_rfi_v_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rfi_v_eligibility_order_idx" ON "_rfi_v_eligibility" USING btree ("_order");
  CREATE INDEX "_rfi_v_eligibility_parent_id_idx" ON "_rfi_v_eligibility" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rfi_v_eligibility_locales_locale_parent_id_unique" ON "_rfi_v_eligibility_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rff_v_order_idx" ON "_rff_v" USING btree ("_order");
  CREATE INDEX "_rff_v_parent_id_idx" ON "_rff_v" USING btree ("_parent_id");
  CREATE INDEX "_rff_v_path_idx" ON "_rff_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_rff_v_locales_locale_parent_id_unique" ON "_rff_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rff_v_items_order_idx" ON "_rff_v_items" USING btree ("_order");
  CREATE INDEX "_rff_v_items_parent_id_idx" ON "_rff_v_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rff_v_items_locales_locale_parent_id_unique" ON "_rff_v_items_locales" USING btree ("_locale","_parent_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "rfi_steps_locales";
  DROP TABLE IF EXISTS "rfi_steps";
  DROP TABLE IF EXISTS "rfi_eligibility_locales";
  DROP TABLE IF EXISTS "rfi_eligibility";
  DROP TABLE IF EXISTS "rfi_locales";
  DROP TABLE IF EXISTS "rfi";
  DROP TABLE IF EXISTS "rfw";
  DROP TABLE IF EXISTS "rff_items_locales";
  DROP TABLE IF EXISTS "rff_items";
  DROP TABLE IF EXISTS "rff_locales";
  DROP TABLE IF EXISTS "rff";

  DROP TABLE IF EXISTS "_rfi_v_steps_locales";
  DROP TABLE IF EXISTS "_rfi_v_steps";
  DROP TABLE IF EXISTS "_rfi_v_eligibility_locales";
  DROP TABLE IF EXISTS "_rfi_v_eligibility";
  DROP TABLE IF EXISTS "_rfi_v_locales";
  DROP TABLE IF EXISTS "_rfi_v";
  DROP TABLE IF EXISTS "_rfw_v";
  DROP TABLE IF EXISTS "_rff_v_items_locales";
  DROP TABLE IF EXISTS "_rff_v_items";
  DROP TABLE IF EXISTS "_rff_v_locales";
  DROP TABLE IF EXISTS "_rff_v";

  DROP TYPE IF EXISTS "public"."enum_rfi_eligibility_type";
  DROP TYPE IF EXISTS "public"."enum__rfi_v_eligibility_type";
  `)
}
