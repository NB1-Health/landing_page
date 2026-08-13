import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { localizeStatus } from 'payload'

function migrationDB(db: MigrateUpArgs['db'], payload: MigrateUpArgs['payload']) {
  // Payload 3.82's helper expects the adapter execute wrapper plus the active
  // transaction as `drizzle`; this keeps every statement in this migration.
  return { drizzle: db, execute: payload.db.execute }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const statusDB = migrationDB(db, payload)
  await localizeStatus.up({ collectionSlug: 'pages', db: statusDB, payload, req, sql })
  await localizeStatus.up({ collectionSlug: 'posts', db: statusDB, payload, req, sql })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Payload requires localizeStatus to be disabled in config before rollback.
  const statusDB = migrationDB(db, payload)
  await localizeStatus.down({ collectionSlug: 'posts', db: statusDB, payload, req, sql })
  await localizeStatus.down({ collectionSlug: 'pages', db: statusDB, payload, req, sql })
}
