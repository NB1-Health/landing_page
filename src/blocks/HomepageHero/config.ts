import type { Block } from 'payload'
import { makeHeadingEditor, inlineRichTextEditor } from '@/fields/headingLexical'


export const HomepageHeroBlock: Block = {
  slug: 'homepageHero',
  interfaceName: 'HomepageHeroBlock',
  fields: [
    {
      name: 'heading',
      type: 'richText',
      localized: true,
      editor: makeHeadingEditor(),
    },
    {
      name: 'subheading',
      type: 'text',
      localized: true,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'ctaHref',
      type: 'text',
      localized: true,
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'backgroundImageMobile',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'showTrustpilotRating',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Lead the trust strip with the live Trustpilot rating. The localized widget source is resolved from the page locale in code. Intended to replace the starred "Loved by early access members" trust item below.',
      },
    },
    {
      name: 'trustItems',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
        {
          name: 'showStars',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
