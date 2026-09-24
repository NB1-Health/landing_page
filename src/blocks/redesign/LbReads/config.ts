import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-03.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbReads.defaults.json, not retyped.
 *
 * "How we read you": a quote band with a portrait, three cards for the three
 * inputs, a drawing of those three converging on one point, and a closing line.
 *
 * THE THREE CARDS ARE BOUND BY INDEX, NOT REPEATED, and the mockup is the reason.
 * It writes them inside `<sc-for list="{{ inputs }}" as="r">`, but almost
 * everything that varies is interpolated into a STYLE or a DRAWING rather than
 * into text:
 *
 *   * the icons are three different SVGs — one path, then a rect and four paths,
 *     then two paths. A repeat takes its children from the template, so all three
 *     would have rendered as the first;
 *   * the first card has no `opacity`, the other two are at 0.82;
 *   * the first card's icon is `var(--nb1-blue)`, the others are
 *     `rgba(81,71,69,.7)`;
 *   * the three plan pills have three different backgrounds — blue-grey,
 *     `rgba(81,71,69,.12)` and orange.
 *
 * Modelling that as a repeat would have meant a style toggle per difference and a
 * field for each, which is a worse description of a design that simply draws three
 * cards. So `cards` holds the words, the drawing stays in the markup, and the
 * field description says a fourth row renders nothing. Same choice rdPrJourney's
 * steps and rdPgBoard's panels made, for the same reason.
 *
 * `deepTag` is a single field rather than a per-card one. The mockup gates the
 * pill on `<sc-if value="{{ r.deep }}">` and only the first card sets it, so the
 * node exists on that card alone — three per-card fields would have been two that
 * do nothing. Bound with `when`, so clearing it removes the node the way sc-if
 * does rather than leaving an invisible one in the flex row's gap.
 *
 * The portrait is a CSS background on a `role="img"` element, not an `<img>`, and
 * it shares `background-image` with a flat blue-grey wash. The wash is written
 * back into the bound expression: replacing the property with just the url would
 * have lifted the tint off the photograph, and nothing would have reported it
 * because the computed value still parses. The element's `aria-label` is bound to
 * the media row's alt text, which is why there is no second field for it.
 *
 * The converging lines are static. The SVG is a fixed 900x120 viewBox with
 * `preserveAspectRatio="none"` so it stretches to the rail above it, and the
 * endpoints at x=150/450/750 are the three card centres — every coordinate is
 * load-bearing and none of it is content.
 *
 * The formula pill uses `ownText`: it holds a 10px dot span before its label, and
 * binding the node's children would have deleted the dot.
 */
export const RdLbReadsBlock: Block = {
  slug: "rdLbReads",
  interfaceName: "RdLbReadsBlock",
  labels: { singular: "RdLbReads", plural: "RdLbReads" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#reads\". Deliberately NOT localized." }, defaultValue: "reads" },
    { name: "eyebrow", type: "text", localized: true, label: "Eyebrow", admin: { description: "The small monospaced line above the quote band." }, defaultValue: "How we read you" },
    { name: "quote", type: "textarea", localized: true, required: true, label: "Quote", admin: { description: "The pull quote in the band. Plain text \u2014 the band gives it its size and measure." }, defaultValue: "We start by reading you — two ways on Core, three on Advanced. We never start with a formula and look for who it fits." },
    { name: "quoteImage", type: "upload", relationTo: "media", label: "Portrait", admin: { description: "Fills the left half of the quote band. Its ALT TEXT is what screen readers announce for the band, because the mockup draws it as a CSS background on a role=\"img\" element rather than as an <img> \u2014 so set the alt on the media row, not here." } },
    { name: "authorName", type: "text", localized: true, label: "Attribution \u2014 name", admin: { description: "The line under the rule in the band." }, defaultValue: "Dr. Polina Novikova" },
    { name: "authorRole", type: "text", localized: true, label: "Attribution \u2014 role", admin: { description: "The uppercase line under the name. The \u00b7 is typed into the text." }, defaultValue: "Chief Scientific Officer · PhD Bioinformatics" },
    {
      name: "cards", type: 'array', label: "Read cards", admin: { description: "EXACTLY THREE. Each card carries its own icon, its own plan-pill colour and \u2014 on the first \u2014 a dimming the other two do not have, all drawn into the markup. A fourth row would save fine and render nothing." },
      defaultValue: [
        {
          "name": "Your gut",
          "body": "We find out exactly which bacteria are in your gut, and what each one can do. Everything in your formula starts here.",
          "planLabel": "Every plan"
        },
        {
          "name": "Your intake",
          "body": "What you want to work on, what you already take, and anything a doctor should know. So your formula fits your life.",
          "planLabel": "Every plan"
        },
        {
          "name": "Your blood",
          "body": "A blood test shows which of your levels sit lower than average, and your formula is built around that. Measured again next cycle.",
          "planLabel": "Advanced"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
        { name: "planLabel", type: "text", localized: true },
      ],
    },
    { name: "deepTag", type: "text", localized: true, label: "\"The deep read\" pill", admin: { description: "The pill beside the FIRST card's name. The mockup gates it on that card alone, so it appears there and nowhere else. Clear it and the pill is removed rather than hidden." }, defaultValue: "The deep read" },
    { name: "formulaLabel", type: "text", localized: true, label: "Formula pill", admin: { description: "The words in the pill the three lines converge on. The dot beside them is drawn by the design." }, defaultValue: "Your formula" },
    { name: "conclusion", type: "textarea", localized: true, label: "Closing line", admin: { description: "The centred line under the diagram." }, defaultValue: "Nothing goes into your formula without a reason." },
  ],
}
