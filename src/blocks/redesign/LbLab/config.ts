import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-05.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbLab.defaults.json, not retyped.
 *
 * The lab band: a headline, a standfirst, five key/value rows, a closing line, and
 * a square photograph beside them.
 *
 * The five rows ARE a repeat, unlike the three cards in #reads and the three
 * microbes in #method. Measured before building: every row's own style and both of
 * its spans are byte-identical across all five, and nothing in a row is a drawing.
 * So the count is free here, and the field description says so rather than warning
 * that a sixth would render nothing.
 *
 * The photograph is a CSS background on a `role="img"` element, not an `<img>`, so
 * its `aria-label` is bound to the media row's alt text and there is no second
 * field for it. Unlike the quote band in #reads, this one lays nothing over the
 * picture, so the `background-image` property is replaced outright rather than
 * having a gradient written back into it.
 *
 * The closing line stays a `<p>`. It is set in the display serif at up to 26px,
 * which reads like a heading, but the mockup writes a paragraph — it closes the
 * argument rather than opening a section — and a heading field would have put an
 * `<h2>` into the page outline that the design never intended.
 *
 * The section has NO id in the mockup. `anchorId` is here anyway, empty, so
 * nothing is rendered unless an editor fills it.
 */
export const RdLbLabBlock: Block = {
  slug: "rdLbLab",
  interfaceName: "RdLbLabBlock",
  labels: { singular: "RdLbLab", plural: "RdLbLab" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The mockup gives this section NO id, so it is empty by default and no id attribute is rendered. Deliberately NOT localized." } },
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
                  "text": "Every organism in your sample, read in full.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The paragraph under the headline." }, defaultValue: "Ten minutes of your time buys three weeks of ours. Sequencing, reading, building, sign-off. None of it can start before your sample arrives, which is the whole point." },
    {
      name: "facts", type: 'array', label: "Lab facts", admin: { description: "Five in the mockup. The count is free \u2014 these repeat properly, and each row draws its own hairline above it. The value is set in uppercase by the design, so type it in normal case." },
      defaultValue: [
        {
          "label": "Organisms read from one sample",
          "value": "1,217"
        },
        {
          "label": "Resolution",
          "value": "Species & strain"
        },
        {
          "label": "Sequenced in",
          "value": "EU laboratories"
        },
        {
          "label": "Turnaround from receipt",
          "value": "Two weeks"
        },
        {
          "label": "Made before your reading",
          "value": "Nothing"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
        { name: "value", type: "text", localized: true, required: true },
      ],
    },
    { name: "closing", type: "textarea", localized: true, label: "Closing line", admin: { description: "The large serif line under the table. A paragraph in the mockup, not a heading." }, defaultValue: "A supplement that could ship tomorrow was made before anyone looked at you." },
    { name: "image", type: "upload", relationTo: "media", label: "Lab photograph", admin: { description: "The square picture beside the copy. Its ALT TEXT is what screen readers announce, because the mockup draws it as a CSS background on a role=\"img\" element rather than as an <img> \u2014 so set the alt on the media row, not here." } },
  ],
}
