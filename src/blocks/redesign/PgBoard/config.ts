import type { Block } from 'payload'

import {
  closeLabelField,
  readBioLabelField,
  scientistsField,
} from '@/blocks/redesign/_shared/scienceBoard'

/**
 * GENERATED from manifests/section-09.json — every defaultValue is injected
 * from out/RdPgBoard.defaults.json, not retyped.
 *
 * Our Plans' science board: a heading, three cards in a three-column grid, and
 * a bio panel that opens over the page when a card is pressed.
 *
 * A NEW block rather than a variant of the homepage's rdLab, after comparing the
 * two section by section. They show the SAME board and the same nine fields per
 * person — so the FIELDS are shared, from _shared/scienceBoard.ts, and rdLab's
 * own Block definition is byte-identical after that refactor. What is not shared
 * is the markup: the homepage section has a cool-grey background, wraps
 * everything in one stack, sizes its heading in `cqi`, lays the cards out as a
 * horizontally scrolling flex rail, carries a three-row assurance strip this page
 * does not have, and renders its panel as a page-level sibling. This one is a
 * plain 1240px section, puts the heading and intro in their own 620px box, sizes
 * in `vw`, lays the cards out as a three-column grid, and holds the panel inside
 * the section. One component behind nine conditionals would be harder to read
 * than two.
 *
 * The copy is the same on both pages except one word: Polina's biography says
 * "personalised" here and "made-for-one" on the homepage. That is why the
 * defaults stay per block while the field list is shared.
 */
export const RdPgBoardBlock: Block = {
  slug: 'rdPgBoard',
  interfaceName: 'RdPgBoardBlock',
  labels: { singular: 'PG Board', plural: 'PG Board' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: "board",
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized — a fragment must be identical in every locale.' },
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
        "bio": "Polina leads the science behind NB1’s personalised supplementation product, from microbiome analysis and metabolic modelling to the algorithm that maps individual gut data into a precise, clinically grounded protocol.",
        "bioExtra": "She holds a PhD in Bioinformatics from the University of Luxembourg (2020–2024) and an MS in Integrated Systems Biology. Her doctoral research built computational workflows using graphs, time-series models, and deep learning to identify patterns in gut microbiome and multi-omics data.",
        "quote": "A supplement should be a readout of your biology, not a guess at the average. Our job is to turn what your gut is actually doing into a protocol that’s precise enough to trust.",
        "photo": null
      },
      {
        "name": "Dr. Marijn Lewis",
        "role": "Immunology & Gut Health · University of Zurich",
        "credentials": "PhD Biomedical Sciences · Gut Intelligence Consultancy founder",
        "panelEyebrow": "Science board",
        "panelCredentials": "PhD Biomedical Sciences, University of Zurich · Gut Intelligence Consultancy",
        "bio": "Dr. Lewis specialises in the microbiome’s role in gastrointestinal health, immunity, and personalised nutrition. Founder of Gut Intelligence Consultancy. PhD Biomedical Sciences, University of Zurich; MS Human Biology, University of Copenhagen.",
        "quote": "Gut health, immunity and nutrition are one connected system. Personalisation only works when you respect that. You can’t optimise one without reading the others.",
        "photo": null
      },
      {
        "name": "Dr. Koen Venema",
        "role": "Gut Microbiology · Wageningen University",
        "credentials": "254 publications · 17,000+ citations · Editor-in-chief, Beneficial Microbes",
        "panelEyebrow": "Science board",
        "panelCredentials": "Microbiome Expert · Wageningen University & Research · Beneficial Microbes Consultancy",
        "bio": "Dr. Venema is one of Europe’s most cited microbiome researchers, with 25 years of experience and 254 publications with more than 17,000 citations. Founder and CEO of Beneficial Microbes Consultancy, and editor-in-chief of the journal Beneficial Microbes.",
        "quote": "After twenty-five years studying these microbes, what convinces me is rigour: sequencing depth, reproducibility, and honest interpretation. That’s the standard I hold NB1’s science to.",
        "photo": null
      }
    ]),
    readBioLabelField("Read bio →"),
    closeLabelField("Close"),
  ],
}
