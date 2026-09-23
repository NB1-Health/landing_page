import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-02.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgPlans.defaults.json, not retyped.
 *
 * Two plan cards, a comparison table hidden behind a button, and three assurances.
 * A NEW block, not the homepage's rdPlans: the two grids happen to share a cell
 * layout, but the cards, the copy and the assurance row are this mockup's, and the
 * outlines match 72%.
 *
 * The table is the whole difficulty. In the mockup it is ONE CSS grid of 57 flat
 * children — a corner cell, two plan headers, then per section a heading plus two
 * blanks, then three cells per row, then a spacer and two CTAs. There is no
 * repeating unit to map, so it is rendered from `compare` by PlansCompareGrid, its
 * cell styles are lifted from the manifest by tools/plans_grid.py, and its DATA is
 * derived from the manifest by tools/compare_table.py. Nothing in the table is
 * typed by hand.
 *
 * `coreKind` / `advancedKind` are a select, not free text, because the mockup
 * distinguishes a tick, a dash and a phrase by STYLING rather than content: a round
 * 22px disc, a dimmed em dash, or plain 13.5px text. An editor typing "✓" into a
 * text field would get the character, not the disc — which is exactly the bug
 * compare_table.py hit while being written, when it read a hyphenated CSS key that
 * parse_style camel-cases and classified all 16 ticks as free text.
 *
 * The two cards are two GROUPS rather than an array of two. They are not the same
 * card with different content: Core is light on a hairline border, Advanced is dark
 * with a lime badge hung off its top edge, lime check discs and a solid button.
 * Five separate styles, which an array would have to carry as flags.
 *
 * The ✓ disc on a feature row is static. There is no second glyph to choose, and a
 * row without one is a layout fault rather than an editorial choice.
 */
