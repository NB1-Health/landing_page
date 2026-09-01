import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/roles'

import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateSiteSettings],
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
    {
      name: 'journal',
      label: 'Journal index page',
      type: 'group',
      admin: {
        description:
          'Copy for the Journal hub at /journal. Every field is per-locale and optional — leave one empty and the built-in translation is used, so no locale can end up blank.',
      },
      fields: [
        {
          name: 'heroTitle',
          label: 'Hero headline',
          type: 'text',
          localized: true,
          admin: {
            description: 'The large headline at the top of the Journal index.',
          },
        },
        {
          name: 'heroLede',
          label: 'Hero lede',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'The paragraph under the headline. Two sentences at most.',
          },
        },
        {
          name: 'metaTitle',
          label: 'SEO title override',
          type: 'text',
          localized: true,
          maxLength: 60,
          admin: {
            description:
              'Optional. The <title> for /journal. Left empty, it is built from the hero headline. Max 60 characters.',
          },
        },
        {
          name: 'metaDescription',
          label: 'SEO description override',
          type: 'textarea',
          localized: true,
          maxLength: 155,
          admin: {
            description:
              'Optional. The meta description for /journal. Left empty, the hero lede is used. Max 155 characters.',
          },
        },
        {
          name: 'ctaHeading',
          label: 'Article CTA heading',
          type: 'text',
          localized: true,
          admin: {
            description: 'The panel that closes every article. Left empty, the built-in copy is used.',
          },
        },
        {
          name: 'ctaBody',
          label: 'Article CTA body',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'ctaLabel',
          label: 'Article CTA button label',
          type: 'text',
          localized: true,
        },
        {
          name: 'ctaUrl',
          label: 'Article CTA link',
          type: 'text',
          localized: true,
          admin: {
            description:
              'A site path such as /your-plan — the locale prefix is added automatically. A full https:// URL is used as-is. Per-locale, so markets can point at different pages.',
          },
        },
        {
          // Not localized, matching the Pages header/footer fields — those
          // documents carry their own localized content.
          name: 'header',
          label: 'Header',
          type: 'relationship',
          relationTo: 'headers',
          admin: {
            description:
              'Header for the Journal index and its paginated pages. Leave blank to use the site default. Individual articles have their own header field.',
          },
        },
        {
          name: 'hideHeader',
          label: 'Hide Header',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Do not render any header on the Journal index.',
          },
        },
        {
          name: 'footer',
          label: 'Footer',
          type: 'relationship',
          relationTo: 'footers',
          admin: {
            description:
              'Footer for the Journal index and its paginated pages. Leave blank to use the site default. Individual articles have their own footer field.',
          },
        },
        {
          name: 'hideFooter',
          label: 'Hide Footer',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Do not render any footer on the Journal index.',
          },
        },
      ],
    },
  ],
}
