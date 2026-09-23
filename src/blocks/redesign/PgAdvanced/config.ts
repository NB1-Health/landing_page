import type { Block } from 'payload'
import { redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-03.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgAdvanced.defaults.json, not retyped.
 *
 * The dark band that explains what Advanced adds: a heading, a paragraph, an
 * orange "Advanced only" tag, three cards, and a closing line.
 *
 * `cards` is an array of exactly THREE, and the markup binds it BY INDEX rather
 * than repeating it. Each card carries its own drawn icon — a squiggle, a
 * clipboard, a blood drop — and the third is tinted orange rather than blue, so
 * there is no single template the three could share. A fourth row would store fine
 * and render nothing; three is the design, not a limit that was overlooked.
 *
 * The icons are drawn SVG, not uploads. Two of the three are stroked in a CSS
 * variable so they take the section's own colour, which an uploaded file cannot do,
 * and none of them has a second version to choose between.
 *
 * `footnote` is rich text because the mockup bolds one clause of it — "Your
 * existing reading carries over" — and which clause carries the weight is
 * editorial. The bold survives into the default as Lexical's format flag rather
 * than as markup.
 */
export const RdPgAdvancedBlock: Block = {
  slug: "rdPgAdvanced",
  interfaceName: "RdPgAdvancedBlock",
  labels: { singular: "PG Advanced", plural: "PG Advanced" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "advanced" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "Core reads you once. Advanced keeps reading." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Every plan starts with the same gut reading, and the formula built from it. Advanced then adds three things, and they work as one loop: we measure again, we rebuild from the new numbers, and we add a blood panel so the doses land on measured levels rather than on how you say you feel." },
    { name: "tagLabel", type: "text", localized: true, label: "Tag", admin: { description: "The orange chip under the paragraph. Leave empty and no chip is drawn." }, defaultValue: "Advanced only" },
    {
      name: "cards", type: 'array', label: "Cards", admin: { description: "Exactly three. Each is drawn with its own icon, which is part of the design rather than a field \u2014 a fourth row would save but never appear." },
      defaultValue: [
        {
          "chip": "Every cycle",
          "title": "The retest",
          "body": "We re-read your gut and your blood on the same methods, so the new numbers are comparable to the old ones rather than a fresh opinion.",
          "points": [
            {
              "label": "The same eight patterns, re-scored"
            },
            {
              "label": "Your blood markers, measured again"
            },
            {
              "label": "Your overall score, measured again"
            },
            {
              "label": "You see what moved, and by how much"
            }
          ]
        },
        {
          "chip": "Every cycle",
          "title": "A rebuilt formula",
          "body": "Your formula is not topped up from the last one. It is built again from the new reading, so strains and doses follow where your gut has actually got to.",
          "points": [
            {
              "label": "Strains that did their job are stepped down"
            },
            {
              "label": "Levels that read low pull in what they need"
            },
            {
              "label": "Fibres re-matched to how you now ferment"
            }
          ]
        },
        {
          "chip": "From cycle one",
          "title": "The blood panel",
          "body": "Your gut read says what your microbes can do. A blood panel says what actually reached you, so doses land on measured levels instead of on symptoms.",
          "points": [
            {
              "label": "Vitamin D3, the most common shortfall"
            },
            {
              "label": "Homocysteine, for B-vitamin need"
            },
            {
              "label": "Omega-3 index and ferritin"
            }
          ]
        }
      ],
      fields: [
        { name: "chip", type: "text", localized: true, label: "Cadence", admin: { description: "The small label beside the icon \u2014 \"Every cycle\", \"From cycle one\"." } },
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
        {
          name: "points", type: 'array', label: "Bullets", admin: { description: "Each row is drawn with its own dot." },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
    { name: "footnote", type: "richText", localized: true, editor: redesignInlineEditor, label: "Closing line", admin: { description: "Bold marks the clause that carries the promise; the rest is plain." }, defaultValue: {
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
                  "text": "You can start on Core and move up at any cycle boundary. ",
                  "version": 1
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 1,
                  "mode": "normal",
                  "style": "",
                  "text": "Your existing reading carries over",
                  "version": 1
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": ", so nothing is re-collected and nothing restarts.",
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
}