export const RdPgPlansBlock: Block = {
  slug: "rdPgPlans",
  interfaceName: "RdPgPlansBlock",
  labels: { singular: "PG Plans", plural: "PG Plans" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own nav and the footer link to \"#plans\", so changing it breaks them. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "plans" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), admin: { description: "The line break is yours to place \u2014 it is what keeps \"One difference.\" on its own line." }, defaultValue: {
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
                  "text": "Two plans.",
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
                  "text": "One difference.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "Same method, both. Advanced reads more, every cycle." },
    {
      name: "core", type: 'group', label: "Core card",
      fields: [
        { name: "name", type: "text", localized: true, required: true, defaultValue: "Core" },
        { name: "tagline", type: "textarea", localized: true, defaultValue: "Your gut read, and the formula built from it." },
        { name: "price", type: "text", localized: true, admin: { description: "The amount only. The \"/mo\" beside it is a separate field so it can be translated on its own." }, defaultValue: "€99" },
        { name: "priceSuffix", type: "text", localized: true, defaultValue: " /mo" },
        { name: "terms", type: "text", localized: true, defaultValue: "Cancel anytime. No minimum commitment." },
        { name: "listLabel", type: "text", localized: true, defaultValue: "What's inside" },
        {
          name: "features", type: 'array', label: "What's inside", admin: { description: "Each row is drawn with a \u2713 disc; the disc is part of the row, not something you type." },
          defaultValue: [
            {
              "label": "Your gut, read at species level"
            },
            {
              "label": "A formula built from your data"
            },
            {
              "label": "Three components, posted monthly"
            },
            {
              "label": "Presorted, travel-ready packaging"
            },
            {
              "label": "Recalibrate on demand"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        localizedLink({
          overrides: {
              name: "cta",
              label: "Button",
              admin: { description: "The card's own button. The comparison table has its own pair of buttons below." },
              defaultValue: {
              "url": "#buy",
              "label": "Start with Core"
            },
          },
        }),
        { name: "note", type: "text", localized: true, label: "Note under the button", defaultValue: "Nothing charged until your formula is made" },
      ],
    },
    {
      name: "advanced", type: 'group', label: "Advanced card",
      fields: [
        { name: "badge", type: "text", localized: true, label: "Badge", admin: { description: "The lime tag hung off the top edge of the card. Leave empty and no badge is drawn." }, defaultValue: "Most informed" },
        { name: "name", type: "text", localized: true, required: true, defaultValue: "Advanced" },
        { name: "tagline", type: "textarea", localized: true, defaultValue: "Gut and blood. Your formula rebuilds every cycle." },
        { name: "price", type: "text", localized: true, admin: { description: "The amount only. The \"/mo\" beside it is a separate field so it can be translated on its own." }, defaultValue: "€149" },
        { name: "priceSuffix", type: "text", localized: true, defaultValue: " /mo" },
        { name: "terms", type: "text", localized: true, defaultValue: "Cancel anytime. No minimum commitment." },
        { name: "listLabel", type: "text", localized: true, defaultValue: "Everything in Core, plus" },
        {
          name: "features", type: 'array', label: "What's inside", admin: { description: "Each row is drawn with a \u2713 disc; the disc is part of the row, not something you type." },
          defaultValue: [
            {
              "label": "Blood biomarkers, alternating with gut"
            },
            {
              "label": "Formula rebuilds from every diagnostic"
            },
            {
              "label": "96 ingredient library, on request"
            },
            {
              "label": "Priority support from the team"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        localizedLink({
          overrides: {
              name: "cta",
              label: "Button",
              admin: { description: "The card's own button. The comparison table has its own pair of buttons below." },
              defaultValue: {
              "url": "#buy",
              "label": "Start with Advanced"
            },
          },
        }),
        { name: "note", type: "text", localized: true, label: "Note under the button", defaultValue: "Nothing charged until your formula is made" },
      ],
    },
    { name: "compareOpenLabel", type: "text", localized: true, label: "Button, table closed", defaultValue: "Compare Core & Advanced in full" },
    { name: "compareCloseLabel", type: "text", localized: true, label: "Button, table open", admin: { description: "The mockup only ever shows the closed wording; this is the text once the table is open." }, defaultValue: "Hide the full comparison" },
    {
      name: "compare", type: 'array', label: "Comparison table", admin: { description: "One entry per section of the table. Sections and rows both render in this order." },
      defaultValue: [
        {
          "title": "Analysis",
          "rows": [
            {
              "label": "Gut microbiome sequencing, shotgun, species-level",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Summary analysis report",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Full data output + deeper interpretation",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Blood biomarker panel",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Alternating gut + blood cycles, from cycle 2",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Gut retests",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "On demand",
              "advancedText": "Every other cycle"
            }
          ]
        },
        {
          "title": "Your formula",
          "rows": [
            {
              "label": "Three-part formula, built from your data",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Presorted, travel-ready packaging",
              "coreKind": "included",
              "advancedKind": "included"
            },
            {
              "label": "Formula rebuilds every cycle",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "96+ add-on ingredients",
              "coreKind": "excluded",
              "advancedKind": "included"
            },
            {
              "label": "Priority support",
              "coreKind": "excluded",
              "advancedKind": "included"
            }
          ]
        },
        {
          "title": "Commitment & billing",
          "rows": [
            {
              "label": "Subscription terms",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "Cancel anytime",
              "advancedText": "Cancel anytime"
            },
            {
              "label": "Minimum commitment",
              "coreKind": "text",
              "advancedKind": "text",
              "coreText": "None",
              "advancedText": "None"
            },
            {
              "label": "Charged on production, never before",
              "coreKind": "included",
              "advancedKind": "included"
            }
          ]
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        {
          name: "rows", type: 'array',
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "coreKind", type: "select", options: ["included", "excluded", "text"], label: "Core", admin: { description: "\"included\" draws the disc, \"excluded\" a dimmed dash, \"text\" shows the wording beside it." }, defaultValue: "included" },
            { name: "coreText", type: "text", localized: true, label: "Core wording", admin: { description: "Only used when Core is set to \"text\"." } },
            { name: "advancedKind", type: "select", options: ["included", "excluded", "text"], label: "Advanced", admin: { description: "\"included\" draws the disc, \"excluded\" a dimmed dash, \"text\" shows the wording beside it." }, defaultValue: "included" },
            { name: "advancedText", type: "text", localized: true, label: "Advanced wording", admin: { description: "Only used when Advanced is set to \"text\"." } },
          ],
        },
      ],
    },
    {
      name: "compareCta", type: 'group', label: "Buttons under the table",
      fields: [
        { name: "coreUrl", type: "text", localized: true, defaultValue: "#buy" },
        { name: "coreLabel", type: "text", localized: true, defaultValue: "Start with Core" },
        { name: "advancedUrl", type: "text", localized: true, defaultValue: "#buy" },
        { name: "advancedLabel", type: "text", localized: true, defaultValue: "Start with Advanced" },
      ],
    },
    {
      name: "assurances", type: 'array', label: "Assurance row", admin: { description: "The three notes under the cards." },
      defaultValue: [
        {
          "glyph": "◔",
          "title": "You pay on production",
          "body": "Charged only when your formula is made — never before your diagnostic completes."
        },
        {
          "glyph": "↻",
          "title": "Cancel anytime",
          "body": "No minimum commitment. Stay for as long as the data is useful to you."
        },
        {
          "glyph": "◉",
          "title": "Diagnostic included",
          "body": "The diagnostic is the product. It's in your subscription, not an add-on."
        }
      ],
      fields: [
        { name: "glyph", type: "text", localized: true, label: "Glyph", admin: { description: "A single character drawn inside the disc \u2014 \u25d4, \u21bb, \u25c9 in the mockup. Not an upload: it takes the section's own colour and scales with the text." } },
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
      ],
    },
  ],
}
