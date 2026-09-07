import type { CollectionConfig, TextFieldValidation } from 'payload'

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { adminOnly, adminOrEditor } from '@/access/roles'
import { costomSlugField } from '@/fields/slug'
import { getInfluencerVideoEmbedURL } from '@/lib/influencerVideo'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'

const validateVideoURL: TextFieldValidation = (value) => {
  if (!value) return true
  return getInfluencerVideoEmbedURL(value) !== null || 'Use a valid HTTPS YouTube or Vimeo URL.'
}

export const InfluencerLandingPages: CollectionConfig = {
  slug: 'influencer-landing-pages',
  labels: {
    singular: 'Influencer landing page',
    plural: 'Influencer landing pages',
  },
  trash: true,
  access: {
    admin: adminOrEditor,
    create: adminOrEditor,
    delete: adminOnly,
    read: authenticatedOrPublished,
    readVersions: adminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: ['internalTitle', 'slug', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          collection: 'influencer-landing-pages',
          slug: data?.slug,
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        collection: 'influencer-landing-pages',
        slug: data?.slug as string,
        req,
      }),
    useAsTitle: 'internalTitle',
  },
  fields: [
    {
      name: 'internalTitle',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal label only. It is not shown on the public page.',
      },
    },
    costomSlugField({ from: 'internalTitle' }),
    {
      name: 'discountCode',
      type: 'text',
      required: true,
      admin: {
        description:
          'The canonical discount-code string. Eligibility and discount details remain owned by the checkout API.',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
        ],
      },
      validate: (value: string | null | undefined) =>
        typeof value !== 'string' || !/^[A-Z0-9_-]{1,64}$/.test(value)
          ? 'Use 1–64 letters, numbers, hyphens, or underscores.'
          : true,
    },
    {
      name: 'influencerName',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'handle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional social handle, including @ when wanted.',
      },
    },
    {
      name: 'heroHeadline',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Main headline. Use {name} to insert the influencer name.',
      },
    },
    {
      name: 'heroCopy',
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'giftQuote',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Short offer badge. Use {name} to insert the influencer name.',
      },
    },
    {
      name: 'testimonial',
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'testimonialAttribution',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'offerHeadline',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Final offer heading. Use {name} to insert the influencer name.',
      },
    },
    {
      name: 'offerCopy',
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'primaryImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'videoUrl',
      label: 'Video embed URL',
      type: 'text',
      validate: validateVideoURL,
      admin: {
        description:
          'Optional YouTube or Vimeo URL. The public page loads the privacy-reduced embed only after a visitor clicks play.',
      },
    },
  ],
  versions: {
    drafts: {
      autosave: { interval: 5000 },
      localizeStatus: true,
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
}
