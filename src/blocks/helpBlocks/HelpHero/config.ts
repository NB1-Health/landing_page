import type { Block } from 'payload'

/**
 * Article header: optional "also read" link to a sibling article, eyebrow, h1,
 * one-sentence dek, and an optional hero photo underneath.
 *
 * The heading is plain text rather than a rich-text field on purpose — the help
 * template deliberately matches the Library article's sober look and does not
 * take the coloured-phrase emphasis the marketing heroes use.
 */
export const HelpHeroBlock: Block = {
  slug: 'helpHero',
  interfaceName: 'HelpHeroBlock',
  dbName: 'hhr',
  labels: { singular: 'Help: Article Header', plural: 'Help: Article Header Blocks' },
  fields: [
    {
      name: 'alsoRead',
      label: 'Also read',
      type: 'group',
      admin: {
        description: 'Link to a sibling article. Leave the link text empty to hide the whole row.',
      },
      fields: [
        { name: 'tag', type: 'text', localized: true, defaultValue: 'Also read' },
        { name: 'label', label: 'Link text', type: 'text', localized: true },
        {
          name: 'url',
          label: 'Link URL',
          type: 'text',
          localized: true,
          admin: { description: 'Site-relative, e.g. /help/how-to-use-your-blood-kit.' },
        },
      ],
    },
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: { description: 'Optional small teal label above the title, e.g. "Kit instructions".' },
    },
    { name: 'heading', type: 'text', localized: true, required: true },
    {
      name: 'dek',
      type: 'textarea',
      localized: true,
      admin: { description: 'One sentence. What the reader is about to do, and roughly how long it takes.' },
    },
    {
      name: 'image',
      label: 'Hero image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. Use this OR the intro photo on the Steps block, not both — a labelled product photo above step 1 usually does the job on its own.',
      },
    },
    { name: 'imageCaption', type: 'text', localized: true },
  ],
}
