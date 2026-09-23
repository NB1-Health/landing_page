import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-04.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgWords.defaults.json, not retyped.
 *
 * Four Trustpilot reviews, each clipped until its own "See more" is pressed.
 *
 * A NEW block rather than a reuse of the homepage's rdReviews, after comparing the
 * two against each other node by node. They share the heading, the copy and the
 * card, but not the section: the homepage version is a swipeable rail with ← →
 * arrows, a progress track under it, and cards at `flex: 0 0 74%`. This one has no
 * arrows, no track, and four equal columns at `flex: 1 1 0`. Reusing it with a
 * background field would have put controls on this page that the design does not
 * have.
 *
 * The differences that are only skin-deep are carried here as values, not as
 * variants: the background is the solid blue-grey rather than the homepage's
 * 34% mix, the inner padding is 104/48 rather than 64/20, and the byline is 9.5px
 * rather than 10.5px.
 *
 * The portrait is a `role="img"` div painted with a background image, because the
 * mockup positions each face differently — `focalY` is that position and is the
 * reason it is not a plain <img>.
 *
 * `body` holds the FULL review; the card clips it to 150 characters at the last
 * space and the component keeps the excerpt. The full texts were read out of the
 * mockup by expanding each card, not copied from the clipped ones on screen.
 */
export const RdPgWordsBlock: Block = {
  slug: "rdPgWords",
  interfaceName: "RdPgWordsBlock",
  labels: { singular: "PG Words", plural: "PG Words" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized \u2014 a fragment must be identical in every locale." }, defaultValue: "words" },
    { name: "heading", type: "text", localized: true, required: true, defaultValue: "We didn't write these." },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Verified Trustpilot reviews, left by members and reproduced in full." },
    { name: "customerLabel", type: "text", localized: true, label: "Byline prefix", admin: { description: "The words before the tenure \u2014 \"nb1 customer\" in the mockup. The tenure itself is per review." }, defaultValue: "nb1 customer" },
    {
      name: "reviews", type: 'array', label: "Reviews", admin: { description: "Four across at desktop; below the breakpoint the row scrolls and snaps." },
      defaultValue: [
        {
          "name": "Eugen",
          "tenure": " · 4 months in",
          "quote": "A smarter way to understand your gut health.",
          "body": "I was really curious about how the process would go. They moved very quickly. I received the kit for the biological sample fast, and it was very easy to send back. The questionnaire I filled out was thorough and detailed, and the analysis I got as a result is very well done and highly informative. I can say they've made taking supplements much easier for me, since everything is already organized by them into morning and evening doses.",
          "focalY": 18
        },
        {
          "name": "Ramona",
          "tenure": " · 6 months in",
          "quote": "From sending the probes to receiving all the supplements my body needs.",
          "body": "Amazing experience! Everything is prompt and they really take care of every aspect of the experience. It really is a helpful, prompt and reliable company i leave my gut health in the hands of with certainty.",
          "focalY": 26
        },
        {
          "name": "Sirko",
          "tenure": " · 5 months in",
          "quote": "A team that clearly knows what it's doing.",
          "body": "Excellent experience with NB1. The process was straightforward and professional throughout, with no friction anywhere. Given how much I travel internationally, recovery and sleep support matter enormously to me, and this was exactly what I was looking for. The results speak for themselves. I feel excellent.",
          "focalY": 50
        },
        {
          "name": "László",
          "tenure": " · 3 weeks in",
          "quote": "I filled out questionnaire then received my personal kit.",
          "body": "I have met with NB1 based on recommendation of a friend. The method they offer you a balanced supplements is simply great by my view. I have been using the personalised supplement since couple a weeks and it works as it was forecasted, already feel more enegetic and my bloating already discontinued.",
          "focalY": 50
        }
      ],
      fields: [
        { name: "image", type: "upload", relationTo: "media" },
        { name: "focalY", type: "number", label: "Focal point", admin: { description: "Where the portrait is anchored vertically, as a percentage. 50 is the middle; lower numbers pull the face up." } },
        { name: "name", type: "text", localized: true, required: true },
        { name: "tenure", type: "text", localized: true, label: "Tenure", admin: { description: "Shown after the byline prefix, including its separator \u2014 \" \u00b7 4 months in\"." } },
        { name: "quote", type: "textarea", localized: true },
        { name: "body", type: "textarea", localized: true, label: "Review", admin: { description: "The full text. The card shows the first 150 characters and reveals the rest on See more, so write it in full." } },
      ],
    },
    { name: "seeMoreLabel", type: "text", localized: true, label: "Expand button", defaultValue: "See more" },
    { name: "seeLessLabel", type: "text", localized: true, label: "Collapse button", defaultValue: "See less" },
  ],
}
