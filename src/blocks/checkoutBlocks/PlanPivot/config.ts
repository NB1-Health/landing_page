import type { Block } from 'payload'

export const PlanPivot: Block = {
  slug: 'planPivot',
  interfaceName: 'PlanPivotBlock',
  labels: { singular: 'Plan Pivot', plural: 'Plan Pivots' },
  fields: [
    {
      name: 'direction',
      type: 'select',
      label: 'Direction',
      defaultValue: 'upsell',
      options: [
        { label: 'Upsell (teal tint bg)', value: 'upsell' },
        { label: 'Downsell (off-white bg)', value: 'downsell' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      localized: true,
      required: true,
      admin: { placeholder: 'Want more from your diagnostic?' },
    },
    {
      name: 'subtitle',
      type: 'textarea',
      label: 'Subtitle',
      localized: true,
    },
    {
      name: 'bullets',
      type: 'array',
      label: 'Bullet points',
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Text',
          localized: true,
          required: true,
        },
      ],
    },
    {
      name: 'ctaText',
      type: 'text',
      label: 'CTA text',
      localized: true,
      required: true,
      admin: {
        placeholder: 'Switch to Advanced · €149/mo',
        description:
          'Label only — the button draws its own arrow, so do not type one at the end or it will show twice.',
      },
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'CTA href',
      required: true,
      localized: true,
    },
  ],
}
