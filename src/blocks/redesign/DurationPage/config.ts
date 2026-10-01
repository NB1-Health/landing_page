import type { Block } from 'payload'

/**
 * The duration page — step 2 of the funnel.
 *
 * ONE BLOCK, TWO PAGES. Core and Advanced are the same 86 nodes — measured — so
 * `plan` says which of them this page sells and everything else that differs is
 * copy: the plan's name, the link to the other page, the tier savings, and the
 * tail of the last FAQ answer, which on Core adds a sentence about what Advanced
 * does and Core does not. `pick.switchSlug` points at the other page.
 *
 * THE STEP HEADER is part of this block. The funnel's Plan / Duration / Checkout
 * stepper is the mockup's page CHROME — `#nbfun > header`, computed once in
 * renderVals() and drawn on all four screens — so it is not part of the duration
 * screen's own tree and is mounted as a SIBLING before the block root. `current`
 * is 1 here, which turns the Plan dot lime with a tick and the Duration dot dark.
 * Measured as section 11 and compared node for node against the order page's
 * header (section 04): the same 27 nodes, identical tags, identical boxes.
 *
 * TWO MODES. Flexible draws one large monthly price; Commit & save draws the 4-
 * and 12-month tiers. They are mutually exclusive in the design, so neither could
 * be captured with the other and each is generated from its own extract, with a
 * dispatcher choosing — the same arrangement the legal block uses for its four
 * clause-body shapes.
 *
 * PRICES ARE NOT FIELDS. Every figure comes from GET /subscriptions/plans through
 * the app's own plans client, the same call the order page and the checkout make,
 * so the three screens cannot disagree. `pick.seededBase` and each tier's
 * `seededRate` are the fallback: they are what the page shows before the request
 * lands, what it keeps if the request fails, and the only thing a server render
 * can show at all. They are NUMBERS, not formatted prices, because the savings
 * line does arithmetic on them.
 *
 * THE SAVINGS ARE COMPUTED. `Save £20 / cycle` is `(base - rate) x months` in the
 * mockup, so the figure follows the live rates and only the words either side are
 * stored — `saveLabel` and `saveSuffix`, which differ between the two tiers
 * (`/ cycle` against `/ year`).
 *
 * THE FAQ OPENS ONE ROW AT A TIME, and clicking the open row closes it. That is
 * the mockup's own behaviour and it is not the order page's, which opens several.
 */
