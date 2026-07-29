import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Plan Summary Card cycle enum: retire the 8-month option and add the 1-month
// standard, so the enum becomes ('1','4','12'). Postgres can't drop an enum
// value in place, so we cast the column to text, remap any stored '8' → '4'
// (the entry-level commit — closest surviving tier; adjust affected blocks by
// hand if a different mapping is wanted), recreate the type, and cast back.
// Default stays '4'.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" DROP DEFAULT;
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE text;
  UPDATE "pages_blocks_plan_summary_card" SET "cycle_month" = '4' WHERE "cycle_month" = '8';
  UPDATE "_pages_v_blocks_plan_summary_card" SET "cycle_month" = '4' WHERE "cycle_month" = '8';
  DROP TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month";
  DROP TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month";
  CREATE TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month" AS ENUM('1', '4', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month" AS ENUM('1', '4', '12');
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month" USING "cycle_month"::"public"."enum_pages_blocks_plan_summary_card_cycle_month";
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month" USING "cycle_month"::"public"."enum__pages_v_blocks_plan_summary_card_cycle_month";
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DEFAULT '4';
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DEFAULT '4';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" DROP DEFAULT;
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" DROP DEFAULT;
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE text;
  UPDATE "pages_blocks_plan_summary_card" SET "cycle_month" = '4' WHERE "cycle_month" = '1';
  UPDATE "_pages_v_blocks_plan_summary_card" SET "cycle_month" = '4' WHERE "cycle_month" = '1';
  DROP TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month";
  DROP TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month";
  CREATE TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month" AS ENUM('4', '8', '12');
  CREATE TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month" AS ENUM('4', '8', '12');
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE "public"."enum_pages_blocks_plan_summary_card_cycle_month" USING "cycle_month"::"public"."enum_pages_blocks_plan_summary_card_cycle_month";
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DATA TYPE "public"."enum__pages_v_blocks_plan_summary_card_cycle_month" USING "cycle_month"::"public"."enum__pages_v_blocks_plan_summary_card_cycle_month";
  ALTER TABLE "pages_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DEFAULT '4';
  ALTER TABLE "_pages_v_blocks_plan_summary_card" ALTER COLUMN "cycle_month" SET DEFAULT '4';`)
}
