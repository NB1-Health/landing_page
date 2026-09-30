import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-12.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgGuarantee.defaults.json, not retyped.
 *
 * The guarantee section: a sticky heading column beside two numbered points, each
 * with a row of chips.
 *
 * A NEW block. All seven homepage sections were compared against this one first;
 * the closest outline match was 20%.
 *
 * A NESTED REPEAT — chips inside points. The two rows are byte-identical in style
 * at every node, and so are all six chips, so one template serves the lot; that was
 * checked node by node rather than assumed from how they look.
 *
 * The numbers are written, not counted. They are text in the mockup and they are
 * text here, which means inserting a row in the middle is a renumbering job — said
 * in the field's admin description rather than left to be discovered.
 */
export const RdPgGuaranteeBlock: Block = {
  slug: "rdPgGuarantee",
  interfaceName: "RdPgGuaranteeBlock",
  labels: { singular: "PG Guarantee", plural: "PG Guarantee" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "guarantee" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "Built on your data. Backed by ours." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "You don't pay for a guess. We don't ship one. The subscription is built so neither can happen." },
    {
      name: "points", type: 'array', label: "Points", admin: { description: "Each is one numbered row: a number, an eyebrow, a heading, a paragraph and a row of chips. The mockup has two; any number works, since the rows are identical in style." },
      defaultValue: [
        {
          "number": "01",
          "eyebrow": "The guarantee",
          "title": "You order. We read you. Then we make it.",
          "body": "Your card is authorised at order and charged only once your formula is finalised — which triggers production, roughly four weeks in. Nothing is made to a guess.",
          "chips": [
            {
              "label": "Charged after analysis"
            },
            {
              "label": "Produced, never before"
            },
            {
              "label": "One-of-one, or not made"
            }
          ]
        },
        {
          "number": "02",
          "eyebrow": "The commitment",
          "title": "No contract. Cancel whenever you want.",
          "body": "Both plans start month-to-month with no minimum commitment. A four-month term simply locks a lower monthly price — a discount, not a requirement.",
          "chips": [
            {
              "label": "No minimum commitment"
            },
            {
              "label": "Cancel anytime"
            },
            {
              "label": "Month-to-month"
            }
          ]
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true, label: "Number", admin: { description: "Written, not counted \u2014 \"01\", \"02\". Adding a row in the middle means renumbering the ones after it." } },
        { name: "eyebrow", type: "text", localized: true, label: "Eyebrow", admin: { description: "The small uppercase line above the heading." } },
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true, label: "Body" },
        {
          name: "chips", type: 'array', label: "Chips", admin: { description: "The pills under the paragraph. They wrap, so any number fits." },
          fields: [
            { name: "label", type: "text", localized: true, required: true, label: "Chip" },
          ],
        },
      ],
    },
  ],
}
