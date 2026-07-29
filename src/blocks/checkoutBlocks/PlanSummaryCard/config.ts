import type { Block } from 'payload'

export const PlanSummaryCard: Block = {
  slug: 'planSummaryCard',
  interfaceName: 'PlanSummaryCardBlock',
  labels: { singular: 'Plan Summary Card', plural: 'Plan Summary Cards' },
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
      admin: { placeholder: 'Your selection' },
    },
    {
      name: 'planVariant',
      type: 'select',
      label: 'Plan variant',
      required: true,
      defaultValue: 'core',
      options: [
        { label: 'Core', value: 'core' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    {
      name: 'planName',
      type: 'text',
      label: 'Plan name',
      localized: true,
      required: true,
      admin: { placeholder: 'Core' },
    },
    {
      name: 'cycleMonth',
      type: 'select',
      label: 'Cycle (live pricing)',
      required: true,
      defaultValue: '4',
      options: [
        { label: '1 month', value: '1' },
        { label: '4 months', value: '4' },
        { label: '12 months', value: '12' },
      ],
      admin: {
        description:
          'Drives the live price + the CTA price chip below (fetched from the subscriptions API for this plan variant + cycle). Not editable directly.',
      },
    },
    {
      name: 'priceNote',
      type: 'text',
      label: 'Price note',
      localized: true,
      admin: { placeholder: '4-month minimum · billed monthly' },
    },
    {
      name: 'switchLinkText',
      type: 'text',
      label: 'Switch plan link text',
      localized: true,
      admin: { placeholder: 'Looking at Advanced instead? →' },
    },
    {
      name: 'switchLinkHref',
      type: 'text',
      label: 'Switch plan link href',
      localized: true,
    },
    {
      name: 'primaryCtaText',
      type: 'text',
      label: 'Primary CTA text',
      localized: true,
      required: true,
      admin: { placeholder: 'Start Core · 4-month' },
    },
    // primaryCtaPrice removed — the CTA price chip is the same live price +
    // pricePeriod computed above (kept in sync automatically rather than a
    // separately editable string that could drift from the headline price).
    {
      name: 'primaryCtaHref',
      type: 'text',
      label: 'Primary CTA href',
      required: true,
      localized: true,
    },
    {
      name: 'secondaryCtaText',
      type: 'text',
      label: 'Secondary CTA text (optional)',
      localized: true,
      admin: { placeholder: 'or pay monthly at €109/mo →' },
    },
    {
      name: 'secondaryCtaHref',
      type: 'text',
      label: 'Secondary CTA href',
      localized: true,
    },
    {
      name: 'ctaSubText',
      type: 'text',
      label: 'CTA sub text',
      localized: true,
      admin: { placeholder: 'Monthly billing · cancel anytime' },
    },
  ],
}
