import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "disclaimers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "disclaimers_locales" (
  	"label" varchar,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "conversion_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "conversion_blocks_locales" (
  	"heading" varchar,
  	"body" varchar NOT NULL,
  	"button_label" varchar,
  	"href" varchar DEFAULT '/order' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "disclaimers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "conversion_blocks_id" integer;
  ALTER TABLE "disclaimers_locales" ADD CONSTRAINT "disclaimers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."disclaimers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "conversion_blocks_locales" ADD CONSTRAINT "conversion_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."conversion_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "disclaimers_key_idx" ON "disclaimers" USING btree ("key");
  CREATE INDEX "disclaimers_updated_at_idx" ON "disclaimers" USING btree ("updated_at");
  CREATE INDEX "disclaimers_created_at_idx" ON "disclaimers" USING btree ("created_at");
  CREATE UNIQUE INDEX "disclaimers_locales_locale_parent_id_unique" ON "disclaimers_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "conversion_blocks_key_idx" ON "conversion_blocks" USING btree ("key");
  CREATE INDEX "conversion_blocks_updated_at_idx" ON "conversion_blocks" USING btree ("updated_at");
  CREATE INDEX "conversion_blocks_created_at_idx" ON "conversion_blocks" USING btree ("created_at");
  CREATE UNIQUE INDEX "conversion_blocks_locales_locale_parent_id_unique" ON "conversion_blocks_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_disclaimers_fk" FOREIGN KEY ("disclaimers_id") REFERENCES "public"."disclaimers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_conversion_blocks_fk" FOREIGN KEY ("conversion_blocks_id") REFERENCES "public"."conversion_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_disclaimers_id_idx" ON "payload_locked_documents_rels" USING btree ("disclaimers_id");
  CREATE INDEX "payload_locked_documents_rels_conversion_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("conversion_blocks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "disclaimers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "disclaimers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "conversion_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "conversion_blocks_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "disclaimers" CASCADE;
  DROP TABLE "disclaimers_locales" CASCADE;
  DROP TABLE "conversion_blocks" CASCADE;
  DROP TABLE "conversion_blocks_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_disclaimers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_conversion_blocks_fk";
  
  DROP INDEX "payload_locked_documents_rels_disclaimers_id_idx";
  DROP INDEX "payload_locked_documents_rels_conversion_blocks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "disclaimers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "conversion_blocks_id";`)
}
