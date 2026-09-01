import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { costomSlugField } from '@/fields/slug'
import { chromeFields } from '@/fields/contentDocument'
import { revalidateHub } from './hooks/revalidateHub'
import { rejectPageSlugCollision } from './hooks/rejectPageSlugCollision'

/**
 * The three content hubs: Microbiome, Research, Lexicon.
 *
 * This is the collection TICKET-SEO-007 §6 describes without naming: *"Each
 * content document stores its own slug and a relationship to its hub… The URL is
 * composed from `locale + hub.slug + doc.slug`. The breadcrumb is composed from
 * the same relationship plus a constant Journal ancestor. Store the hierarchy
 * once; derive both views from it."*
 *
 * Storing it once is the whole point. `/de/mikrobiom/darmgesundheit` and
 * `Home › Journal › Mikrobiom › Darmgesundheit` are two projections of the same
 * fact, and neither is written down anywhere — both are built from the hub a
 * document points at. That is also what makes §4a's "a third language is new
 * field values, not a new route" true.
 *
 * Journal is deliberately NOT one of these, even though it has the same shape —
 * an index with documents beneath it. "Journal" is the same word in English and
 * German, so it is served by a plain `[locale]/journal` folder and never needs a
 * database lookup to resolve its URL; its copy lives in Site Settings. A Hubs
 * record for it would be read by nothing, while appearing editable in the admin.
 *
 * If §4's open question comes back as `/de/magazin`, Journal joins this
 * collection and loses its folder — one mechanism for all four. Until then,
 * having it here would only be a record that lies.
 */
export const Hubs: CollectionConfig = {
  slug: 'hubs',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'key', 'slug'],
    description:
      'The three content hubs. Their slugs are per-locale, so the same hub is /en/microbiome and /de/mikrobiom. The Journal is not here — it has its own route because its name does not change between languages.',
  },
  hooks: {
    // Cross-collection check runs after the field-level slug validation, so a
    // slug that is already malformed never reaches it.
    beforeValidate: [rejectPageSlugCollision],
    afterChange: [revalidateHub],
  },
  fields: [
    {
      name: 'key',
      label: 'Hub',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Microbiome', value: 'microbiome' },
        { label: 'Research', value: 'research' },
        { label: 'Lexicon', value: 'lexicon' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Stable identifier the code matches on. Never changes, and is never shown to a visitor — rename the hub with the Title field instead.',
      },
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'The visible name, used as the H1, the breadcrumb rung and the nav label. Because the breadcrumb JSON-LD must match the rendered text character for character (SEO-007 §5), this one string feeds all three.',
      },
    },
    costomSlugField({
      collection: 'hubs',
      from: 'title',
      localized: true,
      // Seeded from §4's URL map: microbiome/mikrobiom, research/forschung,
      // lexicon/glossar.
    }),
    {
      name: 'intro',
      label: 'Intro',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Two or three sentences under the title. The only authored prose on a hub page — everything below it is generated from the documents in the hub.',
      },
    },
    {
      name: 'metaTitle',
      label: 'SEO title override',
      type: 'text',
      localized: true,
      maxLength: 60,
      admin: {
        description: 'Optional. Left empty, it is built from the title. Max 60 characters.',
      },
    },
    {
      name: 'metaDescription',
      label: 'SEO description override',
      type: 'textarea',
      localized: true,
      maxLength: 155,
      admin: {
        description: 'Optional. Left empty, the intro is used. Max 155 characters.',
      },
    },
    // Chrome selection, matching Posts and Site Settings → Journal. Not
    // localized: the header and footer documents carry their own localized
    // content, so one choice covers every market.
    ...chromeFields({ noun: 'hub', terse: true }),
  ],
}