export const RdDurBlock: Block = {
  slug: "rdDur",
  interfaceName: "RdDurBlock",
  labels: { singular: "RdDur", plural: "RdDur" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor", admin: { description: "The id this block gets on the page." }, defaultValue: "duration" },
    {
      name: "steps", type: 'group',
      fields: [
        { name: "logo", type: "upload", relationTo: "media" },
        { name: "logoAlt", type: "text", localized: true },
        { name: "homeSlug", type: "text", localized: true, defaultValue: "" },
        {
          name: "items", type: 'array',
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
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
        { name: "backLabel", type: "text", localized: true, defaultValue: "← Back" },
      ],
    },
    { name: "plan", type: "select", required: true, options: ["core", "advanced"], label: "Plan", admin: { description: "Which plan this page sells. Core and Advanced are two pages of the same block." }, defaultValue: "advanced" },
    { name: "heading", type: "text", localized: true, required: true, label: "Heading", defaultValue: "How long do you want to give it?" },
    { name: "intro", type: "textarea", localized: true, label: "Intro", defaultValue: "Start month to month, or commit for longer and pay less each month. The longer the cycle, the less you pay." },
    {
      name: "pick", type: 'group', label: "The choice",
      fields: [
        { name: "planPrefix", type: "text", localized: true, label: "Before the plan name", admin: { description: "Keep the trailing space \u2014 it is the gap before the name." }, defaultValue: "Your plan · " },
        { name: "switchLabel", type: "text", localized: true, label: "Switch link", admin: { description: "To the other plan's duration page." }, defaultValue: "Switch to Core →" },
        { name: "switchSlug", type: "text", localized: true, label: "Switch link slug", admin: { description: "The other page's slug. The locale prefix is added automatically." }, defaultValue: "duration-core" },
        {
          name: "modes", type: 'array', label: "The two tabs", admin: { description: "Flexible and Commit & save." },
          defaultValue: [
            {
              "title": "Flexible",
              "subtitle": "1 month"
            },
            {
              "title": "Commit & save",
              "subtitle": "4 or 12 months"
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true },
            { name: "subtitle", type: "textarea", localized: true },
          ],
        },
        { name: "seededBase", type: "number", label: "Fallback monthly rate", admin: { description: "A NUMBER, not a price. Shown until the live rate arrives and kept if it fails. Not what the visitor is charged." }, defaultValue: 149 },
        { name: "flexNote", type: "text", localized: true, label: "Under the flexible price", defaultValue: "Standard · cancel anytime, no minimum" },
        { name: "perMonthLarge", type: "text", localized: true, label: "Large price suffix", admin: { description: "After the big flexible price. Keep the leading space." }, defaultValue: " /mo" },
        { name: "perMonth", type: "text", localized: true, label: "Tier price suffix", admin: { description: "After each tier's price. No leading space." }, defaultValue: "/mo" },
        {
          name: "tiers", type: 'array', label: "The commit tiers", admin: { description: "Two, in order." },
          defaultValue: [
            {
              "label": "4 months",
              "months": 4,
              "saveLabel": "Save ",
              "saveSuffix": " / cycle",
              "best": false,
              "bestLabel": "",
              "seededRate": 144
            },
            {
              "label": "12 months",
              "bestLabel": "Best value",
              "months": 12,
              "saveLabel": "Save ",
              "saveSuffix": " / year",
              "best": true,
              "seededRate": 139
            }
          ],
          fields: [
            { name: "months", type: "number", required: true, label: "Length in months", admin: { description: "Drives the price lookup and the saving." } },
            { name: "label", type: "text", localized: true },
            { name: "saveLabel", type: "text", localized: true, label: "Before the saving", admin: { description: "Keep the trailing space." } },
            { name: "saveSuffix", type: "text", localized: true, label: "After the saving", admin: { description: "'/ cycle' on the shorter tier, '/ year' on the longer." } },
            { name: "bestLabel", type: "text", localized: true, label: "Badge text" },
            { name: "best", type: "checkbox", label: "Best value", admin: { description: "Shows the badge above the card." } },
            { name: "seededRate", type: "number", label: "Fallback rate", admin: { description: "A NUMBER. See the monthly fallback above." } },
          ],
        },
      ],
    },
    {
      name: "perks", type: 'array', label: "The reassurance strip",
      defaultValue: [
        {
          "label": "Billed monthly."
        },
        {
          "label": "No upfront charge."
        },
        {
          "label": "Pay nothing until your formula is made."
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true },
      ],
    },
    {
      name: "go", type: 'group', label: "The continue row",
      fields: [
        { name: "footFlex", type: "text", localized: true, label: "Beside the button, flexible", defaultValue: "1 month · cancel anytime" },
        { name: "footCommit", type: "text", localized: true, label: "Beside the button, committed", admin: { description: "The tier's own name is put in front of this. Keep the leading space." }, defaultValue: " · billed monthly" },
        { name: "ctaPrefix", type: "text", localized: true, label: "Button prefix", admin: { description: "The chosen rate is appended." }, defaultValue: "Continue · " },
        { name: "nextSlug", type: "text", localized: true, label: "Checkout slug", admin: { description: "Where the button goes. The locale prefix is added automatically." }, defaultValue: "checkout" },
      ],
    },
    { name: "faqHeading", type: "text", localized: true, label: "FAQ heading", defaultValue: "Choosing your duration" },
    {
      name: "faq", type: 'array', label: "The questions", admin: { description: "One opens at a time; clicking the open one closes it." },
      defaultValue: [
        {
          "q": "Am I locked in for the whole cycle?",
          "a": "On a 4 or 12-month cycle, yes. You're committing to that term, billed monthly across it, and you can't cancel partway through. Flexible monthly is a little more per month, but you can cancel before any month renews."
        },
        {
          "q": "When am I first charged?",
          "a": "Nothing today. Your first payment only happens once your analysis is back and your formula goes into production, usually around week three. If anything looks off in your results before then, you won't be charged at all."
        },
        {
          "q": "Can I change my cycle later?",
          "a": "You can extend to a longer cycle anytime to bring your monthly price down. To move to a shorter cycle or flexible monthly, you switch once your current term ends. Your dashboard handles both in a couple of taps."
        },
        {
          "q": "Does a longer cycle change my formula?",
          "a": "No. The cycle only sets your price and planning window, not what's in your pack."
        }
      ],
      fields: [
        { name: "q", type: "text", localized: true, required: true },
        { name: "a", type: "textarea", localized: true },
      ],
    },
  ],
}
