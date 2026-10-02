import type { Block } from 'payload'

/**
 * The Ingredient Library: every component nb1 will consider, with the filter and
 * the search that make 96 of them navigable.
 *
 * Four screens and a dialog, one block. The hero and its stat strip, the four
 * families, the browsable grid, and how the library becomes a formula.
 *
 * COUNTS ARE NEVER TYPED. "All 96" on the first chip, 19 / 12 / 21 / 44 on the
 * family tiles, and "Showing 7 of 96 components" under the grid are all counted
 * from the list on the same page. Add a component and every one of them moves.
 *
 * EACH COMPONENT HAS A FAMILY, and it does two things: it decides which filter
 * chip shows the card, and it picks the tint behind the picture — lime for
 * strains, orange for fibres, blue-grey for vitamins and minerals, soft-pink for
 * actives. Set the family; the colour follows.
 *
 * THE DIALOG'S BODY IS ONE FIELD, not one per component: the mockup writes the
 * same sentence in all 96.
 *
 * The counter line holds `{shown}` and `{total}` placeholders. Move them wherever
 * a locale's word order wants them.
 *
 * The CTAs hold a SLUG, not a path — `science-board-v2`, not
 * `/en/science-board-v2` — and the locale is added when the page renders.
 */
export const RdLiBlock: Block = {
  slug: "rdLi",
  interfaceName: "RdLiBlock",
  labels: { singular: "RdLi", plural: "RdLi" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Optional. Gives the section an id so another page can link straight to it." }, defaultValue: "top" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Every ingredient we’ll consider, in one place." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "The full shelf nb1 formulates from: our library of studied strains, fibres, vitamins, minerals and active compounds. Yours draws on only the ones your reading calls for, the rest stay on the shelf." },
        {
          name: "stats", type: 'array', label: "Stat strip", admin: { description: "Three figures. These are claims rather than counts, so they are typed \u2014 unlike the numbers on the chips and tiles below, which are counted from the library." },
          fields: [
            { name: "value", type: "text", localized: true, required: true },
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
    {
      name: "fam", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Four families, one library." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Every component belongs to one of four groups. Together they cover the living layer of the gut, the fibres that feed it, and the micronutrients and actives that support the rest." },
        {
          name: "groups", type: 'array', label: "Family tiles", admin: { description: "Four. The count on each is COUNTED from the library below, not typed \u2014 that is what the Family field is for." },
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
            { name: "label", type: "text", localized: true, required: true },
            { name: "family", type: "select", options: ["strains", "fibres", "vitamins", "actives"], label: "Family", admin: { description: "Which bucket this tile counts." } },
          ],
        },
        {
          name: "avatars", type: 'array', label: "Board faces", admin: { description: "The stack beside the science-board line." },
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
          ],
        },
        { name: "noteLead", type: "text", localized: true, label: "Board line", admin: { description: "The sentence before the link. Mind the trailing space." }, defaultValue: "Science-board vetted. Only evidence-backed ingredients make the library. " },
        { name: "noteTail", type: "text", localized: true },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "Meet the board" },
        { name: "ctaHref", type: "text", localized: true, label: "Link destination", admin: { description: "A page slug such as science-board-v2 \u2014 the locale is added when the page renders." }, defaultValue: "science-board-v2" },
      ],
    },
    {
      name: "browse", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "The full shelf, every component." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Filter by family or search by name. This is the complete list we formulate from, not a sample." },
        { name: "allLabel", type: "text", localized: true, label: "\"All\" chip", admin: { description: "Just the word. The count after it is the length of the library and is added at render." }, defaultValue: "All" },
        {
          name: "filters", type: 'array', label: "Filter chips", admin: { description: "Four, one per family, after the All chip." },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "family", type: "select", options: ["strains", "fibres", "vitamins", "actives"], label: "Family", admin: { description: "Which components this chip shows." } },
          ],
        },
        { name: "searchPlaceholder", type: "text", localized: true, defaultValue: "Search the library" },
        { name: "searchLabel", type: "text", localized: true, defaultValue: "Search components" },
        {
          name: "items", type: 'array', label: "Components", admin: { description: "The library. Each needs a Family \u2014 it decides which chip shows the card AND the tint behind its picture." },
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "name", type: "text", localized: true, required: true },
            { name: "label", type: "text", localized: true, label: "Kind", admin: { description: "The small word under the name \u2014 Vitamin, Live culture, Botanical. Finer than the family, and shown rather than filtered on." } },
            { name: "family", type: "select", options: ["strains", "fibres", "vitamins", "actives"], label: "Family", admin: { description: "One of the four filter buckets. Also picks the card's tint: lime, orange, blue-grey, soft-pink." } },
          ],
        },
        { name: "showing", type: "text", localized: true, label: "Counter line", admin: { description: "Use {shown} and {total} where this language wants the numbers. Both are filled in at render." }, defaultValue: "Showing {shown} of {total} components" },
        { name: "modalBody", type: "textarea", localized: true, label: "Dialog text", admin: { description: "The same line for every component \u2014 the mockup writes it once and uses it 96 times." }, defaultValue: "Part of the nb1 library, drawn on only when your gut reading calls for it." },
        { name: "closeLabel", type: "text", localized: true, label: "Close glyph", admin: { description: "The \u00d7 on the dialog." }, defaultValue: "×" },
      ],
    },
    {
      name: "chosen", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "How the library becomes your formula." },
        {
          name: "steps", type: 'array',
          fields: [
            { name: "num", type: "text", localized: true },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        { name: "noteLead", type: "text", localized: true, label: "Closing line, before the link", defaultValue: "See exactly how a reading turns into a build on " },
        { name: "noteTail", type: "text", localized: true, label: "Closing line, after the link", admin: { description: "Usually just the full stop." }, defaultValue: "." },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "The protocol" },
        { name: "ctaHref", type: "text", localized: true, label: "Link destination", admin: { description: "A page slug such as the-protocol-v2 \u2014 the locale is added when the page renders." }, defaultValue: "the-protocol-v2" },
      ],
    },
  ],
}
