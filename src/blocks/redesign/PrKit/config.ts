import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-03.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrKit.defaults.json, not retyped.
 *
 * The stool kit: two paragraphs and a four-row fact table on the left, a labelled
 * photograph of the kit contents on the right.
 *
 * The two paragraphs are SEPARATE FIELDS, not an array. The mockup styles them
 * differently — the first is a `clamp()` that scales with the container with 18px
 * of top margin, the second a flat 15.5px with 14px — so a repeat would have given
 * both the first one's type.
 *
 * The four fact rows ARE a repeat, and this is the case where that is right: all
 * four are identical in style, and nothing in a row is drawn rather than written.
 * A fifth row renders correctly. Contrast the journey block's steps, which each
 * carry their own icon and had to be bound by index.
 *
 * Both fact cells come through the mockup's `sc-interp` wrapper and are bound with
 * `unwrap`, so the expression renders in the wrapper's place and no extra span
 * reaches the app.
 *
 * `guideLink` points at `protocol/FAQ.html` in the mockup — a path inside the
 * mockup bundle. Seeded as `#` with the page's other undecided destinations.
 */
export const RdPrKitBlock: Block = {
  slug: "rdPrKit",
  interfaceName: "RdPrKitBlock",
  labels: { singular: "RdPrKit", plural: "RdPrKit" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "kit" },
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
                  "text": "It starts with a small sample. A few minutes, at home.",
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
    { name: "intro", type: "textarea", localized: true, label: "Opening paragraph", admin: { description: "The larger of the two \u2014 its type scales with the container." }, defaultValue: "A small stool sample. A few tiny amounts into the tube, nothing more. Private, and done in minutes." },
    { name: "detail", type: "textarea", localized: true, label: "Second paragraph", admin: { description: "Set smaller than the first in the mockup. That is the design, not an accident." }, defaultValue: "Seal it, and send it back with the prepaid return included in your kit. Everything you need is in the box, and a replacement kit is free if anything goes wrong." },
    {
      name: "facts", type: 'array', label: "Fact rows", admin: { description: "Four in the mockup, label left and value right. A fifth renders fine \u2014 these are genuinely repeated, unlike the journey steps." },
      defaultValue: [
        {
          "label": "Time at home",
          "value": "A few minutes"
        },
        {
          "label": "What travels",
          "value": "The tube only"
        },
        {
          "label": "Return",
          "value": "Prepaid, included"
        },
        {
          "label": "If anything goes wrong",
          "value": "Replacement kit, free"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true, label: "Label", admin: { description: "Left side." } },
        { name: "value", type: "text", localized: true, label: "Value", admin: { description: "Right side, uppercase. Kept on one line by the design, so keep it short." } },
      ],
    },
    localizedLink({
      overrides: {
          name: "guideLink",
          label: "Guide link",
          admin: { description: "The \u2192 IS part of the label here \u2014 type it. Destination not yet decided; currently \"#\"." },
          defaultValue: {
          "url": "#",
          "label": "How to take your sample, step by step →"
        },
      },
    }),
    { name: "image", type: "upload", relationTo: "media", label: "Kit diagram", admin: { description: "The labelled photograph of the kit contents." } },
  ],
}
