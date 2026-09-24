import type { Block } from 'payload'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-14.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgBuy.defaults.json, not retyped.
 *
 * The closing buy section: two plan cards, three reassurance blocks and a line of
 * small print, on the dark ground.
 *
 * A NEW block. All seven homepage sections were compared against it, and so was
 * this page's OWN rdPgPlans — the two share a subject and not a shape: rdPgPlans is
 * 166 nodes with a comparison table behind a button, this is 74 with no controls at
 * all. Outline similarity 11%.
 *
 * THE HIGHLIGHT RIDES THE BADGE. The Advanced card differs from Core in four
 * places: it has a badge, an accent border, accent ticks and a filled button. Those
 * are one decision in the design, so one field drives all four — `!!plan.badge` —
 * and an editor cannot end up with a badge on a plain card or an accent card with
 * no badge. Each `altFrom` points at Core's own node, so no border, colour or fill
 * is retyped.
 *
 * The template is the ADVANCED card, because it is the only one carrying the badge
 * and a repeat renders one template; taking Core would have left the badge with no
 * node to bind.
 *
 * The feature labels and both seal texts are `sc-interp` wrappers — the mockup
 * runtime's, not the design's. Both verifiers step through them, so they are
 * `unwrap`ped rather than rendered.
 *
 * THE TWO CTA URLS SHIP AS NULL. The mockup points them at other mockup FILES
 * (`protocol/Order your kit - Cycle Core.html`), which would be broken links in the
 * app. Same call as rdPgHero's two, and recorded in the punch list's CTA table
 * rather than guessed.
 *
 * REUSED ON THE PROTOCOL AND ON THE LAB, which is why `variant` exists.
 *
 * All three mockups' #buy sections are the same component. Measured: Our Plans
 * against The Protocol, all 41 common nodes carry byte-identical inline styles, and
 * the only structural difference is that Our Plans' cards have feature rows where
 * The Protocol's have none — which an empty `features` array already renders
 * exactly, with no code change. The Lab against The Protocol is closer still: 47
 * nodes each, zero differences of any kind, and one word of copy (the third seal
 * says "It's in your subscription" where The Protocol says "It is").
 *
 * What is NOT interchangeable is the style SCOPE. The mockups are built on opposite
 * responsive models: Our Plans is desktop-first, with `max-width` container queries
 * overriding the inline styles downward; The Protocol and The Lab are mobile-first,
 * with `min-width` queries overriding them upward. So the same inline
 * `padding: 72px 20px` is the DESKTOP value on one page and the PHONE value on the
 * other, and a block that wears the wrong page's class gets the wrong layout —
 * measured at 25 of 41 nodes differing at 1440px, including the container width,
 * the heading size and every edge of the section's padding.
 *
 * AND THE TWO MOBILE-FIRST PAGES ARE STILL NOT THE SAME SCOPE, which is why The Lab
 * got a third option rather than borrowing `protocol`. They differ in one token:
 * `[data-d~="bigh"]` caps at 58px under `.rd-lb` and 60px under `.rd-pr`. Rendering
 * The Lab's section as `protocol` was measured — 3 nodes differ at 1440px, the
 * heading at 60px/720px against the mockup's 58px/700px, and the section 2px taller
 * for it. As `lab`: 41 nodes, 0 differing at 390, 900 and 1440px.
 *
 * `variant` therefore picks the root class and nothing else. It defaults to the
 * Our Plans value, so the rows already seeded there render exactly as they shipped —
 * re-measured after this third option was added, and still 0 of 59 nodes differing
 * on Our Plans and 0 of 41 on The Protocol.
 */
