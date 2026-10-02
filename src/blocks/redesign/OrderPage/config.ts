import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * The order page, as one block.
 *
 * ONE BLOCK FOR THE WHOLE SCREEN, and one page for the whole plan step. The
 * funnel is Plan -> Duration -> Checkout, three pages, and this is the first of
 * them. The eight blocks it replaces each cost a table, a locales table and both
 * again for versions, so folding the sections into groups pays that once instead
 * of eight times.
 *
 * WHAT IS EDITABLE AND WHAT IS NOT. Every word on the page is a field and every
 * one of them is localized. The PRICES are not: they come from
 * GET /subscriptions/plans through the app's own `fetchPlansClient`, the same
 * call the checkout makes, so the two screens cannot disagree about what a plan
 * costs. Each card keeps a `seededPrice` that shows until the fetch lands and
 * stays if it fails.
 *
 * THE PLAN CARDS ARE TWO, BY INDEX. `plans.cards` is an array so both cards are
 * edited and translated like anything else, but the component binds card 0 and
 * card 1 to their own markup rather than repeating a template: in the design the
 * Advanced card carries a badge the Core card has not and the Core card carries a
 * footnote the Advanced card has not, so there is no one template that is a
 * superset of both. Adding a third card to the array will not render.
 *
 * THE COST TABLE IS ONE LIST WITH A FLAG. `cost.rows[].variant` decides whether a
 * row is an ordinary line item, the TOTAL (a heavier rule above it and a larger
 * figure) or an ADVANCED-ONLY row that appears when the Advanced card is
 * selected. `softValue` marks a row whose value is a phrase rather than a price,
 * which the design sets in the secondary face — that flag exists so the choice is
 * made in the admin and not by comparing the translated words to "Your time".
 *
 * THE STATE. Four pieces: which plan is selected, whether the formula panel is
 * open, whether the costing breakdown is open, and which FAQ rows are open.
 * `faq.rows[].openByDefault` seeds the last one, so which answers a visitor sees
 * first is an editorial decision rather than a hard-coded 0..3.
 *
 * THE STEP HEADER is part of this block, prepended to it — three steps, repeated
 * from `steps.items`. Every one of them is inert here, exactly as in the mockup:
 * a step is only clickable once it has been passed, and on this page none has.
 *
 * LINKS ARE SLUGS, not paths. Every page lives at /{locale}/{slug} and the block
 * adds the locale itself, so `sticky.nextSlug` — the duration page — is one value
 * that is correct in all nine locales instead of nine paths to keep in step.
 */
