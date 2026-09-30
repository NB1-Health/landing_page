import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-07.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrArrives.defaults.json, not retyped.
 *
 * The tallest section on the page: three product cards, a before/after pair of
 * photographs, three benefits, and a customer quote.
 *
 * THE PACKS ARE A NESTED REPEAT — the cards repeat, and the bullet rows inside
 * each card repeat again. The row counts differ, three on the morning pack and two
 * on the others, and that is DATA. Contrast the analyse steps, where the instances
 * differed in their icons, which is structure, and had to be bound by index.
 *
 * Each pack carries TWO colour choices, and they are not the same thing. `domain`
 * fills the orb from the brand's domain tokens; `accent` is its halo and the bullet
 * dots. They are separate fields because the mockup's own values disagree —
 * `--nb1-domain-energy` is cool-grey where the morning pack's halo is lime. One
 * `accent` drives both the halo and the dots, so those two cannot drift apart; the
 * seed asserts the mockup agrees with itself on that before writing.
 *
 * Both are SELECTS rather than free text. A mistyped token is not an error, it is a
 * `var()` that resolves to nothing — an orb with no colour and a bullet with no
 * fill, on a page that otherwise looks fine.
 *
 * `--nb1-bubble-halo` is a CSS custom property, which cannot appear unquoted in a
 * JS object literal. tools/bind.py now quotes any style key that is not a valid
 * identifier; it used to emit a syntax error and this is the first block to need it.
 *
 * The two photographs sit on different grounds — cool-grey and `--tint` — so
 * `plate` is a select of exactly those two rather than a colour picker.
 *
 * Each photograph's `alt` is its own field and NOT the caption: the captions read
 * "Before · the drawer" and "After · the whole thing", which label the pair for
 * sighted readers and describe neither picture.
 *
 * RESIDUAL, measured and accepted: at 1440px six nodes are 145.203px wide against
 * the mockup's 145.219px — 0.016px, one sixty-fourth of a pixel, which is the
 * browser's own layout precision. They are the three pack headers and their three
 * `WHEN · FORM` lines, and the cause is `unwrap`: the mockup wraps each
 * interpolated value in a `sc-interp` span, we render the bare text, and a run set
 * in `letter-spacing: 0.12em` accumulates its final letter-space differently
 * across an inline boundary than inside one continuous run. Keeping the spans
 * would trade an invisible 0.016px for markup the design has not got, so the
 * difference stays. It will recur on any uppercase, letter-spaced value that the
 * mockup interpolates.
 */