export const RdPgBuyBlock: Block = {
  slug: "rdPgBuy",
  interfaceName: "RdPgBuyBlock",
  labels: { singular: "PG Buy", plural: "PG Buy" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "buy" },
    { name: "variant", type: "select", options: ["plans", "protocol", "lab"], label: "Page style", admin: { description: "Which page this instance belongs to. Each page has its own stylesheet and they are not interchangeable — Our Plans is desktop-first where the other two are mobile-first, and The Lab and The Protocol size the big heading differently. Leave as Our Plans unless this block is on The Protocol or The Lab." }, defaultValue: "plans" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "So we start by reading yours." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Your kit ships first; your formula is produced after your analysis, never before." },
    {
      name: "plans", type: 'array', label: "Plans", admin: { description: "The cards at the end of the page. The mockup has two; the grid takes any number." },
      defaultValue: [
        {
          "name": "Core",
          "summary": "We read your gut, and build your formula from it.",
          "price": "€99",
          "priceSuffix": "/mo",
          "note": "Prefer no commitment? €109/mo, month-to-month, cancel anytime.",
          "featuresLabel": "What's inside",
          "features": [
            {
              "label": "Your gut, read at species level"
            },
            {
              "label": "A formula built from your data"
            },
            {
              "label": "Three components, posted monthly"
            },
            {
              "label": "Presorted, travel-ready packaging"
            },
            {
              "label": "Recalibrate on demand"
            }
          ],
          "cta": {
            "url": "#",
            "label": "Start with Core"
          }
        },
        {
          "badge": "Most informed",
          "name": "Advanced",
          "summary": "Gut and blood. Your formula rebuilds every cycle.",
          "price": "€149",
          "priceSuffix": "/mo",
          "note": "Four months is the minimum cycle, the window biology needs to shift.",
          "featuresLabel": "Everything in Core, plus",
          "features": [
            {
              "label": "Blood biomarkers, alternating with gut"
            },
            {
              "label": "Formula rebuilds from every analysis"
            },
            {
              "label": "96+ ingredient library, on request"
            },
            {
              "label": "Priority support from the team"
            }
          ],
          "cta": {
            "url": "#",
            "label": "Start with Advanced"
          }
        }
      ],
      fields: [
        { name: "badge", type: "text", localized: true, label: "Badge", admin: { description: "The pill above the card. Giving a plan a badge is what makes it the highlighted one \u2014 it also switches the card's border, its ticks and its button to the accent colour. Leave empty for a plain card." } },
        { name: "name", type: "text", localized: true, required: true, label: "Plan name", admin: { description: "The small uppercase line at the top of the card." } },
        { name: "summary", type: "textarea", localized: true, label: "Summary", admin: { description: "The sentence under the name." } },
        { name: "price", type: "text", localized: true, label: "Price", admin: { description: "Including the currency symbol, exactly as it should read." } },
        { name: "priceSuffix", type: "text", localized: true, label: "Price suffix", admin: { description: "The smaller text beside the price \u2014 \"/mo\" in the mockup." } },
        { name: "note", type: "textarea", localized: true, label: "Note", admin: { description: "The small print under the price." } },
        { name: "featuresLabel", type: "text", localized: true, label: "List heading", admin: { description: "The uppercase line above the ticks \u2014 it differs per card in the mockup (\"What's inside\" and \"Everything in Core, plus\")." } },
        {
          name: "features", type: 'array', label: "Features", admin: { description: "One tick each. Any number; the cards do not have to match." },
          fields: [
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        localizedLink({
          overrides: {
              name: "cta",
              label: "Button",
          },
        }),
      ],
    },
    {
      name: "seals", type: 'array', label: "Reassurance", admin: { description: "Three short blocks under the cards." },
      defaultValue: [
        {
          "title": "You pay on production",
          "body": "Charged only when your formula is made, never before your analysis completes."
        },
        {
          "title": "Four-month cycle",
          "body": "The minimum window biology needs to shift, not a contract trick."
        },
        {
          "title": "Analysis included",
          "body": "The analysis is the product. It's in your subscription, not an add-on."
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true, label: "Body" },
      ],
    },
    { name: "smallPrint", type: "textarea", localized: true, label: "Small print", admin: { description: "The last line on the page, under everything." }, defaultValue: "Renews automatically each cycle; cancel up to 30 days before renewal. Prices in EUR; any currency conversion or FX fee is set by your bank." },
  ],
}
