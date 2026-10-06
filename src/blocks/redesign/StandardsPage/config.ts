import type { Block } from 'payload'

/**
 * Our Standards: what goes into an nb1 formula, what stays out, and the paper
 * trail either way.
 *
 * Eight sections, one block. The hero, the four rules, sourcing, the factory, the
 * clean-by-design accordion, the science board's veto, the proof cards, and the
 * two plans.
 *
 * Pictures are SEEDED, not left for the admin — seventeen of them, lifted from the
 * mockup itself. An upload left empty still renders; the section simply has no
 * picture.
 *
 * `clean.items` is an accordion and ONE ROW IS OPEN AT A TIME. The mockup writes
 * copy only for the row it draws open, so the other three seed with an empty body
 * and need one written.
 *
 * `plans.tiers[].features` and `proof.docs[].rows` are TEXTAREAS, one item per
 * line — `Label | Value` for the proof rows. They are not arrays because the
 * identifiers an array would have produced run past the 63 bytes Postgres
 * truncates at, silently.
 *
 * The CTAs hold a SLUG, not a path — `order-v2`, not `/en/order-v2` — and the
 * locale is added when the page renders, so one value is right in all nine.
 */
export const RdStBlock: Block = {
  slug: "rdSt",
  interfaceName: "RdStBlock",
  labels: { singular: "RdSt", plural: "RdSt" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Optional. Gives the section an id so another page can link straight to it." }, defaultValue: "top" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "The hard part is what we leave out." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Anyone can add ingredients. We built nb1 to refuse the ones that don’t earn their place, to prove the ones that do, and to make it all ourselves, in our own factory. This is where we draw the line." },
      ],
    },
    {
      name: "rules", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Four rules. Everything else follows." },
        {
          name: "items", type: 'array',
          defaultValue: [
            {
              "num": "01",
              "title": "Biology before formula",
              "body": "We understand a body before we decide what to give it. The order is the whole point."
            },
            {
              "num": "02",
              "title": "Evidence over trend",
              "body": "What’s popular doesn’t earn a place here. Published proof does."
            },
            {
              "num": "03",
              "title": "Restraint over more",
              "body": "The shorter formula is the better one, and we’ll leave things out to keep it that way."
            },
            {
              "num": "04",
              "title": "Proof built in",
              "body": "Built from data, measured against data, documented in the batch that reaches you."
            }
          ],
          fields: [
            { name: "num", type: "text", localized: true },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        { name: "panelLead", type: "text", localized: true, label: "Panel heading, before the italic", admin: { description: "The heading sets one word in italic mid-sentence, so it is three fields. Mind the spaces at the ends \u2014 they are what separates the words from the italic." }, defaultValue: "Most of the industry competes by " },
        { name: "panelEm", type: "text", localized: true, label: "Panel heading, the italic word", defaultValue: "adding." },
        { name: "panelTail", type: "text", localized: true, label: "Panel heading, after the italic", defaultValue: " We compete by taking things out." },
        { name: "panelBody", type: "textarea", localized: true, defaultValue: "A library of 96+ components, and a single formula typically draws on just 15–25. The rest stays on the shelf, by design. Four rules we don’t break:" },
        {
          name: "nots", type: 'array', label: "What we don't do", admin: { description: "The four refusals inside the panel." },
          defaultValue: [
            {
              "title": "No pixie dust",
              "body": "Nothing goes in to look impressive. If it can’t do something your reading calls for, it stays out."
            },
            {
              "title": "No claim-farming",
              "body": "We don’t pad formulas with vitamins just to qualify for authorised health claims. That buys copy, not results."
            },
            {
              "title": "No evidence, no entry",
              "body": "Every ingredient enters only with published evidence, signed off by our science board."
            },
            {
              "title": "Nothing you don’t need",
              "body": "You get only what fits you. The best formula is the shortest one that works."
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "source", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "A component earns its place. So does its source." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Where an ingredient comes from, and in what form, decides whether it does anything at all. A source earns its place the same way an ingredient does, or it doesn’t get used." },
        {
          name: "cards", type: 'array',
          defaultValue: [
            {
              "title": "The active form, not just the name",
              "body": "We specify the bioavailable form the evidence is built on, not the cheapest version sharing the label name.",
              "imageAlt": "Cross-section of a raw botanical root beside crystalline mineral powder"
            },
            {
              "title": "Purity specified before a lot is accepted",
              "body": "Every raw material arrives with a spec for identity, potency and contaminants. Lots that miss it are rejected, not blended in.",
              "imageAlt": "Fine supplement powder being weighed on a precision lab scale"
            },
            {
              "title": "Suppliers vetted, not just invoiced",
              "body": "We qualify suppliers before a material enters the library, and re-check them over time.",
              "imageAlt": "Gloved hands inspecting raw botanical material over labelled sample jars"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "factory", type: 'group',
      fields: [
        { name: "headingLead", type: "text", localized: true, required: true, label: "Heading, before the italic", admin: { description: "Mind the trailing space \u2014 it separates the words from the italic clause." }, defaultValue: "We don’t outsource " },
        { name: "headingEm", type: "text", localized: true, label: "Heading, the italic clause", defaultValue: "the part that matters." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Most brands design a formula and hand it to a contract manufacturer. We don’t. Your formula is made in our own facility in Europe, operating to Good Manufacturing Practice, same team, same standard, from library to batch to bottle." },
        {
          name: "items", type: 'array', label: "Capability tiles", admin: { description: "Exactly four. Each tile's icon is drawn in the design, one per position, so a fifth row renders nothing." },
          defaultValue: [
            {
              "title": "Our own factory",
              "body": "Made in-house in our own European facility, not a shared contract line."
            },
            {
              "title": "GMP manufacture",
              "body": "Produced to Good Manufacturing Practice (GMP) standards."
            },
            {
              "title": "Ingredient testing",
              "body": "Every ingredient identity-tested and screened for contaminants before production, in accredited EU labs."
            },
            {
              "title": "Traceable, batch to bottle",
              "body": "Every component documented, raw material to the pack you receive."
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        { name: "outro", type: "textarea", localized: true, defaultValue: "Owning production means no contract manufacturer’s minimums and no shared lines, so the restraint above survives into the bottle. Our facility operates to Good Manufacturing Practice; nb1 runs its quality system to ISO 9001. Details available on request." },
        { name: "image", type: "upload", relationTo: "media" },
        { name: "imageAlt", type: "text", localized: true, defaultValue: "Inside nb1’s own production facility" },
      ],
    },
    {
      name: "clean", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "What every nb1 formula holds to." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Beyond what your reading calls for, every formula meets a baseline that never changes. Open any standard for the detail." },
        {
          name: "items", type: 'array', label: "Standards", admin: { description: "An accordion: one row open at a time, the first on load. Every row needs a body \u2014 a row with none opens onto nothing, and the row still looks clickable." },
          defaultValue: [
            {
              "title": "Allergen-conscious formulation",
              "body": "We formulate to avoid the major allergens wherever possible, and every formula is screened against the sensitivities you tell us about."
            },
            {
              "title": "No unnecessary fillers or binders",
              "body": "We use only what a dose genuinely needs to hold together. Nothing is added to bulk out a capsule or pad the label."
            },
            {
              "title": "No artificial colours or sweeteners",
              "body": "Nothing goes in for looks or taste. No synthetic dyes, no artificial sweeteners, no cosmetic additives."
            },
            {
              "title": "Full transparency on every dose",
              "body": "You see the exact amount of every ingredient in your formula. No proprietary blends, no hidden quantities."
            }
          ],
          fields: [
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
        {
          name: "strip", type: 'array', label: "Picture strip", admin: { description: "Four square photographs beside the accordion." },
          defaultValue: [
            {
              "imageAlt": "Person taking a supplement sachet with a glass of water at home"
            },
            {
              "imageAlt": "Capsules and loose powder beside a fresh botanical sprig"
            },
            {
              "imageAlt": "Overhead of a daily supplement ritual, stirring powder into water"
            },
            {
              "imageAlt": "Macro of a pale capsule resting in fine off-white powder"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
          ],
        },
        { name: "badge", type: "upload", relationTo: "media", label: "GMP mark", admin: { description: "The certification badge under the strip." } },
        { name: "badgeAlt", type: "text", localized: true, defaultValue: "GMP certified: Good Manufacturing Practice" },
      ],
    },
    {
      name: "board", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Every ingredient is vetted by our science board." },
        { name: "body", type: "textarea", localized: true, defaultValue: "Nothing joins the library until the board agrees the evidence holds, at a dose the research supports. Popularity and trend count for nothing here." },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "Meet the board" },
        { name: "ctaHref", type: "text", localized: true, label: "Link destination", admin: { description: "A page slug such as science-board-v2 \u2014 the locale is added when the page renders. A full url, a /path or a #anchor is used exactly as typed." }, defaultValue: "science-board-v2" },
        { name: "statValue", type: "text", localized: true, label: "Stat number", defaultValue: "6" },
        { name: "statLineOne", type: "text", localized: true, label: "Stat label, first line", admin: { description: "The design breaks the label across two lines, so it is two fields." }, defaultValue: "researchers" },
        { name: "statLineTwo", type: "text", localized: true, label: "Stat label, second line", defaultValue: "on the board" },
        {
          name: "avatars", type: 'array',
          defaultValue: [
            {
              "imageAlt": "Dr. Polina Novikova"
            },
            {
              "imageAlt": "Dr. Marijn Lewis"
            },
            {
              "imageAlt": "Dr. Irina Utkina"
            },
            {
              "imageAlt": "Katia B. Otterstedt"
            },
            {
              "imageAlt": "Dr. Monica S. Matchado"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "They decide what the library is allowed to contain, including two independent academics with no stake in nb1." },
      ],
    },
    {
      name: "proof", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Proof with your batch number on it." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Standards only mean something if they leave a paper trail. Every formula produces records tied to your batch, from our own factory, yours, not a sample’s." },
        {
          name: "docs", type: 'array', label: "Document cards", admin: { description: "Three in the mockup: screening, traceability, sign-off." },
          defaultValue: [
            {
              "kicker": "Doc · Ingredients",
              "status": "Verified",
              "title": "Ingredient screening",
              "body": "Every ingredient we use is identity-tested and screened for heavy metals and microbial contaminants before it enters production.",
              "foot": "Tested on every incoming ingredient lot, before production",
              "rows": "Identity | 100% tested\nHeavy metals | Screened\nMicrobial | Screened",
              "imageAlt": "QC operator inspecting a labelled ingredient bin on our line"
            },
            {
              "kicker": "Doc · Trace",
              "status": "On file",
              "title": "Batch traceability",
              "body": "Every component in your formula, logged from raw material through to the pack that reaches you.",
              "foot": "Held for the life of the product",
              "rows": "Components traced | 18 / 18\nSource lots | Documented\nChain | batch → bottle",
              "imageAlt": "QC check of a blended powder batch against the batch record"
            },
            {
              "kicker": "Doc · Sign-off",
              "status": "Approved",
              "title": "Formula sign-off",
              "body": "Before manufacture, each formula is reviewed against the reading it was built from and health inputs, and its heavy-metal load is checked for its specific blend and daily serving.",
              "foot": "A human approves every build; over-limit blends are blocked",
              "rows": "Formula review | Cleared\nHeavy-metal load | Within limit\nInteraction screen | Cleared",
              "imageAlt": "Finished capsules inspected before sign-off"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true },
            { name: "kicker", type: "text", localized: true },
            { name: "status", type: "text", localized: true },
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
            { name: "rows", type: "textarea", localized: true, label: "Spec rows", admin: { description: "One per line, written as  Label | Value  with a pipe between them. A line with no pipe becomes a label with no value." } },
            { name: "foot", type: "text", localized: true, label: "Footnote", admin: { description: "The small line that closes the card." } },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "Illustrative of the records each order generates. Your own documents are tied to your batch and available on request. Screening is based on the information you provide and does not replace advice from your doctor or pharmacist. nb1 is a wellness product, not a medical device, and is not intended to diagnose, treat, cure or prevent any disease." },
      ],
    },
    {
      name: "plans", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Two plans, built to these standards." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Both read your biology and build the formula from it. Advanced just goes deeper, every cycle." },
        {
          name: "tiers", type: 'array', label: "Plans", admin: { description: "Two in the mockup. A tier with a badge gets the featured frame \u2014 the heavier border and the drop shadow \u2014 so the badge is what makes a plan stand out, not its position." },
          defaultValue: [
            {
              "blurb": "We read your gut, and build your formula from it.",
              "price": "£99",
              "priceSuffix": "/ mo",
              "priceNote": "Monthly, or £94/mo on a 4-month cycle.",
              "listHeading": "What’s inside",
              "ctaLabel": "Start with Core",
              "name": "Core",
              "features": "Your gut, read at species level\nA formula built from your data\nThree components, posted monthly\nPresorted, travel-ready packaging\nRecalibrate on demand",
              "ctaHref": "order-v2"
            },
            {
              "name": "Advanced",
              "badge": "Most informed",
              "blurb": "Gut and blood. Your formula rebuilds every cycle.",
              "price": "£149",
              "priceSuffix": "/ mo",
              "priceNote": "Monthly, or £144/mo on a 4-month cycle.",
              "listHeading": "Everything in Core, plus",
              "ctaLabel": "Start with Advanced",
              "features": "Blood biomarkers, alternating with gut\nFormula rebuilds from every diagnostic\n96+ ingredient library, on request\nPriority support from the team",
              "ctaHref": "order-v2"
            }
          ],
          fields: [
            { name: "name", type: "text", localized: true, required: true },
            { name: "badge", type: "text", localized: true, label: "Badge", admin: { description: "Shown beside the name, and it also switches the card to the featured frame. Leave empty for a plain card." } },
            { name: "blurb", type: "textarea", localized: true },
            { name: "price", type: "text", localized: true },
            { name: "priceSuffix", type: "text", localized: true },
            { name: "priceNote", type: "text", localized: true },
            { name: "listHeading", type: "text", localized: true },
            { name: "features", type: "textarea", localized: true, label: "What's included", admin: { description: "One per line. Each renders with a tick." } },
            { name: "ctaLabel", type: "text", localized: true },
            { name: "ctaHref", type: "text", localized: true, label: "Button destination", admin: { description: "A page slug such as order-v2 \u2014 the locale is added when the page renders." } },
          ],
        },
        { name: "note", type: "textarea", localized: true, defaultValue: "Both plans include the analysis and are held to everything on this page." },
      ],
    },
  ],
}
