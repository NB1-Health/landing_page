import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineLinkEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-01.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrHero.defaults.json, not retyped.
 *
 * The Protocol's opening section: headline, standfirst, two calls to action, a row
 * of three overlapping avatars beside a one-line credibility note, and a wide
 * photograph.
 *
 * It is NOT the Our Plans hero with different words. Measured before building:
 * 10% outline similarity — Our Plans opens with a two-row register mark above the
 * headline that this page does not have, and its avatars each sit in their own
 * wrapper where these are bare `<img>` children of one row. Reusing it would have
 * meant making the marquee optional and re-parenting the avatars, which is more
 * change to a shipped block than a new block costs.
 *
 * `trustText` is RICH TEXT rather than a text field and a link field, because the
 * destination sits inside the sentence — "reviewed by our [seven-person science
 * board], analysed in EU labs." A separate link field would have to be re-inserted
 * at a fixed offset and would break the first time a translator moved it. The
 * editor is `redesignInlineLinkEditor`, the one in the repo that carries
 * LinkFeature.
 *
 * The two CTAs are built differently and that is the mockup's doing: the primary's
 * ↗ is its own span, drawn by the button and sized in em off the label; the
 * secondary's → is inside its text node. So the primary's label must not contain a
 * glyph and the secondary's must.
 *
 * The avatars overlap by `margin-left: -6px` on every one after the first. Written
 * as an index rule rather than a toggle against the second row, so the stack is
 * still right if the count changes.
 */
export const RdPrHeroBlock: Block = {
  slug: "rdPrHero",
  interfaceName: "RdPrHeroBlock",
  labels: { singular: "RdPrHero", plural: "RdPrHero" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#top\". Deliberately NOT localized." }, defaultValue: "top" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h1']), defaultValue: {
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
                  "text": "Nothing in here your biology didn't ask for.",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1,
              "tag": "h1"
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "version": 1
        }
      } },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Your protocol is the live cultures, the fibres that feed them and the supplement layer your reading called for — each one dosed to your gut. Nothing is manufactured before we have read you." },
    localizedLink({
      overrides: {
          name: "primaryCta",
          label: "Primary link",
          admin: { description: "The \u2197 glyph is drawn by the button \u2014 do not type it into the label." },
          defaultValue: {
          "url": "#buy",
          "label": "Order your kit"
        },
      },
    }),
    localizedLink({
      overrides: {
          name: "secondaryCta",
          label: "Secondary link",
          admin: { description: "The \u2192 IS part of the label here, unlike the primary above. Type it." },
          defaultValue: {
          "label": "See how it works →",
          "url": "#journey"
        },
      },
    }),
    {
      name: "trustAvatars", type: 'array', label: "Trust avatars", admin: { description: "Three in the mockup. They overlap by 6px, and the overlap follows the count, so a fourth stacks correctly." },
      defaultValue: [
        {
          "photo": null
        },
        {
          "photo": null
        },
        {
          "photo": null
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media" },
      ],
    },
    { name: "trustText", type: "richText", localized: true, editor: redesignInlineLinkEditor, label: "Trust line", admin: { description: "The link to the science board lives inside this sentence \u2014 set it in the editor, not in a separate field, so a translator can move it." }, defaultValue: {
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
                  "text": "Every formula reviewed by our ",
                  "version": 1
                },
                {
                  "type": "link",
                  "version": 3,
                  "direction": "ltr",
                  "format": "",
                  "indent": 0,
                  "fields": {
                    "linkType": "custom",
                    "newTab": false,
                    "url": "#"
                  },
                  "children": [
                    {
                      "type": "text",
                      "detail": 0,
                      "format": 0,
                      "mode": "normal",
                      "style": "",
                      "text": "seven-person science board",
                      "version": 1
                    }
                  ]
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": ", analysed in EU labs.",
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
    { name: "image", type: "upload", relationTo: "media", label: "Hero image", admin: { description: "The wide photograph beside the copy." } },
  ],
}
