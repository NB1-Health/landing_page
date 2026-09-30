import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-05.json — defaults are the mockup's own values.
 *
 * Six orbs sit at fixed points around a hand-drawn diagram: six connector rails,
 * a nucleus, a scatter of specks, and six SMIL particles that travel the rails
 * inward. The positions are not on a true circle — the rails end at hand-placed
 * coordinates in the SVG's own 360-unit box, and each orb's ring and core colour
 * is a CSS custom property set per position. So the geometry and the colours stay
 * in the component and only the six LABELS are fields, bound per index, exactly
 * as the hero's bubbles are. An editor who could move an orb would detach it from
 * its rail.
 *
 * The array is therefore fixed at six rows: a seventh has nowhere to sit.
 *
 * Tapping an orb rings it AND opens a panel over the page — `revealBody` and
 * `readFrom` on that orb's row. The panel's markup lives outside every section in
 * the mockup's DOM (a page-level overlay, display:none at rest), which is why a
 * first pass that read only the section found no reveal at all.
 *
 * Each orb also carries a `data-domain` (energy, resilience, immunity, gut, sleep,
 * resilience — five domains across six orbs). Nothing reads it: the panel's copy
 * is per orb, not per domain. Kept as a static attribute rather than modelled as
 * a field with no consumer.
 */
export const RdBiologyBlock: Block = {
  slug: 'rdBiology',
  interfaceName: 'RdBiologyBlock',
  labels: { singular: 'RD Biology', plural: 'RD Biologies' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'biology',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized.' },
    },
    { name: 'heading', type: 'text', localized: true, required: true, defaultValue: "Your gut is where your body tells us what you need." },
    { name: 'intro', type: 'textarea', localized: true, defaultValue: "It is the richest read on your whole body: which species are present, and how they ferment fibre. We read how your gut is working, then build exactly that." },
    {
      name: 'centreLabel',
      type: 'text',
      localized: true,
      label: 'Centre label',
      admin: { description: 'The caption under the nucleus, inside the diagram.' },
      defaultValue: "YOUR GUT",
    },
    {
      name: 'bubbles',
      type: 'array',
      label: 'Orb labels',
      minRows: 6,
      maxRows: 6,
      admin: {
        description:
          'Exactly six, in clockwise order from the top. Each one is pinned to a '
          + 'rail drawn into the diagram, so rows cannot be added, removed or '
          + 'reordered — only relabelled.',
      },
      defaultValue: [
      {
            "label": "Energy",
            "revealBody": "Fibre-fermenting species turn what you eat into short-chain fatty acids. Whether that machinery is running shows up directly in your reading.",
            "readFrom": "Butyrate producers · fermentation capacity"
      },
      {
            "label": "Focus",
            "revealBody": "Your gut and brain trade signals constantly. We read the species involved in that exchange, and whether they are present in useful numbers.",
            "readFrom": "Species diversity · metabolic output"
      },
      {
            "label": "Immunity",
            "revealBody": "Most of your immune tissue sits along the gut wall. The species that maintain that barrier are measurable, and so is their absence.",
            "readFrom": "Barrier species · Bifidobacteria"
      },
      {
            "label": "Digestion",
            "revealBody": "Fibre degraders and cross-feeders determine how comfortably food is processed. This is the most direct read in your report.",
            "readFrom": "Fibre degraders · cross-feeders"
      },
      {
            "label": "Sleep",
            "revealBody": "Some of the same metabolites tied to rest are made in the gut. We read what is producing them, and at what level.",
            "readFrom": "Metabolic pathways · SCFA balance"
      },
      {
            "label": "Stress",
            "revealBody": "Sustained stress changes which species dominate. That shift is visible in your reading before you would notice it elsewhere.",
            "readFrom": "Proteolytic guild · team balance"
      }
],
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        {
          name: 'revealBody',
          type: 'textarea',
          localized: true,
          label: 'What we read',
          admin: { description: 'Shown in the panel that opens when this orb is tapped.' },
        },
        {
          name: 'readFrom',
          type: 'text',
          localized: true,
          label: 'Read from',
          admin: { description: 'The markers line at the foot of that panel.' },
        },
      ],
    },
    {
      name: 'modal',
      type: 'group',
      label: 'Orb panel',
      admin: {
        description:
          'The panel that opens over the page when an orb is tapped. Its title and '
          + 'body come from the orb itself; only the fixed chrome lives here.',
      },
      fields: [
        { name: 'eyebrow', type: 'text', localized: true, defaultValue: "What your gut reveals" },
        {
          name: 'readFromLabel',
          type: 'text',
          localized: true,
          label: 'Markers line prefix',
          defaultValue: "Read from:",
        },
        {
          name: 'closeLabel',
          type: 'text',
          localized: true,
          label: 'Close button label',
          admin: { description: 'Read by screen readers; the button itself shows ✕.' },
          defaultValue: "Close",
        },
      ],
    },
    {
      name: 'hint',
      type: 'text',
      localized: true,
      admin: { description: 'The pill under the diagram.' },
      defaultValue: "Tap an orb to see what we read",
    },
  ],
}
