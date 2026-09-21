import type { Block } from 'payload'

import { helpBodyEditor } from '../_shared/editors'

/**
 * A standalone callout panel in the article's body column — the same box the
 * Steps block renders inside a step, but placed between blocks instead.
 *
 * Two jobs on the kit-instruction pages, and it is the same block both times:
 *
 *   - "Before you start" — sits between the header and the steps, no rail entry.
 *   - "What to never do" — sits between the steps and the questions, and DOES
 *     get a rail entry, so its heading is an `h2` carrying `data-help-heading`.
 *
 * "Show in the contents rail" is what switches between those: it decides both
 * the heading tag and whether the rail picks the heading up. The heading looks
 * the same either way — a short line at callout size, not a section title.
 */
export const HelpCalloutBlock: Block = {
  slug: 'helpCallout',
  interfaceName: 'HelpCalloutBlock',
  // Short dbName for the same reason as the rest of the kit: the default
  // (pages_blocks_help_callout_...) leaves no room under Postgres's
  // 63-character identifier limit once locale index suffixes are appended.
  dbName: 'hcl',
  labels: { singular: 'Help: Callout', plural: 'Help: Callout Blocks' },
  fields: [
    {
      name: 'reserveTocSpace',
      label: 'Leave room for the contents rail',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Keep this matched to the same setting on the Steps block, so the body columns line up.',
      },
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info (teal)', value: 'info' },
        { label: 'Quiet (grey)', value: 'quiet' },
      ],
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: { description: 'A short line, e.g. "Before you start". Leave empty for a bare panel.' },
    },
    {
      name: 'showInNav',
      label: 'Show in the contents rail',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'On for a panel the reader should be able to jump to ("What to never do"). Off for an aside that only makes sense where it sits ("Before you start"). Needs a heading.',
      },
    },
    {
      name: 'anchor',
      type: 'text',
      admin: {
        description:
          'Anchor id for the heading, used by the contents rail and by links pointing at it (e.g. never). Defaults to a slug of the heading. Not localized — keep links stable across locales.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      required: true,
      editor: helpBodyEditor,
      admin: {
        description:
          'One short paragraph, or a bulleted list. Links are supported — pointing at a step on the same page works too (#step-4).',
      },
    },
  ],
}
