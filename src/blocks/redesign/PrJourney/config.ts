import type { Block } from 'payload'
import { makeRedesignHeadingEditor, redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-02.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrJourney.defaults.json, not retyped.
 *
 * Two columns: the headline and a payment note on the left, a three-step vertical
 * timeline on the right.
 *
 * THE STEPS ARE BOUND BY INDEX, not repeated. Each carries a DIFFERENT icon — a
 * droplet, a document and a parcel, three SVGs with different path data and
 * different child counts — and a repeat takes its children from the first
 * instance, so all three would have rendered as the droplet. Same choice
 * PgBoard's panels made, for the same reason. `steps` is still an array, so the
 * admin shows three rows; a fourth would store and render nothing, which the
 * field description says.
 *
 * Two things on the last step are the mockup's own per-step styles rather than
 * index rules, because the steps are written out individually anyway: the vertical
 * rule joining each step to the next is `display:none` on the third, and only the
 * third carries the small lime dot beside its label.
 *
 * `payBody` ends on a heavier run — `Never before.` is font-weight 500 in the SAME
 * colour as the rest, so it is a real weight and bold is the right thing to store.
 * It is not bold standing in for a colour token.
 *
 * The step labels come through the mockup's `sc-interp` wrapper, the runtime's
 * interpolation span. They are bound with `unwrap`, so the expression renders in
 * the wrapper's place and no extra span reaches the app.
 */
export const RdPrJourneyBlock: Block = {
  slug: "rdPrJourney",
  interfaceName: "RdPrJourneyBlock",
  labels: { singular: "RdPrJourney", plural: "RdPrJourney" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The hero's secondary link points at \"#journey\". Deliberately NOT localized." }, defaultValue: "journey" },
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
                  "text": "Ten minutes of your time. We do the rest.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "One sample, collected at home. Everything after that is ours." },
    { name: "payLabel", type: "text", localized: true, label: "Payment card \u2014 label", admin: { description: "The small uppercase line above the payment note." }, defaultValue: "You pay once" },
    { name: "payLead", type: "text", localized: true, label: "Payment card \u2014 lead", admin: { description: "The first sentence. The lime dot after it is drawn by the design, not typed here." }, defaultValue: "Nothing is paid until your results are analysed." },
    { name: "payBody", type: "richText", localized: true, editor: redesignInlineEditor, label: "Payment card \u2014 body", admin: { description: "The closing run is heavier in the mockup (weight 500, same colour). Use bold for it, not a colour." }, defaultValue: {
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
                  "text": "That single charge unlocks your report and releases your first delivery. ",
                  "version": 1
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 1,
                  "mode": "normal",
                  "style": "",
                  "text": "Never before.",
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
    { name: "payFooter", type: "text", localized: true, label: "Payment card \u2014 footer", admin: { description: "The timing line that closes the card." }, defaultValue: "Under 4 weeks, every time" },
    {
      name: "steps", type: 'array', label: "Steps", admin: { description: "Exactly three, in order. Each has its own icon drawn into the markup, so a fourth row would store fine and render nothing." },
      defaultValue: [
        {
          "meta": "You · about ten minutes",
          "title": "Collect and tell us about you",
          "body": "A sample in private, sent back with the prepaid return, plus a short intake form: your diet, your symptoms, what you already take."
        },
        {
          "meta": "Us · two weeks",
          "title": "Your biology, read in full",
          "body": "Shotgun sequencing in EU labs reads every organism at species level. You get the full report."
        },
        {
          "meta": "Us · week four",
          "title": "Your formula, at your door",
          "body": "Built from that report and nothing else, then delivered presorted. It tops up monthly."
        }
      ],
      fields: [
        { name: "meta", type: "text", localized: true, label: "Who \u00b7 how long", admin: { description: "The small uppercase line, e.g. \"You \u00b7 about ten minutes\"." } },
        { name: "title", type: "text", localized: true, required: true, label: "Title", admin: { description: "One line." } },
        { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "Two or three lines." } },
      ],
    },
  ],
}
