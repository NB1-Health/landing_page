import type { Block } from 'payload'
import { makeHeadingEditor } from '@/fields/headingLexical'

export const PlansBlock: Block = {
  slug: 'plansSection',
  interfaceName: 'PlansSectionBlock',
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
    { name: 'heading', type: 'richText', localized: true, editor: makeHeadingEditor() },
    { name: 'lede', type: 'text', localized: true },
    { name: 'coreLabel', type: 'text', localized: true },
    { name: 'coreDesc', type: 'text', localized: true },
    // corePrice removed — Core's 4-month headline price is fetched live from
    // the subscriptions API (see Component.tsx) and is no longer editable here.
    { name: 'coreMonthly', type: 'text', localized: true },
    { name: 'coreCommit', type: 'text', localized: true },
    { name: 'coreFeaturesLabel', type: 'text', localized: true },
    { name: 'coreFeatures', type: 'array', fields: [{ name: 'item', type: 'text', localized: true }] },
    {
      name: 'coreCtaLabel',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Label only — the button draws its own arrow, so do not type one at the end or it will show twice.',
      },
    },
    { name: 'coreCtaHref', type: 'text', localized: true },
    { name: 'advBadge', type: 'text', localized: true },
    { name: 'advLabel', type: 'text', localized: true },
    { name: 'advDesc', type: 'text', localized: true },
    // advPrice removed — Advanced's 4-month headline price is fetched live
    // from the subscriptions API (see Component.tsx) and is no longer editable here.
    { name: 'advCommit', type: 'text', localized: true },
    { name: 'advFeaturesLabel', type: 'text', localized: true },
    { name: 'advFeatures', type: 'array', fields: [{ name: 'item', type: 'text', localized: true }] },
    {
      name: 'advCtaLabel',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Label only — the button draws its own arrow, so do not type one at the end or it will show twice.',
      },
    },
    { name: 'advCtaHref', type: 'text', localized: true },
    { name: 'guarantees', type: 'array', fields: [
      { name: 'iconSvg', type: 'textarea' },
      { name: 'title', type: 'text', localized: true },
      { name: 'description', type: 'text', localized: true },
    ]},
    { name: 'compareRowsJson', type: 'textarea', localized: true },
  ],
}