export const RdOrderBlock: Block = {
  slug: "rdOrder",
  interfaceName: "RdOrderBlock",
  labels: { singular: "RdOrder", plural: "RdOrder" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor", admin: { description: "The id this block gets on the page, so another page can link straight to it." }, defaultValue: "order" },
    {
      name: "steps", type: 'group', label: "Step header", admin: { description: "The sticky header above the page. Three steps: Plan, Duration, Checkout." },
      fields: [
        { name: "logo", type: "upload", relationTo: "media", label: "Wordmark", admin: { description: "The nb1 mark in the header. Links to the homepage." } },
        { name: "logoAlt", type: "text", localized: true },
        { name: "homeSlug", type: "text", localized: true, label: "Homepage slug", admin: { description: "Where the wordmark goes. Leave empty for the locale's homepage; the locale prefix is added automatically." }, defaultValue: "" },
        {
          name: "items", type: 'array', label: "The steps", admin: { description: "Repeated in order and numbered by position. This block is always the first one, so none of them is a link here." },
          defaultValue: [
            {
              "label": "Plan"
            },
            {
              "label": "Duration"
            },
            {
              "label": "Checkout"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true, label: "Step name" },
          ],
        },
        { name: "backLabel", type: "text", localized: true, label: "Back link", admin: { description: "Sends the visitor back in their browser history." }, defaultValue: "← Back" },
      ],
    },
    {
      name: "hero", type: 'group', label: "Opening",
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Your formula doesn't exist before your analysis does." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Measure first. Then a formula built from your biology, made only after we know what it needs." },
      ],
    },
    {
      name: "proof", type: 'group', label: "The science quote and the formula reveal",
      fields: [
        { name: "quote", type: "textarea", localized: true, defaultValue: "“When a supplement does nothing, it's rarely the ingredient that was wrong. It's that the strain and the dose were never chosen for you. We read your sample at shotgun depth, not a 16S screen, and build from a 96-ingredient library against what it actually says.”" },
        { name: "portrait", type: "upload", relationTo: "media" },
        { name: "attribution", type: "text", localized: true, defaultValue: "Dr. Polina Novikova" },
        { name: "attributionNote", type: "text", localized: true, defaultValue: " · built the science behind nb1" },
        { name: "revealLabel", type: "text", localized: true, label: "Reveal button", admin: { description: "The label does not change when the panel opens; the chevron turns instead." }, defaultValue: "See a real formula " },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "caption", type: "textarea", localized: true, defaultValue: "One component from one member's protocol. Eight named strains, each at a stated CFU, and the reason they were chosen written against that person's own reading. Nothing here is a preset." },
      ],
    },
    {
      name: "plans", type: 'group', label: "Plans",
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "Choose your plan" },
        { name: "subheading", type: "text", localized: true, defaultValue: "Both plans include your full analysis" },
        { name: "wasPrice", type: "text", localized: true, label: "Was", admin: { description: "The struck-through figure. Editorial, not from the plans API." }, defaultValue: "£463" },
        { name: "nowPrice", type: "text", localized: true, label: "Now", defaultValue: "£0" },
        {
          name: "items", type: 'array', label: "What both plans include", admin: { description: "The value strip above the cards, with its struck-through total." },
          defaultValue: [
            {
              "price": "£149",
              "label": "A full lab test of your gut bacteria"
            },
            {
              "price": "£29",
              "label": "A simple guide to how your gut works"
            },
            {
              "price": "£29",
              "label": "Which fibres your gut can digest"
            },
            {
              "price": "£29",
              "label": "How varied your gut bacteria are"
            },
            {
              "price": "£69",
              "label": "Why your gut looks the way it does"
            },
            {
              "price": "£69",
              "label": "A food plan built for your gut"
            },
            {
              "price": "£89",
              "label": "Personal advice from a nutritionist"
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "price", type: "text", localized: true },
          ],
        },
        {
          name: "cards", type: 'array', label: "The two plan cards", admin: { description: "TWO cards, bound by position: card 1 is Core's markup and card 2 is Advanced's. A third card will not render \u2014 see the block's notes." },
          defaultValue: [
            {
              "name": "Core",
              "perLabel": "/mo",
              "meta": "Monthly subscription · cancel anytime",
              "eyebrow": "What's inside",
              "feats": [
                {
                  "text": "Gut sequencing, species-level, with summary report"
                },
                {
                  "text": "Personalised formula: Activate, Restore, Nourish"
                },
                {
                  "text": "Presorted, travel-ready packaging, posted monthly"
                }
              ],
              "foot": "Add a retest whenever you want to see what changed",
              "key": "core",
              "seededPrice": "£99",
              "blurb": "All of it in one kit, matched to your analysis.",
              "ticks": [
                {
                  "label": "Gut sequencing included"
                },
                {
                  "label": "Built from your own reading"
                },
                {
                  "label": "Three things a day: morning blister, powder, evening blister"
                }
              ],
              "retestNote": "On Core, add a retest whenever you want one."
            },
            {
              "badge": "Most informed",
              "name": "Advanced",
              "perLabel": "/mo",
              "meta": "Monthly subscription · cancel anytime",
              "eyebrow": "Everything in Core, plus",
              "feats": [
                {
                  "text": "Blood biomarker panel from cycle 2"
                },
                {
                  "text": "Gut and blood alternate every cycle, retests included"
                },
                {
                  "text": "Formula rebuilds every cycle"
                },
                {
                  "text": "Full data output and deeper interpretation"
                },
                {
                  "text": "Formulated from a 96-ingredient library, shotgun sequencing"
                },
                {
                  "text": "Priority support"
                }
              ],
              "key": "advanced",
              "seededPrice": "£149",
              "blurb": "All of it in one kit, matched to your analysis, plus blood biomarkers from cycle 2.",
              "ticks": [
                {
                  "label": "Gut sequencing and blood panel included"
                },
                {
                  "label": "Rebuilt every cycle against new data"
                },
                {
                  "label": "Three things a day: morning blister, powder, evening blister"
                }
              ],
              "retestNote": "Built into Advanced: your first at the end of cycle one, then every second cycle."
            }
          ],
          fields: [
            { name: "key", type: "select", required: true, options: ["core", "advanced"], label: "Plan", admin: { description: "Which backend plan this card sells. The price is fetched against it; the card will show its seeded price if this is unset." } },
            { name: "badge", type: "text", localized: true, label: "Badge", admin: { description: "The flag above the card. Only the second card has one in the design." } },
            { name: "name", type: "text", localized: true, required: true },
            { name: "meta", type: "text", localized: true },
            { name: "perLabel", type: "text", localized: true, label: "Price suffix", admin: { description: "Shown after the price, e.g. /mo." } },
            { name: "seededPrice", type: "text", localized: true, label: "Fallback price", admin: { description: "Shown until the live price arrives, and kept if the request fails. Not what the visitor is charged." } },
            { name: "eyebrow", type: "text", localized: true },
            { name: "foot", type: "text", localized: true, label: "Footnote", admin: { description: "Below the feature list. Leave empty to omit the line entirely." } },
            { name: "icon", type: "upload", relationTo: "media", label: "Kit icon" },
            { name: "icon2", type: "upload", relationTo: "media", label: "Second kit icon", admin: { description: "Advanced only \u2014 the blood panel's icon beside the gut one." } },
            { name: "blurb", type: "textarea", localized: true, label: "Comparison line", admin: { description: "The sentence in the nb1 card beside the cost table, when this plan is chosen." } },
            {
              name: "ticks", type: 'array', label: "Comparison ticks", admin: { description: "The ticked lines under it. Two of the three differ between the plans." },
              fields: [
                { name: "label", type: "text", localized: true, required: true },
              ],
            },
            { name: "retestNote", type: "textarea", localized: true, label: "Retest note", admin: { description: "Shown under the retest row of the timeline, when this plan is chosen." } },
            {
              name: "feats", type: 'array',
              fields: [
                { name: "text", type: "text", localized: true, required: true },
              ],
            },
          ],
        },
        { name: "noteHeading", type: "text", localized: true, label: "Reassurance heading", defaultValue: "You won't be charged today." },
        { name: "note", type: "text", localized: true, label: "Reassurance body", defaultValue: "Your first payment lands around week three, only once your analysis is back and your formula enters production. Continuing starts the analysis, not the billing." },
        { name: "trustLabel", type: "text", localized: true, defaultValue: "Excellent" },
        { name: "trustName", type: "text", localized: true, defaultValue: "Trustpilot" },
      ],
    },
    {
      name: "cost", type: 'group', label: "What it would cost to assemble yourself",
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "Buying this yourself costs £172 a month." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Every formula is different. This is one member's protocol, priced as separate products." },
        { name: "columnLabel", type: "text", localized: true, defaultValue: "Assembled yourself" },
        {
          name: "rows", type: 'array', label: "The breakdown", admin: { description: "One list. Each row's Variant decides how it is drawn and whether it shows at all." },
          defaultValue: [
            {
              "label": "Probiotics",
              "detail": "Strains picked from 20+, dosed to your reading",
              "value": "£35",
              "variant": "row",
              "softValue": false
            },
            {
              "label": "Daily prebiotic powder",
              "detail": "Fibres chosen and ramped to your gut",
              "value": "£24",
              "variant": "row",
              "softValue": false
            },
            {
              "label": "Omegas & antioxidants",
              "detail": "1.5g EPA/DHA with astaxanthin and D3",
              "value": "£32",
              "variant": "row",
              "softValue": false
            },
            {
              "label": "Vitamins & minerals",
              "detail": "Full B-complex with C, zinc, selenium, glutathione and propolis",
              "value": "£45",
              "variant": "row",
              "softValue": false
            },
            {
              "label": "Evening blend & magnesium",
              "detail": "Ashwagandha, L-theanine and 420mg elemental magnesium",
              "value": "£36",
              "variant": "row",
              "softValue": false
            },
            {
              "value": "£172",
              "variant": "sum",
              "softValue": false,
              "detail": "",
              "label": "Every month"
            },
            {
              "label": "A consumer gut test",
              "detail": "Once",
              "value": "£149",
              "variant": "row",
              "softValue": false
            },
            {
              "label": "A blood biomarker panel",
              "detail": "Every cycle, from cycle 2",
              "value": "£199",
              "variant": "advancedOnly",
              "softValue": false
            },
            {
              "label": "Sorting it yourself",
              "detail": "Six containers to buy, store and sort every month",
              "value": "Your time",
              "variant": "row",
              "softValue": true
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "detail", type: "text", localized: true },
            { name: "value", type: "text", localized: true },
            { name: "variant", type: "select", options: ["row", "sum", "advancedOnly"], label: "Row type", admin: { description: "Row is an ordinary line. Sum is the total \u2014 heavier rule, larger figure. Advanced only shows the row when the Advanced card is selected." } },
            { name: "softValue", type: "checkbox", label: "Value is a phrase", admin: { description: "Tick when the value is words rather than a price, e.g. \"Your time\". Sets the secondary face." } },
          ],
        },
        { name: "howLabel", type: "text", localized: true, label: "Breakdown button, closed", defaultValue: "How we costed this" },
        { name: "howLabelOpen", type: "text", localized: true, label: "Breakdown button, open", admin: { description: "The two labels are separate so a translator writes both." }, defaultValue: "Hide the breakdown" },
        {
          name: "howRows", type: 'array',
          defaultValue: [
            {
              "label": "Probiotics:",
              "detail": "priced against a generic multi-strain blend at a comparable CFU count."
            },
            {
              "label": "Omegas and antioxidants:",
              "detail": "a high-EPA omega-3 at 1.5g EPA/DHA, plus an astaxanthin and a D3."
            },
            {
              "label": "Prebiotic:",
              "detail": "a six-fibre blend, undosed."
            },
            {
              "label": "Vitamins and minerals:",
              "detail": "a B-complex, a vitamin C, a zinc, a glutathione and a propolis, at the strengths in the protocol."
            },
            {
              "label": "Evening blend:",
              "detail": "an ashwagandha, an L-theanine and a magnesium bisglycinate at 420mg elemental."
            },
            {
              "label": "Gut test:",
              "detail": "a consumer microbiome test at retail."
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "detail", type: "textarea", localized: true },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "Figures are placeholders. Retail prices need sourcing and the basket documenting, since a price comparison has to be objective and verifiable to hold up if challenged." },
        { name: "asideBrand", type: "text", localized: true, label: "Comparison card brand", admin: { description: "'nb1', then the chosen plan's name." }, defaultValue: "nb1 " },
        { name: "asidePerMonth", type: "text", localized: true, label: "Price suffix", defaultValue: "/mo" },
        { name: "asideImage", type: "upload", relationTo: "media" },
        { name: "asideName", type: "text", localized: true },
        { name: "asideNote", type: "text", localized: true, defaultValue: "One box. Your name and cycle on the lid." },
        { name: "figureImage", type: "upload", relationTo: "media" },
        { name: "figureName", type: "text", localized: true, defaultValue: "Dr. Koen Venema" },
        { name: "figureNote", type: "text", localized: true, defaultValue: " · independent advisor to the nb1 science team · Gut Microbiology, Wageningen" },
        { name: "figureQuote", type: "textarea", localized: true, defaultValue: "“You can't buy named probiotic strains as a consumer. They aren't sold, at any price. Matching individual strains to one person's gut is exactly what nb1 does. That's why I work with them.”" },
      ],
    },
    {
      name: "timeline", type: 'group', label: "From kit to formula",
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "From kit to formula, fully mapped." },
        {
          name: "rows", type: 'array', label: "The weeks",
          defaultValue: [
            {
              "week": "Week 0",
              "title": "Kit ships.",
              "detail": "Two-minute sample at home, prepaid return.",
              "isPayment": false,
              "isRetest": false
            },
            {
              "week": "Weeks 1–2",
              "title": "Sequencing and sign-off.",
              "detail": "200–400 species, read and approved by a person.",
              "isPayment": false,
              "isRetest": false
            },
            {
              "week": "Week 3",
              "title": "First charge.",
              "detail": "Only once your formula is being made.",
              "isPayment": true,
              "isRetest": false
            },
            {
              "week": "Week 4",
              "title": "Formula ships.",
              "detail": "30 days, presorted and blister-packed.",
              "isPayment": false,
              "isRetest": false
            },
            {
              "week": "Week 16",
              "title": "Retest.",
              "detail": "The same markers, re-measured. This is how you find out whether it worked, rather than being asked to trust us.",
              "isPayment": false,
              "isRetest": true
            }
          ],
          fields: [
            { name: "week", type: "text", localized: true, required: true },
            { name: "title", type: "text", localized: true },
            { name: "detail", type: "textarea", localized: true },
            { name: "isPayment", type: "checkbox", label: "First charge lands here", admin: { description: "Fills the row lime. One row only." } },
            { name: "isRetest", type: "checkbox", label: "Retest row", admin: { description: "The row that carries the chosen plan's retest note." } },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "Our first 200 beta members, around four months into their protocol. The score is measured from the retest. The four ratings are self-reported on a 1–10 scale, not lab results, and individual responses vary." },
        { name: "changesHeading", type: "text", localized: true, defaultValue: "What changed, four months in" },
        {
          name: "changes", type: 'array', label: "What changed", admin: { description: "The before/after bars." },
          defaultValue: [
            {
              "label": "Digestion",
              "from": 8,
              "to": 3
            },
            {
              "label": "Energy",
              "from": 6,
              "to": 3
            },
            {
              "label": "Sleep",
              "from": 6,
              "to": 8
            },
            {
              "label": "Stress",
              "from": 7,
              "to": 5
            }
          ],
          fields: [
            { name: "label", type: "text", localized: true, required: true },
            { name: "from", type: "number", label: "Before", admin: { description: "On the 1-10 scale the members rated. The bar is drawn from this, not stored as a width." } },
            { name: "to", type: "number", label: "After" },
          ],
        },
        { name: "scoreValue", type: "text", localized: true, defaultValue: "80.2" },
        { name: "scoreLabel", type: "text", localized: true, defaultValue: "Overall microbiome score, out of 100" },
        { name: "scoreDelta", type: "text", localized: true, defaultValue: "▲ 11.9 pts" },
        { name: "scoreSource", type: "text", localized: true, defaultValue: "up from 68.3 · measured by retest" },
        { name: "scaleMin", type: "text", localized: true, defaultValue: "0" },
        { name: "scaleMax", type: "text", localized: true, defaultValue: "100" },
        { name: "barsLabel", type: "text", localized: true, defaultValue: "How members say they feel" },
        { name: "figureImage", type: "upload", relationTo: "media" },
        { name: "figureQuote", type: "textarea", localized: true, defaultValue: "“Everything is prompt and they really take care of every aspect of the experience. A reliable company I leave my gut health in the hands of with certainty.” " },
        { name: "figureAttribution", type: "text", localized: true, defaultValue: "Ramona · kit to capsules, start to finish" },
        { name: "advancedBadge", type: "text", localized: true, label: "Advanced row badge", admin: { description: "The trailing row appears only when the Advanced card is selected." }, defaultValue: "Advanced" },
        { name: "advancedCadence", type: "text", localized: true, defaultValue: "Every cycle" },
        { name: "advancedNote", type: "text", localized: true, defaultValue: " Gut and blood alternate, and the formula is rebuilt against whatever the new data says." },
        { name: "advancedLead", type: "text", localized: true, defaultValue: "Formula recalibrates." },
      ],
    },
    {
      name: "faq", type: 'group', label: "Questions",
      fields: [
        { name: "heading", type: "text", localized: true, defaultValue: "The things people actually ask" },
        {
          name: "rows", type: 'array', label: "The questions",
          defaultValue: [
            {
              "q": "I've tried supplements before and nothing worked.",
              "a": {
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
                          "text": "Everything you've tried was formulated before anyone knew anything about your gut. This starts from your sample. If your retest shows nothing moved, you'll be the first to know. The data is yours.",
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
              },
              "openByDefault": true
            },
            {
              "q": "Do I actually have to take a stool sample?",
              "a": {
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
                          "text": "Yes. Two minutes, at home, everything in the box, prepaid return. No pharmacy, no appointment. It's the least pleasant part and it's the reason the rest works.",
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
              },
              "openByDefault": true
            },
            {
              "q": "Isn't microbiome testing unproven?",
              "a": {
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
                          "text": "A single snapshot sold as a verdict is not reliable, and that criticism is fair. What we do is different in kind. Your sample is read at species level, your formula is built from that reading, and then it is read again and rebuilt against what changed. Reviewed by a five-person science board, run in an EU-certified lab. We will never tell you it diagnoses anything, because it doesn't.",
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
              },
              "openByDefault": true
            },
            {
              "q": "Can I cancel, and what happens to the kit?",
              "a": {
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
                          "text": "Yes. You have 14 days from receiving your kit to cancel, and nothing has been charged by then. Send the unused kit back to us and there's nothing to pay at all. If it isn't returned, we charge a £49 kit fee, and we credit that £49 against your supplements if you start later. Once your formula enters production it exists only for you and can't be resold, which is the point the first charge lands.",
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
              },
              "openByDefault": true
            },
            {
              "q": "How is this different from ZOE?",
              "a": {
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
                          "text": "ZOE reads your microbiome to advise you on what to eat. We read it to manufacture a formula. Complementary, not competing.",
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
              },
              "openByDefault": false
            },
            {
              "q": "Core or Advanced?",
              "a": {
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
                          "text": "Two different products, not two rungs of a ladder. Core reads your gut and builds your formula from it. Advanced reads your gut and your blood, and rebuilds the formula every cycle against both. Pick the one that matches how much you want to know. You can move between them at any point.",
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
              },
              "openByDefault": false
            },
            {
              "q": "How does the analysis work?",
              "a": {
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
                          "text": "Shotgun sequencing, not a 16S screen: 200–400 species read at species level from your own sample. That reading is checked against the science board’s reference standards, and a person signs off your formula before anything is manufactured.",
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
              },
              "openByDefault": false
            }
          ],
          fields: [
            { name: "q", type: "text", localized: true, required: true },
            { name: "a", type: "richText", localized: true, editor: makeRedesignHeadingEditor(['h2']) },
            { name: "openByDefault", type: "checkbox", label: "Open on arrival", admin: { description: "Which answers a visitor sees without clicking." } },
          ],
        },
        { name: "closingHeading", type: "text", localized: true, defaultValue: "Your formula doesn't exist until your analysis does." },
        { name: "closingBody", type: "textarea", localized: true },
        {
          name: "stories", type: 'array', label: "Member quotes",
          defaultValue: [
            {
              "quote": "“It works as it was forecasted, already feel more energetic and my bloating already discontinued.”",
              "name": "László · Verified member"
            },
            {
              "quote": "“The process was straightforward and professional throughout, with no friction anywhere. The results speak for themselves. I feel excellent.”",
              "name": "Sirko · Verified member"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "name", type: "text", localized: true, required: true },
            { name: "quote", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "sticky", type: 'group', label: "Sticky bar", admin: { description: "The bar pinned to the bottom of the screen." },
      fields: [
        { name: "selectedPrefix", type: "text", localized: true, label: "Before the plan name", admin: { description: "Keep the trailing space \u2014 it is the gap before the name." }, defaultValue: "Selected " },
        { name: "selectedSuffix", type: "text", localized: true, label: "After the plan name", admin: { description: "Keep the leading space \u2014 it is the gap after the name." }, defaultValue: " ·" },
        { name: "switchLabel", type: "text", localized: true, label: "Switch link", admin: { description: "Flips between Core and Advanced." }, defaultValue: "switch" },
        { name: "note", type: "text", localized: true, defaultValue: "· Nothing charged today" },
        { name: "ctaPrefix", type: "text", localized: true, label: "Button prefix", admin: { description: "The selected plan's name is appended to this." }, defaultValue: "Continue with" },
        { name: "nextSlugCore", type: "text", localized: true, label: "Duration page slug \u2014 Core", admin: { description: "Where the CTA goes when the Core card is selected. The locale prefix is added automatically." }, defaultValue: "duration-core" },
        { name: "nextSlugAdvanced", type: "text", localized: true, label: "Duration page slug \u2014 Advanced", admin: { description: "Where the CTA goes when the Advanced card is selected." }, defaultValue: "duration-advanced" },
      ],
    },
  ],
}
