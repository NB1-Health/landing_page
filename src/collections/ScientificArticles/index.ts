import type { CollectionConfig } from 'payload'

import { lexicalEditor, FixedToolbarFeature, InlineToolbarFeature } from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { costomSlugField } from '@/fields/slug'
import { requiredOnPublish } from '@/collections/Posts/hooks/requiredOnPublish'
import {
  authorsField,
  noindexField,
  publishedAtField,
  referencesField,
  reviewedAtField,
  reviewerField,
} from '@/fields/contentDocument'
import { articleSectionFields } from './sections'
import { createHubDocumentRevalidation } from '@/collections/hooks/revalidateHubDocument'

/**
 * Scientific articles — the 408 study summaries under the Research hub.
 *
 * Structurally the opposite of `Pillars`, despite both living under a hub. A
 * pillar is a free-form explainer whose shape the writer chooses; this is a
 * fixed seven-section template the ingestion pipeline fills the same way 408
 * times. That is why the body is seven named groups rather than one rich-text
 * field: §11 fixes the section order, and a single field cannot express an order
 * at all.
 *
 * Reuses `fields/contentDocument` for everything a content document shares, which
 * is the reason P5 came before this — otherwise `publishedAt`, `authors`,
 * `reviewer`, `noindex` and `references` would exist here in a third slightly
 * different form.
 *
 * Section names and order come from `preview-scientific-article.html` — see
 * `sections.ts`.
 */
/**
 * Cache invalidation. Before this, saving a scientific article invalidated NOTHING —
 * not its page, not the hub listing it, not the sitemap. Shared with the other
 * hub-document collections rather than copied; see `revalidateHubDocument`.
 */
const revalidation = createHubDocumentRevalidation({
  collection: 'scientific-articles',
  contextKey: 'scientificArticlePublication',
  tags: ['research-sitemap'],
})

export const ScientificArticles: CollectionConfig = {
  slug: 'scientific-articles',
  labels: { singular: 'Scientific article', plural: 'Scientific articles' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // A Research hub listing of 408 records must not pull seven rich-text bodies
  // per row. Cards need six fields; this is the difference between a listing
  // query and a memory problem.
  defaultPopulate: {
    title: true,
    slug: true,
    standfirst: true,
    hub: true,
    category: true,
    publishedAt: true,
    studyYear: true,
  },
  admin: {
    defaultColumns: ['title', 'category', 'studyYear', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Study summaries under Research. Seven sections in a fixed order; most fields are filled by the content pipeline.',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      // The brief measures a worst case of 122 characters. Study titles are long
      // and not the writer's to shorten, so the cap sits above the real maximum
      // rather than at it — a limit that rejects a real title is worse than one
      // that lets a long one through for a human to look at.
      maxLength: 160,
      admin: {
        description:
          'Study titles run long — the measured worst case is 122 characters. Check how it wraps rather than trimming the meaning out of it.',
      },
    },
    costomSlugField({ collection: 'scientific-articles', from: 'title', localized: true }),
    {
      name: 'hub',
      type: 'relationship',
      relationTo: 'hubs',
      required: true,
      // Always Research. Filtered rather than hardcoded so the URL and breadcrumb
      // compose exactly as they do for every other content type.
      filterOptions: () => ({ key: { equals: 'research' } }),
      admin: {
        position: 'sidebar',
        description: 'Always Research. Supplies the middle URL segment and the breadcrumb rung.',
      },
    },
    {
      // Slot 2 — the subject label above the title. NOT the hub name: every
      // article in this collection sits under Research, so rendering the hub
      // there would print the same word 408 times and tell a reader nothing.
      name: 'category',
      type: 'relationship',
      relationTo: 'article-categories',
      validate: requiredOnPublish('Category'),
      admin: {
        position: 'sidebar',
        description: 'The subject label shown above the title. 26 in use.',
      },
    },
    {
      name: 'standfirst',
      type: 'textarea',
      localized: true,
      validate: requiredOnPublish('Standfirst'),
      admin: {
        description: 'One or two sentences under the title. Also used as the card summary.',
      },
    },
    {
      // Slot 6 — the opening paragraph. No heading above it, slightly larger than
      // body text, and it is NOT the standfirst: the standfirst is also the card
      // summary and is capped for that, while this is the article's first
      // paragraph and runs long.
      name: 'lead',
      type: 'richText',
      localized: true,
      label: 'Opening paragraph',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      validate: requiredOnPublish('Opening paragraph'),
      admin: {
        description:
          'One paragraph, before the first section, with no heading above it. Sets up the study.',
      },
    },
    // The seven fixed sections, "In Plain Language" among them as the seventh.
    ...articleSectionFields(),
    referencesField({ maxRows: 20 }),
    authorsField(),
    reviewerField({
      description:
        'Optional but expected on study summaries. Renders the "Reviewed by" line — the strongest E-E-A-T signal this collection has.',
    }),
    reviewedAtField(),
    {
      // Source study identity. A summary that does not say what it summarises is
      // not a summary, and `Person`/`ScholarlyArticle` structured data needs a
      // citation target. Not localized: a DOI and a journal name are the same in
      // every market.
      name: 'sourceTitle',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Title of the study being summarised.',
      },
    },
    {
      name: 'sourceJournal',
      type: 'text',
      admin: { position: 'sidebar', description: 'e.g. Nature Microbiology' },
    },
    {
      name: 'studyYear',
      type: 'number',
      min: 1900,
      admin: { position: 'sidebar', description: 'Publication year of the source study.' },
    },
    {
      name: 'doi',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'e.g. 10.1038/s41564-024-01234-5. Rendered as a link to doi.org.',
      },
    },
    publishedAtField(),
    noindexField(),
    {
      // Identity for the ingestion pipeline, added before any content exists.
      // Without a stable external key a re-sync duplicates rather than updates,
      // and retrofitting one across 408 documents means matching on titles.
      name: 'externalId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set by the content pipeline. Do not edit.',
      },
    },
  ],
  hooks: {
    beforeOperation: [revalidation.capture],
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
  },
  versions: {
    drafts: {
      localizeStatus: true,
      schedulePublish: true,
    },
    // Lower than the 50 on Pillars: 408 articles maintained by a pipeline will
    // generate versions far faster than ten hand-written explainers, and the
    // version tables are the largest thing in this database.
    maxPerDoc: 20,
  },
}
