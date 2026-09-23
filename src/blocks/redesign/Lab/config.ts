import type { Block } from 'payload'

import {
  closeLabelField,
  readBioLabelField,
  scientistsField,
} from '@/blocks/redesign/_shared/scienceBoard'

/**
 * GENERATED from manifests/section-06.json + section-16.json — defaults are the
 * mockup's own values.
 *
 * One array, `scientists`, carries BOTH halves: the card in the rail and the
 * panel that opens over the page when it is tapped. They are the same person and
 * the same photograph, so splitting them into two arrays would be two lists an
 * editor has to keep in the same order.
 *
 * The panel lives OUTSIDE this section in the mockup's DOM — a page-level
 * overlay holding all three panels, one shown at a time. It was extracted by
 * clicking each card in turn (manifest 16).
 *
 * The per-person fields and the two labels are SHARED with Our Plans' rdPgBoard,
 * which shows the same board with different markup — see _shared/scienceBoard.ts,
 * which also records why the three rows are fixed. `bioExtra` is the optional
 * second paragraph; it is hidden when empty. The defaults below are this page's
 * own and stay here.
 *
 * The three assurance icons are each a different hand-drawn glyph, so those
 * three are bound per index too rather than repeated from one template.
 */
export const RdLabBlock: Block = {
  slug: 'rdLab',
  interfaceName: 'RdLabBlock',
  labels: { singular: 'RD Lab', plural: 'RD Labs' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'lab',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized.' },
    },
    { name: 'heading', type: 'text', localized: true, required: true, defaultValue: "Who signs off your formula." },
    { name: 'intro', type: 'textarea', localized: true, defaultValue: "Real people with verifiable credentials. Every formula is approved by a scientist before it goes into production." },
    scientistsField([
      {
            "name": "Dr. Polina Novikova",
            "role": "Chief Scientific Officer",
            "credentials": "PhD Bioinformatics · University of Luxembourg · Microbiome & Multi-Omics",
            "panelEyebrow": "Chief Scientific Officer",
            "panelCredentials": "Chief Scientific Officer · PhD Bioinformatics, University of Luxembourg",
            "bio": "Polina leads the science behind NB1’s made-for-one supplementation product, from microbiome analysis and metabolic modelling to the algorithm that maps individual gut data into a precise, clinically grounded protocol.",
            "bioExtra": "She holds a PhD in Bioinformatics from the University of Luxembourg (2020–2024) and an MS in Integrated Systems Biology. Her doctoral research built computational workflows using graphs, time-series models, and deep learning to identify patterns in gut microbiome and multi-omics data.",
            "quote": "A supplement should be a readout of your biology, not a guess at the average. Our job is to turn what your gut is actually doing into a protocol that’s precise enough to trust."
      },
      {
            "name": "Dr. Marijn Lewis",
            "role": "Immunology & Gut Health · University of Zurich",
            "credentials": "PhD Biomedical Sciences · Gut Intelligence Consultancy founder",
            "panelEyebrow": "Science board",
            "panelCredentials": "PhD Biomedical Sciences, University of Zurich · Gut Intelligence Consultancy",
            "bio": "Dr. Lewis specialises in the microbiome’s role in gastrointestinal health, immunity, and personalised nutrition. Founder of Gut Intelligence Consultancy. PhD Biomedical Sciences, University of Zurich; MS Human Biology, University of Copenhagen.",
            "quote": "Gut health, immunity and nutrition are one connected system. Personalisation only works when you respect that. You can’t optimise one without reading the others."
      },
      {
            "name": "Dr. Koen Venema",
            "role": "Gut Microbiology · Wageningen University",
            "credentials": "254 publications · 17,000+ citations · Editor-in-chief, Beneficial Microbes",
            "panelEyebrow": "Science board",
            "panelCredentials": "Microbiome Expert · Wageningen University & Research · Beneficial Microbes Consultancy",
            "bio": "Dr. Venema is one of Europe’s most cited microbiome researchers, with 25 years of experience and 254 publications with more than 17,000 citations. Founder and CEO of Beneficial Microbes Consultancy, and editor-in-chief of the journal Beneficial Microbes.",
            "quote": "After twenty-five years studying these microbes, what convinces me is rigour: sequencing depth, reproducibility, and honest interpretation. That’s the standard I hold NB1’s science to."
      }
]),
    readBioLabelField("Read bio →"),
    closeLabelField("Close"),
    {
      name: 'assurances',
      type: 'array',
      label: 'Assurance strip',
      minRows: 3,
      maxRows: 3,
      admin: { description: 'Exactly three: each has its own icon drawn into the component.' },
      defaultValue: [
      {
            "label": "EU laboratories",
            "body": "Analysed in certified European labs."
      },
      {
            "label": "Shotgun sequencing",
            "body": "Species-level metagenomic resolution, not a basic 16S test."
      },
      {
            "label": "Human sign-off",
            "body": "Every formula reviewed by our science team before production."
      }
],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'body', type: 'textarea', localized: true },
      ],
    },
  ],
}
