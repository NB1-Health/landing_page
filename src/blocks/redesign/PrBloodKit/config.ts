import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-04.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrBloodKit.defaults.json, not retyped.
 *
 * The Advanced-only blood kit: a badge, heading, two paragraphs and a five-row
 * fact table on the left; on the right, a PLACEHOLDER.
 *
 * A NEW BLOCK rather than a variant of rdPrKit, though the two are 72% identical by
 * DOM outline — the same measurement that made the Our Plans #buy section a
 * variant. The difference is timing: rdPrKit had already shipped and been seeded
 * when this section came up, so a variant would have meant altering a live block,
 * a migration and a re-seed. Merging the two later costs less than un-merging.
 *
 * THE RIGHT COLUMN NOW TAKES A PHOTOGRAPH, and keeps the mockup's empty box as
 * its fallback.
 *
 * The mockup leaves a bordered 4:5 panel with `role="img"`, an aria-label that
 * says it is a placeholder, and the caption "Blood kit image". That was
 * reproduced exactly while the design had no photograph — inventing an `<img>`
 * the design has not got is how a block stops matching its design — and the two
 * placeholder strings are still fields, still translated, still what renders
 * when `image` is empty. Nothing about the box changed: same aspect ratio, same
 * radius, same inset hairline. Only its CONTENTS switch.
 *
 * `image` is deliberately NOT localized. That is the standing rule for this
 * redesign: media is shared across the nine locales and only the words around
 * it are translated. `imageAlt` IS localized, and falls back to the alt text set
 * on the upload itself — so a photograph described once in the media library
 * needs nothing here.
 *
 * Five fact rows against rdPrKit's four, and they ARE a genuine repeat: identical
 * in style, nothing in a row drawn rather than written. Both cells come through
 * the mockup's `sc-interp` wrapper and are bound with `unwrap`.
 *
 * `guideLink` has the same label and the same mockup-relative destination as
 * rdPrKit's, and is still its own field — the two sections may well end up
 * pointing at different anchors of the same guide.
 */
export const RdPrBloodKitBlock: Block = {
  slug: "rdPrBloodKit",
  interfaceName: "RdPrBloodKitBlock",
  labels: { singular: "RdPrBloodKit", plural: "RdPrBloodKit" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "bloodkit" },
    { name: "tag", type: "text", localized: true, label: "Badge", admin: { description: "The lime pill above the heading. Names a plan, so it is editorial." }, defaultValue: "Advanced only" },
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
                  "text": "Two readings, not one.",
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
    { name: "intro", type: "textarea", localized: true, label: "Opening paragraph", admin: { description: "The larger of the two \u2014 its type scales with the container." }, defaultValue: "One finger prick, and a single drop of blood into each circle on the two collection cards. They go into the envelope, and back in the same return bag as everything else." },
    { name: "detail", type: "textarea", localized: true, label: "Second paragraph", admin: { description: "Set smaller than the first in the mockup. That is the design." }, defaultValue: "No needles, no clinic, no appointment. The panel tells us what actually reached you, so your doses land on measured levels rather than on symptoms." },
    {
      name: "facts", type: 'array', label: "Fact rows", admin: { description: "Five in the mockup, label left and value right. A sixth renders correctly." },
      defaultValue: [
        {
          "label": "Time at home",
          "value": "Under five minutes"
        },
        {
          "label": "Collection",
          "value": "One finger prick"
        },
        {
          "label": "What travels",
          "value": "Two dried cards"
        },
        {
          "label": "Return",
          "value": "The same prepaid bag"
        },
        {
          "label": "When it runs",
          "value": "From cycle one"
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
          admin: { description: "The \u2192 IS part of the label \u2014 type it. Destination not yet decided; currently \"#\"." },
          defaultValue: {
          "url": "#",
          "label": "How to take your sample, step by step →"
        },
      },
    }),
    { name: "image", type: "upload", relationTo: "media", label: "Photograph", admin: { description: "The at-home blood collection kit. Fills the 4:5 panel on the right. Leave empty and the panel renders the placeholder box below instead \u2014 which is what the mockup draws." } },
    { name: "imageAlt", type: "text", localized: true, label: "Photograph alt text", admin: { description: "Leave empty to use the alt text set on the upload itself. Ignored while there is no photograph." } },
    { name: "placeholderAria", type: "text", localized: true, label: "Placeholder description", admin: { description: "Read by screen readers in place of the photograph. Used only while Photograph is empty." }, defaultValue: "Placeholder for the at-home blood collection kit" },
    { name: "placeholderLabel", type: "text", localized: true, label: "Placeholder caption", admin: { description: "The caption inside the empty box. Shown only while Photograph is empty; upload one and the box becomes the photograph." }, defaultValue: "Blood kit image" },
  ],
}
