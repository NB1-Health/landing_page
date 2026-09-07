import type { Block } from 'payload'

/**
 * The sticky "On this page" rail from the help-article mockup.
 *
 * It has no content of its own beyond a label: the list is built in the browser
 * from the step headings rendered by the `Help: Steps` and `Help: Common
 * Questions` blocks on the same page. Place this block anywhere in the layout
 * (conventionally right after `Help: Article Header`) — it renders no box in the
 * document flow, so its position in the block list does not move anything.
 */
export const HelpNavBlock: Block = {
  slug: 'helpNav',
  interfaceName: 'HelpNavBlock',
  // Short dbName, matching the convention used by the other long-named blocks:
  // the default (pages_blocks_help_nav_...) leaves little room under Postgres's
  // 63-character identifier limit once locale index suffixes are appended.
  dbName: 'hnv',
  labels: { singular: 'Help: On-page Nav', plural: 'Help: On-page Nav Blocks' },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      defaultValue: 'On this page',
      admin: { description: 'Heading above the contents list. Also its accessible name.' },
    },
    {
      name: 'minHeadings',
      label: 'Minimum headings',
      type: 'number',
      defaultValue: 2,
      min: 1,
      max: 12,
      admin: {
        description:
          'The rail stays hidden unless the page has at least this many step headings — a one-step article does not need a contents list.',
      },
    },
  ],
}
