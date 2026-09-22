import type { Block } from 'payload'

/**
 * GENERATED from manifests/section-07.json — defaults are the mockup's own values.
 *
 * `body` holds the FULL review. The card shows a clipped version and "See more"
 * swaps in the rest; the mockup does the same, in JS, and the rule it uses was
 * derived from its own four cards rather than guessed: 150 characters, backed off
 * to the last word boundary, then an ellipsis. That reproduces all four collapsed
 * strings exactly (150 / 146 / 143 / 146 characters). Storing the clipped text as
 * a second field would mean an editor keeping two copies of the same review in
 * step, and a translation could not be clipped at all.
 *
 * `focalY` is the vertical focal point of the portrait, as a percentage. The
 * mockup sets it per card (18, 26, centre, centre) because the faces sit at
 * different heights in their crops; without it every portrait repeats the first
 * card's framing. The repeat-consistency gate is what caught this — the four
 * portrait divs differ in `background-position`, not only in their image.
 *
 * The arrows are a MOBILE control — `[data-m="revnav"]` is `display:none` above
 * the rail breakpoint. They scroll by one card plus the gap, which is what the
 * mockup does (301px at 420px wide = 287px card + 14px gap), measured at runtime
 * rather than hard-coded so it holds at any width.
 */
export const RdReviewsBlock: Block = {
  slug: 'rdReviews',
  interfaceName: 'RdReviewsBlock',
  labels: { singular: 'RD Reviews', plural: 'RD Reviews' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'words',
      label: 'Anchor id',
      admin: { description: 'Rendered as the section id. Deliberately NOT localized.' },
    },
    { name: 'heading', type: 'text', localized: true, required: true, defaultValue: "We didn't write these." },
    { name: 'intro', type: 'textarea', localized: true, defaultValue: "Verified Trustpilot reviews, left by members and reproduced in full." },
    {
      name: 'customerLabel',
      type: 'text',
      localized: true,
      label: 'Customer label',
      admin: { description: "The fixed prefix before each reviewer's tenure." },
      defaultValue: "nb1 customer",
    },
    {
      name: 'reviews',
      type: 'array',
      label: 'Reviews',
      admin: {
        description:
          'A swipeable rail. Reproduced in full from Trustpilot — write the whole '
          + 'review into Body; the card clips it and "See more" reveals the rest.',
      },
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
        { name: 'image', type: 'upload', relationTo: 'media', label: 'Portrait' },
        {
          name: 'focalY',
          type: 'number',
          defaultValue: 50,
          min: 0,
          max: 100,
          label: 'Portrait focal point',
          admin: {
            description:
              'Vertical framing of the square crop, as a percentage: 0 is the top of '
              + 'the photograph, 50 the middle. Raise it if the face sits low in frame.',
          },
        },
        { name: 'name', type: 'text', localized: true, required: true },
        {
          name: 'tenure',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Follows the customer label, e.g. " · 4 months in". The LEADING SPACE is '
              + 'the mockup\'s own and is the only space between this and the label — '
              + 'without it the byline reads "nb1 customer· 4 months in".',
          },
        },
        {
          name: 'quote',
          type: 'textarea',
          localized: true,
          label: 'Headline',
          admin: { description: 'The quotation marks are drawn by the card — do not type them.' },
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
          label: 'Review, in full',
          admin: { description: 'The card clips this to roughly 150 characters until "See more".' },
        },
      ],
    },
    { name: 'seeMoreLabel', type: 'text', localized: true, defaultValue: "See more" },
    { name: 'seeLessLabel', type: 'text', localized: true, defaultValue: "See less" },
    {
      name: 'prevLabel',
      type: 'text',
      localized: true,
      label: 'Previous arrow label',
      admin: { description: 'Read by screen readers; the button shows ←.' },
      defaultValue: "Previous reviews",
    },
    {
      name: 'nextLabel',
      type: 'text',
      localized: true,
      label: 'Next arrow label',
      admin: { description: 'Read by screen readers; the button shows →.' },
      defaultValue: "More reviews",
    },
  ],
}
