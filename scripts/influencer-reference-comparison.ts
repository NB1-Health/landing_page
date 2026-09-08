import type { YpPlansBlock } from '@/payload-types'

/** The full comparison from the reference's embedded compare.js, as inert CMS data.
 * Prototype prices/minimum-term claims are replaced by live-price tokens and neutral duration copy.
 */
export const referenceComparison: NonNullable<YpPlansBlock['comparison']> = {
  toggleLabelClosed: 'Compare side by side',
  toggleLabelOpen: 'Hide full comparison',
  sections: [
    {
      title: 'Analysis',
      rows: [
        { id: 'gut', text: 'Gut microbiome sequencing, shotgun, species-level', cell: 'checkbox' },
        { id: 'report', text: 'Summary analysis report', cell: 'checkbox' },
        { id: 'deep', text: 'Full data output + deeper interpretation', cell: 'checkbox' },
        { id: 'blood', text: 'Blood biomarker panel', cell: 'checkbox' },
        {
          id: 'alternating',
          text: 'Alternating gut + blood cycles, from cycle 2',
          cell: 'checkbox',
        },
        { id: 'retests', text: 'Gut retests', cell: 'oneLine' },
      ],
    },
    {
      title: 'Your formula',
      rows: [
        { id: 'formula', text: 'Three-part personalised formula', cell: 'checkbox' },
        { id: 'packaging', text: 'Presorted, travel-ready packaging', cell: 'checkbox' },
        { id: 'rebuild', text: 'Formula rebuilds every cycle', cell: 'checkbox' },
        { id: 'addons', text: '125+ add-on ingredients', cell: 'checkbox' },
        { id: 'support', text: 'Priority support', cell: 'checkbox' },
      ],
    },
    {
      title: 'Commitment & billing',
      rows: [
        { id: 'terms', text: 'Subscription terms', cell: 'twoLine' },
        { id: 'billing', text: 'Charged on production, never before', cell: 'checkbox' },
      ],
    },
  ],
  cards: (['core', 'advanced'] as const).map((family) => {
    const advanced = family === 'advanced'
    return {
      label: advanced ? 'Advanced' : 'Core',
      planFamily: family,
      highlight: advanced,
      ctaLabel: advanced ? 'Start with Advanced' : 'Start with Core',
      ctaStyle: advanced ? 'lime' : 'out',
      features: {
        gut: true,
        report: true,
        deep: advanced,
        blood: advanced,
        alternating: advanced,
        retests: advanced ? 'Every other cycle' : 'On demand',
        formula: true,
        packaging: true,
        rebuild: advanced,
        addons: advanced,
        support: advanced,
        billing: true,
        terms: {
          v: '4-month plan',
          sub: advanced ? 'See checkout for available durations' : 'or {{price:core:1}}/mo monthly',
        },
      },
    }
  }),
}
