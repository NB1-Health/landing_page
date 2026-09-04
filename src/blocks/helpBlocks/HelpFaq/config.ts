import type { Block } from 'payload'

import { helpInlineEditor } from '../_shared/editors'

/**
 * The "Common questions" accordion at the foot of a help article.
 *
 * Deliberately a separate block from `Refer — FAQ`: this one is the plain
 * divider list from the help template (hairline rows, teal ± toggle), sits in
 * the article's body column, and contributes its heading to the on-page nav
 * rail. `referFaq` is the two-column marketing treatment and should stay that.
 */
export const HelpFaqBlock: Block = {
  slug: 'helpFaq',
  interfaceName: 'HelpFaqBlock',
  dbName: 'hfq',
  labels: { singular: 'Help: Common Questions', plural: 'Help: Common Questions Blocks' },
  fields: [
    {
      name: 'reserveTocSpace',
      label: 'Leave room for the contents rail',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Keep this matched to the same setting on the Steps block above, so the two body columns line up.',
      },
    },
    { name: 'title', type: 'text', localized: true, defaultValue: 'Common questions' },
    {
      name: 'anchor',
      type: 'text',
      defaultValue: 'faq',
      admin: {
        description:
          'Anchor id for the heading, used by the contents rail. Not localized — keep links stable across locales.',
      },
    },
    {
      name: 'items',
      type: 'array',
      // dbName replaces the WHOLE table name in this adapter (see rff / prh /
      // cvr), so it must be fully qualified — a bare 'it' would create a
      // top-level table called "it", which also collides visually with the
      // Italian locale suffix.
      dbName: 'hfq_qs',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: { initCollapsed: true, description: 'Keep each answer to one short paragraph.' },
      fields: [
        { name: 'question', type: 'text', localized: true, required: true },
        {
          name: 'answer',
          type: 'richText',
          localized: true,
          required: true,
          editor: helpInlineEditor,
          admin: { description: 'One paragraph. Links are supported (e.g. "get in touch").' },
        },
      ],
    },
  ],
}
