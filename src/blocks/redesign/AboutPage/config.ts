import type { Block } from 'payload'

/**
 * The About page: why nb1 was started, the two things that had to be built first,
 * and who stands behind the method.
 *
 * Seven sections, one block. The hero, the founder's account, the science-and-
 * factory pair, the cost band, the independence statement, the people strip, and
 * the closing CTA.
 *
 * Pictures are UPLOADS and ship empty — the founder's portrait, the two card
 * images, the cost photograph, the team photograph and the avatar strip are all
 * set in the admin.
 *
 * The two CTAs hold a SLUG, not a path — `science-board-v2`, not
 * `/en/science-board-v2` — and the locale is added when the page renders, so one
 * value is right in all nine. An absolute url or a #anchor is left exactly as
 * typed.
 */
export const RdAbBlock: Block = {
  slug: "rdAb",
  interfaceName: "RdAbBlock",
  labels: { singular: "RdAb", plural: "RdAb" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Optional. Gives the section an id so another page can link straight to it." }, defaultValue: "top" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "eyebrow", type: "text", localized: true, defaultValue: "About nb1" },
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Personal health, made for everyone." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Supplements built from your own biology, not a bestseller off the shelf, made so the personal version of health isn't a luxury." },
      ],
    },
    {
      name: "why", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Why we started." },
        { name: "bodyOne", type: "textarea", localized: true, label: "First paragraph", admin: { description: "The run before the emphasised question. The question itself is the next field, so the design's heavier weight stays where it is." }, defaultValue: "nb1 started with a pattern Dr. Marcus Traxler kept seeing in his own practice. As a specialist in general and family medicine, he had patients coming to him looking for solutions: a supplement, a fix, the right thing to take. And time after time the honest answer was another question: " },
        { name: "bodyOneAsk", type: "text", localized: true, label: "Emphasised question", admin: { description: "Set in a heavier weight at the end of the first paragraph." }, defaultValue: "what does your body, specifically, actually need?" },
        { name: "bodyTwo", type: "textarea", localized: true, defaultValue: "The gap wasn't a missing product. It was that almost no one was being looked at individually enough to know. We reach for the same off-the-shelf answers and never stop to read the one body in front of us." },
        { name: "bodyThree", type: "textarea", localized: true, defaultValue: "So he went the other way, into the research, to build a way to read a person's biology first, and only then decide what belongs in their formula. That research became nb1." },
        { name: "photo", type: "upload", relationTo: "media" },
        { name: "photoAlt", type: "text", localized: true, label: "Portrait alt text", admin: { description: "Leave empty to use the alt text set on the upload itself." }, defaultValue: "Dr. Marcus Traxler, founder and CEO" },
        { name: "personName", type: "text", localized: true, defaultValue: "Dr. Marcus Traxler" },
        { name: "personRole", type: "text", localized: true, defaultValue: "Founder & CEO · Specialist in general & family medicine" },
      ],
    },
    {
      name: "built", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Two things had to exist before nb1 was possible." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Personalised, biology-based nutrition wasn't waiting on a better recipe. It was waiting on two things no one had built for an audience of one: the science to make sense of a body's reading, and a way to make the result affordably. So we built both." },
        {
          name: "cards", type: 'array', label: "The two things", admin: { description: "One card each. The mockup draws two; a third would render beside them." },
          defaultValue: [
            {
              "eyebrow": "One · The science",
              "heading": "First, we built the science.",
              "bodyOne": "A gut reading on its own is just data. The hard part, the part almost no one had solved, is translating it: turning a raw read of your biology into a clear picture of what your body can do and what it actually needs.",
              "bodyTwo": "That interpretation is the science we built. Not the sequencing itself, but the layer that turns a reading into understanding, and understanding into a formula that's genuinely yours. Without it, “personalised” is just a word on the box.",
              "imageAlt": "A scientist reading a gut sequencing result"
            },
            {
              "eyebrow": "Two · The factory",
              "heading": "Then, we built the factory.",
              "bodyOne": "Knowing what someone needs is worthless if you can't make it. No contract manufacturer will stop and blend for an audience of one, so we built our own production line: custom, end to end, and owned by us.",
              "bodyTwo": "That's what collapsed the cost, and the reason a formula built for one person can be priced like an ordinary supplement. Most of this industry spends its money on marketing. We spent ours on the machine that makes the thing.",
              "imageAlt": "The nb1 production line"
            }
          ],
          fields: [
            { name: "image", type: "upload", relationTo: "media" },
            { name: "imageAlt", type: "text", localized: true, label: "Image description", admin: { description: "The card's picture is a background image, so this is what a screen reader announces in its place." } },
            { name: "eyebrow", type: "text", localized: true },
            { name: "heading", type: "text", localized: true, required: true },
            { name: "bodyOne", type: "textarea", localized: true },
            { name: "bodyTwo", type: "textarea", localized: true },
          ],
        },
        { name: "outro", type: "textarea", localized: true, label: "Closing line", admin: { description: "The line under both cards." }, defaultValue: "Put the two together and personalised, biology-based nutrition stops being a luxury. It becomes something anyone can have. That's the whole company." },
      ],
    },
    {
      name: "cost", type: 'group',
      fields: [
        { name: "image", type: "upload", relationTo: "media", label: "Background photograph", admin: { description: "Dimmed behind the line. Decorative, so it needs no alt text." } },
        { name: "statLead", type: "text", localized: true, label: "Line, first half", admin: { description: "Set in the body colour." }, defaultValue: "€150 a run, " },
        { name: "statAccent", type: "text", localized: true, label: "Line, second half", admin: { description: "Set in blue-grey. Two fields so the colour change survives an edit." }, defaultValue: "down to single digits." },
        { name: "body", type: "textarea", localized: true, defaultValue: "What a personalised production run used to cost, before we built and owned the line it's made on." },
      ],
    },
    {
      name: "indep", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "No corporate parent. No investors to please. Just conviction." },
        { name: "bodyOne", type: "textarea", localized: true, defaultValue: "nb1 isn't owned by a big corporation, and it doesn't answer to outside investors. It's privately funded by a small group of people who care about health, longevity and gut science, and put their own money behind making it real." },
        { name: "bodyTwo", type: "textarea", localized: true, defaultValue: "That independence is the point. No quarterly targets deciding what goes in your formula. No investor pressure to cut the science or pad the label. One mission: make the personal version of health accessible to everyone, not only those who can already afford it." },
        { name: "note", type: "textarea", localized: true, label: "Closing line", admin: { description: "The line that sits apart, under both columns." }, defaultValue: "Funded by people who wanted this to exist, not by people who wanted a return on it." },
      ],
    },
    {
      name: "people", type: 'group',
      fields: [
        { name: "eyebrow", type: "text", localized: true, defaultValue: "Who's behind it" },
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "A method a real board stands behind." },
        { name: "body", type: "textarea", localized: true, defaultValue: "nb1 is designed by our own scientists and governed by a six-person board, including independent academics with no stake in the company. Nothing reaches your formula until it's held up to them." },
        {
          name: "avatars", type: 'array', label: "Faces", admin: { description: "The stacked portraits. The mockup draws five; the number is not fixed." },
          defaultValue: [
            {},
            {},
            {},
            {},
            {}
          ],
          fields: [
            { name: "photo", type: "upload", relationTo: "media" },
          ],
        },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "Meet the science board →" },
        { name: "ctaHref", type: "text", localized: true, label: "Link destination", admin: { description: "A page slug such as science-board-v2 \u2014 the locale is added when the page renders. A full url, a /path or a #anchor is used exactly as typed." }, defaultValue: "science-board-v2" },
        { name: "photo", type: "upload", relationTo: "media", label: "Team photograph", admin: { description: "The wide picture beside the copy." } },
        { name: "photoAlt", type: "text", localized: true, defaultValue: "The nb1 team at work" },
      ],
    },
    {
      name: "close", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Stop guessing. Start with your biology." },
        { name: "body", type: "textarea", localized: true, defaultValue: "Your kit ships first. Your formula is produced after your analysis, never before." },
        { name: "ctaLabel", type: "text", localized: true, defaultValue: "Order your kit" },
        { name: "ctaHref", type: "text", localized: true, label: "Button destination", admin: { description: "A page slug such as our-plans-v2 \u2014 the locale is added when the page renders." }, defaultValue: "our-plans-v2" },
      ],
    },
  ],
}
