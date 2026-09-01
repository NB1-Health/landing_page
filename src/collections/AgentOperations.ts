import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/roles'

/**
 * Server-written audit, idempotency, and bulk-plan records for agent mutations.
 * Agent tools intentionally bypass this collection's access control only when
 * writing their own derived audit data; clients never receive direct CRUD access.
 */
export const AgentOperations: CollectionConfig<'agent-operations'> = {
  slug: 'agent-operations',
  access: {
    admin: adminOnly,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['tool', 'status', 'actor', 'locale', 'updatedAt'],
    group: 'MCP',
    useAsTitle: 'tool',
  },
  fields: [
    {
      name: 'operationKey',
      type: 'text',
      admin: { hidden: true },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      admin: { readOnly: true },
      required: true,
    },
    {
      name: 'requestHash',
      type: 'text',
      admin: { readOnly: true },
      required: true,
    },
    {
      name: 'tool',
      type: 'text',
      admin: { readOnly: true },
      index: true,
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      admin: { readOnly: true },
      defaultValue: 'running',
      index: true,
      options: ['planned', 'running', 'succeeded', 'failed'],
      required: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      admin: { readOnly: true },
      index: true,
      relationTo: 'users',
      required: true,
    },
    {
      name: 'locale',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'targetCollection',
      type: 'select',
      admin: { readOnly: true },
      options: ['pages', 'posts', 'media'],
    },
    {
      name: 'targetIDs',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'plan',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'planHash',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'approvalStatus',
      type: 'select',
      defaultValue: 'not-required',
      options: ['not-required', 'pending', 'approved', 'rejected'],
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'result',
      type: 'json',
      admin: { readOnly: true },
    },
    {
      name: 'error',
      type: 'textarea',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
