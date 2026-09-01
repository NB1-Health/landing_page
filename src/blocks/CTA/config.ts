import type { Block } from 'payload'

/**
 * An editor-placed CTA mid-article.
 *
 * `conversionBlock` points at a record in the library; `body` and `buttonUrl`
 * remain as a per-article override and as the shape every existing block already
 * holds. Resolution order is record first, then the inline fields, then the
 * translated defaults — so selecting a record is never silently overridden by
 * copy left behind in the textarea.
 *
 * Centralising these is what makes testing a variant possible at all: conversion
 * wording buried inside 2,800 rich-text documents cannot be changed, only
 * rewritten.
 */
export const CtaBlock: Block = {
  slug: 'ctaBlock',
  interfaceName: 'CtaBlock',
  labels: {
    singular: 'Article CTA',
    plural: 'Article CTAs',
  },
  fields: [
    {
      name: 'conversionBlock',
      type: 'relationship',
      relationTo: 'conversion-blocks',
      admin: {
        description:
          'Pick the CTA from the library. Preferred — editing the record updates every article using it.',
      },
    },
    {
      name: 'body',
      label: 'Body Text',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          '1–3 sentences connecting the article topic to the NB1 kit. Override for this article only; ignored when a conversion block is selected.',
        condition: (_, siblingData) =>
          !(siblingData as { conversionBlock?: unknown })?.conversionBlock,
      },
    },
    {
      name: 'buttonUrl',
      label: 'Button URL',
      type: 'text',
      // No longer `required`: a block that gets its href from the selected record
      // has nothing to put here, and requiring it would block the save.
      defaultValue: '/order',
      admin: {
        condition: (_, siblingData) =>
          !(siblingData as { conversionBlock?: unknown })?.conversionBlock,
      },
    },
  ],
}
