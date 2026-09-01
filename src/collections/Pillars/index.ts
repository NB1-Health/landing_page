import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { BulletListBlock } from '@/blocks/BulletList/config'
import { ComplianceNote } from '@/blocks/ComplianceNote/config'
import { CtaBlock } from '@/blocks/CTA/config'
import { DataTableBlock } from '@/blocks/DataTable/config'
import { EvidenceTable } from '@/blocks/EvidenceTable/config'
import { ExpertQuote } from '../../blocks/ExpertQuote/config'
import { HighlightCallout } from '@/blocks/HighlightCallout/config'
import { KeyTakeaways } from '@/blocks/KeyTakeways/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { PullQuote } from '@/blocks/PullQuote/config'
import { StepFlow } from '@/blocks/StepFlow/config'

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
import { createHubDocumentRevalidation } from '@/collections/hooks/revalidateHubDocument'

/**
 * Pillar pages — the 10 flagship explainers under the Microbiome hub.
 *
 * Its own collection rather than a `type` on Posts, because the field sets barely
 * overlap: a pillar has a hero image, an evidence table, a step flow and an FAQ;
 * a Journal article has an excerpt, a read time and a featured flag. One
 * collection would mean most fields hidden behind `admin.condition` on every
 * record.
 *
 * Shape follows the designer brief §5 slot table. Slots 1, 2, 5, 7, 10 and 11 are
 * NOT fields — the breadcrumb, the category label, the author line, the contents
 * list and the two related strips are all derived at render time. §4 of that
 * brief is explicit that generated components are designed once and assembled
 * automatically, and a field for each would be a field the API has to fill 2,000
 * times.
 *
 * `hub` is a relationship rather than a hardcoded constant. The URL and the
 * breadcrumb are both composed from it (§6), and it is filtered to Microbiome so
 * an editor cannot file a pillar under Research by accident.
 */
/**
 * Cache invalidation, now shared with the other hub-document collections.
 *
 * Migrated off the hand-written `revalidatePillar`, which this factory was
 * extracted from — so behaviour is unchanged except for one fix.
 *
 * THE FIX: the old hook busted `pillars-sitemap` and nothing else. Nothing in the
 * codebase busted `pillars`, and `getCachedJournalNav` is tagged with it — so
 * publishing, renaming or unpublishing a pillar never reached the Discover menu.
 * The nav would have kept the previous ten until its TTL expired, which is the
 * class of bug that looks like "the CMS didn't save".
 */
const revalidation = createHubDocumentRevalidation({
  collection: 'pillars',
  // Unchanged from the old hook, so an in-flight request mid-deploy cannot read
  // state parked under a different key.
  contextKey: 'pillarPublication',
  tags: ['pillars', 'pillars-sitemap'],
})

export const Pillars: CollectionConfig = {
  slug: 'pillars',
  labels: { singular: 'Pillar', plural: 'Pillars' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // Everything a hub card needs, so the Microbiome listing stays at depth 1
  // instead of pulling whole 1,400-word documents.
  defaultPopulate: {
    title: true,
    slug: true,
    standfirst: true,
    heroImage: true,
    hub: true,
    publishedAt: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'The 10 Microbiome explainers. Around 1,400 words each, with a comparison table and a step-by-step section.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      // The brief measures real titles at 43–71 characters and warns German runs
      // ~8% longer. Not a hard cap at 71: a limit that rejects real content is
      // worse than one that lets a long title through for a human to shorten.
      maxLength: 110,
      admin: {
        description:
          'Two lines on desktop, three on mobile. Real ones run 43–71 characters; German about 8% longer.',
      },
    },
    costomSlugField({ collection: 'pillars', from: 'title', localized: true }),
    {
      name: 'hub',
      type: 'relationship',
      relationTo: 'hubs',
      required: true,
      // Pillars belong to Microbiome. Filtering here rather than hardcoding the
      // value keeps the URL and breadcrumb composition identical to every other
      // content type, while making the wrong choice unavailable.
      filterOptions: () => ({ key: { equals: 'microbiome' } }),
      admin: {
        position: 'sidebar',
        description: 'Always Microbiome. Supplies the middle URL segment and the breadcrumb rung.',
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
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      validate: requiredOnPublish('Hero image'),
      admin: { description: '16:8. Required before publishing.' },
    },
    {
      // Slot 6's caption. Separate from the media item's `alt`: alt text
      // describes the image for someone who cannot see it, a caption adds
      // information for everyone. Using one as the other produces either a
      // caption that reads like a description of a photograph, or alt text
      // that assumes you can already see it.
      name: 'heroCaption',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional. Shown under the hero. Not the same as the image alt text.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      // Its own editor, not the project default. `defaultLexical` has no
      // HeadingFeature, so a body containing H2s could not even be PARSED — the
      // admin threw `parseEditorState: type "heading" + not found` and refused to
      // render the field. Section titles being real headings is Rule 1 of the
      // designer brief, so headings are not optional here.
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          // Exactly one H1 per page and that is the title; the contents list is
          // built from H2s. Three levels total, per Rule 1 — deeper ones have
          // nowhere to render.
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          BlocksFeature({
            // The body sub-components from designer brief §5. The four pillar
            // ones — evidence table, step flow, highlight callout, pull quote —
            // needed no migration: lexical blocks serialize into this field's
            // JSON rather than into tables of their own.
            blocks: [
              KeyTakeaways,
              EvidenceTable,
              StepFlow,
              HighlightCallout,
              PullQuote,
              DataTableBlock,
              CtaBlock,
              BulletListBlock,
              ExpertQuote,
              MediaBlock,
              ComplianceNote,
            ],
          }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
        ],
      }),
      validate: requiredOnPublish('Body'),
      admin: {
        description:
          'Around 1,400 words. Section titles are H2 and drive the contents list — three heading levels, no more (designer brief, Rule 1).',
      },
    },
    {
      name: 'faq',
      type: 'array',
      localized: true,
      maxRows: 5,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        initCollapsed: true,
        description:
          'Optional, 2–5 entries. The one place an accordion is allowed — Rule 3 forbids hiding body content behind a click, and names the FAQ as the exception.',
      },
      fields: [
        { name: 'question', type: 'text', required: true, localized: true },
        { name: 'answer', type: 'textarea', required: true, localized: true },
      ],
    },
    referencesField(),
    authorsField(),
    reviewerField({
      description: 'Optional. Renders the "Last reviewed" line; hidden entirely when empty.',
    }),
    reviewedAtField(),
    {
      // Slot 11. Optional picks; the strip fills itself from the newest published
      // articles when this is empty, so it is never partly full.
      name: 'relatedResearch',
      type: 'relationship',
      relationTo: 'scientific-articles',
      hasMany: true,
      maxDepth: 0,
      admin: {
        position: 'sidebar',
        description:
          'Optional manual picks for "Related research". Left empty, the strip fills with the newest articles.',
      },
    },
    {
      name: 'relatedPillars',
      type: 'relationship',
      relationTo: 'pillars',
      hasMany: true,
      maxDepth: 1,
      admin: {
        position: 'sidebar',
        description:
          'Optional manual picks for the "Related topics" strip. Left empty, the strip fills itself.',
      },
    },
    // Gains the stamp-on-first-publish hook it never had: a pillar published
    // without a date emitted no `datePublished` in its Article schema.
    publishedAtField(),
    noindexField(),
    {
      // Identity for the ingestion pipeline. Added now, before any content
      // exists: without a stable external key a re-sync duplicates instead of
      // updating, and retrofitting one across 2,000 documents means matching on
      // titles. Unused until the API contract is specified.
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
    maxPerDoc: 50,
  },
}
