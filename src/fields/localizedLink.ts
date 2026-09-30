import type { Field, GroupField } from 'payload'

import deepMerge from '@/utilities/deepMerge'

/**
 * Link field with a LOCALIZED url and label.
 *
 * NEW FILE, deliberately. `src/fields/link.ts` keeps `url` and `label`
 * unlocalized, so it cannot express a per-locale destination — and a redesign
 * CTA does need one: `/de/plaene` is not `/en/plans`. Changing `link()` in place
 * would rewrite the schema of every block already using it across the live site
 * and require a data migration, so the redesign uses this instead and `link()`
 * is left untouched.
 *
 * NOT for rows inside an array. Payload forbids a localized field inside a
 * localized array, and this field's own `url`/`label` are localized — so an
 * array of nav rows uses a flat `{ label, url }` pair with each marked
 * `localized: true`, and the array itself left unlocalized. That shape also
 * keeps ONE list of rows across all nine locales instead of nine lists.
 */
type LocalizedLinkType = (options?: {
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}) => Field

export const localizedLink: LocalizedLinkType = ({ disableLabel = false, overrides = {} } = {}) => {
  const result: GroupField = {
    name: 'link',
    type: 'group',
    admin: { hideGutter: true },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            defaultValue: 'custom',
            admin: { layout: 'horizontal', width: '50%' },
            options: [
              { label: 'Internal link', value: 'reference' },
              { label: 'Custom URL', value: 'custom' },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            label: 'Open in new tab',
            admin: { width: '50%', style: { alignSelf: 'flex-end' } },
          },
        ],
      },
      {
        name: 'reference',
        type: 'relationship',
        relationTo: ['pages', 'posts'],
        label: 'Document to link to',
        admin: { condition: (_, siblingData) => siblingData?.type === 'reference' },
      },
      {
        name: 'url',
        type: 'text',
        label: 'Custom URL',
        localized: true,
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'custom',
          description: 'Localized: each locale can point at a different destination.',
        },
      },
    ],
  }

  if (!disableLabel) {
    result.fields.push({
      name: 'label',
      type: 'text',
      label: 'Label',
      localized: true,
      required: true,
    })
  }

  return deepMerge(result, overrides)
}
