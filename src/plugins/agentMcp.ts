import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { UnauthorizedError, type Field, type Plugin } from 'payload'

import { isAdmin, isAgentEditor } from '@/access/roles'
import { agentMcpTools } from '@/mcp/tools'

type MCPOptions = Parameters<typeof mcpPlugin>[0]

function defaultToolsOff(fields: Field[]): Field[] {
  fields.forEach((field) => {
    if ('name' in field && field.name === 'payload-mcp-tool' && 'fields' in field) {
      field.fields.forEach((toolField) => {
        if (toolField.type === 'checkbox') toolField.defaultValue = false
      })
      return
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      defaultToolsOff(field.fields)
    }
  })
  return fields
}

export const agentMcpOptions: MCPOptions = {
  // Generic collection/global tools are intentionally absent. This prevents
  // arbitrary bulk update, live publishing, and permanent delete operations.
  collections: {},
  disabled: false,
  globals: {},
  mcp: {
    handlerOptions: {
      disableSse: true,
      maxDuration: 60,
      verboseLogs: false,
    },
    serverOptions: {
      serverInfo: {
        name: 'NB1 Content MCP',
        version: '1.0.0',
      },
    },
    tools: agentMcpTools,
  },
  overrideApiKeyCollection: (collection) => ({
    ...collection,
    access: {
      admin: ({ req }) => isAdmin(req.user),
      create: ({ req }) => isAdmin(req.user),
      delete: ({ req }) => isAdmin(req.user),
      read: ({ req }) => isAdmin(req.user),
      update: ({ req }) => isAdmin(req.user),
    },
    admin: {
      ...collection.admin,
      description:
        'Admin-managed MCP keys. Enable only the tools needed, set an owner, and rotate before expiry.',
      group: 'MCP',
    },
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        index: true,
        required: true,
      },
      {
        name: 'expiresAt',
        type: 'date',
        admin: {
          date: { pickerAppearance: 'dayAndTime' },
          description: 'Keys are rejected after this time. The default is 90 days.',
        },
        defaultValue: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        index: true,
        required: true,
      },
      ...defaultToolsOff(collection.fields),
    ],
  }),
  overrideAuth: async (req, getDefaultMcpAccessSettings) => {
    const settings = await getDefaultMcpAccessSettings()
    const key = settings as typeof settings & { enabled?: unknown; expiresAt?: unknown }
    const expiresAt = typeof key.expiresAt === 'string' ? Date.parse(key.expiresAt) : Number.NaN

    if (key.enabled !== true || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new UnauthorizedError()
    }
    if (!isAgentEditor(settings.user)) throw new UnauthorizedError()

    // Payload's v3.82 MCP plugin resolves the key owner but does not attach it
    // to custom-tool requests. Local API access control depends on req.user.
    req.user = settings.user
    return settings
  },
  userCollection: 'users',
}

export const agentMcpPlugin: Plugin = mcpPlugin(agentMcpOptions)
