import type { Block } from 'payload'

/**
 * The numbered step flow — designer brief §5's step-by-step section.
 *
 * Renders an `<ol>`, so the numbers come from the list rather than from digits
 * an editor typed into each title. That is not pedantry: hand-typed numbers go
 * wrong the first time a step is reordered or deleted, and they are read aloud
 * twice by a screen reader that is already announcing "item 3 of 5".
 *
 * `minRows: 2` — one step is not a flow, and the design reads as broken with a
 * single item.
 */
export const StepFlow: Block = {
  slug: 'stepFlow',
  interfaceName: 'StepFlowBlock',
  labels: { singular: 'Step flow', plural: 'Step flows' },
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      localized: true,
      admin: { description: 'Optional heading above the steps.' },
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 8,
      labels: { singular: 'Step', plural: 'Steps' },
      admin: {
        description:
          'Numbered automatically. Do not type "1." into the titles — reordering would leave them wrong.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          admin: { description: 'Optional. One or two sentences.' },
        },
      ],
    },
  ],
}
