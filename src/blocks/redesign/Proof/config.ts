import type { Block } from 'payload'
import { redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-04.json — defaults are the mockup's own values.
 *
 * The one judgement call in this block: the before/after numbers are NUMBER
 * fields, and everything that restates them is derived rather than stored.
 *
 * The mockup hard-codes, per card, a before value, an after value, a delta pill
 * ("▲ 2.0"), a filled bar segment and two dot positions. Stored separately, an
 * editor who changes 6 → 7 gets a card whose pill, bar and dots all still
 * describe the old number. The rule `higherIsBetter ? v / max : (max - v) / max`
 * reproduces all four of the mockup's bars exactly (6→8 gives 60→80; 6→3 gives
 * 40→70; 8→3 gives 20→70; 7→5 gives 30→50), so the bar, the dots, the two
 * displayed values and the delta pill are all computed from `from`, `to`,
 * `scaleMax` and `higherIsBetter`. Same for the ring: `value` and `prior` are
 * numbers, and the ↑ glyph, the "11.9 pts" pill and "up from 68.3" follow.
 *
 * `summary` stays an editorial sentence rather than an assembled one — building
 * "Up 2.0 points. Higher is better." from fragments does not survive nine
 * locales. It restates the numbers, so its description says to keep it in step.
 *
 * Numbers are formatted per locale (Intl.NumberFormat, one decimal), which the
 * mockup's hard-coded "6" / "8.0" strings could not do.
 */
