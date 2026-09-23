import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-08.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgTimeline.defaults.json, not retyped.
 *
 * The four-month timeline: a heading, four month columns, and a photo banner
 * holding four figures.
 *
 * THE MONTH CARDS repeat over `months`, with card 3 as the template rather than
 * card 0. Card 3 is the only one carrying the third chip ("Advanced"), and a repeat
 * renders ONE template — taking card 0 would have left that chip with no node to
 * bind, because a node absent from the template is absent from the manifest and
 * cannot be named at all. The chip renders only when the row has a `tag`, so it is
 * the row's own content rather than a fact about position.
 *
 * THE ACCENT on the first column's top rule is positional, not a field. It marks
 * where the timeline starts, so it has to follow whichever card is first whatever
 * an editor reorders.
 *
 * THE DOT is a dial, and it is ONE number. The mockup draws four radial gradients
 * whose solid orange core shrinks 62 → 40 → 26 → 8 across the months; every other
 * varying stop is a function of that core — the colour-mix percentage is exactly
 * half it, and the mid stop is exactly it plus six, in all four of the mockup's own
 * values. So `dial` is the field and the gradient is derived from it. Four
 * hand-maintained gradient strings would have been unreadable in the admin and
 * un-extendable to a fifth month. The four values were read back out of the
 * mockup's own style attributes rather than retyped, and the two derived
 * relationships are asserted while reading, so a mockup that stopped obeying them
 * would fail loudly instead of rendering a wrong dot.
 *
 * THE BANNER FIGURES are bound by index, not repeated. The four captions are not
 * the same shape: three end in a `white-space: nowrap` span that keeps the last
 * phrase together — load-bearing, it moves "by week 8" and "vs DIY stack" onto
 * their own line at desktop width — and the third breaks with a hard `<br>` between
 * two bare text runs instead. A single template cannot render both without adding
 * a node to one of them, so the grid is bound as four cells and the array is
 * documented as fixed at four, which is what the 2×2 design is anyway.
 *
 * That third caption is why `ownText` now accepts a LIST of expressions, one per
 * bare text run. A single expression binds the first run and drops the rest — the
 * field would render, the block would compile, and "decision fatigue" would be
 * gone.
 */
export const RdPgTimelineBlock: Block = {
  slug: "rdPgTimeline",
  interfaceName: "RdPgTimelineBlock",
  labels: { singular: "PG Timeline", plural: "PG Timeline" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "timeline" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "Four months, because biology takes four months to shift." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Not a lock-in. The shortest honest window to measure real change." },
    { name: "monthLabel", type: "text", localized: true, label: "Chip word", admin: { description: "The word before the number on every card \u2014 \"Month\" in the mockup. One field for the section, because it is the same word on all four." }, defaultValue: "Month" },
    {
      name: "months", type: 'array', label: "Months", admin: { description: "Four columns at desktop. The first column's rule is accented automatically \u2014 that marks where the timeline starts, so it follows whichever card is first." },
      defaultValue: [
        {
          "number": "1",
          "title": "Settling in",
          "body": "Probiotic strains begin colonising. You may notice small shifts in digestion — normal as your gut adjusts.",
          "dial": 62
        },
        {
          "number": "2",
          "title": "Early momentum",
          "body": "SCFA production rebuilds as fibre supply stabilises. Energy and sleep often respond first.",
          "dial": 40
        },
        {
          "number": "3",
          "title": "Deepening balance",
          "body": "Team composition shifts measurably. Skin and immune markers tend to follow.",
          "dial": 26
        },
        {
          "number": "4",
          "tag": "Advanced",
          "title": "The retest",
          "body": "The same pipeline runs again, now with your first blood biomarker panel. Your formula recalibrates against everything that shifted.",
          "dial": 8
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true, label: "Number", admin: { description: "The second half of the chip. Text rather than a number so a locale can write it its own way." } },
        { name: "tag", type: "text", localized: true, label: "Extra chip", admin: { description: "An optional third chip after the number \u2014 \"Advanced\" on the retest month. Leave empty and no chip is rendered." } },
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true, label: "Body" },
        { name: "dial", type: "number", label: "Dot fill", admin: { description: "How much of the dot above the card is solid, 0\u2013100. The mockup runs 62, 40, 26, 8 across the four months; the rest of the dot's gradient is derived from this one number." } },
      ],
    },
    { name: "image", type: "upload", relationTo: "media", label: "Banner photo", admin: { description: "Fills the band under the four columns, behind a left-to-right dark gradient that keeps the figures readable." } },
    { name: "bannerLabel", type: "text", localized: true, label: "Banner eyebrow", defaultValue: "What early members report" },
    {
      name: "stats", type: 'array', label: "Banner figures", admin: { description: "A 2\u00d72 grid inside the banner. The design is built for exactly four \u2014 a fifth row will not render." },
      defaultValue: [
        {
          "value": "95",
          "caption": "Noticeable change by",
          "tail": " week 8"
        },
        {
          "value": "87",
          "caption": "Formula accuracy vs",
          "tail": " DIY stack"
        },
        {
          "value": "75",
          "caption": "Less supplement",
          "tail": "decision fatigue"
        },
        {
          "value": "92",
          "caption": "Would recommend to",
          "tail": " a friend"
        }
      ],
      fields: [
        { name: "value", type: "text", localized: true, label: "Figure", admin: { description: "The large number, exactly as it should read. The mockup writes bare numerals with no unit." } },
        { name: "caption", type: "text", localized: true, label: "Caption", admin: { description: "The first part of the line under the figure." } },
        { name: "tail", type: "text", localized: true, label: "Caption tail", admin: { description: "The end of the caption. Three of the four keep it on one line so the phrase never breaks in the middle, and their value starts with a space; the third breaks the line before it instead, and its value does not." } },
      ],
    },
  ],
}
