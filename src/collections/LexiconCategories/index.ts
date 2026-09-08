import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { costomSlugField } from '@/fields/slug'
import { noindexField, publishedAtField } from '@/fields/contentDocument'
import { revalidateTag } from 'next/cache'

/**
 * Lexicon categories — the ~13 browse pages at `/en/lexicon/topics/{slug}`.
 *
 * Real pages, unlike `ArticleCategories`, which are labels. Each one lists every
 * term it holds with that term's definition sentence, and each is the fourth rung
 * in a term's breadcrumb. That is why the term trail runs to five levels: skipping
 * this rung would declare a term as a direct child of the Lexicon and lose the
 * hierarchy the whole ticket exists to state.
 *
 * Ten today — taxa, conditions, diet, methods, metabolites, lifestyle, statistics,
 * antibiotics, interventions, core — against the brief's "around 13". The counts
 * are wildly uneven by design: 19 terms in the smallest, 436 in the largest.
 *
 * `key` is the URL segment AND the stable identity. Unusually the two are the same
 * here. NOTE: the URL is the localized SLUG, not the key — `/topics/bacterial-taxa`
 * and `/de/glossar/themen/bakterielle-taxa`. The preview HTML used short keys (
 * not `/topics/bacterial-taxa`) while the display name is translated. A localized
 * slug would be the more consistent choice; it is not what the previews show, and
 * matching them costs nothing today. Recorded in the handover as a divergence
 * worth confirming.
 */
/**
 * Cache invalidation. Categories are read by the browse page, the switcher on
 * every sibling category, the index grid, the counts and the sitemap — all
 * `unstable_cache`d under these two tags, so one bust reaches all of them.
 *
 * Tag-only, with no `revalidatePath`: every page that shows a category is
 * `force-dynamic`, so the stale thing is the query result rather than a rendered
 * route. That also means no hub-slug lookup is needed, which is why this does not
 * use `createHubDocumentRevalidation` — a category has no `hub` relationship to
 * resolve a URL from.
 */
function bustCategoryCaches() {
  for (const tag of ['lexicon-categories', 'lexicon-categories-sitemap']) {
    try {
      revalidateTag(tag)
    } catch {
      // Outside a Next request — a seed script. The write already succeeded.
    }
  }
}

export const LexiconCategories: CollectionConfig = {
  slug: 'lexicon-categories',
  labels: { singular: 'Lexicon category', plural: 'Lexicon categories' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // A term reads its category for the breadcrumb and the label; neither needs the
  // intro copy, and at 2,400 terms that saving is the whole cost of the read.
  defaultPopulate: {
    key: true,
    title: true,
    slug: true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'updatedAt'],
    description: 'Browse pages for the lexicon. Each lists every term in its category.',
    group: 'Lexicon',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Display name, e.g. "Bacterial taxa". One or two words; German runs up to 20% longer on short labels.',
      },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'The URL segment and the stable identity: /en/lexicon/topics/{key}. Untranslated, and changing it breaks every link to this page.',
      },
    },
    // A localized slug as well as the key, so the URL can be translated later
    // without changing the identity the pipeline references. Empty falls back to
    // `key` at render time.
    costomSlugField({
      collection: 'lexicon-categories',
      from: 'title',
      localized: true,
      required: false,
    }),
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: { description: '2–3 sentences. The only authored prose on the category page.' },
    },
    {
      name: 'exampleTerms',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional. Three term names for the index card, comma separated. Left empty, the card fills itself from the newest terms.',
      },
    },
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
    afterChange: [({ doc }) => (bustCategoryCaches(), doc)],
    afterDelete: [({ doc }) => (bustCategoryCaches(), doc)],
  },
  versions: {
    drafts: { localizeStatus: true },
    maxPerDoc: 10,
  },
}
