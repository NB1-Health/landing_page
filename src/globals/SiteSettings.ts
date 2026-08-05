import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/roles'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'organizationJsonLd',
      label: 'Organization JSON-LD',
      type: 'json',
      admin: {
        description:
          'Site-wide Organization structured data (JSON-LD). Paste a JSON object. Example: @context, @type, name, url, logo, sameAs.',
      },
      validate: (val) => {
        if (!val) return true
        if (typeof val !== 'object') return 'Must be a JSON object (not a string).'

        const v = val as Record<string, unknown>
        if (!('@context' in v)) return 'Missing "@context" (usually "https://schema.org").'
        if (!('@type' in v)) return 'Missing "@type" (usually "Organization").'

        return true
      },
    },
  ],
}
