import { createHash } from 'node:crypto'

import type { PostgresAdapter } from '@payloadcms/db-postgres'
import {
  APIError,
  commitTransaction,
  initTransaction,
  killTransaction,
  type PayloadRequest,
} from 'payload'

export type AgentMutationTransaction = {
  active: boolean
  started: boolean
}

function advisoryLockID(actorID: number | string): string {
  const hex = createHash('sha256')
    .update(`agent-mutation:${String(actorID)}`)
    .digest('hex')
  return BigInt(`0x${hex.slice(0, 15)}`).toString()
}

/** Serialize quota/idempotency work per actor in the current Postgres transaction. */
export async function beginAgentMutationTransaction(
  req: PayloadRequest,
  actorID: number | string,
): Promise<AgentMutationTransaction> {
  const database = (req.payload as unknown as { db?: Partial<PostgresAdapter> }).db
  if (!database || typeof database.beginTransaction !== 'function') {
    // Lightweight unit adapters may not implement transactions. Production uses Postgres.
    return { active: false, started: false }
  }

  const inherited = Boolean(req.transactionID)
  const started = await initTransaction(req)
  if (!started && !inherited && !req.transactionID) {
    throw new APIError('Agent mutations require database transaction support.', 503)
  }

  try {
    const transactionID = await req.transactionID
    if (!transactionID) throw new APIError('Could not start an agent mutation transaction.', 500)

    // Postgres production requests serialize per actor. Small test adapters can still
    // exercise the transaction boundary without implementing adapter internals.
    if (typeof database.execute === 'function' && database.sessions) {
      const session = database.sessions[String(transactionID)]
      if (!session) throw new APIError('Could not start an agent mutation transaction.', 500)

      await database.execute({
        db: session.db,
        raw: `SELECT pg_advisory_xact_lock(${advisoryLockID(actorID)})`,
      })
    }
  } catch (error) {
    if (started) await killTransaction(req)
    throw error
  }
  return { active: true, started }
}

export async function commitAgentMutationTransaction(
  req: PayloadRequest,
  transaction: AgentMutationTransaction,
): Promise<void> {
  if (transaction.started) await commitTransaction(req)
}

export async function rollbackAgentMutationTransaction(
  req: PayloadRequest,
  transaction: AgentMutationTransaction,
): Promise<void> {
  if (transaction.started) await killTransaction(req)
}
