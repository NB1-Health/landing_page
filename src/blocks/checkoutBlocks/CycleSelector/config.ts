import type { Block } from 'payload'

export const CycleSelector: Block = {
  slug: 'cycleSelector',
  interfaceName: 'CycleSelectorBlock',
  labels: { singular: 'Cycle Selector', plural: 'Cycle Selectors' },
  fields: [
    {
      name: 'planName',
      type: 'text',
      label: 'Plan name (e.g. Core)',
      localized: true,
      required: true,
      admin: { placeholder: 'Core' },
    },
    {
      name: 'switchLinkLabel',
      type: 'text',
      label: 'Switch plan link label',
      localized: true,
      admin: { placeholder: 'Switch to Advanced →' },
    },
    {
      name: 'switchLinkHref',
      type: 'text',
      label: 'Switch plan link href',
      localized: true,
      admin: { placeholder: '/order-cycle-advanced' },
    },
    {
      name: 'planFamily',
      type: 'select',
      label: 'Plan family (live pricing)',
      required: true,
      defaultValue: 'core',
      options: [
        { label: 'Core', value: 'core' },
        { label: 'Advanced', value: 'advanced' },
      ],
      admin: {
        description:
          'The 1/4/12-month price grid below is fetched live from the subscriptions API for this plan family — it is not editable here. 1 month is the standard (the "Flexible" tab); 4 & 12 months are the discount tiers. Checkout links are generated as {locale order-details slug}?plan={family}&cycle={month} (the 1-month tier uses cycle=monthly).',
      },
    },
    {
      name: 'flexTabLabel',
      type: 'text',
      label: '"Flexible" tab label (1-month standard)',
      localized: true,
      admin: { placeholder: 'Flexible' },
    },
    {
      name: 'commitTabLabel',
      type: 'text',
      label: '"Commit & save" tab label (4/12-month discounts)',
      localized: true,
      admin: { placeholder: 'Commit & save' },
    },
    {
      name: 'flexNoteLabel',
      type: 'text',
      label: 'Note under the flexible-tab price',
      localized: true,
      admin: { placeholder: 'Standard · cancel anytime, no minimum' },
    },
    // ── Retired with the 1-month-standard model. Kept in the schema (no
    //    migration / no data loss) but hidden from the admin UI; the client
    //    component no longer reads them. Safe to remove in a later cleanup.
    {
      name: 'showMonthlyOption',
      type: 'checkbox',
      label: 'Show flexible monthly option',
      defaultValue: false,
      admin: { hidden: true },
    },
    {
      name: 'monthlyRate',
      type: 'text',
      label: 'Flexible monthly rate (e.g. €109)',
      localized: true,
      admin: {
        hidden: true,
        condition: (_, siblingData) => siblingData?.showMonthlyOption,
        placeholder: '€109',
      },
    },
    {
      name: 'monthlyCheckoutHref',
      type: 'text',
      label: 'Flexible monthly checkout href',
      localized: true,
      admin: {
        hidden: true,
        condition: (_, siblingData) => siblingData?.showMonthlyOption,
        placeholder: '/order-details?plan=core&cycle=monthly',
      },
    },
    {
      name: 'yourPlanLabel',
      type: 'text',
      label: '"Your plan" label',
      localized: true,
      admin: { placeholder: 'Your plan' },
    },
    {
      name: 'bestValueLabel',
      type: 'text',
      label: '"Best value" badge text',
      localized: true,
      admin: { placeholder: 'Best value' },
    },
    {
      name: 'preferFlexibleLabel',
      type: 'text',
      label: '"Prefer to stay flexible?" label',
      localized: true,
      admin: {
        hidden: true,
        placeholder: 'Prefer to stay flexible?',
        condition: (_, siblingData) => siblingData?.showMonthlyOption,
      },
    },
    {
      name: 'chooseFlexiblePrefix',
      type: 'text',
      label: '"Choose Flexible monthly" prefix',
      localized: true,
      admin: {
        hidden: true,
        placeholder: 'Choose Flexible monthly ·',
        condition: (_, siblingData) => siblingData?.showMonthlyOption,
      },
    },
    {
      name: 'continuePrefix',
      type: 'text',
      label: '"Continue" CTA prefix',
      localized: true,
      admin: { placeholder: 'Continue' },
    },
    {
      name: 'cancelAnytimeLabel',
      type: 'text',
      label: '"Cancel anytime" label',
      localized: true,
      admin: { placeholder: 'cancel anytime' },
    },
    {
      name: 'billedMonthlyShortLabel',
      type: 'text',
      label: '"Billed monthly" short label (footer bar)',
      localized: true,
      admin: { placeholder: 'billed monthly' },
    },
    {
      name: 'guaranteeItems',
      type: 'array',
      label: 'Guarantee strip items',
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
      name: 'faqTitle',
      type: 'text',
      label: 'FAQ section title',
      localized: true,
      admin: { placeholder: 'Choosing your duration' },
    },
    {
      name: 'faqItems',
      type: 'array',
      label: 'FAQ items',
      fields: [
        {
          name: 'question',
          type: 'text',
          label: 'Question',
          localized: true,
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          label: 'Answer',
          localized: true,
          required: true,
        },
      ],
    },
  ],
}
