import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { localizeStatus } from 'payload'

type PublicationCollection = 'pages' | 'posts'
type PublicationStatus = 'draft' | 'published'

function migrationDB(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload']) {
  // Payload 3.82's helper expects the adapter execute wrapper plus the active
  // transaction as `drizzle`; this keeps every statement in this migration.
  return { drizzle: db, execute: payload.db.execute }
}

async function readLegacyStatuses(
  db: MigrateUpArgs['db'],
  collection: PublicationCollection,
): Promise<Map<number | string, PublicationStatus>> {
  const { rows } = await db.execute(sql`
    SELECT id, COALESCE(_status::text, 'draft') AS status
    FROM ${sql.identifier(collection)}
  `)

  return new Map(
    rows.map((row) => [
      row.id as number | string,
      row.status === 'published' ? 'published' : 'draft',
    ]),
  )
}

async function restoreLegacyStatuses(
  db: MigrateUpArgs['db'],
  collection: PublicationCollection,
  statuses: Map<number | string, PublicationStatus>,
): Promise<void> {
  for (const [id, status] of statuses) {
    await db.execute(sql`
      UPDATE ${sql.identifier(`${collection}_locales`)}
      SET _status = ${status}
      WHERE _parent_id = ${id}
    `)
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const statusDB = migrationDB(db, payload)

  for (const collection of ['pages', 'posts'] as const) {
    // The legacy main row remains published when a newer autosave draft exists.
    // Payload's helper migrates version history correctly, but derives the new
    // main status from that draft, so retain the live main-row boundary here.
    const legacyStatuses = await readLegacyStatuses(db, collection)
    await localizeStatus.up({ collectionSlug: collection, db: statusDB, payload, req, sql })
    await restoreLegacyStatuses(db, collection, legacyStatuses)
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Payload requires localizeStatus to be disabled in config before rollback.
  const statusDB = migrationDB(db, payload)
  await localizeStatus.down({ collectionSlug: 'posts', db: statusDB, payload, req, sql })
  await localizeStatus.down({ collectionSlug: 'pages', db: statusDB, payload, req, sql })
}
