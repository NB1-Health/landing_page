import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-03.json — defaults are the mockup's own values.
 *
 * Three tabs, three panels — but NOT three of the same thing. Observed by
 * clicking them in the mockup rather than inferred: tab 0 shows the morning
 * protocol, tab 1 the evening one, tab 2 the living layer, and each panel has a
 * genuinely different shape. Morning has a hero item, a "why" box, strain chips
 * and a list of extras; evening is a list of items with a note; the living layer
 * has a hero item, a "why" box and dose chips.
 *
 * So they are three named GROUPS rather than an array of three. An array would
 * mean a union of every panel's fields, most of them blank on any given row, and
 * an editor guessing which ones this tab actually renders.
 *
 * `intro` carries "96+ ingredients" in blue-grey and `note` an orange cross —
 * both are named colour tokens on the text node, never bold standing in for a
 * colour.
 */
export const RdFormulaBlock: Block = {
  slug: 'rdFormula',
  interfaceName: 'RdFormulaBlock',
  labels: { singular: 'RD Formula', plural: 'RD Formulas' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'formula',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized.' },
    },
    { name: 'heading', type: 'richText', localized: true, editor: makeRedesignHeadingEditor(['h2']), defaultValue: {
      "root": {
            "type": "root",
            "children": [
                  {
                        "type": "heading",
                        "children": [
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "What's actually",
                                    "version": 1
                              },
                              {
                                    "type": "linebreak",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "in your formula.",
                                    "version": 1
                              }
                        ],
                        "direction": "ltr",
                        "format": "",
                        "indent": 0,
                        "version": 1,
                        "tag": "h2"
                  }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "version": 1
      }
} },
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
                                    "text": "From a library of ",
                                    "version": 1
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": "96+ ingredients",
                                    "version": 1,
                                    "$": {
                                          "color": "rd-blue-grey"
                                    }
                              },
                              {
                                    "type": "text",
                                    "detail": 0,
                                    "format": 0,
                                    "mode": "normal",
                                    "style": "",
                                    "text": ", only the ones your biology calls for — each dosed to your gut reading. Never a default.",
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
    { name: 'replacesLabel', type: 'text', localized: true, defaultValue: "One subscription, in place of" },
    {
      name: 'replaces',
      type: 'array',
      label: 'Replaces',
      admin: { description: 'The products this subscription stands in for.' },
      defaultValue: [
      {
            "label": "greens powder"
      },
      {
            "label": "probiotic"
      },
      {
            "label": "omega"
      },
      {
            "label": "magnesium"
      },
      {
            "label": "adaptogens"
      }
],
      fields: [{ name: 'label', type: 'text', localized: true, required: true }],
    },
    { name: 'kitImage', type: 'upload', relationTo: 'media', label: 'Kit photograph' },
    { name: 'imageCaption', type: 'text', localized: true, defaultValue: "An example kit" },
    {
      name: 'morning',
      type: 'group',
      label: 'Activate panel',
      admin: { description: 'Tab "Activate" and the panel it shows.' },
      fields: [
        { name: 'tabLabel', type: 'text', localized: true, required: true, defaultValue: "Activate" },
        { name: 'heading', type: 'text', localized: true, defaultValue: "Morning protocol · with your first meal" },
        { name: 'itemName', type: 'text', localized: true, defaultValue: "Probiotic Capsule" },
        { name: 'itemMeta', type: 'text', localized: true, defaultValue: "5 strains · AM" },
        { name: 'whyLabel', type: 'text', localized: true, defaultValue: "Why it's in this formula" },
        { name: 'whyBody', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
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
                                                            "text": "This reading showed ",
                                                            "version": 1
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 1,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": "Bifidobacteria low at 1.3%.",
                                                            "version": 1
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 0,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": " These five strains are matched to that part of it.",
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
          name: 'strains',
          type: 'array',
          label: 'Strain chips',
          defaultValue: [
          {
                    "label": "B. longum 1714"
          },
          {
                    "label": "B. lactis B420"
          },
          {
                    "label": "B. lactis BB-12"
          },
          {
                    "label": "L. acidophilus NCFM"
          }
],
          fields: [{ name: 'label', type: 'text', localized: true, required: true }],
        },
        {
          name: 'extras',
          type: 'array',
          label: 'Other morning items',
          defaultValue: [
          {
                    "name": "Omega & Antioxidant Softgel",
                    "meta": "2 softgels · AM"
          },
          {
                    "name": "Polyphenol Capsule",
                    "meta": "1 capsule · AM"
          },
          {
                    "name": "Morning Wellness Capsule",
                    "meta": "1 capsule · AM"
          }
],
          fields: [
            { name: 'name', type: 'text', localized: true, required: true },
            { name: 'meta', type: 'text', localized: true },
          ],
        },
      ],
    },
    {
      name: 'evening',
      type: 'group',
      label: 'Restore panel',
      admin: { description: 'Tab "Restore" and the panel it shows.' },
      fields: [
        { name: 'tabLabel', type: 'text', localized: true, required: true, defaultValue: "Restore" },
        { name: 'heading', type: 'text', localized: true, defaultValue: "Evening protocol · before bed" },
        {
          name: 'items',
          type: 'array',
          label: 'Evening items',
          admin: {
            description:
              'Tick "Left out" to show an item as assessed and excluded — it renders '
              + 'struck through and dimmed, which is the design\'s way of saying '
              + 'nothing is added by default.',
          },
          defaultValue: [
          {
                    "name": "Magnesium Capsule",
                    "meta": "300mg · PM",
                    "leftOut": false
          },
          {
                    "name": "Evening Wellness Capsule",
                    "meta": "Left out",
                    "leftOut": true
          }
],
          fields: [
            { name: 'name', type: 'text', localized: true, required: true },
            { name: 'meta', type: 'text', localized: true },
            { name: 'leftOut', type: 'checkbox', defaultValue: false, label: 'Left out' },
          ],
        },
        { name: 'note', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
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
                                                            "text": "✕",
                                                            "version": 1,
                                                            "$": {
                                                                      "color": "rd-orange"
                                                            }
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 0,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": "Evening Wellness was assessed and left out — your diagnostic didn't warrant it. Nothing is added by default.",
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
      ],
    },
    {
      name: 'living',
      type: 'group',
      label: 'Nourish panel',
      admin: { description: 'Tab "Nourish" and the panel it shows.' },
      fields: [
        { name: 'tabLabel', type: 'text', localized: true, required: true, defaultValue: "Nourish" },
        { name: 'heading', type: 'text', localized: true, defaultValue: "The living layer · any time of day" },
        { name: 'itemName', type: 'text', localized: true, defaultValue: "Precision Prebiotic Powder" },
        { name: 'itemMeta', type: 'text', localized: true, defaultValue: "8g · daily" },
        { name: 'whyLabel', type: 'text', localized: true, defaultValue: "Why this dose" },
        { name: 'whyBody', type: 'richText', localized: true, editor: redesignInlineEditor, defaultValue: {
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
                                                            "text": "Fibre matched to ",
                                                            "version": 1
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 1,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": "your gut's fermentation machinery.",
                                                            "version": 1
                                                  },
                                                  {
                                                            "type": "text",
                                                            "detail": 0,
                                                            "format": 0,
                                                            "mode": "normal",
                                                            "style": "",
                                                            "text": " The same fibre acts differently in different guts, so yours is sized to yours — not a fixed dose.",
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
          name: 'chips',
          type: 'array',
          label: 'Dose chips',
          defaultValue: [
          {
                    "label": "Inulin blend · 6g"
          },
          {
                    "label": "Resistant starch · 2g"
          }
],
          fields: [{ name: 'label', type: 'text', localized: true, required: true }],
        },
      ],
    },
  ],
}
