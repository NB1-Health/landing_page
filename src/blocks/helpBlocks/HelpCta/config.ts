import type { Block } from 'payload'

import { helpInlineEditor } from '../_shared/editors'

/**
 * The navy support banner that closes a help article. Reused verbatim from the
 * Library article template so the two families end the same way.
 */
export const HelpCtaBlock: Block = {
  slug: 'helpCta',
  interfaceName: 'HelpCtaBlock',
  dbName: 'hct',
  labels: { singular: 'Help: CTA Banner', plural: 'Help: CTA Banner Blocks' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'textarea', localized: true },
    {
      name: 'fine',
      label: 'Fine print',
      type: 'richText',
      localized: true,
      editor: helpInlineEditor,
      admin: { description: 'Optional small line under the body, e.g. a link to the Help centre.' },
    },
    { name: 'ctaLabel', type: 'text', localized: true, defaultValue: 'Contact support' },
    {
      name: 'ctaUrl',
      type: 'text',
      localized: true,
      defaultValue: '/contact',
      admin: { description: 'Site-relative, e.g. /contact.' },
    },
  ],
}
