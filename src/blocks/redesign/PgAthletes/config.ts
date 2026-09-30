import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-10.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgAthletes.defaults.json, not retyped.
 *
 * The athletes band: a heading over two photographic quote cards, with a record
 * strip underneath.
 *
 * A NEW block. The homepage has no athletes section at all — every one of its seven
 * sections was compared against this one before building, and the closest outline
 * match was 18%.
 *
 * THE TWO CARDS repeat over `athletes`, and exactly one node differs between them:
 * the quote block, in three properties at once — font-size, line-height and
 * max-width. The first card is the feature, sitting in the wider 1.18fr column with
 * the larger type, so the difference follows POSITION rather than the person. It is
 * carried by a `styleToggle` pointing at the second card's own quote node, which
 * means both styles are the mockup's verbatim and neither clamp() string is
 * retyped.
 *
 * The grid is `1.18fr 1fr`, so the design is built for exactly two cards. A third
 * row has no column; that is recorded in the field's admin description rather than
 * left for an editor to discover.
 *
 * The heading is rich text because the mockup breaks it with a `<br>` after the
 * first sentence, and that break is the design's, not the browser's.
 */
export const RdPgAthletesBlock: Block = {
  slug: "rdPgAthletes",
  interfaceName: "RdPgAthletesBlock",
  labels: { singular: "PG Athletes", plural: "PG Athletes" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "athletes" },
    { name: "heading", type: "richText", localized: true, editor: makeRedesignHeadingEditor(['h2']), defaultValue: {
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
                  "text": "Run on your data.",
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
                  "text": "Not someone else's average.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "HYROX World Champions Tim Wenisch and Alexander Rončević train on data. Their formula does too." },
    {
      name: "athletes", type: 'array', label: "Athletes", admin: { description: "Two cards side by side. The grid is 1.18fr / 1fr, so the FIRST card is the wider one and carries the larger quote \u2014 that follows position, not the person. The design is built for exactly two; a third has no column." },
      defaultValue: [
        {
          "quote": "\"My supplement stack finally runs on the same data as my training. Not what worked for someone else — what works for me.\"",
          "attribution": "Tim Wenisch · 2025 HYROX Solo & Doubles World Champion",
          "photo": null
        },
        {
          "quote": "\"When performance is measured in milliseconds, generic supplements aren't an option.\"",
          "attribution": "Alexander Rončević · 2024 HYROX Solo World Champion",
          "photo": null
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media", label: "Photograph", admin: { description: "Fills the card, behind a bottom-up dark gradient that keeps the quote readable." } },
        { name: "quote", type: "textarea", localized: true, label: "Quote", admin: { description: "Include the quotation marks \u2014 they are part of the text in the mockup, not drawn by the design." } },
        { name: "attribution", type: "text", localized: true, label: "Attribution", admin: { description: "Name and title, separated by the interpunct as in the mockup." } },
      ],
    },
    { name: "recordLabel", type: "text", localized: true, label: "Record caption", admin: { description: "The uppercase line to the left of the time." }, defaultValue: "Together they hold the Men's Doubles World Record" },
    { name: "recordValue", type: "text", localized: true, label: "Record", admin: { description: "The large figure between the two captions." }, defaultValue: "47:40" },
    { name: "recordPlace", type: "text", localized: true, label: "Record place", admin: { description: "The uppercase line to the right of the time." }, defaultValue: "London 2026" },
  ],
}
