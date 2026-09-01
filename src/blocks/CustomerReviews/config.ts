import type { Block } from 'payload'
import { makeHeadingEditor } from '@/fields/headingLexical'

export const CustomerReviewsBlock: Block = {
  slug: 'customerReviews',
  interfaceName: 'CustomerReviewsBlock',
  // Short dbName: the default (pages_blocks_customer_reviews_reviews_locales_...)
  // pushes the nested "reviews" array's locale index names past Postgres's
  // 63-char identifier limit.
  dbName: 'cvr',
  labels: {
    singular: 'Customer Reviews Carousel',
    plural: 'Customer Reviews Carousels',
  },
  fields: [
    {
      name: 'heading',
      type: 'richText',
      localized: true,
      editor: makeHeadingEditor(['h2']),
      admin: {
        description: 'Section heading, e.g. "Their own words." Renders as an <h2>.',
      },
    },
    {
      name: 'reviews',
      label: 'Reviews',
      labels: { singular: 'Review', plural: 'Reviews' },
      type: 'array',
      minRows: 1,
      localized: false,
      admin: {
        initCollapsed: true,
        description:
          'Add as many reviews as you need — the carousel scrolls horizontally and the progress bar adapts automatically. Every text field is per-locale; the photo is shared across locales.',
      },
      fields: [
        {
          name: 'quote',
          label: 'Pull Quote',
          type: 'text',
          localized: true,
          required: true,
          admin: {
            description:
              'The short headline quote at the top of the card, e.g. "A smarter way to understand your gut health." Include the quotation marks if the design calls for them.',
          },
        },
        {
          name: 'body',
          label: 'Review Text',
          type: 'textarea',
          localized: true,
          admin: {
            description:
              'The full review. Clamped to two lines on the card; a "See more" toggle appears automatically when it is longer.',
          },
        },
        {
          name: 'authorName',
          label: 'Reviewer Name',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'authorMeta',
          label: 'Reviewer Caption',
          type: 'text',
          localized: true,
          defaultValue: 'NB1 customer',
          admin: { description: 'Small uppercase line under the name, e.g. "NB1 customer".' },
        },
        {
          name: 'photo',
          label: 'Reviewer Photo',
          type: 'upload',
          relationTo: 'media',
          // Deliberately not localized — the same photo is used in every locale.
          admin: {
            description:
              'Optional. When empty, the initials below are shown inside the avatar circle instead.',
          },
        },
        {
          name: 'initials',
          label: 'Avatar Initials',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Fallback shown in the avatar when no photo is uploaded. Leave empty to derive it from the reviewer name.',
          },
        },
      ],
    },
    {
      name: 'seeMoreLabel',
      label: 'Label: See More',
      type: 'text',
      localized: true,
      defaultValue: 'See more',
    },
    {
      name: 'seeLessLabel',
      label: 'Label: See Less',
      type: 'text',
      localized: true,
      defaultValue: 'See less',
    },
    {
      name: 'prevAriaLabel',
      label: 'Aria Label: Previous',
      type: 'text',
      localized: true,
      defaultValue: 'Previous reviews',
    },
    {
      name: 'nextAriaLabel',
      label: 'Aria Label: Next',
      type: 'text',
      localized: true,
      defaultValue: 'Next reviews',
    },
    {
      name: 'railAriaLabel',
      label: 'Aria Label: Carousel',
      type: 'text',
      localized: true,
      defaultValue: 'Member reviews',
    },
  ],
}
