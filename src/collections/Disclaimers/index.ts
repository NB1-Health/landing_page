import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { normalizeSlug } from '@/fields/slug'
import {
  revalidateContentLibrary,
  revalidateContentLibraryDelete,
} from '@/collections/hooks/revalidateContentLibrary'

/**
 * Compliance and legal framing, held once and referenced everywhere.
 *
 * SEO-007 P5. The wording is regulated — NB1 is a wellness product, not a
 * medical one — and it was being typed into a `ComplianceNote` block per article.
 * At 10 pillars that is a nuisance. At 408 scientific articles and 2,400 lexicon
 * terms it means a wording change from legal is a content migration across ~2,800
 * documents in eight languages, and the only way to know it landed everywhere is
 * to read them.
 *
 * Records, not a global with seven fields: the set grows, and a global would need
 * a config change and a migration to add the eighth.
 *
 * `key` is the stable identity. Not the id, because ids differ between the
 * staging and production databases, and the ingestion pipeline will reference
 * these by name. Not the title either, since that is localized and editable.
 * Editors pick from a dropdown and never see the key; the API uses it and never
 * sees the dropdown.
 */
export const Disclaimers: CollectionConfig = {
  slug: 'disclaimers',
  labels: { singular: 'Disclaimer', plural: 'Disclaimers' },
  access: {
    create: authenticated,
    delete: authenticated,
    // Public: the renderer resolves these on the server for anonymous visitors.
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'updatedAt'],
    description:
      'Reusable compliance wording. Edit here and every article using it updates — never retype legal copy into an article.',
    group: 'Content library',
  },
  // A block referencing one of these needs the text at depth 1, without pulling
  // anything else.
  defaultPopulate: {
    key: true,
    name: true,
    label: true,
    text: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description:
          'Internal label, for the dropdown editors choose from. Not shown to visitors.',
      },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Stable identity, e.g. "wellness-not-medical". Used by the content pipeline. Changing it breaks anything referencing it by name — rename the label instead.',
      },
      hooks: {
        beforeValidate: [
          // Normalized rather than validated so an editor typing "Wellness Not
          // Medical" gets a usable key instead of a rejection.
          ({ value, data }) => {
            const source =
              typeof value === 'string' && value.trim()
                ? value
                : ((data as Record<string, unknown> | undefined)?.name as string) || ''
            return source ? normalizeSlug(source) : value
          },
        ],
      },
    },
    {
      // How it renders. Four treatments in the previews, not the three the brief
      // describes by length — the fourth is the fine print nested inside a
      // conversion block, which the brief counts as part of the CTA rather than
      // as a disclaimer weight.
      //
      // Stored rather than inferred from length: a 230-character health notice is
      // still a health notice, and guessing the treatment from a character count
      // would change how a legal text renders when someone tightens the wording.
      name: 'weight',
      type: 'select',
      required: true,
      defaultValue: 'standard',
      options: [
        { label: 'Quiet note — under a table, or at the foot of a pillar', value: 'note' },
        { label: 'Standard — every lexicon term, every article', value: 'standard' },
        { label: 'Health notice — condition lexicon terms only', value: 'health' },
        { label: 'Fine print — inside a conversion block', value: 'fine' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'The health notice runs about 540 characters, more than twice the quiet note. Check it renders before publishing.',
      },
    },
    {
      name: 'label',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Bold lead-in, e.g. "A note on claims:". Leave empty to use the standard translated one.',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'The wording itself. Translate per locale — legal copy does not travel.',
      },
    },
  ],
  // These records are read through an indefinitely-cached, tagged query, so a
  // saved edit is invisible until the tag is busted. Without this hook a legal
  // wording change would land in the database and never reach a page.
  hooks: {
    afterChange: [revalidateContentLibrary],
    afterDelete: [revalidateContentLibraryDelete],
  },
}
