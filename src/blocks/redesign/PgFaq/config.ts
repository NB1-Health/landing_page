import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-13.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgFaq.defaults.json, not retyped.
 *
 * The FAQ: a sticky heading column beside twelve rows that open and close.
 *
 * NO STATE. The mockup uses native `<details>`/`<summary>`, so opening and closing
 * is the browser's job and the component owns nothing. That was verified rather
 * than assumed: a row was opened in the mockup and the glyph's text, its `::after`
 * content, its transform, the row's style attribute and the summary's marker were
 * all re-read and all unchanged. Nothing in the stylesheet keys off `[open]`.
 *
 * The twelve rows are byte-identical at every node except the LAST, which closes
 * the stack with a bottom rule. That is positional, so the condition is positional,
 * and `altFrom` points at the mockup's own last row — neither border string is
 * retyped.
 *
 * The `+` in its outlined circle is static: part of the control's drawing rather
 * than content, with nothing an editor could put there and no state in which it
 * changes.
 *
 * The numbers are written, not counted, as in rdPgGuarantee — inserting a question
 * in the middle is a renumbering job, said in the field's admin description.
 */
export const RdPgFaqBlock: Block = {
  slug: "rdPgFaq",
  interfaceName: "RdPgFaqBlock",
  labels: { singular: "PG Faq", plural: "PG Faq" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "faq" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "The questions worth asking." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Still unsure? Everything is charged on production, and you can cancel anytime." },
    {
      name: "faqs", type: 'array', label: "Questions", admin: { description: "Each row opens and closes on its own. Any number works; the last row automatically closes the stack with a bottom rule, so that follows whichever row is last." },
      defaultValue: [
        {
          "number": "01",
          "question": "When am I charged?",
          "answer": "Your card is authorised when you order, but charged only when your formula is produced, roughly four weeks after your diagnostic completes. Nothing is produced before your diagnostic does, so nothing is charged before then either."
        },
        {
          "number": "02",
          "question": "How long until my formula ships?",
          "answer": "Your kit arrives within days. Once we've read your gut and our science team approves your formula, your first protocol ships, typically around four weeks from order."
        },
        {
          "number": "03",
          "question": "Can I cancel my subscription?",
          "answer": "Yes. Four months is the minimum window because biology takes time to shift; after your first cycle you can cancel or pause. Core is also available month-to-month."
        },
        {
          "number": "04",
          "question": "What's actually in my formula?",
          "answer": "Three components, built from your data: a probiotic capsule, a precision prebiotic, and targeted daily support. Every ingredient earns its place from something in your analysis, and nothing is added by default."
        },
        {
          "number": "05",
          "question": "What if I'm on medication?",
          "answer": "Your Clinical Baseline captures this. If anything needs review, our medical team checks your formula before production and writes to you directly. Always consult your healthcare provider before starting."
        },
        {
          "number": "06",
          "question": "How is my sample data used?",
          "answer": "Your gut data builds your formula and your dashboard. It's located against a reference index to produce your score. Your data is yours, handled under GDPR, never sold."
        },
        {
          "number": "07",
          "question": "What's the difference between Core and Advanced?",
          "answer": "Core reads your gut and builds your formula from it. Advanced adds blood biomarkers, alternates gut and blood each cycle, rebuilds your formula every cycle, and opens the 140+ ingredient library."
        },
        {
          "number": "08",
          "question": "Is the diagnostic included in the price?",
          "answer": "Yes. The diagnostic is the product, it's included in your subscription, not an add-on. Your formula is the proof."
        },
        {
          "number": "09",
          "question": "Is there a minimum commitment period?",
          "answer": "No. Both plans start month-to-month and you can cancel anytime. Choosing a 4 or 12-month term simply locks a lower monthly price, it is a discount, not a requirement."
        },
        {
          "number": "10",
          "question": "Can I switch between plans?",
          "answer": "Only at the end of a cycle, never mid-cycle. You can move between Core and Advanced when your current cycle closes, and your new plan takes effect from the next one."
        },
        {
          "number": "11",
          "question": "How does the retest work?",
          "answer": "Your sample runs back through the same pipeline, same six functional teams, same four ratios. When a protocol is built from data, it can be tested against data. Your formula recalibrates against what changed."
        },
        {
          "number": "12",
          "question": "How is shotgun sequencing different from other gut tests?",
          "answer": "Shotgun sequencing reads the functional genes in your gut, not just which species are present, but what they actually do. That's roughly 3× more strain-level resolution than standard 16S testing."
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true, label: "Number", admin: { description: "Written, not counted \u2014 \"01\", \"02\". Adding a question in the middle means renumbering the ones after it." } },
        { name: "question", type: "text", localized: true, required: true },
        { name: "answer", type: "textarea", localized: true, label: "Answer" },
      ],
    },
  ],
}
