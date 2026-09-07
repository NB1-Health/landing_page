import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Localize the three upload fields in the help-article kit:
//   helpHero.image, helpSteps.introImage, helpSteps.steps[].media
//
// A localized upload column moves out of the block table into its `_locales`
// sibling. Two naming details, taken from the existing schema (pages.meta.image
// is the precedent) rather than guessed:
//   - the FK is renamed to the locales table: hhr_locales_image_id_media_id_fk
//   - the INDEX keeps its base-table-prefixed name (hhr_image_idx) and simply
//     moves to the locales table
//
// Existing values are carried over into the `en` row before the old column is
// dropped, so seeded images survive. Other locales start empty and fall back to
// nothing — set them per locale in the CMS.
//
// Hand-written for the same reason as 20260904_120000_help_article_blocks: the
// schema snapshot in this folder is stale, so `migrate:create` re-emits drift.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- hhr.image_id -> hhr_locales.image_id
  ALTER TABLE "hhr_locales" ADD COLUMN "image_id" integer;

  UPDATE "hhr_locales" l SET "image_id" = b."image_id"
    FROM "hhr" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."image_id" IS NOT NULL;

  INSERT INTO "hhr_locales" ("_locale", "_parent_id", "image_id")
    SELECT 'en', b."id", b."image_id" FROM "hhr" b
    WHERE b."image_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "hhr_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "hhr_image_idx";
  ALTER TABLE "hhr" DROP CONSTRAINT IF EXISTS "hhr_image_id_media_id_fk";
  ALTER TABLE "hhr" DROP COLUMN "image_id";

  ALTER TABLE "hhr_locales" ADD CONSTRAINT "hhr_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hhr_image_idx" ON "hhr_locales" USING btree ("image_id");

  -- _hhr_v.image_id -> _hhr_v_locales.image_id
  ALTER TABLE "_hhr_v_locales" ADD COLUMN "image_id" integer;

  UPDATE "_hhr_v_locales" l SET "image_id" = b."image_id"
    FROM "_hhr_v" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."image_id" IS NOT NULL;

  INSERT INTO "_hhr_v_locales" ("_locale", "_parent_id", "image_id")
    SELECT 'en', b."id", b."image_id" FROM "_hhr_v" b
    WHERE b."image_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "_hhr_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "_hhr_v_image_idx";
  ALTER TABLE "_hhr_v" DROP CONSTRAINT IF EXISTS "_hhr_v_image_id_media_id_fk";
  ALTER TABLE "_hhr_v" DROP COLUMN "image_id";

  ALTER TABLE "_hhr_v_locales" ADD CONSTRAINT "_hhr_v_locales_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hhr_v_image_idx" ON "_hhr_v_locales" USING btree ("image_id");

  -- hst.intro_image_id -> hst_locales.intro_image_id
  ALTER TABLE "hst_locales" ADD COLUMN "intro_image_id" integer;

  UPDATE "hst_locales" l SET "intro_image_id" = b."intro_image_id"
    FROM "hst" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."intro_image_id" IS NOT NULL;

  INSERT INTO "hst_locales" ("_locale", "_parent_id", "intro_image_id")
    SELECT 'en', b."id", b."intro_image_id" FROM "hst" b
    WHERE b."intro_image_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "hst_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "hst_intro_image_idx";
  ALTER TABLE "hst" DROP CONSTRAINT IF EXISTS "hst_intro_image_id_media_id_fk";
  ALTER TABLE "hst" DROP COLUMN "intro_image_id";

  ALTER TABLE "hst_locales" ADD CONSTRAINT "hst_locales_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hst_intro_image_idx" ON "hst_locales" USING btree ("intro_image_id");

  -- _hst_v.intro_image_id -> _hst_v_locales.intro_image_id
  ALTER TABLE "_hst_v_locales" ADD COLUMN "intro_image_id" integer;

  UPDATE "_hst_v_locales" l SET "intro_image_id" = b."intro_image_id"
    FROM "_hst_v" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."intro_image_id" IS NOT NULL;

  INSERT INTO "_hst_v_locales" ("_locale", "_parent_id", "intro_image_id")
    SELECT 'en', b."id", b."intro_image_id" FROM "_hst_v" b
    WHERE b."intro_image_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "_hst_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "_hst_v_intro_image_idx";
  ALTER TABLE "_hst_v" DROP CONSTRAINT IF EXISTS "_hst_v_intro_image_id_media_id_fk";
  ALTER TABLE "_hst_v" DROP COLUMN "intro_image_id";

  ALTER TABLE "_hst_v_locales" ADD CONSTRAINT "_hst_v_locales_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hst_v_intro_image_idx" ON "_hst_v_locales" USING btree ("intro_image_id");

  -- hst_st.media_id -> hst_st_locales.media_id
  ALTER TABLE "hst_st_locales" ADD COLUMN "media_id" integer;

  UPDATE "hst_st_locales" l SET "media_id" = b."media_id"
    FROM "hst_st" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."media_id" IS NOT NULL;

  INSERT INTO "hst_st_locales" ("_locale", "_parent_id", "media_id")
    SELECT 'en', b."id", b."media_id" FROM "hst_st" b
    WHERE b."media_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "hst_st_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "hst_st_media_idx";
  ALTER TABLE "hst_st" DROP CONSTRAINT IF EXISTS "hst_st_media_id_media_id_fk";
  ALTER TABLE "hst_st" DROP COLUMN "media_id";

  ALTER TABLE "hst_st_locales" ADD CONSTRAINT "hst_st_locales_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hst_st_media_idx" ON "hst_st_locales" USING btree ("media_id");

  -- _hst_st_v.media_id -> _hst_st_v_locales.media_id
  ALTER TABLE "_hst_st_v_locales" ADD COLUMN "media_id" integer;

  UPDATE "_hst_st_v_locales" l SET "media_id" = b."media_id"
    FROM "_hst_st_v" b
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND b."media_id" IS NOT NULL;

  INSERT INTO "_hst_st_v_locales" ("_locale", "_parent_id", "media_id")
    SELECT 'en', b."id", b."media_id" FROM "_hst_st_v" b
    WHERE b."media_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "_hst_st_v_locales" l WHERE l."_parent_id" = b."id" AND l."_locale" = 'en'
      );

  DROP INDEX IF EXISTS "_hst_st_v_media_idx";
  ALTER TABLE "_hst_st_v" DROP CONSTRAINT IF EXISTS "_hst_st_v_media_id_media_id_fk";
  ALTER TABLE "_hst_st_v" DROP COLUMN "media_id";

  ALTER TABLE "_hst_st_v_locales" ADD CONSTRAINT "_hst_st_v_locales_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hst_st_v_media_idx" ON "_hst_st_v_locales" USING btree ("media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- hhr_locales.image_id -> hhr.image_id
  ALTER TABLE "hhr" ADD COLUMN "image_id" integer;

  UPDATE "hhr" b SET "image_id" = l."image_id"
    FROM "hhr_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."image_id" IS NOT NULL;

  DROP INDEX IF EXISTS "hhr_image_idx";
  ALTER TABLE "hhr_locales" DROP CONSTRAINT IF EXISTS "hhr_locales_image_id_media_id_fk";
  ALTER TABLE "hhr_locales" DROP COLUMN "image_id";

  ALTER TABLE "hhr" ADD CONSTRAINT "hhr_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hhr_image_idx" ON "hhr" USING btree ("image_id");

  -- _hhr_v_locales.image_id -> _hhr_v.image_id
  ALTER TABLE "_hhr_v" ADD COLUMN "image_id" integer;

  UPDATE "_hhr_v" b SET "image_id" = l."image_id"
    FROM "_hhr_v_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."image_id" IS NOT NULL;

  DROP INDEX IF EXISTS "_hhr_v_image_idx";
  ALTER TABLE "_hhr_v_locales" DROP CONSTRAINT IF EXISTS "_hhr_v_locales_image_id_media_id_fk";
  ALTER TABLE "_hhr_v_locales" DROP COLUMN "image_id";

  ALTER TABLE "_hhr_v" ADD CONSTRAINT "_hhr_v_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hhr_v_image_idx" ON "_hhr_v" USING btree ("image_id");

  -- hst_locales.intro_image_id -> hst.intro_image_id
  ALTER TABLE "hst" ADD COLUMN "intro_image_id" integer;

  UPDATE "hst" b SET "intro_image_id" = l."intro_image_id"
    FROM "hst_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."intro_image_id" IS NOT NULL;

  DROP INDEX IF EXISTS "hst_intro_image_idx";
  ALTER TABLE "hst_locales" DROP CONSTRAINT IF EXISTS "hst_locales_intro_image_id_media_id_fk";
  ALTER TABLE "hst_locales" DROP COLUMN "intro_image_id";

  ALTER TABLE "hst" ADD CONSTRAINT "hst_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hst_intro_image_idx" ON "hst" USING btree ("intro_image_id");

  -- _hst_v_locales.intro_image_id -> _hst_v.intro_image_id
  ALTER TABLE "_hst_v" ADD COLUMN "intro_image_id" integer;

  UPDATE "_hst_v" b SET "intro_image_id" = l."intro_image_id"
    FROM "_hst_v_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."intro_image_id" IS NOT NULL;

  DROP INDEX IF EXISTS "_hst_v_intro_image_idx";
  ALTER TABLE "_hst_v_locales" DROP CONSTRAINT IF EXISTS "_hst_v_locales_intro_image_id_media_id_fk";
  ALTER TABLE "_hst_v_locales" DROP COLUMN "intro_image_id";

  ALTER TABLE "_hst_v" ADD CONSTRAINT "_hst_v_intro_image_id_media_id_fk" FOREIGN KEY ("intro_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hst_v_intro_image_idx" ON "_hst_v" USING btree ("intro_image_id");

  -- hst_st_locales.media_id -> hst_st.media_id
  ALTER TABLE "hst_st" ADD COLUMN "media_id" integer;

  UPDATE "hst_st" b SET "media_id" = l."media_id"
    FROM "hst_st_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."media_id" IS NOT NULL;

  DROP INDEX IF EXISTS "hst_st_media_idx";
  ALTER TABLE "hst_st_locales" DROP CONSTRAINT IF EXISTS "hst_st_locales_media_id_media_id_fk";
  ALTER TABLE "hst_st_locales" DROP COLUMN "media_id";

  ALTER TABLE "hst_st" ADD CONSTRAINT "hst_st_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hst_st_media_idx" ON "hst_st" USING btree ("media_id");

  -- _hst_st_v_locales.media_id -> _hst_st_v.media_id
  ALTER TABLE "_hst_st_v" ADD COLUMN "media_id" integer;

  UPDATE "_hst_st_v" b SET "media_id" = l."media_id"
    FROM "_hst_st_v_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en' AND l."media_id" IS NOT NULL;

  DROP INDEX IF EXISTS "_hst_st_v_media_idx";
  ALTER TABLE "_hst_st_v_locales" DROP CONSTRAINT IF EXISTS "_hst_st_v_locales_media_id_media_id_fk";
  ALTER TABLE "_hst_st_v_locales" DROP COLUMN "media_id";

  ALTER TABLE "_hst_st_v" ADD CONSTRAINT "_hst_st_v_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "_hst_st_v_media_idx" ON "_hst_st_v" USING btree ("media_id");
  `)
}
