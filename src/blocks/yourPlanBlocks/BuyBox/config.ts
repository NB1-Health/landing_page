import type { Block } from 'payload'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

const headingEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
  ],
})

export const YpBuyBoxBlock: Block = {
  slug: 'ypBuyBox',
  interfaceName: 'YpBuyBoxBlock',
  labels: { singular: 'YP — Buy Box', plural: 'YP — Buy Boxes' },
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
    // ── Appearance ──────────────────────────────────────────────
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'select',
      defaultValue: 'inkDeep',
      options: [
        { label: 'Ink Deep (#0A1B2E)', value: 'inkDeep' },
        { label: 'Deep Navy (#0E2740)', value: 'navyDeep' },
        { label: 'Navy (#12314D)', value: 'navy' },
        { label: 'Teal (#0A8FB0)', value: 'teal' },
        { label: 'Cool Light (#F1F4F7)', value: 'off' },
        { label: 'Paper / White (#FFFFFF)', value: 'paper' },
        { label: 'Cream (#FAF8F2)', value: 'cream' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'backgroundColorCustom',
      label: 'Custom Background Color (hex)',
      type: 'text',
      admin: { condition: (_, s) => s?.backgroundColor === 'custom' },
    },
    {
      name: 'backgroundType',
      label: 'Background Type',
      type: 'select',
      defaultValue: 'image',
      options: [
        { label: 'Color', value: 'color' },
        { label: 'Image', value: 'image' },
      ],
    },
    {
      name: 'backgroundImage',
      label: 'Background Image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, s) => s?.backgroundType === 'image',
        description: 'Full-bleed image behind the dark overlay (e.g. athlete at rest).',
      },
    },
    { name: 'grain', label: 'Grain Texture', type: 'checkbox', defaultValue: false },
    // ── Head ────────────────────────────────────────────────────
    {
      name: 'heading',
      label: 'Heading',
      type: 'richText',
      localized: true,
      editor: headingEditor,
      admin: { description: 'Apply teal color to a phrase. Shift+Enter for a line break.' },
    },
    {
      name: 'sub',
      label: 'Subtitle',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Supports live-price tokens, e.g. "{{price:core:4}}" → visitor-currency rate.',
      },
    },
    // ── Options ─────────────────────────────────────────────────
    {
      name: 'options',
      labels: { singular: 'Option', plural: 'Options' },
      type: 'array',
      admin: { description: 'Pricing options (the source uses two: Core + Advanced).' },
      fields: [
        { name: 'name', label: 'Name', type: 'text', localized: true, required: true, admin: { description: 'e.g. "Core".' } },
        {
          name: 'planFamily',
          label: 'Plan Family (live pricing)',
          type: 'select',
          options: [
            { label: 'Core', value: 'core' },
            { label: 'Advanced', value: 'advanced' },
          ],
          admin: {
            description:
              'Drives the live headline price (the 4-month rate, fetched from the subscriptions API). Leave empty to hide the price.',
          },
        },
        { name: 'priceSuffix', label: 'Price Suffix', type: 'text', localized: true, defaultValue: '/mo', admin: { description: 'Small text after price (e.g. "/mo").' } },
        { name: 'altLabel', label: 'Alt Pill Label', type: 'text', localized: true, admin: { hidden: true, description: 'Retired with the 1-month-standard model (the "€109/mo monthly" pill). Hidden from the admin UI and no longer rendered; kept in the schema so no migration is needed.' } },
        { name: 'description', label: 'Description', type: 'textarea', localized: true },
        { name: 'ctaLabel', label: 'CTA Label', type: 'text', localized: true, admin: { description: 'e.g. "Order Core kit" — the → arrow is added automatically.' } },
        { name: 'ctaHref', label: 'CTA URL', type: 'text', localized: true, defaultValue: '#' },
        { name: 'recommended', label: 'Recommended (lime accent)', type: 'checkbox', defaultValue: false },
        { name: 'recFlagLabel', label: 'Recommended Flag Label', type: 'text', localized: true, defaultValue: 'Recommended', admin: { condition: (_, s) => !!s?.recommended } },
      ],
    },
    // ── Footer ──────────────────────────────────────────────────
    {
      name: 'buyNote',
      label: 'Note',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Supports live-price tokens, e.g. "Core runs month-to-month at {{price:core:1}}." Resolves to the visitor’s currency.',
      },
    },
    {
      name: 'trust',
      labels: { singular: 'Trust Item', plural: 'Trust Items' },
      type: 'array',
      admin: { description: 'Checkmarked items in the bottom trust row.' },
      fields: [{ name: 'text', label: 'Text', type: 'text', localized: true, required: true }],
    },
  ],
}
