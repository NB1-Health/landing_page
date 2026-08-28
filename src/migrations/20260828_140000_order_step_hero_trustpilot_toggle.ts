import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

// OrderStepHero gains `showTrustpilotRating`, the opt-in for the Trustpilot
// TrustBox that leads its trust-seal row — the same mechanism HomepageHero got in
// 20260819_120000. Non-localized boolean: the widget's localized source
// (data-locale, token, review host) is resolved in code from the page locale, so
// there is nothing per-locale to store.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_order_step_hero"
      ADD COLUMN IF NOT EXISTS "show_trustpilot_rating" boolean DEFAULT false;

    ALTER TABLE "_pages_v_blocks_order_step_hero"
      ADD COLUMN IF NOT EXISTS "show_trustpilot_rating" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_order_step_hero"
      DROP COLUMN IF EXISTS "show_trustpilot_rating";

    ALTER TABLE "_pages_v_blocks_order_step_hero"
      DROP COLUMN IF EXISTS "show_trustpilot_rating";
  `)
}
