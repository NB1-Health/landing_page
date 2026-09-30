import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-06.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrFormula.defaults.json, not retyped.
 *
 * The ingredient library: a heading, two drifting rails of ingredient photographs,
 * and a four-row accordion of categories closing on a link.
 *
 * THE RAILS HOLD EIGHT EACH, NOT TWENTY-FOUR. The mockup draws 24 plates per row,
 * but they are one cycle of eight tiled three times — that is what makes an
 * infinite drift seamless, and it is presentation, not content. The component
 * tiles; the CMS holds one copy. Three identical copies for an editor to keep in
 * step is a bug waiting to happen.
 *
 * They are TWO fields rather than one list split in half because they are two
 * separate strips of the design: the top drifts forward over 82s, the bottom
 * backwards over 98s with a -58px offset.
 *
 * The plate photographs are CSS backgrounds on a 116px circle — the mockup's own
 * construction — and `role="img"` with an aria-label is already on that node, so
 * the ingredient name does double duty as the label.
 *
 * THE FOUR CATEGORIES ARE BOUND BY INDEX, not repeated: their container also holds
 * the closing line and the library link as a fifth child, so a repeat would either
 * swallow that or reproduce it four times.
 *
 * The accordion's open state was MEASURED by driving the mockup, because the
 * capture holds every panel closed and the open values are not in it: the panel is
 * `display: block`, the glyph goes from `+` to `–` (an en dash, not a hyphen), one
 * opens at a time, and clicking the open one closes it.
 *
 * `type="button"` and `aria-expanded` are added to each button — the same two
 * additions rdPgBoard's disclosure got. A bare <button> submits any form it finds
 * itself inside, and a disclosure with no `aria-expanded` announces nothing.
 */
export const RdPrFormulaBlock: Block = {
  slug: "rdPrFormula",
  interfaceName: "RdPrFormulaBlock",
  labels: { singular: "RdPrFormula", plural: "RdPrFormula" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "formula" },
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
                  "text": "Your formula is drawn from 96+ studied ingredients.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "Built in three parts, each a small set of units. Only the ingredients your reading calls for go in, each dosed to your gut. Nothing is a default." },
    {
      name: "railTop", type: 'array', label: "Rail \u2014 top row", admin: { description: "Eight ingredients. The row is DRAWN three times to make the drift seamless \u2014 add eight more and you get a longer loop, not a fourth copy." },
      defaultValue: [
        {
          "name": "L. rhamnosus GG",
          "photo": null
        },
        {
          "name": "Galacto-oligosaccharides",
          "photo": null
        },
        {
          "name": "Ashwagandha",
          "photo": null
        },
        {
          "name": "Bergamot extract",
          "photo": null
        },
        {
          "name": "Magnesium",
          "photo": null
        },
        {
          "name": "Flaxseed oil",
          "photo": null
        },
        {
          "name": "Turmeric root",
          "photo": null
        },
        {
          "name": "Inulin",
          "photo": null
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true, label: "Name", admin: { description: "Also the photo's screen-reader label." } },
        { name: "photo", type: "upload", relationTo: "media", label: "Photo", admin: { description: "Drawn as a CSS background in a 116px circle." } },
      ],
    },
    {
      name: "railBottom", type: 'array', label: "Rail \u2014 bottom row", admin: { description: "Eight more. This row drifts the other way and slightly slower." },
      defaultValue: [
        {
          "name": "B. lactis BB-12",
          "photo": null
        },
        {
          "name": "Partially hydrolysed guar gum",
          "photo": null
        },
        {
          "name": "Rhodiola",
          "photo": null
        },
        {
          "name": "Pomegranate extract",
          "photo": null
        },
        {
          "name": "Vitamin D3",
          "photo": null
        },
        {
          "name": "Green tea extract",
          "photo": null
        },
        {
          "name": "Valerian root",
          "photo": null
        },
        {
          "name": "Oat beta-glucan",
          "photo": null
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true, label: "Name", admin: { description: "Also the photo's screen-reader label." } },
        { name: "photo", type: "upload", relationTo: "media", label: "Photo", admin: { description: "Drawn as a CSS background in a 116px circle." } },
      ],
    },
    {
      name: "groups", type: 'array', label: "Categories", admin: { description: "Exactly four. Each is its own row in the markup, so a fifth would store fine and render nothing. The counts in the labels are typed, not calculated from the rail." },
      defaultValue: [
        {
          "label": "19 × live-culture strains",
          "body": "Includes L. rhamnosus GG, L. acidophilus NCFM, L. plantarum 299v, L. paracasei LPC-37, L. reuteri, B. lactis BB-12, B. lactis HN019, B. longum 1714, B. breve BR03 and S. thermophilus."
        },
        {
          "label": "13 × prebiotic fibres",
          "body": "Includes galacto-oligosaccharides, inulin, chicory-root FOS, partially hydrolysed guar gum, oat beta-glucan, resistant starch, soluble corn fibre, acacia fibre, psyllium husk and carob bean extract."
        },
        {
          "label": "21 × vitamins and minerals",
          "body": "Includes vitamin D3, K2, A, C, E, the full B-complex with folate as 5-MTHF and B12 as methylcobalamin, plus magnesium, zinc, iron, selenium, iodine, copper and manganese."
        },
        {
          "label": "45 × active compounds",
          "body": "Includes ashwagandha, rhodiola, Korean ginseng, bacopa, turmeric, bergamot, pomegranate, apple polyphenols, green tea with L-theanine, quercetin, omega-3 as DHA and EPA, CoQ10, NAC, L-glutamine, valerian, lemon balm, lavender and L-tryptophan."
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true, label: "Label", admin: { description: "e.g. \"19 \u00d7 live-culture strains\". The +/\u2013 is drawn by the button." } },
        { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "Shown when the row is opened. One at a time." } },
      ],
    },
    { name: "footerText", type: "text", localized: true, label: "Closing line", admin: { description: "The sentence beside the link." }, defaultValue: "A single reading draws on about 35 of them" },
    localizedLink({
      overrides: {
          name: "libraryLink",
          label: "Library link",
          admin: { description: "The \u2192 IS part of the label \u2014 type it. Destination not yet decided; currently \"#\"." },
          defaultValue: {
          "url": "#",
          "label": "Explore the full library →"
        },
      },
    }),
  ],
}
