import type { Block } from 'payload'
import { redesignInlineLinkEditor } from '@/fields/redesignLexical'

/**
 * The Legal / Policy page — Terms & Conditions, Privacy Policy, Imprint and Cookie
 * Policy, all four from this one block.
 *
 * They are the same page with different words: a title band, then a contents rail
 * beside a column holding a plain-language summary, the numbered clauses, and a
 * contact card. Verified against all four mockups at 390, 768 and 1440.
 *
 * TWO THINGS TO KNOW BEFORE EDITING.
 *
 * The contents rail is DERIVED from the clauses. Each clause carries its own
 * anchor, its own short label for the rail, and a "Show in contents" switch. There
 * is no second list to keep in step, so a clause added here cannot go missing from
 * the rail, and a rail entry cannot point at a clause that no longer exists.
 *
 * A clause body is a list of PARTS, not a list of paragraphs. Most are "Numbered
 * item" and that is the default. The other three kinds exist because the mockups
 * use them: a "Panel" is the white box (Privacy's processing table, Cookie's
 * categories), a "Card grid" is the row of small cards (Privacy's GDPR rights),
 * and "Prose" is a run of plain paragraphs (the Terms annex withdrawal form).
 * Choosing a kind shows only the fields that kind uses.
 */
export const RdLegalBlock: Block = {
  slug: "rdLegal",
  interfaceName: "RdLegalBlock",
  labels: { singular: "RdLegal", plural: "RdLegal" },
  fields: [
    {
      name: "top", type: 'group', label: "Title band", admin: { description: "The page heading and the sentence under it. Identical in shape on all four legal pages." },
      fields: [
        { name: "anchorId", type: "text", label: "Anchor", admin: { description: "The id this section gets in the page, for links that point at it. Leave as `top`." }, defaultValue: "top" },
        { name: "title", type: "text", localized: true, required: true, label: "Page title", defaultValue: "Terms & Conditions" },
        { name: "intro", type: "textarea", localized: true, label: "Intro", admin: { description: "One or two sentences saying what this document governs." }, defaultValue: "The General Terms and Conditions for orders placed in the NB1 web shop at nb1.com. They govern the business relationship between you and NB1 Health GmbH." },
      ],
    },
    { name: "anchorId", type: "text", label: "Body anchor", admin: { description: "The id of the policy section. Leave as `policy`." }, defaultValue: "policy" },
    { name: "tocLabel", type: "text", localized: true, label: "Contents heading", admin: { description: "The small label above the rail. `On this page` on all four mockups." }, defaultValue: "On this page" },
    {
      name: "glance", type: 'group', label: "At a glance", admin: { description: "The white summary panel above the clauses. It is a convenience, not part of the contract \u2014 say so in the intro, as all four mockups do." },
      fields: [
        { name: "heading", type: "text", localized: true, label: "Heading", defaultValue: "The short version" },
        { name: "intro", type: "textarea", localized: true, label: "Intro", defaultValue: "A plain-language overview for convenience only. It is not part of the contract, the numbered terms below are what apply." },
        {
          name: "points", type: 'array', label: "Points", admin: { description: "One bullet each. Bold carries the emphasis; no other formatting is styled here." },
          fields: [
            { name: "body", type: "richText", localized: true, required: true, editor: redesignInlineLinkEditor, label: "Point" },
          ],
        },
      ],
    },
    {
      name: "clauses", type: 'array', label: "Clauses", admin: { description: "The numbered clauses, in order. The contents rail is built from this list, so nothing needs keeping in step by hand." },
      fields: [
        { name: "anchorId", type: "text", required: true, label: "Anchor", admin: { description: "The id used by the contents rail and by any link from another page \u2014 `s1`, `s2`, `s6a`. Changing it breaks existing links to this clause." } },
        { name: "number", type: "text", localized: true, label: "Number", admin: { description: "Shown beside the title \u2014 `01`, `02`. Typed, not counted, so an inserted clause does not silently renumber the ones after it. Terms' annex reads `6 \u2014 Annex`." } },
        { name: "title", type: "text", localized: true, required: true, label: "Title" },
        { name: "tocLabel", type: "text", localized: true, label: "Contents label", admin: { description: "A shorter label for the rail when the full title is too long. Left empty, the rail shows the title." } },
        { name: "showInToc", type: "checkbox", label: "Show in contents", admin: { description: "Off for a clause the rail should skip \u2014 Terms' annex is the one case in the mockups." } },
        {
          name: "parts", type: 'array', label: "Body", admin: { description: "The clause body, part by part, in the order they appear." },
          fields: [
            { name: "kind", type: "select", options: ["item", "panel", "grid", "prose"], label: "Kind", admin: { description: "Numbered item is the default and covers almost everything. Panel is the white box; Card grid is the row of small cards; Prose is a run of plain paragraphs." } },
            { name: "number", type: "text", localized: true, label: "Number", admin: { description: "For a numbered item \u2014 `1.1`, `6.6`. Typed, like the clause number.", condition: (_, s) => !s?.kind || s.kind === 'item' } },
            { name: "title", type: "text", localized: true, label: "Panel heading", admin: { condition: (_, s) => s?.kind === 'panel' } },
            { name: "body", type: "richText", localized: true, editor: redesignInlineLinkEditor, label: "Text", admin: { description: "The item's paragraph, the panel's intro, or the whole of a prose part.", condition: (_, s) => s?.kind !== 'grid' } },
            { name: "caption", type: "text", localized: true, label: "Table caption", admin: { description: "Only the Cookie page uses a table. Fill this and the column headings below, and the rows become table rows instead of label/value rows.", condition: (_, s) => s?.kind === 'panel' } },
            {
              name: "cols", type: 'group', label: "Table column headings", admin: { description: "Fill the first to make this panel a table. Two or three columns; an empty third gives a two-column table.", condition: (_, s) => s?.kind === 'panel' },
              fields: [
                { name: "c1", type: "text", localized: true },
                { name: "c2", type: "text", localized: true },
                { name: "c3", type: "text", localized: true },
              ],
            },
            {
              name: "rows", type: 'array', label: "Rows", admin: { description: "One array, three jobs, decided by the part's kind and by whether a column heading is set: a numbered item's lettered sub-list (a, b); a panel's label/value rows, or its table rows; a card grid's cards.", condition: (_, s) => s?.kind !== 'prose' },
              fields: [
                { name: "label", type: "text", localized: true, label: "Label", admin: { description: "The letter, the row label, or the card heading. Leave empty in a table row." } },
                { name: "body", type: "richText", localized: true, editor: redesignInlineLinkEditor, label: "Text", admin: { description: "Leave empty in a table row." } },
                { name: "c1", type: "text", localized: true, label: "Cell 1", admin: { description: "Table rows only." } },
                { name: "c2", type: "text", localized: true, label: "Cell 2", admin: { description: "Table rows only." } },
                { name: "c3", type: "text", localized: true, label: "Cell 3", admin: { description: "Table rows only; leave empty in a two-column table." } },
              ],
            },
            { name: "after", type: "richText", localized: true, editor: redesignInlineLinkEditor, label: "Text after the table", admin: { condition: (_, s) => s?.kind === 'panel' } },
          ],
        },
      ],
    },
    {
      name: "contact", type: 'group', label: "Contact card", admin: { description: "The dark card that closes the page." },
      fields: [
        { name: "heading", type: "text", localized: true, label: "Heading", defaultValue: "Questions or complaints?" },
        { name: "body", type: "textarea", localized: true, label: "Text", defaultValue: "For anything relating to your order, a withdrawal, or these terms, our customer service team is the fastest route." },
        {
          name: "details", type: 'array', label: "Details", admin: { description: "Label and value pairs. A value may hold a link \u2014 the mockups link the email addresses." },
          fields: [
            { name: "label", type: "text", localized: true, required: true, label: "Label" },
            { name: "value", type: "richText", localized: true, required: true, editor: redesignInlineLinkEditor, label: "Value" },
          ],
        },
      ],
    },
  ],
}