export const RdPrArrivesBlock: Block = {
  slug: "rdPrArrives",
  interfaceName: "RdPrArrivesBlock",
  labels: { singular: "RdPrArrives", plural: "RdPrArrives" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "arrives" },
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
                  "text": "We did the hard part. Your day is two moments, not seven bottles.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "Everything is pre-sorted before it ships. No juggling bottles, no pill organiser, no counting. What is left is yours: the commitment to show up." },
    {
      name: "packs", type: 'array', label: "Packs", admin: { description: "Three in the mockup. Genuinely repeated \u2014 a fourth renders correctly, bullets and all." },
      defaultValue: [
        {
          "domain": "energy",
          "name": "Activate",
          "timing": "Morning",
          "form": "Pre-packed",
          "body": "Taken with your first meal.",
          "items": [
            {
              "text": "Live strains matched to your gaps"
            },
            {
              "text": "Omega and antioxidant softgel"
            },
            {
              "text": "Polyphenols and daytime botanicals"
            }
          ],
          "accent": "lime"
        },
        {
          "domain": "sleep",
          "name": "Restore",
          "timing": "Evening",
          "form": "Pre-packed",
          "body": "Taken before bed.",
          "items": [
            {
              "text": "Magnesium, dosed to your reading"
            },
            {
              "text": "Evening botanicals, only if warranted"
            }
          ],
          "accent": "blue-grey"
        },
        {
          "domain": "gut",
          "name": "Nourish",
          "timing": "Any time",
          "form": "One scoop",
          "body": "Whenever suits your day.",
          "items": [
            {
              "text": "Fibres paired to the strains they feed"
            },
            {
              "text": "Dosed to the range your gut handles"
            }
          ],
          "accent": "soft-pink"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true, label: "Name", admin: { description: "e.g. Activate." } },
        { name: "timing", type: "text", localized: true, label: "When", admin: { description: "e.g. Morning. The \u00b7 between this and the next is drawn by the design." } },
        { name: "form", type: "text", localized: true, label: "Form", admin: { description: "e.g. Pre-packed." } },
        { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "One line under the header." } },
        { name: "domain", type: "select", options: ["gut", "energy", "resilience", "immunity", "sleep"], label: "Domain", admin: { description: "Picks the orb's fill out of the brand tokens. A typo here fails silently, as an orb with no colour \u2014 which is why it is a list." } },
        { name: "accent", type: "select", options: ["lime", "blue-grey", "blue", "soft-pink", "orange"], label: "Accent", admin: { description: "The orb's halo AND the bullet dots. One choice drives both, so they cannot drift apart. Not derivable from the domain \u2014 the two use different palettes." } },
        {
          name: "items", type: 'array', label: "Bullets", admin: { description: "Three on the morning pack, two on the others. Any number works." },
          fields: [
            { name: "text", type: "text", localized: true, required: true, label: "Line", admin: { description: "The lime dot is drawn by the design." } },
          ],
        },
      ],
    },
    { name: "midline", type: "text", localized: true, label: "Line above the photographs", admin: { description: "The sentence between the packs and the before/after pair." }, defaultValue: "This was the drawer. This is the whole thing now." },
    {
      name: "shots", type: 'array', label: "Before / after", admin: { description: "Two photographs. The order is the before/after reading \u2014 nothing in the markup says which is which, only the captions." },
      defaultValue: [
        {
          "caption": "Before · the drawer",
          "alt": "A bathroom drawer of assorted supplement bottles and blister packs",
          "plate": "cool-grey",
          "image": null
        },
        {
          "caption": "After · the whole thing",
          "alt": "The open nb1 box: morning and evening blister trays either side of the prebiotic tub",
          "plate": "tint",
          "image": null
        }
      ],
      fields: [
        { name: "image", type: "upload", relationTo: "media", label: "Photograph", admin: { description: "Drawn as a CSS background, as elsewhere on this page." } },
        { name: "alt", type: "text", localized: true, label: "Description", admin: { description: "Read by screen readers. NOT the caption \u2014 the caption is a label, this describes the picture." } },
        { name: "caption", type: "text", localized: true, label: "Caption", admin: { description: "Printed under the photograph." } },
        { name: "plate", type: "select", options: ["cool-grey", "tint"], label: "Ground", admin: { description: "The colour behind the photograph while it loads. The mockup uses a different one for each of the two." } },
      ],
    },
    {
      name: "benefits", type: 'array', label: "Benefits", admin: { description: "Three in the mockup. Genuinely repeated." },
      defaultValue: [
        {
          "title": "Nothing to sort",
          "body": "Your whole day arrives already divided into morning and evening packs. No pill organiser, nothing to count, nothing to measure out."
        },
        {
          "title": "Travels anywhere",
          "body": "Tear off the days you need and go. Packs slip into a bag or pocket, so a weekend or a full month packs flat in seconds."
        },
        {
          "title": "Never runs out",
          "body": "Your next month arrives before you finish this one. No reordering, no gaps to plan around, no running out mid-week."
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
      ],
    },
    { name: "proofImage", type: "upload", relationTo: "media", label: "Review photograph", admin: { description: "Drawn as a CSS background." } },
    { name: "proofAlt", type: "text", localized: true, label: "Review photograph description", admin: { description: "Read by screen readers." }, defaultValue: "Eugen, four months in" },
    { name: "quote", type: "textarea", localized: true, label: "Quote", admin: { description: "The curly quotation marks are part of the text \u2014 they are typography, not marks the component adds." }, defaultValue: "“They've made taking supplements much easier for me, since everything is already organised by them into morning and evening doses.”" },
    { name: "attribution", type: "text", localized: true, label: "Attribution", admin: { description: "The line under the quote." }, defaultValue: "Eugen · four months in · verified Trustpilot review" },
  ],
}
