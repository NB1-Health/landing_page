import type { Block } from 'payload'

export const PlanSelector: Block = {
  slug: 'planSelector',
  interfaceName: 'PlanSelectorBlock',
  labels: { singular: 'Plan Selector', plural: 'Plan Selectors' },
  fields: [
    {
      name: 'priceTokenHelp',
      type: 'ui',
      admin: {
        components: {
          Field: { path: '/blocks/yourPlanBlocks/PriceTokenHelp', exportName: 'PriceTokenHelp' },
        },
      },
    },
    {
      name: 'sectionTitle',
      type: 'text',
      label: 'Section title',
      localized: true,
      admin: { placeholder: 'Choose your plan' },
    },
    {
      name: 'guaranteeItems',
      type: 'array',
      label: 'Guarantee items (shown above plans)',
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Text (bold the first part with **bold**)',
          localized: true,
          required: true,
          admin: { placeholder: '**Billed monthly.** No upfront charge.' },
        },
      ],
    },
    {
      name: 'plans',
      type: 'array',
      label: 'Plans',
      minRows: 2,
      maxRows: 2,
      fields: [
        {
          name: 'planKey',
          type: 'select',
          label: 'Plan key',
          required: true,
          options: [
            { label: 'Core', value: 'core' },
            { label: 'Advanced', value: 'advanced' },
          ],
          admin: {
            description:
              'Also drives the live headline price (the 4-month rate, fetched from the subscriptions API) — strikePrice/minNote/monthlyLinkText below stay manually edited.',
          },
        },
        {
          name: 'isRecommended',
          type: 'checkbox',
          label: 'Show "Most informed" badge',
          defaultValue: false,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Plan name',
          localized: true,
          required: true,
          admin: { placeholder: 'Core' },
        },
        {
          name: 'strikePrice',
          type: 'text',
          label: 'Strike-through price (e.g. €119)',
          localized: true,
        },
        {
          name: 'minNote',
          type: 'text',
          label: 'Minimum note',
          localized: true,
          admin: { placeholder: '4-month minimum · billed monthly' },
        },
        {
          name: 'monthlyLinkText',
          type: 'text',
          label: 'Monthly option link text',
          localized: true,
          admin: { hidden: true, placeholder: 'or pay monthly, €109/mo, cancel anytime →' },
        },
        {
          name: 'monthlyLinkHref',
          type: 'text',
          label: 'Monthly option link href',
          localized: true,
          admin: { hidden: true },
        },
        {
          name: 'ctaText',
          type: 'text',
          label: 'CTA text',
          localized: true,
          required: true,
          admin: {
            placeholder: 'Start with Core',
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
    },
    {
      name: 'scienceBoardLabel',
      type: 'text',
      label: 'Science board label (shown above comparison table)',
      localized: true,
      admin: { placeholder: 'Reviewed by our science board' },
    },
    {
      name: 'scienceBoardSub',
      type: 'text',
      label: 'Science board sub-line',
      localized: true,
      admin: { placeholder: 'Human sign-off before manufacture' },
    },
    {
      name: 'scienceBoardImages',
      type: 'array',
      label: 'Science board member photos',
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Photo',
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Alt text',
          localized: true,
        },
      ],
    },
    {
      name: 'showComparison',
      type: 'checkbox',
      label: 'Show collapsible comparison table',
      defaultValue: true,
    },
    {
      name: 'comparisonRows',
      type: 'array',
      label: 'Comparison table rows',
      admin: {
        condition: (_, siblingData) => siblingData?.showComparison,
        description: 'Leave coreValue/advancedValue empty to render as a section header row.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Row label',
          localized: true,
          required: true,
        },
        {
          name: 'coreValue',
          type: 'text',
          label: 'Core value (blank = section header)',
          localized: true,
        },
        {
          name: 'advancedValue',
          type: 'text',
          label: 'Advanced value',
          localized: true,
        },
        {
          name: 'corePositive',
          type: 'checkbox',
          label: 'Core value is positive (bold)',
          defaultValue: false,
        },
        {
          name: 'advancedPositive',
          type: 'checkbox',
          label: 'Advanced value is positive (bold)',
          defaultValue: false,
        },
      ],
    },
  ],
}
