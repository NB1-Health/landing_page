import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { costomSlugField } from '@/fields/slug'
import { requiredOnPublish } from '@/collections/Posts/hooks/requiredOnPublish'
import {
  noindexField,
  publishedAtField,
  referencesField,
  reviewedAtField,
  reviewerField,
} from '@/fields/contentDocument'
import { termSectionFields } from './sections'
import { createHubDocumentRevalidation } from '@/collections/hooks/revalidateHubDocument'

/**
 * Lexicon terms — up to 2,400 pages at `/en/lexicon/{slug}`.
 *
 * The highest-volume type on the site and the most uniform: ~800 words in three
 * fixed sections, opening with a one-sentence definition. Designed for density and
 * repetition, and every field here is a field the pipeline has to fill 2,400 times
 * — which is the argument that settled most of the decisions below.
 *
 * URLs are FLAT: `/en/lexicon/butyrate`, not `/en/lexicon/topics/metabolites/butyrate`.
 * The category appears in the breadcrumb only, which is the same
 * hierarchy-in-the-trail rule the whole ticket runs on.
 *
 * Three things the template derives rather than storing, each saving 2,400 rows:
 *
 * - **The educational disclaimer** — always the same record, looked up by key.
 * - **The conversion block** — `condition-analysis` when `isCondition`,
 *   `microbiome-analysis` otherwise. The previews differ only in which key they
 *   mount, so a field here would be a field whose value is already implied.
 * - **The health notice** — condition terms only, again by key.
 *
 * Unlike the scientific article, the sections carry no `heading` override. Seven
 * sections across 408 articles can justify an escape hatch; three sections across
 * 2,400 terms cannot, and the uniformity is what makes the reference usable.
 */
/**
 * Cache invalidation. Before this, saving a lexicon term invalidated NOTHING —
 * not its page, not the hub listing it, not the sitemap. Shared with the other
 * hub-document collections rather than copied; see `revalidateHubDocument`.
 */
const revalidation = createHubDocumentRevalidation({
  collection: 'lexicon-terms',
  contextKey: 'lexiconTermPublication',
  tags: ['lexicon-terms', 'lexicon-sitemap'],
})

export const LexiconTerms: CollectionConfig = {
  slug: 'lexicon-terms',
  labels: { singular: 'Lexicon term', plural: 'Lexicon terms' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // The category page lists 436 of these with their definitions. Anything not in
  // this list is a column that page does not need and cannot afford.
  defaultPopulate: {
    title: true,
    slug: true,
    definition: true,
    category: true,
    italicName: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'isCondition', 'updatedAt'],
    description: 'One page per term. Three fixed sections, opening with a definition sentence.',
    group: 'Lexicon',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      // Real ones run 5–41 characters. The cap is well above that: the longest is
      // "time restricted eating and gut microbiome", and a limit that rejects a
      // real term name is worse than one that lets a long one through.
      maxLength: 90,
      admin: {
        description: 'The term. Real ones run 5–41 characters. Often a species name.',
      },
    },
    {
      // Species names are italic — designer brief §7, slot 3. A flag rather than
      // asking editors to wrap the title in markup: the name is rendered in the
      // h1, the breadcrumb, the related-terms row and the category list, and
      // markup in a text field would have to be parsed in four places.
      name: 'italicName',
      type: 'checkbox',
      defaultValue: false,
      label: 'Italicise the name',
      admin: {
        position: 'sidebar',
        description: 'For species and genus names — Akkermansia muciniphila, Bacteroides.',
      },
    },
    costomSlugField({ collection: 'lexicon-terms', from: 'title', localized: true }),
    {
      name: 'hub',
      type: 'relationship',
      relationTo: 'hubs',
      required: true,
      filterOptions: () => ({ key: { equals: 'lexicon' } }),
      admin: {
        position: 'sidebar',
        description: 'Always Lexicon. Supplies the URL segment and the third breadcrumb rung.',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'lexicon-categories',
      validate: requiredOnPublish('Category'),
      admin: {
        position: 'sidebar',
        description:
          'The fourth breadcrumb rung, and which browse page lists this term. Not part of the URL.',
      },
    },
    {
      name: 'alsoKnownAs',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional, and most terms have none — the brief says to design the version without it first. Synonyms, comma separated.',
      },
    },
    {
      // Slot 5, and the most important element on the page: "It is the sentence
      // that gets quoted when these pages are referenced elsewhere, so it needs
      // to read as a standalone statement rather than as the first line of a
      // paragraph."
      //
      // A textarea, not rich text. It is one sentence, and a rich-text field
      // invites the bold-and-link treatment that stops it reading as a definition.
      name: 'definition',
      type: 'textarea',
      localized: true,
      validate: requiredOnPublish('Definition'),
      admin: {
        description:
          'ONE sentence, complete on its own. This is what gets quoted elsewhere and what the category page lists.',
      },
    },
    ...termSectionFields(),
    referencesField({ maxRows: 3 }),
    {
      name: 'relatedTerms',
      type: 'relationship',
      relationTo: 'lexicon-terms',
      hasMany: true,
      maxDepth: 0,
      admin: {
        position: 'sidebar',
        description:
          'Optional. Exactly five are shown; left empty the row fills from the same category.',
      },
    },
    {
      // Roughly one term in seven. Drives three things at once — the health
      // notice, the reviewer line and which conversion block is used — so it is
      // one checkbox rather than three fields that could disagree with each other.
      name: 'isCondition',
      type: 'checkbox',
      defaultValue: false,
      label: 'Health condition term',
      admin: {
        position: 'sidebar',
        description:
          'Adds the health notice and the reviewer line, and switches the conversion block. About one term in seven.',
      },
    },
    reviewerField({
      description: 'Required in practice on condition terms — it renders the reviewer line.',
    }),
    reviewedAtField(),
    publishedAtField(),
    noindexField(),
    {
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
    drafts: { localizeStatus: true },
    // Deliberately low. 2,400 terms maintained by a pipeline generate versions
    // faster than anything else on the site, and the version tables are already
    // the largest thing in this database.
    maxPerDoc: 10,
  },
}
