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
import { ComplianceNote } from '@/blocks/ComplianceNote/config'

import { MetaImageField, OverviewField, PreviewField } from '@payloadcms/plugin-seo/fields'
import { costomSlugField } from '@/fields/slug'
import {
  authorsField,
  chromeFields,
  noindexField,
  publishedAtField,
  reviewerField,
} from '@/fields/contentDocument'
import { seoOverridesField } from '@/fields/seoOverrides'
import { enforceSingleFeatured } from './hooks/enforceSingleFeatured'
import { requiredOnPublish } from './hooks/requiredOnPublish'
import { estimateReadTime } from '@/utilities/countLexicalWords'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // Everything a Journal card needs, so index / related-post queries can stay
  // at depth 1 instead of pulling whole documents.
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    primaryCategory: true,
    excerpt: true,
    readTime: true,
    heroImage: true,
    featured: true,
    publishedAt: true,
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
      // The brief calls this the "standfirst" (dek). Kept as `subtitle` so no
      // migration or existing content is disturbed — only the label changes.
      name: 'subtitle',
      type: 'text',
      label: 'Standfirst (dek)',
      localized: true,
      required: false,
      admin: {
        description:
          'One or two sentences under the title that expand on it and earn the click. May differ from the excerpt.',
      },
      validate: requiredOnPublish('Standfirst'),
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
              admin: {
                description:
                  'Cover image. Drives the Journal card thumbnail, the article hero and the Open Graph image. Alt text lives on the media item itself. Recommended 1600x800 (2:1); the card crops to 16:10.',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              maxLength: 160,
              label: 'Excerpt (card summary)',
              admin: {
                description:
                  'Plain summary with the primary keyword, max 160 characters. Shown on the Journal card, and used for the meta description when that is left empty.',
                components: {
                  afterInput: [
                    {
                      path: '/components/Payload/fields/RemainingCharacterCounter',
                      exportName: 'RemainingCharacterCounter',
                      clientProps: {
                        path: 'excerpt',
                        maxLength: 160,
                      },
                    },
                  ],
                },
              },
              validate: requiredOnPublish('Excerpt'),
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
                    // Exactly one h1 per page, and that is the title. The
                    // template styles h2/h3 only, and the table of contents is
                    // built from h2s, so deeper levels have nowhere to render.
                    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
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
                        ComplianceNote,
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
              name: 'references',
              type: 'array',
              label: 'References',
              admin: {
                description:
                  'Rendered as the numbered "References" list at the foot of the article. Cite primary sources and link out where possible.',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'citation',
                  type: 'text',
                  required: true,
                  // The rows themselves are shared across locales so the agency
                  // enters each source once; only the rendered text is
                  // translatable.
                  localized: true,
                  admin: {
                    description: 'Author(s). Title. Journal or source, year.',
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: {
                    description: 'Optional URL or DOI.',
                  },
                },
              ],
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
              name: 'primaryCategory',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: false,
              admin: {
                position: 'sidebar',
                description:
                  'The single primary category. Drives the card label, the breadcrumb, the topic filter chip and article:section. Use "Categories" below for secondary topics.',
              },
              validate: requiredOnPublish('Primary category'),
            },
            {
              name: 'categories',
              type: 'relationship',
              label: 'Categories (secondary topics)',
              admin: {
                position: 'sidebar',
                description: 'Optional secondary topics, used for related-article matching.',
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
              hooks: {
                // MUST be beforeValidate, not beforeChange. Field `beforeChange`
                // runs *after* validation, so a value produced there cannot
                // satisfy `required: true` — the save would still be rejected
                // for an empty description. `beforeValidate` runs first, which is
                // also why the slug field uses it to derive from the title.
                beforeValidate: [
                  ({ data, originalDoc, value }) => {
                    if (typeof value === 'string' && value.trim()) return value

                    // Fall back to the excerpt so the agency writes the summary
                    // once. On a partial update (autosave sends only changed
                    // fields) the excerpt may be absent from `data` while still
                    // present on the stored document.
                    const incoming = (data as Record<string, unknown> | undefined)?.excerpt
                    const stored = (originalDoc as Record<string, unknown> | undefined)?.excerpt
                    const excerpt = typeof incoming === 'string' ? incoming : stored

                    if (typeof excerpt !== 'string' || !excerpt.trim()) return value

                    // The excerpt allows 160 characters and this field caps at
                    // 155, so trim at a word boundary rather than overflowing.
                    const trimmed = excerpt.trim()
                    if (trimmed.length <= 155) return trimmed

                    const cut = trimmed.slice(0, 155)
                    const lastSpace = cut.lastIndexOf(' ')
                    return lastSpace > 100 ? cut.slice(0, lastSpace) : cut
                  },
                ],
              },
              admin: {
                description:
                  'SEO meta description. Max 155 characters. Left empty, it is generated from the excerpt.',
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
    publishedAtField(),
    authorsField(),
    reviewerField(),
    {
      name: 'readTime',
      type: 'number',
      min: 1,
      localized: true,
      label: 'Read time (minutes)',
      admin: {
        position: 'sidebar',
        description:
          'Filled automatically from the word count when left empty. Type a value to override it, or clear the field to recalculate on the next save.',
      },
      hooks: {
        beforeChange: [
          ({ data, value }) => {
            // Same convention as `publishedAt` below and the slug field: only
            // compute when the editor has not supplied a value.
            if (typeof value === 'number' && value > 0) return value

            const doc = data as Record<string, unknown> | undefined
            return estimateReadTime(doc?.intro, doc?.content) ?? value
          },
        ],
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Shows this article in the single featured slot on the Journal index. Publishing another featured article clears this one automatically.',
      },
    },
    noindexField({
      description:
        'Adds robots noindex and drops the article from the sitemap, while leaving it live. For thin or seasonal pages. To exclude only certain locales, use International SEO Overrides on the SEO tab instead.',
    }),
    ...chromeFields({ noun: 'article' }),
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
    // Localized, matching Pages, Hubs and Pillars. Previously one slug served all
    // eight markets, so `/de/journal/what-your-gut-is-telling-you` was an English
    // URL with German content — and the only content type on the site that could
    // not have a translated address.
    //
    // Per-locale uniqueness is a validate hook, not a DB constraint: a unique
    // index on a localized column enforces uniqueness across ALL locales at once,
    // which would reject a German slug because an unrelated Dutch post already
    // used that string.
    costomSlugField({ localized: true, collection: 'posts' }),
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
    // enforceSingleFeatured runs first so the index revalidation that
    // revalidatePost triggers already reflects the cleared flags.
    afterChange: [enforceSingleFeatured, revalidatePost],
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
