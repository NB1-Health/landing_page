import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// The Hubs collection — four records (journal, microbiome, research, lexicon)
// carrying the localized URL segment and title for each content hub.
// TICKET-SEO-007 §6: "Store the hierarchy once; derive both views from it."
//
// Hand-written rather than generated. The snapshot was resynced on 24 Aug so
// `migrate:create` is usable again, but a generated diff would also pick up
// anything else that has drifted since, and this table is small enough to state
// exactly.
//
// SHAPE NOTES
//
// `key` is the stable identity the code matches on and is NOT localized —
// unique across the table. `slug`, `title`, `intro` and the two SEO overrides
// ARE localized, so they live in `hubs_locales` with a (_locale, _parent_id)
// unique pair, the same shape Payload generates for every other localized
// collection here.
//
// Slug uniqueness is deliberately NOT a database constraint. It is per-locale,
// and a DB unique index on `hubs_locales.slug` would enforce it across every
// locale at once — rejecting a German slug because an English one already used
// that string. `costomSlugField({ localized: true })` does the per-locale check
// in a validate hook instead, which is the same trade-off Pages and Posts make.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "hubs" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "header_id" integer,
      "hide_header" boolean DEFAULT false,
      "footer_id" integer,
      "hide_footer" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "hubs_locales" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar,
      "intro" varchar,
      "meta_title" varchar,
      "meta_description" varchar,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "hubs_locales" DROP CONSTRAINT IF EXISTS "hubs_locales_parent_id_fk";
    ALTER TABLE "hubs_locales"
      ADD CONSTRAINT "hubs_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."hubs"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "hubs" DROP CONSTRAINT IF EXISTS "hubs_header_id_headers_id_fk";
    ALTER TABLE "hubs"
      ADD CONSTRAINT "hubs_header_id_headers_id_fk"
      FOREIGN KEY ("header_id") REFERENCES "public"."headers"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "hubs" DROP CONSTRAINT IF EXISTS "hubs_footer_id_footers_id_fk";
    ALTER TABLE "hubs"
      ADD CONSTRAINT "hubs_footer_id_footers_id_fk"
      FOREIGN KEY ("footer_id") REFERENCES "public"."footers"("id")
      ON DELETE set null ON UPDATE no action;

    -- One row per hub. \`key\` is what the code resolves against, so a duplicate
    -- would make "which record is Research?" ambiguous at runtime.
    CREATE UNIQUE INDEX IF NOT EXISTS "hubs_key_idx" ON "hubs" USING btree ("key");
    CREATE INDEX IF NOT EXISTS "hubs_header_idx" ON "hubs" USING btree ("header_id");
    CREATE INDEX IF NOT EXISTS "hubs_footer_idx" ON "hubs" USING btree ("footer_id");
    CREATE INDEX IF NOT EXISTS "hubs_updated_at_idx" ON "hubs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "hubs_created_at_idx" ON "hubs" USING btree ("created_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "hubs_locales_locale_parent_id_unique"
      ON "hubs_locales" USING btree ("_locale", "_parent_id");
    -- Not unique: slug uniqueness is per-locale and enforced in the validate
    -- hook, for the reason in the header comment.
    CREATE INDEX IF NOT EXISTS "hubs_slug_idx" ON "hubs_locales" USING btree ("slug");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "hubs_locales" CASCADE;
    DROP TABLE IF EXISTS "hubs" CASCADE;
  `)
}
