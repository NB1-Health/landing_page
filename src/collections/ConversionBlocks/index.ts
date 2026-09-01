import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { normalizeSlug } from '@/fields/slug'
import {
  revalidateContentLibrary,
  revalidateContentLibraryDelete,
} from '@/collections/hooks/revalidateContentLibrary'

/**
 * The in-article CTAs, held once and referenced everywhere.
 *
 * Same argument as `Disclaimers`, different motive. Compliance copy is
 * centralised because it must not drift; conversion copy is centralised because
 * it must be *changeable* — the point of a CTA is that someone tests a variant,
 * and that is not possible when the wording lives inside 2,800 rich-text
 * documents.
 *
 * `href` is stored without the locale prefix (`/order`) and prefixed at render,
 * so one record works in all eight markets. An absolute URL passes through, for a
 * market that needs to point somewhere else entirely — the same convention
 * `resolveCtaHref` already uses for the Journal CTA.
 */
export const ConversionBlocks: CollectionConfig = {
  slug: 'conversion-blocks',
  labels: { singular: 'Conversion block', plural: 'Conversion blocks' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'updatedAt'],
    description:
      'Reusable in-article CTAs. Edit here and every article using one updates — which is what makes testing a variant possible at all.',
    group: 'Content library',
  },
  defaultPopulate: {
    key: true,
    name: true,
    heading: true,
    body: true,
    buttonLabel: true,
    href: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Internal label for the dropdown. Not shown to visitors.' },
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Stable identity, e.g. "order-kit". Used by the content pipeline. Rename the label rather than the key.',
      },
      hooks: {
        beforeValidate: [
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
      name: 'heading',
      type: 'text',
      localized: true,
      admin: { description: 'Leave empty to use the standard translated heading.' },
    },
    {
      name: 'lede',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional italic line above the body. Only one of the five records uses one — leave empty unless it is that one.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      localized: true,
      admin: { description: '1–3 sentences connecting the article topic to the NB1 kit.' },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
      admin: { description: 'Leave empty to use the standard translated button text.' },
    },
    {
      // The fine print, as a REFERENCE. Every conversion block in the previews
      // carries one and every one points into the disclaimer library rather than
      // holding its own copy — which is what makes a legal wording change one
      // edit instead of five, and keeps the same sentence identical wherever it
      // appears.
      name: 'disclaimer',
      type: 'relationship',
      relationTo: 'disclaimers',
      admin: {
        description: 'Fine print under the body. Pick from the library — never retype legal copy.',
      },
    },
    {
      name: 'href',
      type: 'text',
      required: true,
      defaultValue: '/order',
      localized: true,
      admin: {
        description:
          'Site path without the locale — "/order", not "/de/order". An absolute URL is passed through untouched.',
      },
    },
  ],
  // Same reason as `Disclaimers`: read through a tagged, indefinitely-cached
  // query. A CTA whose whole purpose is being changeable has to actually change.
  hooks: {
    afterChange: [revalidateContentLibrary],
    afterDelete: [revalidateContentLibraryDelete],
  },
}
