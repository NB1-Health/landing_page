import type { Block } from 'payload'

/**
 * The Science Board page: who designs the method, who checks it from outside, and
 * who runs it every day.
 *
 * Five screens, one block. The hero's four stat tiles, then three screens of
 * people, then the closing band and the page's single CTA.
 *
 * Every person card is the same shape — photo, role, name, credential, a short
 * bio, and the credential chips. The chips are ONE PER LINE in the Tags box, not a
 * list to click through; blank lines are ignored.
 *
 * The CTA holds a SLUG, not a path — `order-v2`, not `/en/order-v2` — and the
 * locale is added when the page renders, so one value is right in all nine. An
 * absolute url or a #anchor is left exactly as typed.
 */
export const RdSbBlock: Block = {
  slug: "rdSb",
  interfaceName: "RdSbBlock",
  labels: { singular: "RdSb", plural: "RdSb" },
  fields: [
    { name: "anchorId", type: "text", defaultValue: "top" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "The minds behind your formula." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "The science here is young, and reading a gut this deeply sits at its edge. So we built a board to govern it: researchers who design the method, run it, and check it from outside, holding every formula to what the evidence backs, not what a label would like to claim." },
        {
          name: "stats", type: 'array',
          defaultValue: [
            {
              "value": "6",
              "label": "Specialists"
            },
            {
              "value": "4",
              "label": "Universities"
            },
            {
              "value": "290+",
              "label": "Publications"
            },
            {
              "value": "17,000+",
              "label": "Citations"
            }
          ],
          fields: [
            { name: "value", type: "text", localized: true, required: true },
            { name: "label", type: "text", localized: true, required: true },
          ],
        },
      ],
    },
    {
      name: "leads", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Who leads the science" },
        { name: "intro", type: "textarea", localized: true, defaultValue: "The scientist who owns the method end to end, and the team that runs it every day." },
        {
          name: "people", type: 'array',
          defaultValue: [
            {
              "role": "Chief Scientific Officer",
              "name": "Dr. Polina Novikova",
              "credential": "PhD in Bioinformatics, University of Luxembourg.",
              "bio": "She owns the nb1 method end to end, from raw shotgun sequencing to the decision logic that turns a gut reading into a specific formula. Every rule that decides what goes into your protocol, and at what dose, runs through her team. Her background is in making sense of large, messy biological datasets: finding the signal in a metagenome that a formula can actually act on.",
              "tags": "PhD Bioinformatics\nUniversity of Luxembourg\nOwns the method"
            }
          ],
          fields: [
            { name: "photo", type: "upload", relationTo: "media" },
            { name: "role", type: "text", localized: true },
            { name: "name", type: "text", localized: true, required: true },
            { name: "credential", type: "text", localized: true },
            { name: "bio", type: "textarea", localized: true },
            { name: "tags", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "board", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Two of Europe’s most senior microbiome scientists review and challenge the method, with no stake in nb1." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Their job is to find where the science reaches further than the evidence allows, and to say so, before any of it reaches your formula." },
        {
          name: "people", type: 'array',
          defaultValue: [
            {
              "role": "Independent Validator",
              "name": "Prof. Dr. Dirk Haller",
              "credential": "Full Professor and Chair of Nutrition & Immunology, and Director of the ZIEL Institute for Food & Health at the Technical University of Munich.",
              "bio": "One of Europe’s most cited microbiome researchers. He leads Germany’s national Collaborative Research Center on Microbiome Signatures (CRC 1371) and was awarded the €100,000 UEG Distinguished Research Prize for his work on gut inflammation. His lab pioneered the gnotobiotic models that established how specific gut bacteria drive, or protect against, chronic disease. He reviews and challenges the nb1 method from outside the company.",
              "tags": "TU Munich\nDirector, ZIEL Institute\nCRC 1371 Lead\nUEG Research Prize"
            },
            {
              "role": "Independent Validator",
              "name": "Dr. Koen Venema",
              "credential": "Gut-microbiology researcher and former Professor of Gut Microbiology at Maastricht University; editor-in-chief of the journal Beneficial Microbes; principal at Beneficial Microbes® Consultancy.",
              "bio": "A leading authority on how dietary fibres are fermented in the colon, the exact science nb1’s precision prebiotics rest on. He built the TIM “artificial gut” models used worldwide to test how specific fibres feed specific microbes, across a body of work spanning more than 200 peer-reviewed papers. He holds the evidence bar for what personalisation can and cannot claim.",
              "tags": "Former Prof., Maastricht\nBeneficial Microbes® Consultancy\nTIM gut-model pioneer\nEditor, Beneficial Microbes\nh-index 64"
            }
          ],
          fields: [
            { name: "photo", type: "upload", relationTo: "media" },
            { name: "role", type: "text", localized: true },
            { name: "name", type: "text", localized: true, required: true },
            { name: "credential", type: "text", localized: true },
            { name: "bio", type: "textarea", localized: true },
            { name: "tags", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "team", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "The team that builds it" },
        { name: "intro", type: "textarea", localized: true, defaultValue: "One pipeline, the same hands every time: the people who read your sample, work out what it means, and hold the build to clinical standards." },
        {
          name: "people", type: 'array',
          defaultValue: [
            {
              "role": "Bioinformatics",
              "name": "Dr. Monica S. Matchado",
              "credential": "Microbiome functional profiling, TU Munich.",
              "bio": "She turns raw metagenomic data into functional profiles: what a microbial community is equipped to do, not just who is present. Her work bridges the gap between sequencing output and the biology that actually decides a formula.",
              "tags": "Functional Profiling\nTU Munich"
            },
            {
              "role": "Immunology & Gut Health",
              "name": "Dr. Marijn Lewis",
              "credential": "PhD in Biomedical Sciences, University of Zurich; founder of Gut Intelligence Consultancy.",
              "bio": "She connects the gut reading to immune and gut-health pathways, so a formula targets the mechanism behind a problem rather than the symptom on the surface. She also represents the nb1 method externally, most recently presenting our personalisation approach at the International Probiotics Conference.",
              "tags": "PhD Biomedical Sciences\nUniversity of Zurich\nFounder, Gut Intelligence"
            },
            {
              "role": "Clinical Research",
              "name": "Katia B. Otterstedt",
              "credential": "Clinical research & genomics, ECLIN.",
              "bio": "She runs the reproducibility checks, every step from sample to formula validated and then validated again, so the same sample always yields the same build.",
              "tags": "Clinical Research\nGenomics\nECLIN"
            }
          ],
          fields: [
            { name: "photo", type: "upload", relationTo: "media" },
            { name: "role", type: "text", localized: true },
            { name: "name", type: "text", localized: true, required: true },
            { name: "credential", type: "text", localized: true },
            { name: "bio", type: "textarea", localized: true },
            { name: "tags", type: "textarea", localized: true },
          ],
        },
      ],
    },
    {
      name: "close", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Nothing reaches your formula unsigned." },
        { name: "body", type: "textarea", localized: true, defaultValue: "Every formula is signed off by the board before it is made." },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "Order your kit" },
        { name: "ctaHref", type: "text", localized: true, defaultValue: "order-v2" },
      ],
    },
  ],
}
