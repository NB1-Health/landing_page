import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { normalizeSlug } from '@/fields/slug'

/**
 * The subject categories for scientific articles — slot 2 of designer brief §6.
 *
 * 26 in use, 12–42 characters, e.g. "Bacterial Taxa", "Gut Conditions & Disease",
 * "Antibiotics & Drug-Microbiome Interactions".
 *
 * A collection rather than a `select` with 26 options, for one reason that
 * decides it: the label is **displayed**, so it has to be translated. A select's
 * option labels are admin-only strings — the stored value is the key — so a
 * German page would need those 26 names mirrored into every dictionary and kept
 * in step with the config by hand. Here the translation lives on the record.
 *
 * It also makes the list editable. 26 is the count today; the brief says "26 in
 * use", not "26 exist", and a taxonomy that grows should not need a deploy.
 *
 * NOT the same thing as a lexicon category. Those are real pages at
 * `/en/lexicon/topics/{key}` with an intro and a term list. These are labels: the
 * brief gives scientific articles no category page, and inventing one would
 * create ~26 thin index pages competing with the Research hub.
 */
export const ArticleCategories: CollectionConfig = {
  slug: 'article-categories',
  labels: { singular: 'Article category', plural: 'Article categories' },
  access: {
    create: authenticated,
    delete: authenticated,
    // Public: the label is rendered on every article for anonymous readers.
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'updatedAt'],
    description:
      'Subject labels for scientific articles. Displayed above the title; translate the name per locale.',
    group: 'Content library',
  },
  // An article read at depth 1 needs the label and nothing else.
  defaultPopulate: {
    key: true,
    title: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      // The brief measures 12–42 characters and warns German runs up to 20%
      // longer on short labels. Not capped at 42: a real category name that
      // happens to be longer should reach a human, not a validation error.
      maxLength: 80,
      admin: {
        description:
          'Shown above the article title. Real ones run 12–42 characters; the longest is "Antibiotics & Drug-Microbiome Interactions".',
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
          'Stable identity, e.g. "bacterial-taxa". Used by the content pipeline. Rename the title rather than the key.',
      },
      hooks: {
        beforeValidate: [
          // Derived from the English title on first save so nobody has to invent
          // one, but editable — and never regenerated, because the pipeline will
          // reference it.
          ({ value, data }) => {
            const source =
              typeof value === 'string' && value.trim()
                ? value
                : ((data as Record<string, unknown> | undefined)?.title as string) || ''
            return source ? normalizeSlug(source) : value
          },
        ],
      },
    },
  ],
}
