import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-08.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrAdvanced.defaults.json, not retyped.
 *
 * Core against Advanced: a heading, a badge, three cards of three bullets each, and
 * a closing line with a link to the plans page.
 *
 * NOT the Our Plans block of the same name, and not a variant of it. Both sections
 * are exactly 961px tall, which is what made it worth measuring rather than
 * assuming: 22% outline similarity. Our Plans' cards have no icons and a different
 * inner structure.
 *
 * THE THREE CARDS ARE BOUND BY INDEX. Each carries a different icon, and the
 * tinted badge behind it is a different colour per card — blue, lime, orange. Both
 * are drawing rather than content, and a repeat takes its children from the first
 * instance. Everything else about the three is identical; only the icon holds them
 * apart.
 *
 * The bullet rows INSIDE each card do repeat. A repeat nested inside an
 * index-bound parent is fine — the rows are identical in style and nothing in one
 * is drawn.
 *
 * Every interpolated value here comes through the mockup's `sc-interp` wrapper,
 * including each bullet's own span. Which spans those are was checked against the
 * LIVE DOM rather than inferred from the manifest, because the previous block
 * shipped nine extra spans that way and the harness could only report the result
 * as "not comparable".
 */
export const RdPrAdvancedBlock: Block = {
  slug: "rdPrAdvanced",
  interfaceName: "RdPrAdvancedBlock",
  labels: { singular: "RdPrAdvanced", plural: "RdPrAdvanced" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "advanced" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), defaultValue: {
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "Every plan starts with the same gut reading, and the formula built from it. Advanced then adds three things, and they work as one loop: we measure again, we rebuild from the new numbers, and we add a blood panel so the doses land on measured levels rather than on how you say you feel." },
    { name: "tag", type: "text", localized: true, label: "Badge", admin: { description: "The lime pill under the standfirst." }, defaultValue: "Advanced only" },
    {
      name: "cards", type: 'array', label: "Cards", admin: { description: "Exactly three. Each has its own icon and badge colour drawn into the markup, so a fourth would store fine and render nothing." },
      defaultValue: [
        {
          "meta": "Every cycle",
          "title": "The retest",
          "body": "We re-read your gut and your blood on the same methods, so the new numbers are comparable to the old ones rather than a fresh opinion.",
          "rows": [
            {
              "text": "The same eight patterns, re-scored"
            },
            {
              "text": "Your blood markers, measured again"
            },
            {
              "text": "You see what moved, and by how much"
            }
          ]
        },
        {
          "meta": "Every cycle",
          "title": "A rebuilt formula",
          "body": "Your formula is not topped up from the last one. It is built again from the new reading, so strains and doses follow where your gut has actually got to.",
          "rows": [
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
          "meta": "From cycle one",
          "title": "The blood panel",
          "body": "Your gut read says what your microbes can do. A blood panel says what actually reached you, so doses land on measured levels instead of on symptoms.",
          "rows": [
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
        { name: "meta", type: "text", localized: true, label: "Timing", admin: { description: "The small uppercase line beside the icon." } },
        { name: "title", type: "text", localized: true, required: true, label: "Title", admin: { description: "One line." } },
        { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "Two or three lines." } },
        {
          name: "rows", type: 'array', label: "Bullets", admin: { description: "Three per card in the mockup. Any number works \u2014 these repeat properly." },
          fields: [
            { name: "text", type: "text", localized: true, required: true, label: "Line", admin: { description: "The dot is drawn by the design." } },
          ],
        },
      ],
    },
    { name: "footerText", type: "richText", localized: true, editor: redesignInlineEditor, label: "Closing line", admin: { description: "The heavier run at the end is bold in the mockup at weight 500, which is what this page renders bold as." }, defaultValue: {
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
    localizedLink({
      overrides: {
          name: "footerLink",
          label: "Closing link",
          admin: { description: "The \u2192 IS part of the label \u2014 type it. The mockup points at the Our Plans page; currently \"#\"." },
          defaultValue: {
          "url": "#",
          "label": "Compare Core and Advanced →"
        },
      },
    }),
  ],
}
