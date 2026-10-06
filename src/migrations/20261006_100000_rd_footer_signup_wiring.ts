import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Wire the redesign footer's sign-up box: five new columns.
 *
 * WHAT GOES WHERE, and why the split is not arbitrary. Payload puts localized
 * fields on `<collection>_locales` and unlocalized ones on the collection table
 * itself, so this touches two tables:
 *
 *   rd_footers_locales   klaviyo_list_id, signup_sending, signup_success,
 *                        signup_error            -- localized text
 *   rd_footers           form_id                 -- relationship, one per doc
 *
 * `klaviyo_list_id` IS LOCALIZED, deliberately. The old site footer ran nine
 * locales on two Klaviyo forms (`TPTv44`, and `SadZpb` for de) because the ids
 * were a ternary inside a component — a limit of where they lived, not a
 * decision anyone made. A column on the locales table lets each locale have its
 * own list, or share one by being given the same value.
 *
 * NOT A FORM ID. The values that belong here are LIST ids from Klaviyo. The
 * old footer's form ids will not work against the client subscriptions
 * endpoint, so this column starts empty everywhere rather than being
 * back-filled with them — and an empty value means the footer behaves exactly
 * as it did before this migration: submit prevented, nothing sent.
 *
 * `form_id` mirrors `footers.form` — the Payload Form Builder relationship the
 * site footer already uses to log a copy of each address and to carry the
 * redirect setting. ON DELETE SET NULL rather than CASCADE: deleting a form
 * should cost the footer its logging, not the footer.
 *
 * The three message columns are back-filled with English so no footer renders
 * a blank status line if it is wired before someone translates them. Nine
 * locales get the same string; that is a visible prompt to translate, which an
 * empty cell is not.
 *
 * `rd_footers` is NOT versioned — there is no `_rd_footers_v` — so unlike a
 * page block this is one table per concern, with no version twin to keep in
 * step. Checked against the collection's own config, which sets no `versions`.
 *
 * Names and shapes were copied from the DDL rather than guessed: the FK and
 * index follow `footers_form_id_forms_id_fk` / `footers_form_idx` verbatim with
 * the table swapped, and `rd_footers_locales` already holds `signup_label`,
 * `signup_note` and the rest as `varchar`, which is what the four new columns
 * match.
 *
 * Idempotent: IF NOT EXISTS / IF EXISTS throughout, and the UPDATEs are guarded
 * on IS NULL so re-running cannot overwrite a translation.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "rd_footers_locales" ADD COLUMN IF NOT EXISTS "klaviyo_list_id" varchar;
  ALTER TABLE "rd_footers_locales" ADD COLUMN IF NOT EXISTS "signup_sending" varchar;
  ALTER TABLE "rd_footers_locales" ADD COLUMN IF NOT EXISTS "signup_success" varchar;
  ALTER TABLE "rd_footers_locales" ADD COLUMN IF NOT EXISTS "signup_error" varchar;

  UPDATE "rd_footers_locales"
     SET "signup_sending" = 'Signing you up…'
   WHERE "signup_sending" IS NULL;
  UPDATE "rd_footers_locales"
     SET "signup_success" = 'You''re on the list. Check your inbox to confirm.'
   WHERE "signup_success" IS NULL;
  UPDATE "rd_footers_locales"
     SET "signup_error" = 'That didn''t go through. Please try again.'
   WHERE "signup_error" IS NULL;

  ALTER TABLE "rd_footers" ADD COLUMN IF NOT EXISTS "form_id" integer;

  DO $$ BEGIN
   ALTER TABLE "rd_footers" ADD CONSTRAINT "rd_footers_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "rd_footers_form_idx" ON "rd_footers" USING btree ("form_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "rd_footers_form_idx";
  ALTER TABLE "rd_footers" DROP CONSTRAINT IF EXISTS "rd_footers_form_id_forms_id_fk";
  ALTER TABLE "rd_footers" DROP COLUMN IF EXISTS "form_id";

  ALTER TABLE "rd_footers_locales" DROP COLUMN IF EXISTS "klaviyo_list_id";
  ALTER TABLE "rd_footers_locales" DROP COLUMN IF EXISTS "signup_sending";
  ALTER TABLE "rd_footers_locales" DROP COLUMN IF EXISTS "signup_success";
  ALTER TABLE "rd_footers_locales" DROP COLUMN IF EXISTS "signup_error";`)
}
