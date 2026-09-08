import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { adminOnly, adminOrEditor } from '@/access/roles'
import { OutcomesBlock } from '@/blocks/Outcomes/config'
import { YpPlansBlock } from '@/blocks/yourPlanBlocks/Plans/config'

/** Shared content, not a copy per creator. Publishing updates every linked landing page. */
export const InfluencerTemplates: CollectionConfig = {
  slug: 'influencer-templates',
  dbName: 'inf_tpl',
  labels: { singular: 'Influencer template', plural: 'Influencer templates' },
  admin: {
    useAsTitle: 'title',
    description:
      'Shared layout content for influencer pages. Preview changes through a linked influencer page before publishing. Prices come from the checkout catalogue; do not enter fixed prices or unverified claims.',
    defaultColumns: ['title', 'key', '_status'],
  },
  access: {
    admin: adminOrEditor,
    read: authenticatedOrPublished,
    readVersions: adminOrEditor,
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOnly,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Use "default" for the template used by existing pages without an explicit selection.',
      },
    },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'timelineHeading', type: 'text', localized: true },
    { name: 'timelineAccent', type: 'text', localized: true },
    {
      name: 'timeline',
      type: 'array',
      maxRows: 4,
      admin: {
        description:
          'Up to four milestones. Use {name} for the creator name. Keep shared wording valid for every linked discount; per-creator offer details belong on the influencer record.',
      },
      fields: [
        { name: 'when', type: 'text', localized: true, required: true },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'description', type: 'text', localized: true },
        { name: 'gift', type: 'checkbox', defaultValue: false },
      ],
    },
    { name: 'scienceHeading', type: 'text', localized: true },
    { name: 'scienceCopy', type: 'textarea', localized: true },
    {
      name: 'scientists',
      type: 'array',
      maxRows: 6,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'portrait', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [OutcomesBlock, YpPlansBlock],
      admin: {
        description:
          'Shared outcomes and plans. On influencer pages, ALL plan CTAs automatically preserve the offer and use localized checkout routes; configured CTA URLs are ignored.',
      },
    },
    { name: 'offerBackground', type: 'upload', relationTo: 'media' },
    {
      name: 'offerBadge',
      type: 'text',
      localized: true,
      admin: { description: 'For example: Gift from {name}. No discount amount is inferred.' },
    },
    {
      name: 'offerFinePrint',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Shared offer/kit terms. Ensure these match the current checkout policy.',
      },
    },
    {
      name: 'footerLinks',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'page', type: 'relationship', relationTo: 'pages', required: true },
      ],
    },
    { name: 'footerCopy', type: 'textarea', localized: true },
  ],
  versions: { drafts: { autosave: { interval: 5000 } }, maxPerDoc: 20 },
}
