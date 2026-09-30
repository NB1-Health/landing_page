import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-08.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbAdvanced.defaults.json, not retyped.
 *
 * The dark band: what Advanced adds, in three cards.
 *
 * It is NOT Our Plans' rdPgAdvanced with different words. Measured before
 * building: 52% outline similarity — the closest any two sections on this page and
 * that one come, and still half of it different. That block's cards carry a meta
 * line, a title, a body and a bullet list with no icon and no chip; these carry a
 * 44px icon chip and a cadence label instead of the meta, and sit on a dark ground
 * the other has no notion of. Reusing it would have meant making the chip, the
 * cadence and the whole dark treatment optional — more change to a shipped block
 * than a new block costs.
 *
 * THE THREE CARDS ARE BOUND BY INDEX, NOT REPEATED. Their icons are three
 * different drawings — one path, then a rect and four paths, then two paths — and
 * a repeat takes its children from the template, so all three would have rendered
 * the first card's. Binding by index also means each card keeps its chip colour
 * verbatim, a blue tint on the first two and an orange one on the blood panel,
 * with nothing to bind and nothing to get out of step. Same choice #reads' cards
 * and #method's state key made.
 *
 * THE BULLET LISTS INSIDE THEM DO REPEAT. Identical rows, a 7px orange disc and a
 * line of text, and the mockup itself uses four, three and three — so the count
 * is free and the field description says so rather than warning about a fourth.
 *
 * The closing line is rich text. Its bold clause is in the MIDDLE of the sentence,
 * so splitting it into before/emphasis/after would fix the clause at an offset and
 * break the first time a translator moved it — the same call #formula's
 * `We use <b>strains</b>` made. Its inline `opacity: 1` is a no-op here, because
 * this paragraph dims with a translucent colour rather than with opacity, so rich
 * text loses nothing but the weight and `.rd-lb b` puts the 500 back.
 */
export const RdLbAdvancedBlock: Block = {
  slug: "rdLbAdvanced",
  interfaceName: "RdLbAdvancedBlock",
  labels: { singular: "RdLbAdvanced", plural: "RdLbAdvanced" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#advanced\". Deliberately NOT localized." }, defaultValue: "advanced" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Heading", admin: { description: "The section headline." }, defaultValue: {
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
                  "text": "Core reads you once. Advanced keeps reading.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The paragraph under the headline." }, defaultValue: "Everything above is in every plan. Advanced adds three things, and they work as one loop: we measure again, we rebuild from the new numbers, and we add a blood panel so the doses land on measured levels rather than on how you say you feel." },
    { name: "tag", type: "text", localized: true, label: "Tag", admin: { description: "The orange pill under the standfirst." }, defaultValue: "Advanced only" },
    {
      name: "cards", type: 'array', label: "What Advanced adds", admin: { description: "EXACTLY THREE. Each card carries its own icon and its own chip colour, both drawn into the markup, so a fourth row would save fine and render nothing. The bullet lists inside them DO repeat \u2014 the mockup has four, three and three, and any count works." },
      defaultValue: [
        {
          "cadence": "Every cycle",
          "title": "The retest",
          "body": "We re-read your gut and your blood on the same methods, so the new numbers are comparable to the old ones rather than a fresh opinion.",
          "points": [
            {
              "text": "The same eight patterns, re-scored"
            },
            {
              "text": "Your blood markers, measured again"
            },
            {
              "text": "Your overall score, measured again"
            },
            {
              "text": "You see what moved, and by how much"
            }
          ]
        },
        {
          "cadence": "Every cycle",
          "title": "A rebuilt formula",
          "body": "Your formula is not topped up from the last one. It is built again from the new reading, so strains and doses follow where your gut has actually got to.",
          "points": [
            {
              "text": "Strains that did their job are stepped down"
            },
            {
              "text": "Levels that read low pull in what they need"
            },
            {
              "text": "Fibres re-matched to how you now ferment"
            }
          ]
        },
        {
          "cadence": "From cycle one",
          "title": "The blood panel",
          "body": "Your gut read says what your microbes can do. A blood panel says what actually reached you, so doses land on measured levels instead of on symptoms.",
          "points": [
            {
              "text": "Vitamin D3, the most common shortfall"
            },
            {
              "text": "Homocysteine, for B-vitamin need"
            },
            {
              "text": "Omega-3 index and ferritin"
            }
          ]
        }
      ],
      fields: [
        { name: "cadence", type: "text", localized: true },
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
        {
          name: "points", type: 'array',
          fields: [
            { name: "text", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
    { name: "closing", type: "richText", localized: true, editor: redesignInlineEditor, label: "Closing line", admin: { description: "The last line of the section. Rich text, because its bold clause sits in the middle of the sentence rather than at either end." }, defaultValue: {
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
