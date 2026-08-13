import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { capturePostPublication, revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import { parseApiContent } from './hooks/parseApiContent'
import { TableOfContents } from '../../blocks/TableOfContents/config'
import { AuthorBox } from '../../blocks/AuthorBox/config'
// import { FAQAccordion } from '../../blocks/FAQAccordion/config'
import { Citation } from '../../blocks/Citation/config'
import { ExpertQuote } from '../../blocks/ExpertQuote/config'
import { ComparisonTable } from '../../blocks/ComparisonTable/config'
import { KeyTakeaways } from '@/blocks/KeyTakeways/config'
import { FAQBlock } from '@/blocks/FAQ/config'
import { DataTableBlock } from '@/blocks/DataTable/config'
import { CtaBlock } from '@/blocks/CTA/config'
import { BulletListBlock } from '@/blocks/BulletList/config'

import { MetaImageField, OverviewField, PreviewField } from '@payloadcms/plugin-seo/fields'
import { costomSlugField } from '@/fields/slug'
import { isPublishedForActiveLocale } from '@/utilities/publishedLocaleAvailability'
import { seoOverridesField } from '@/fields/seoOverrides'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      maxLength: 70,
      admin: {
        description: 'Max 70 characters (recommended for SEO)',
        components: {
          afterInput: [
            {
              path: '/components/Payload/fields/RemainingCharacterCounter',
              exportName: 'RemainingCharacterCounter',
              clientProps: {
                path: 'title',
                maxLength: 70,
              },
            },
          ],
        },
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      required: false,
    },
    {
      name: 'focusKeywordReference',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '/components/Payload/fields/FocusKeywordPanel',
            exportName: 'FocusKeywordPanel',
          },
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'intro',
              type: 'richText',
              required: true,
              localized: true,
              label: 'Intro (2–3 paragraphs)',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                  ]
                },
              }),
              validate: (value: unknown, options: { data?: Record<string, unknown> }) => {
                if (options?.data?.source === 'api') return true
                if (!value) return 'This field is required.'
                return true
              },
              admin: {
                description:
                  'Write 2–3 introductory paragraphs. This appears before all content blocks.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              localized: true,
              label: 'Content',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({
                      blocks: [
                        Banner,
                        Code,
                        MediaBlock,
                        // TableOfContents,
                        AuthorBox,
                        // FAQAccordion,
                        Citation,
                        ExpertQuote,
                        // ComparisonTable,
                        KeyTakeaways,
                        FAQBlock,
                        DataTableBlock,
                        CtaBlock,
                        BulletListBlock,
                      ],
                    }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              required: true,
              validate: (value: unknown, { data }: { data?: Record<string, unknown> }) => {
                if (data?.source === 'api') return true
                if (!value) return 'This field is required.'
                return true
              },
            },
            {
              name: 'schemaMarkup',
              type: 'group',
              label: 'Structured Data',
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  defaultValue: 'Article',
                  options: [
                    { label: 'Article', value: 'Article' },
                    { label: 'TechArticle', value: 'TechArticle' },
                    { label: 'FAQPage', value: 'FAQPage' },
                  ],
                },
                {
                  name: 'headline',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'Optional. If empty, the post title will be used.',
                  },
                },
                {
                  name: 'faqItems',
                  type: 'array',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'FAQPage',
                  },
                  fields: [
                    { name: 'question', type: 'text', required: true, localized: true },
                    { name: 'answer', type: 'textarea', required: true, localized: true },
                  ],
                },
              ],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedArticles',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            {
              name: 'title',
              label: 'Meta title',
              type: 'text',
              required: true,
              maxLength: 60,
              admin: {
                description: 'SEO title tag. Max 60 characters. " | NB1" is added automatically.',
                components: {
                  afterInput: [
                    {
                      path: '/components/Payload/fields/RemainingCharacterCounter',
                      exportName: 'RemainingCharacterCounter',
                      clientProps: {
                        path: 'meta.title',
                        maxLength: 60,
                      },
                    },
                  ],
                },
              },
            },
            MetaImageField({
              relationTo: 'media',
            }),
            {
              name: 'description',
              label: 'Meta description',
              type: 'textarea',
              required: true,
              maxLength: 155,
              admin: {
                description: 'SEO meta description. Max 155 characters.',
                components: {
                  afterInput: [
                    {
                      path: '/components/Payload/fields/RemainingCharacterCounter',
                      exportName: 'RemainingCharacterCounter',
                      clientProps: {
                        path: 'meta.description',
                        maxLength: 155,
                      },
                    },
                  ],
                },
              },
            },
            seoOverridesField(),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'focusKeyword',
      type: 'text',
      maxLength: 100,
      admin: {
        position: 'sidebar',
        placeholder: 'e.g. gut health test',
        description:
          'Primary SEO keyword for this article. For editor reference only; not rendered on the frontend.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ req, siblingData, value }) => {
            if (isPublishedForActiveLocale(siblingData._status, req.locale) && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: { position: 'sidebar' },
      hasMany: true,
      relationTo: 'authors',
    },
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        { name: 'id', type: 'text' },
        { name: 'name', type: 'text' },
        { name: 'slug', type: 'text' },
        { name: 'credentials', type: 'text' },
        { name: 'avatarUrl', type: 'text' },
      ],
    },
    costomSlugField(),
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'API', value: 'api' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How this article was created.',
      },
    },
    {
      name: 'htmlContent',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Raw HTML from the content pipeline. Parsed automatically on save.',
        condition: (_, siblingData) => siblingData?.source === 'api',
      },
    },
  ],
  hooks: {
    beforeOperation: [capturePostPublication],
    beforeChange: [parseApiContent],
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      localizeStatus: true,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