export const RdProofBlock: Block = {
  slug: 'rdProof',
  interfaceName: 'RdProofBlock',
  labels: { singular: 'RD Proof', plural: 'RD Proofs' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'proof',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized.' },
    },
    { name: 'heading', type: 'text', localized: true, defaultValue: "We don't promise change. We show it to you." },
    { name: 'intro', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
      "root": {
            "type": "root",
            "children": [
                  {
                        "type": "paragraph",
                        "children": [
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "Retest your gut and see ",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 1,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "exactly what moved",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": ". The same markers, re-measured before and after. One number, ",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 1,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "objectively re-scored",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": ".",
                                    "version": 1
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1,
                        "textFormat": 0
                  }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "version": 1
      }
} },
    {
      name: 'score',
      type: 'group',
      label: 'Overall score ring',
      admin: {
        description:
          'The example retest score. `value` and `prior` are numbers; the arrow, '
          + 'the delta pill and the "up from" line are computed from them, so they '
          + 'cannot drift out of step with each other.',
      },
      fields: [
        { name: 'value', type: 'number', required: true, defaultValue: 80.2, label: 'Score after' },
        { name: 'prior', type: 'number', required: true, defaultValue: 68.3, label: 'Score before' },
        { name: 'scale', type: 'text', localized: true, defaultValue: "out of 100", label: 'Scale caption' },
        { name: 'deltaUnit', type: 'text', localized: true, defaultValue: "pts", label: 'Delta unit' },
        { name: 'priorPrefix', type: 'text', localized: true, defaultValue: "up from", label: 'Prior prefix' },
        { name: 'caption', type: 'text', localized: true, defaultValue: "Overall microbiome score" },
      ],
    },
    { name: 'availability', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
      "root": {
            "type": "root",
            "children": [
                  {
                        "type": "paragraph",
                        "children": [
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "Retesting is built into ",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 1,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "Advanced",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": ": your first at the end of your first cycle, then every second cycle. On ",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 1,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "Core",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": ", add a retest whenever you want to see your change. The score is what we measure; how it feels is what members tell us, self-reported alongside each retest.",
                                    "version": 1
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1,
                        "textFormat": 0
                  }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "version": 1
      }
} },
    {
      name: 'cards',
      type: 'array',
      label: 'Marker cards',
      admin: {
        description:
          'A horizontal snap rail below 900px and a grid above it. Tapping a card '
          + 'flips it to the explanation on the back.',
      },
      defaultValue: [
      {
            "metric": "Sleep quality",
            "goal": "Sleep deeper",
            "from": 6,
            "to": 8,
            "scaleMax": 10,
            "higherIsBetter": true,
            "scaleSuffix": "/10",
            "scaleLow": "Worse",
            "scaleHigh": "Better",
            "summary": "Up 2.0 points. Higher is better.",
            "backLabel": "Behind the number",
            "backBody": "Sleep is self-reported and logged alongside your gut score at each retest. As fibre-fed species recover early in a cycle, sleep and energy tend to be among the first signals people notice shifting."
      },
      {
            "metric": "Fatigue",
            "goal": "More energy",
            "from": 6,
            "to": 3,
            "scaleMax": 10,
            "higherIsBetter": false,
            "scaleSuffix": "/10",
            "scaleLow": "Worse",
            "scaleHigh": "Better",
            "summary": "Down 3.0 points. Lower is better.",
            "backLabel": "Behind the number",
            "backBody": "Energy is one of the self-reported markers tracked against your gut score. In the early weeks, as bifidobacteria respond and fermentation picks back up, daytime energy is often where people report the earliest change."
      },
      {
            "metric": "Bloating",
            "goal": "Less bloating",
            "from": 8,
            "to": 3,
            "scaleMax": 10,
            "higherIsBetter": false,
            "scaleSuffix": "/10",
            "scaleLow": "Worse",
            "scaleHigh": "Better",
            "summary": "Down 5.0 points. Lower is better.",
            "backLabel": "Behind the number",
            "backBody": "Bloating is the most direct read on how the gut is running day to day. As an ecosystem moves from a protein-driven state back toward a fibre-fed one, digestive comfort is usually where change shows up first."
      },
      {
            "metric": "Stress",
            "goal": "Calmer days",
            "from": 7,
            "to": 5,
            "scaleMax": 10,
            "higherIsBetter": false,
            "scaleSuffix": "/10",
            "scaleLow": "Worse",
            "scaleHigh": "Better",
            "summary": "Down 2.0 points. Lower is better.",
            "backLabel": "Behind the number",
            "backBody": "Stress is self-reported alongside each retest. The gut and the systems governing stress are in constant chemical exchange, so it tends to be a slower-moving marker, usually consolidating in the back half of a cycle."
      }
],
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Card photograph' },
        { name: 'metric', type: 'text', localized: true, required: true },
        { name: 'goal', type: 'text', localized: true },
        {
          name: 'from',
          type: 'number',
          required: true,
          label: 'Before',
          admin: { width: '25%' },
        },
        { name: 'to', type: 'number', required: true, label: 'After', admin: { width: '25%' } },
        {
          name: 'scaleMax',
          type: 'number',
          required: true,
          defaultValue: 10,
          label: 'Scale maximum',
          admin: { width: '25%' },
        },
        {
          name: 'higherIsBetter',
          type: 'checkbox',
          defaultValue: false,
          label: 'Higher is better',
          admin: {
            width: '25%',
            description: 'Flips which end of the bar counts as progress.',
          },
        },
        { name: 'scaleSuffix', type: 'text', localized: true, label: 'Value suffix' },
        { name: 'scaleLow', type: 'text', localized: true, label: 'Left end label' },
        { name: 'scaleHigh', type: 'text', localized: true, label: 'Right end label' },
        {
          name: 'orb',
          type: 'upload',
          relationTo: 'media',
          label: 'After-marker orb',
          admin: { description: 'The blob that sits on the bar at the after value.' },
        },
        {
          name: 'summary',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Says the movement in words. It restates Before/After, so change it '
              + 'when you change them.',
          },
        },
        { name: 'backLabel', type: 'text', localized: true, label: 'Back-of-card label' },
        { name: 'backBody', type: 'textarea', localized: true, label: 'Back-of-card body' },
      ],
    },
    { name: 'footnote', type: 'text', localized: true, defaultValue: "An example retest, around four months in. Individual responses vary; your own retest measures your markers, before and after." },
  ],
}
